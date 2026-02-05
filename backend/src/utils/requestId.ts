/**
 * EXEC-BRIEF-PREUI-SWEEP-004
 * Request ID Utility for Correlation Tracking
 * 
 * Generates and manages request IDs for tracing requests across FE → BE → logs
 */

import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Generate a request ID
 * Prefers Netlify's x-nf-request-id if available, otherwise generates UUID
 */
export function generateRequestId(req: Request): string {
    // Prefer Netlify's request ID if present
    const netlifyId = req.headers['x-nf-request-id'];
    if (netlifyId && typeof netlifyId === 'string') {
        return netlifyId;
    }

    // Otherwise generate UUID
    return randomUUID();
}

/**
 * Middleware to attach request ID to all requests
 * Adds requestId to req object and response headers
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Generate or extract request ID
    const requestId = generateRequestId(req);

    // Attach to request object for use in handlers
    (req as any).requestId = requestId;

    // Add to response headers
    res.setHeader('x-request-id', requestId);

    next();
}

/**
 * Get request ID from request object
 */
export function getRequestId(req: Request): string | undefined {
    return (req as any).requestId;
}
