/**
 * ⚠️ EXECUTION LOCK — DO NOT MODIFY CASUALLY
 *
 * This file is governed by /working_protocol.md
 *
 * Default mode: NON-DESTRUCTIVE
 * Forbidden unless explicitly authorized:
 * - Refactors
 * - File moves or deletions
 * - API contract changes
 * - Dropping fields (e.g. cta, reveal)
 *
 * If unsure: STOP and ask before editing.
 */

// TrustAgent API client

export interface ChatRequest {
  sessionId?: string;
  message: string;
  mode?: 'homepage' | 'feta';
  pageContext?: {
    entryPage?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  };
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  options?: Array<{ id: string; label: string; nextStepId?: string }>;
  cta?: { type: string; label: string };
  reveal?: {
    headline: string;
    signals: string[];
    diagnosis: string;
  };
}

/**
 * Send message to TrustAgent(FE - TA Only)
 */
export async function chat(
  message: string,
  sessionId?: string,
  pageContext?: ChatRequest['pageContext'],
  mode: 'feta' = 'feta'
): Promise<ChatResponse> {
  const response = await fetch('/api/public/trustagent/homepage/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sessionId,
      pageContext,
      mode,
    } as ChatRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `TrustAgent API error: ${response.statusText}`);
  }

  return response.json();
}

export const trustagentApi = {
  chat,
};
