/**
 * Webinar PDF Data Shaper
 * Maps session stores to canonical template interface
 * DETERMINISTIC: same inputs -> same outputs
 */

import { FETA_REGISTRY, type RoleId } from '@roadmap/shared';

interface SessionState {
    step: string;
    answers: {
        H0: string | null;
        Q1: string | null;
        Q2: string | null;
        Q3: string | null;
    };
}

interface TeamSession {
    teamSessionId: string;
    rolesCompleted: Record<RoleId, boolean>;
    roleAnswers: Record<RoleId, any>;
    roleEvidence: Record<RoleId, any>;
    roleSessions: Record<RoleId, string>;
}

export interface RolePdfData {
    roleName: string;
    sessionId: string;
    kicker: string;
    primaryBottleneckName: string;
    headline: string;
    subhead: string;
    evidenceObserved: string;
    impactVector: string;
    evidenceQuote1?: string;
    evidenceQuote2?: string;
    findings: Array<{
        claim: string;
        consequence: string;
        evidence?: string;
    }>;
    primaryBottleneckSummary: string;
    compoundingTags: string[];
    bottleneckEvidence?: string;
    plan: Array<{
        week: string;
        action: string;
        why: string;
        owner: string;
    }>;
    risks: string[];
    ctaLink: string;
}

export interface TeamPdfData {
    generatedAt: string;
    rolesCompleted: number;
    companyName?: string;
    contactName?: string;
    contactEmail?: string;
    teamSessionId: string;
    team: {
        primaryConstraint: string;
        headline: string;
        summary: string;
        alignment: string;
        contradictions: number;
        confidenceLabel: string;
        keySignals?: string[];
    };
    roles: RolePdfData[];
    year: number;
}

const ROLE_NAMES: Record<RoleId, string> = {
    owner: 'Owner',
    sales: 'Sales',
    ops: 'Operations',
    delivery: 'Delivery'
};

/**
 * Shape role session data for PDF template
 */
export function shapeRolePdfData(
    role: RoleId,
    sessionState: SessionState,
    sessionId: string,
    teamSessionId?: string
): RolePdfData {
    const roleConfig = FETA_REGISTRY[role];
    const synthesisKey = roleConfig.selectSynthesis(sessionState.answers);
    const synthesis = roleConfig.synthesis[synthesisKey];

    // Extract synthesis components
    const headline = synthesis?.headline || 'Diagnostic Complete';
    const signals = synthesis?.signals || [];
    const diagnosis = synthesis?.diagnosis || '';

    return {
        roleName: ROLE_NAMES[role],
        sessionId: sessionId.substring(0, 12) + '...', // Truncate for display
        kicker: `${ROLE_NAMES[role].toUpperCase()} DIAGNOSTIC`,
        primaryBottleneckName: headline.split('—')[0]?.trim() || 'Primary Bottleneck',
        headline,
        subhead: diagnosis,
        evidenceObserved: signals[0] || 'Execution patterns observed',
        impactVector: signals[1] || 'Compounding effects detected',
        evidenceQuote1: undefined, // Evidence would come from roleEvidence if captured
        evidenceQuote2: undefined,
        findings: [
            {
                claim: signals[0] || 'Pattern detected',
                consequence: 'Creates execution friction',
                evidence: undefined
            },
            {
                claim: signals[1] || 'Secondary pattern',
                consequence: 'Compounds primary constraint',
                evidence: undefined
            },
            {
                claim: signals[2] || 'Systemic impact',
                consequence: 'Affects cross-functional coordination',
                evidence: undefined
            }
        ].filter(f => f.claim !== 'Pattern detected'), // Remove defaults if no real signal
        primaryBottleneckSummary: diagnosis,
        compoundingTags: [
            'Structural',
            'Repeating',
            'Cross-functional'
        ],
        bottleneckEvidence: undefined,
        plan: [
            {
                week: 'W1',
                action: 'Map current state and identify quick wins',
                why: 'Establish baseline and build momentum',
                owner: ROLE_NAMES[role]
            },
            {
                week: 'W2-3',
                action: 'Implement tactical fixes to reduce immediate friction',
                why: 'Create space for strategic changes',
                owner: 'Operations'
            },
            {
                week: 'W4+',
                action: 'Monitor impact and iterate on systemic changes',
                why: 'Ensure constraint removal persists',
                owner: 'Leadership'
            }
        ],
        risks: [
            'Fixes may not persist without systemic changes',
            'Local optimizations could create new bottlenecks',
            'Team may revert to workarounds under pressure',
            'Misalignment could widen without shared visibility'
        ],
        ctaLink: `https://strategicai.io/roadmap?session=${teamSessionId || sessionId}`
    };
}

/**
 * Shape team session data for comprehensive PDF
 */
export function shapeTeamPdfData(
    teamSession: TeamSession,
    sessionStates: Map<string, SessionState>
): TeamPdfData {
    const completedRoles: RoleId[] = (Object.keys(teamSession.rolesCompleted) as RoleId[])
        .filter(role => teamSession.rolesCompleted[role]);

    const rolePdfs = completedRoles.map(role => {
        const roleSessionId = teamSession.roleSessions[role];
        const compositeKey = `${role}:${roleSessionId}`;
        const sessionState = sessionStates.get(compositeKey);

        if (!sessionState) {
            // Fallback for missing session
            return shapeRolePdfData(role, {
                step: 'R1_REVEAL',
                answers: { H0: null, Q1: null, Q2: null, Q3: null }
            }, roleSessionId || 'unknown', teamSession.teamSessionId);
        }

        return shapeRolePdfData(role, sessionState, roleSessionId, teamSession.teamSessionId);
    });

    // Compute team-level metrics
    const primaryConstraints = rolePdfs.map(r => r.primaryBottleneckName);
    const mostCommon = primaryConstraints.reduce((acc, c) => {
        acc[c] = (acc[c] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const primaryConstraint = Object.keys(mostCommon).sort((a, b) => mostCommon[b] - mostCommon[a])[0] || 'Systemic Fragmentation';

    const alignment = completedRoles.length === 4 ? 'MED' : 'LOW';
    const contradictions = Math.floor(completedRoles.length / 2); // Simplified

    return {
        generatedAt: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        rolesCompleted: completedRoles.length,
        companyName: undefined, // Could be pulled from registration if available
        contactName: undefined,
        contactEmail: undefined,
        teamSessionId: teamSession.teamSessionId.substring(0, 12) + '...',
        team: {
            primaryConstraint,
            headline: 'Your team is compensating for execution gaps — and the mismatch is the signal',
            summary: `Across ${completedRoles.length} roles, patterns reveal that ${primaryConstraint.toLowerCase()} is creating systematic friction. Each function sees it differently, which is itself diagnostic.`,
            alignment,
            contradictions,
            confidenceLabel: completedRoles.length >= 3 ? 'MEDIUM' : 'LOW',
            keySignals: [
                'Cross-functional misalignment on root causes',
                'Each role compensating differently',
                'Systemic patterns emerge across diagnostics'
            ]
        },
        roles: rolePdfs,
        year: new Date().getFullYear()
    };
}
