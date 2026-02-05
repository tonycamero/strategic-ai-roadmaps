/**
 * EXEC-BRIEF-PREUI-SWEEP-004
 * Standardized Error Response Utilities
 * 
 * Provides consistent error payload structure across all Executive Brief endpoints
 */

import type { Response, Request } from 'express';
import { getRequestId } from './requestId';
import type { ValidationViolation } from '../services/executiveBriefValidation.service';

/**
 * Standard error payload structure for Executive Brief operations
 */
export interface ExecutiveBriefErrorPayload {
    error: string;
    code: string;
    stage?: string;
    message: string;
    requestId?: string;
    tenantId?: string;
    briefId?: string;
    violations?: ValidationViolation[];
    details?: Record<string, any>;

    // EXEC-BRIEF-SIGNAL-GATE-009A: Threshold metadata
    assertionCount?: number;
    minRequired?: number;
    targetCount?: number;
}

/**
 * Send standardized error response
 */
export function sendBriefError(
    res: Response,
    req: Request,
    statusCode: number,
    payload: Omit<ExecutiveBriefErrorPayload, 'requestId'> & { requestId?: string }
): void {
    const requestId = payload.requestId || getRequestId(req);

    const errorPayload: ExecutiveBriefErrorPayload = {
        ...payload,
        requestId
    };

    // Set x-request-id header if not already set
    if (requestId && !res.getHeader('x-request-id')) {
        res.setHeader('x-request-id', requestId);
    }

    res.status(statusCode).json(errorPayload);
}

/**
 * Send CONTRACT_VIOLATION error with violations
 */
export function sendContractViolationError(
    res: Response,
    req: Request,
    violations: ValidationViolation[],
    tenantId?: string,
    briefId?: string
): void {
    sendBriefError(res, req, 500, {
        error: 'EXEC_BRIEF_CONTRACT_VIOLATION',
        code: 'CONTRACT_VIOLATION',
        stage: 'ASSEMBLY_VALIDATION',
        message: `Executive Brief synthesis failed contract validation: ${violations.length} violation(s)`,
        tenantId,
        briefId,
        violations
    });
}
