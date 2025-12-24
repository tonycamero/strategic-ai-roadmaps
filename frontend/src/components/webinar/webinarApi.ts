/**
 * Webinar API Client
 * Handles auth, registration, and diagnostic chat for webinar system
 */

export interface AuthRequest {
    password: string;
}

export interface AuthResponse {
    ok: boolean;
    passwordVersion?: number;
    message?: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    company: string;
    role?: string;
    teamSize?: number;
    currentCrm?: string;
    bottleneck?: string;
    source?: string;
    metadata?: Record<string, any>;
}

export interface RegisterResponse {
    ok: boolean;
    message?: string;
}

export interface DiagnosticChatRequest {
    sessionId?: string;
    role?: 'owner' | 'sales' | 'ops' | 'delivery';
    message: string;
    teamSessionId?: string;
    evidence?: string;
}

export interface DiagnosticChatResponse {
    sessionId: string;
    role: string;
    message: string;
    options?: Array<{ id: string; label: string }>;
    cta?: { type: string; label: string };
    reveal?: {
        headline: string;
        signals: string[];
        diagnosis: string;
    };
    progress?: {
        roles: Record<string, boolean>;
        completedCount: number;
        isTeamComplete: boolean;
    };
    teamReport?: {
        primaryConstraint: string;
        alignment: string;
        headline: string;
        summary: string;
        topSignals: string[];
        whyThisCompounds: string;
        firstMoves: string[];
        risks: string[];
        evidence: any;
        contradictions: any[];
        comparisonMatrix: any;
    };
}

/**
 * Validate webinar password
 */
export async function validatePassword(password: string): Promise<AuthResponse> {
    const response = await fetch('/api/public/diagnostic/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password } as AuthRequest),
    });

    if (!response.ok) {
        throw new Error(`Auth failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Register for webinar
 */
export async function registerForWebinar(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch('/api/public/diagnostic/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Send diagnostic chat message
 */
export async function sendDiagnosticMessage(
    message: string,
    sessionId?: string,
    role?: DiagnosticChatRequest['role'],
    evidence?: string,
    teamSessionId?: string
): Promise<DiagnosticChatResponse> {
    const response = await fetch('/api/public/diagnostic/diagnostic/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            sessionId,
            role,
            evidence,
            teamSessionId
        } as DiagnosticChatRequest),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Diagnostic API error: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Generate full team strategy
 */
export async function generateTeamResults(data: {
    sessionId: string;
    rolePayloads: Record<string, any>;
}): Promise<any> {
    const response = await fetch('/api/public/diagnostic/diagnostic/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Team Strategy API error: ${response.statusText}`);
    }

    return response.json();
}

export const webinarApi = {
    validatePassword,
    registerForWebinar,
    sendDiagnosticMessage,
    generateTeamResults,
    generateTeamPdf
};

/**
 * Generate PDF for team report
 */
export async function generateTeamPdf(teamSessionId: string, rolePayloads: any): Promise<Blob> {
    const response = await fetch('/api/public/diagnostic/pdf/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamSessionId, rolePayloads }),
    });

    if (!response.ok) {
        throw new Error(`PDF Generation failed: ${response.statusText}`);
    }

    return response.blob();
}
