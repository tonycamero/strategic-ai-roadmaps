/**
 * Canonical Ticket System Enforcement
 * 
 * Throws a standardized error when legacy non-canonical ticket generation
 * paths are invoked. All ticket generation must use the canonical pipeline:
 * Discovery Synthesis + generateTicketsFromDiscovery()
 */

export class CanonicalRequiredError extends Error {
    public readonly code = 'CANONICAL_REQUIRED';
    public readonly statusCode = 409; // Conflict with canonical system requirement

    constructor(context?: string) {
        const message =
            'CANONICAL_REQUIRED: ingestDiagnostic() is deprecated and generates non-canonical tickets (INV-DERIVED-*). ' +
            'Use generateTicketsFromDiscovery() with Discovery Synthesis instead. ' +
            'See: backend/src/services/ticketGeneration.service.ts';

        const fullMessage = context ? `${message} [context=${context}]` : message;

        super(fullMessage);
        this.name = 'CanonicalRequiredError';

        // Maintain proper stack trace for debugging
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CanonicalRequiredError);
        }
    }
}

/**
 * Throws CanonicalRequiredError - use this to block legacy ticket generation paths
 * 
 * @param context - Optional context string for debugging (e.g., "temp_controller:generateSop01")
 * @throws {CanonicalRequiredError} Always throws
 */
export function canonicalRequired(context?: string): never {
    throw new CanonicalRequiredError(context);
}
