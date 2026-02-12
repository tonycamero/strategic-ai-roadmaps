/**
 * PulseAgent Homepage Controller
 * 
 * Handles public homepage assistant conversations.
 * No authentication required - uses anonymous sessions.
 */

import { Request, Response } from 'express';
import {
  getOrCreateSession,
  queryHomepageAssistant,
  logEvent,
  getHomepageAssistantDebug,
  type PageContext,
} from '../services/publicAgentSession.service.ts';
import { HOMEPAGE_PULSEAGENT_PROMPT } from '../trustagent/homepagePrompt.v2.backup.ts';

interface ChatRequest {
  sessionId?: string;
  message: string;
  pageContext?: PageContext;
  _safetyOverride?: string; // Injected by middleware
}

interface ChatResponse {
  sessionId: string;
  message: string;
}

/**
 * POST /api/pulseagent/homepage/chat
 * Main chat endpoint for homepage PulseAgent
 */
export async function chat(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, message, pageContext, _safetyOverride } = req.body as ChatRequest;

    // Allow empty message for proactive greeting, otherwise validate
    const userMessage = message?.trim() || '';

    if (userMessage.length > 2000) {
      res.status(400).json({ error: 'Message too long (max 2000 characters)' });
      return;
    }

    console.log('[PulseAgent] Chat request:', {
      sessionId: sessionId || 'new',
      messageLength: userMessage.length,
      isProactiveGreeting: userMessage.length === 0,
      hasPageContext: !!pageContext,
      hasSafetyOverride: !!_safetyOverride,
    });

    // Get or create session
    const session = await getOrCreateSession(sessionId, pageContext);

    // Log user message event (only if there's a message)
    if (userMessage) {
      await logEvent(session.sessionId, 'message.user', userMessage, pageContext);
    }

    // For empty message (proactive greeting), use a special prompt that forces the exact opener
    const messageToSend = userMessage || 'Start the conversation now using your mandatory opening.';


    // Query assistant with SAFE Override (Injects Smartass Persona)
    const assistantReply = await queryHomepageAssistant(
      session.openaiThreadId,
      messageToSend,
      _safetyOverride,
      HOMEPAGE_PULSEAGENT_PROMPT // Force the Smartass Constitution
    );

    // Log assistant message event
    await logEvent(session.sessionId, 'message.assistant', assistantReply);

    // Return response
    const response: ChatResponse = {
      sessionId: session.sessionId,
      message: assistantReply,
    };

    res.json(response);
  } catch (error: any) {
    console.error('[PulseAgent] Chat error:', error);

    // User-friendly error response
    res.status(500).json({
      error: 'Failed to process message',
      message: 'I encountered an issue processing your message. Please try again.',
    });
  }
}

/**
 * GET /api/pulseagent/homepage/debug
 * Debug endpoint to inspect assistant configuration
 */
export async function debug(req: Request, res: Response): Promise<void> {
  try {
    const debugInfo = await getHomepageAssistantDebug();
    res.json({
      ok: true,
      debug: debugInfo,
    });
  } catch (err: any) {
    console.error('[PulseAgent Debug] Error fetching assistant info:', err);
    res.status(500).json({
      ok: false,
      error: 'debug_failed',
      message: err?.message ?? 'Unknown error',
    });
  }
}
