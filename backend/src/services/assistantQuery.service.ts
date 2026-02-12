/**
 * Assistant Query Service
 * 
 * Handles querying OpenAI Assistants with per-user thread management.
 * Supports owner threads and superadmin tap-in with visibility isolation.
 */

import OpenAI from 'openai';
import { db } from '../db/index.ts';
import { agentConfigs, agentThreads, users, agentMessages, agentLogs, roadmapSections, intakes } from '../db/schema.ts';
import { and, eq } from 'drizzle-orm';
import { wrapUserMessageWithRoleContext } from '../config/role-runtime-context.ts';
import type { CapabilityProfile } from '../shared/types/capability-profile.ts';
import { buildStrategyContext } from './strategyContextBuilder.service.ts';
import { saveStrategyContext } from './strategyContextStore.service.ts';
import type { PersonaRole } from '../types/strategyContext.ts';
import { getOrCreateVectorStore } from './tenantVectorStore.service.ts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ActorRole = 'owner' | 'team' | 'superadmin';
export type ThreadVisibility = 'owner' | 'superadmin_only' | 'shared';


/**
 * Find or create a thread for a specific actor and role
 * Each actor gets their own thread per tenant/role combination
 */
async function getOrCreateThread(
  tenantId: string,
  roleType: string,
  actorUserId: string,
  actorRole: ActorRole,
  visibility: ThreadVisibility = 'owner',
): Promise<{ id: string; openaiThreadId: string; agentConfigId: string }> {
  // Try to find existing thread
  const existing = await db.query.agentThreads.findFirst({
    where: and(
      eq(agentThreads.tenantId, tenantId),
      eq(agentThreads.roleType, roleType),
      eq(agentThreads.actorUserId, actorUserId),
      eq(agentThreads.actorRole, actorRole),
    ),
  });

  if (existing) {
    console.log('[Query] Reusing existing thread:', existing.openaiThreadId);
    return {
      id: existing.id,
      openaiThreadId: existing.openaiThreadId,
      agentConfigId: existing.agentConfigId,
    };
  }

  // Get agent_config for this tenant's roadmap coach to link the thread
  const config = await db.query.agentConfigs.findFirst({
    where: and(
      eq(agentConfigs.tenantId, tenantId),
      eq(agentConfigs.agentType, 'roadmap_coach'),
    ),
  });

  if (!config) {
    throw new Error(`No agent config found for tenant ${tenantId}`);
  }

  // Create new OpenAI thread with metadata
  const thread = await openai.beta.threads.create({
    metadata: {
      tenantId,
      roleType,
      actorUserId,
      actorRole,
      visibility,
    },
  });

  console.log('[Query] Created new thread:', thread.id);

  // Persist thread in DB
  const [row] = await db
    .insert(agentThreads)
    .values({
      tenantId,
      agentConfigId: config.id,
      roleType,
      openaiThreadId: thread.id,
      actorUserId,
      actorRole,
      visibility,
    })
    .returning();

  return {
    id: row.id,
    openaiThreadId: row.openaiThreadId,
    agentConfigId: row.agentConfigId,
  };
}

export interface QueryAssistantParams {
  tenantId: string;
  message: string;
  actorUserId: string;
  actorRole: ActorRole;
  capabilityProfile: CapabilityProfile;
  visibilityOverride?: ThreadVisibility; // For admin tap-in control
  context?: {
    roadmapSection?: string; // Current section user is viewing
  };
}

export interface QueryAssistantResult {
  reply: string;
  runId: string;
  threadId: string;
}

/**
 * Query an assistant with automatic thread management
 * Enforces tenant isolation and supports admin tap-in with visibility control
 */
export async function queryAssistant(
  params: QueryAssistantParams,
): Promise<QueryAssistantResult> {
  const {
    tenantId,
    message,
    actorUserId,
    actorRole,
    capabilityProfile,
    visibilityOverride,
  } = params;

  const roleType: 'owner' = 'owner'; // Single roadmap coach per tenant (for now)

  console.log('[Query] Processing query:', {
    tenantId,
    roleType,
    actorRole,
    persona: capabilityProfile.persona,
  });

  // 1. Load agent_config and assert it's provisioned
  const config = await db.query.agentConfigs.findFirst({
    where: and(
      eq(agentConfigs.tenantId, tenantId),
      eq(agentConfigs.agentType, 'roadmap_coach'),
    ),
  });

  if (!config || !config.openaiAssistantId) {
    throw new Error(`Assistant not provisioned for tenant ${tenantId}`);
  }

  const assistantId = config.openaiAssistantId;

  // 2. Determine visibility based on actor role
  const visibility: ThreadVisibility =
    actorRole === 'superadmin'
      ? visibilityOverride ?? 'superadmin_only'
      : 'owner';

  // 3. Get or create thread for this actor
  const threadInfo = await getOrCreateThread(
    tenantId,
    roleType,
    actorUserId,
    actorRole,
    visibility,
  );

  const threadId = threadInfo.openaiThreadId;

  // 4. Build StrategyContext at runtime (v2 architecture)
  let strategyContextBlock = '';
  
  try {
    const personaRole = capabilityProfile.persona as PersonaRole;
    
    const strategyContext = await buildStrategyContext({
      tenantId,
      personaRole,
      currentView: params.context?.roadmapSection ?? null,
    });

    // Save to database for debugging/auditing
    await saveStrategyContext(strategyContext);

    // Format as JSON block
    strategyContextBlock = [
      '[STRATEGY_CONTEXT]',
      JSON.stringify(strategyContext, null, 2),
      '[END_CONTEXT]',
      '',
    ].join('\n');

    console.log('[Query] StrategyContext built and saved for tenant:', tenantId);
  } catch (error) {
    console.error('[Query] Failed to build StrategyContext:', error);
    // Continue without context rather than failing the query
  }

  // 5. Prepare message content
  let content = '';

  if (actorRole === 'superadmin') {
    // Get admin user info for context
    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, actorUserId),
    });

    const adminName = adminUser?.name || 'Platform Admin';

    content = [
      `ADMIN TAP-IN CONTEXT:`,
      `You are speaking to ${adminName}, a superadmin for this platform.`,
      `Answer as if you are a trusted member of the firm's leadership team.`,
      `Be helpful and provide insights that would be valuable to both the admin and the firm.`,
      '',
      `${adminName} says:`,
      strategyContextBlock,
      message,
    ].join('\n');
  } else {
    // Normal user: StrategyContext + message
    content = [
      strategyContextBlock,
      'User Message:',
      message,
    ].join('\n');
  }

  // 6. Add user message to thread
  console.log('[Query] Sending to OpenAI - First 500 chars:', content.substring(0, 500));
  
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content,
  });

  // Persist user message to DB
  await db.insert(agentMessages).values({
    agentThreadId: threadInfo.id,
    role: 'user',
    content: message, // Store original message, not wrapped version
  });

  console.log('[Query] Message added to thread');

  // 6. Attach tenant vector store for retrieval (v2 architecture)
  let vectorStoreId: string | null = null;
  try {
    vectorStoreId = await getOrCreateVectorStore(tenantId);
    console.log('[Query] Using vector store for tenant:', vectorStoreId);
  } catch (error: any) {
    console.warn('[Query] Failed to get vector store, continuing without retrieval:', error.message);
  }

  // 7. Run the assistant with retry logic
  let run;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      // Attach vector store at run time (v2: per-tenant vector stores)
      const runParams: any = {
        assistant_id: assistantId,
      };

      // If vector store available, attach it for this run
      if (vectorStoreId) {
        runParams.tool_resources = {
          file_search: {
            vector_store_ids: [vectorStoreId],
          },
        };
        console.log('[Query] Attached vector store to run');
      }

      run = await openai.beta.threads.runs.createAndPoll(threadId, runParams);
      
      console.log('[Query] Run completed:', { status: run.status, runId: run.id, attempt: retryCount + 1 });
      
      if (run.status === 'completed') {
        break;
      }
      
      // Log failed status
      await db.insert(agentLogs).values({
        agentConfigId: threadInfo.agentConfigId,
        eventType: 'query_retry',
        interactionMode: 'capability_profile',
        metadata: {
          threadId: threadInfo.openaiThreadId,
          runId: run.id,
          status: run.status,
          attempt: retryCount + 1,
        },
      });
      
      if (run.status === 'failed' || run.status === 'expired') {
        // Only retry for transient failures
        if (retryCount < maxRetries - 1) {
          console.log(`[Query] Run ${run.status}, retrying... (${retryCount + 1}/${maxRetries})`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          continue;
        }
      }
      
      // Non-retryable status or max retries reached
      break;
    } catch (error: any) {
      console.error('[Query] Run error:', error.message);
      
      if (retryCount < maxRetries - 1) {
        console.log(`[Query] Retrying after error... (${retryCount + 1}/${maxRetries})`);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        continue;
      }
      
      throw new Error(`I'm having trouble connecting right now. Please try again in a moment. (${error.message})`);
    }
  }
  
  if (!run || run.status !== 'completed') {
    const userMessage = run?.status === 'failed' 
      ? "I encountered an issue processing your request. Could you try rephrasing your question?"
      : "I'm taking longer than expected to respond. Please try again.";
    throw new Error(userMessage);
  }

  // 7. Fetch latest assistant message with fallback
  const messages = await openai.beta.threads.messages.list(threadId, {
    order: 'desc',
    limit: 10, // Fetch more to ensure we get assistant response
  });

  const lastMessage = messages.data.find((m) => m.role === 'assistant');

  if (!lastMessage) {
    // Log the missing message issue
    await db.insert(agentLogs).values({
      agentConfigId: threadInfo.agentConfigId,
      eventType: 'query_error',
      interactionMode: 'capability_profile',
      metadata: {
        threadId: threadInfo.openaiThreadId,
        runId: run.id,
        error: 'No assistant message found',
        messageCount: messages.data.length,
      },
    });
    
    throw new Error("I'm having trouble generating a response. Please try your question again.");
  }

  // Extract text content from message
  const textContent = lastMessage.content
    .filter((c) => c.type === 'text')
    .map((c: any) => c.text.value)
    .join('\n');

  const reply = textContent || "I understand your question, but I'm having trouble formulating a complete response. Could you rephrase or provide more context?";

  // 8. Persist assistant message to DB
  await db.insert(agentMessages).values({
    agentThreadId: threadInfo.id,
    role: 'assistant',
    content: reply,
  });

  // 9. Update thread activity timestamp
  await db
    .update(agentThreads)
    .set({ lastActivityAt: new Date() })
    .where(eq(agentThreads.id, threadInfo.id));

  // 10. Log query event
  await db.insert(agentLogs).values({
    agentConfigId: threadInfo.agentConfigId,
    eventType: 'query',
    interactionMode: 'capability_profile',
    metadata: {
      threadId: threadInfo.openaiThreadId,
      runId: run.id,
      actorRole,
      capabilityProfile,
      messageLength: message.length,
      replyLength: reply.length,
    },
  });

  console.log('[Query] Response ready');

  return {
    reply,
    runId: run.id,
    threadId,
  };
}

/**
 * List threads for a tenant/role (useful for admin views)
 */
export async function listThreadsForTenantRole(
  tenantId: string,
  roleType: string,
  visibilityFilter?: ThreadVisibility,
) {
  const conditions = [
    eq(agentThreads.tenantId, tenantId),
    eq(agentThreads.roleType, roleType),
  ];

  if (visibilityFilter) {
    conditions.push(eq(agentThreads.visibility, visibilityFilter));
  }

  const threads = await db.query.agentThreads.findMany({
    where: and(...conditions),
    orderBy: (threads, { desc }) => [desc(threads.lastActivityAt)],
  });

  return threads;
}
