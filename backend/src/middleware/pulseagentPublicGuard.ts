/**
 * PulseAgent Public Safety Guard Middleware
 * 
 * Inspects incoming messages to the public homepage assistant and injects
 * safety overrides if users attempt to access restricted information.
 * 
 * This is a defense-in-depth layer on top of the assistant's system prompt.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Patterns that indicate attempts to access internal/restricted data
 */
const RESTRICTED_PATTERNS = [
  // Ticket/implementation references
  /\b(T\d+\.\d+|SA-\d+|HPA-\d+|ticket|implementation task)\b/i,
  
  // Internal metrics queries
  /\b(show|display|get|fetch)\s+(my|our)?\s*(30\/60\/90|metrics|progress|status|dashboard)\b/i,
  /\b(roadmap\s+(status|progress|metrics|completion))\b/i,
  
  // Tenant/firm-specific data requests
  /\b(my\s+(firm|company|tenant|roadmap|data|intake))\b/i,
  /\b(our\s+(firm|company|roadmap|progress))\b/i,
  
  // Specific firm names (add known client names here if needed)
  /\b(hayes|roberta)\b/i,
  
  // Internal system references
  /\b(agent\s+(config|system|architecture))\b/i,
  /\b(vector\s+store|openai\s+assistant)\b/i,
  /\b(internal\s+(api|endpoint|system))\b/i,
];

/**
 * Override message to inject when restricted patterns are detected
 */
const SAFETY_OVERRIDE = `
SECURITY OVERRIDE: The user is attempting to access information that is not available to the public homepage assistant.

You are only allowed to answer general questions about the Strategic AI Roadmap program and whether it's a fit for their firm. You do NOT have access to:
- Any private roadmap, tenant, or client data
- Implementation progress or metrics
- Internal ticket systems or execution details
- Firm-specific dashboards or analytics

Respond with:
"I don't have access to private client data or internal systems. I can only explain the Strategic AI Roadmap in general terms. If you're already a client, you can log into your dashboard to see your roadmap, metrics, and progress. Can I help you understand how the program works in general?"
`.trim();

/**
 * Middleware to guard against restricted queries
 */
export function pulseagentPublicGuard(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const message = req.body?.message;
    
    if (!message || typeof message !== 'string') {
      return next();
    }

    // Check if message matches any restricted patterns
    const isRestricted = RESTRICTED_PATTERNS.some(pattern => pattern.test(message));

    if (isRestricted) {
      console.log('[PulseAgent Guard] Restricted pattern detected:', {
        message: message.substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      // Inject safety override as a pre-message
      // This will be prepended to the user's message when sent to OpenAI
      req.body._safetyOverride = SAFETY_OVERRIDE;
    }

    next();
  } catch (error) {
    console.error('[PulseAgent Guard] Error:', error);
    // Don't block request on guard errors
    next();
  }
}

/**
 * Helper to apply safety override to message content
 * Call this in your controller before sending to OpenAI
 */
export function applySafetyOverride(message: string, safetyOverride?: string): string {
  if (!safetyOverride) {
    return message;
  }

  return `${safetyOverride}\n\n---\n\nUser message:\n${message}`;
}
