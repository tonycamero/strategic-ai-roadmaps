/**
 * Public Agent Session Service
 * 
 * Manages anonymous homepage PulseAgent sessions and OpenAI threads.
 * Sessions are ephemeral and not tied to authenticated users or tenants.
 */

import { db } from '../db/index.ts';
import { publicAgentSessions, publicAgentEvents } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { homepageAssistantConfig } from '../config/openai.config.ts';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PageContext {
  entryPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

export interface SessionInfo {
  sessionId: string;
  dbId: string;
  openaiThreadId: string;
}

/**
 * Get or create a public agent session
 * If sessionId provided, reuse existing. Otherwise, create new.
 */
export async function getOrCreateSession(
  sessionId?: string,
  pageContext?: PageContext
): Promise<SessionInfo> {
  // Try to find existing session if sessionId provided
  if (sessionId) {
    const existing = await db.query.publicAgentSessions.findFirst({
      where: eq(publicAgentSessions.sessionId, sessionId),
    });

    if (existing) {
      // Update last activity timestamp
      await db
        .update(publicAgentSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(publicAgentSessions.id, existing.id));

      // Ensure OpenAI thread exists
      let threadId = existing.openaiThreadId;
      if (!threadId) {
        threadId = await createOpenAIThread(sessionId, pageContext);
        await db
          .update(publicAgentSessions)
          .set({ openaiThreadId: threadId })
          .where(eq(publicAgentSessions.id, existing.id));
      }

      return {
        sessionId: existing.sessionId,
        dbId: existing.id,
        openaiThreadId: threadId,
      };
    }
  }

  // Create new session
  const newSessionId = sessionId || crypto.randomBytes(32).toString('base64url');
  const openaiThreadId = await createOpenAIThread(newSessionId, pageContext);

  const [session] = await db
    .insert(publicAgentSessions)
    .values({
      sessionId: newSessionId,
      openaiThreadId,
      pageContext: pageContext || {},
    })
    .returning();

  return {
    sessionId: session.sessionId,
    dbId: session.id,
    openaiThreadId: session.openaiThreadId!,
  };
}

/**
 * Create OpenAI thread for homepage assistant
 */
async function createOpenAIThread(
  sessionId: string,
  pageContext?: PageContext
): Promise<string> {
  const thread = await openai.beta.threads.create({
    metadata: {
      sessionId,
      type: 'homepage_pulseagent',
      ...pageContext,
    },
  });

  console.log('[PublicSession] Created OpenAI thread:', thread.id);
  return thread.id;
}

/**
 * Log an event for analytics
 */
export async function logEvent(
  sessionId: string,
  eventType: string,
  message?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await db.insert(publicAgentEvents).values({
    sessionId,
    eventType,
    message,
    metadata: metadata || {},
  });

  console.log('[PublicSession] Event logged:', { sessionId, eventType });
}

/**
 * Send message to homepage assistant and get response
 */
export async function queryHomepageAssistant(
  threadId: string,
  message: string,
  safetyOverride?: string,
  instructionOverride?: string
): Promise<string> {
  if (!homepageAssistantConfig.assistantId) {
    throw new Error('Homepage assistant not configured');
  }

  // Apply safety override if present
  const finalMessage = safetyOverride
    ? `${safetyOverride}\n\n---\n\nUser message:\n${message}`
    : message;

  // Add user message to thread
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: finalMessage,
  });

  console.log('[PublicSession] Message added to thread:', threadId);

  // Run assistant with default response format (no JSON requirement)
  const run = await openai.beta.threads.runs.createAndPoll(
    threadId,
    {
      assistant_id: homepageAssistantConfig.assistantId,
      temperature: 0.7,
      instructions: instructionOverride, // Allow overriding system prompt at runtime
    },
    {
      pollIntervalMs: 500,
    }
  );

  // Log run metadata for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('[PublicSession] RUN METADATA:', JSON.stringify({
      id: run.id,
      assistant_id: run.assistant_id,
      model: run.model,
      status: run.status,
      instructions: run.instructions ? run.instructions.slice(0, 300) : null,
      truncation_strategy: run.truncation_strategy,
      parallel_tool_calls: run.parallel_tool_calls,
      metadata: run.metadata,
      temperature: run.temperature,
      top_p: run.top_p,
    }, null, 2));
  }

  if (run.status !== 'completed') {
    console.error('[PublicSession] Run failed:', run.status, run.last_error);
    throw new Error(`Assistant run failed: ${run.status}`);
  }

  // Get latest assistant message
  const messages = await openai.beta.threads.messages.list(threadId, {
    order: 'desc',
    limit: 1,
  });

  // Log first 3 messages for debugging
  if (process.env.NODE_ENV !== 'production') {
    const allMessages = await openai.beta.threads.messages.list(threadId, {
      order: 'desc',
      limit: 3,
    });
    console.log('[PublicSession] MESSAGES:', JSON.stringify(
      allMessages.data.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content.map(c => c.type === 'text' ? c.text.value.slice(0, 300) : c.type),
        created_at: msg.created_at,
      })),
      null,
      2
    ));
  }

  const assistantMessage = messages.data[0];
  if (!assistantMessage || assistantMessage.role !== 'assistant') {
    throw new Error('No assistant response found');
  }

  // Extract text content
  const textContent = assistantMessage.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in assistant response');
  }

  const rawResponse = textContent.text.value;

  // Log raw response for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('[PublicSession] RAW ASSISTANT RESPONSE:', rawResponse);
  }

  return rawResponse;
}

/**
 * Debug: Get homepage assistant configuration from OpenAI
 */
export async function getHomepageAssistantDebug() {
  const { assistantId, model } = homepageAssistantConfig;

  if (!assistantId) {
    return {
      configured: false,
      reason: 'No OPENAI_TRUSTAGENT_ASSISTANT_ID set',
      env: {
        assistantId,
        model,
      },
    };
  }

  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    const instructions = assistant.instructions ?? '';
    const length = instructions.length;

    return {
      configured: true,
      env: {
        assistantId,
        model,
      },
      openai: {
        id: assistant.id,
        name: assistant.name,
        model: assistant.model,
        instructionsPreview: instructions.slice(0, 600),
        instructionsLength: length,
        hasStructuralTags: instructions.includes('<quick_hit>'),
      },
    };
  } catch (err: any) {
    return {
      configured: false,
      reason: 'Failed to retrieve assistant from OpenAI',
      error: err.message,
      env: {
        assistantId,
        model,
      },
    };
  }
}
