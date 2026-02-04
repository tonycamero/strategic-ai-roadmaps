/**
 * EXEC-BRIEF-UI-ACCEPTANCE-005: Brief Error Parser
 * Parses structured error responses from Executive Brief endpoints
 */

export interface BriefErrorPayload {
    error: string;
    code: string;
    stage?: string;
    message: string;
    requestId?: string;
    tenantId?: string;
    briefId?: string;
    violations?: Array<{
        path: string;
        rule: string;
        message: string;
        severity: string;
    }>;
    details?: Record<string, any>;
}

export function parseBriefError(error: any): BriefErrorPayload {
    // If error already has the structured payload
    if (error?.code && error?.message) {
        return {
            error: error.error || 'EXEC_BRIEF_ERROR',
            code: error.code,
            stage: error.stage,
            message: error.message,
            requestId: error.requestId,
            tenantId: error.tenantId,
            briefId: error.briefId,
            violations: error.violations,
            details: error.details
        };
    }

    // If error is from API response (has errorPayload)
    if (error?.errorPayload) {
        return parseBriefError(error.errorPayload);
    }

    // Fallback for unstructured errors
    return {
        error: 'EXEC_BRIEF_UNKNOWN_ERROR',
        code: 'UNKNOWN_ERROR',
        message: error?.message || 'Executive Brief action failed',
        requestId: error?.requestId
    };
}

export function isBriefActionError(error: any): boolean {
    // Brief action errors have specific codes
    const briefErrorCodes = [
        'INSUFFICIENT_SIGNAL',
        'CONTRACT_VIOLATION',
        'EXEC_BRIEF_INSUFFICIENT_SIGNAL',
        'SYNTHESIS_FAILED'
    ];

    return briefErrorCodes.includes(error?.code) ||
        briefErrorCodes.includes(error?.errorPayload?.code);
}
