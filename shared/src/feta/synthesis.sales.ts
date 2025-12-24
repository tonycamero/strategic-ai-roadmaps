/**
 * FE-TA Sales Synthesis Blocks
 * Maps answer patterns to diagnostic insights
 */

export const SALES_SYNTHESIS = {
    SB_01: {
        headline: "Revenue depends on individual heroics, not a system.",
        signals: [
            "Follow-ups rely on memory instead of enforcement",
            "Deal context isn't persistent across stages",
            "Pipeline confidence is emotional, not evidential"
        ],
        diagnosis:
            "Sales execution breaks when attention shifts. Without enforced follow-up and shared context, revenue leaks silently even when demand exists."
    },

    SB_02: {
        headline: "Sales velocity collapses under volume.",
        signals: [
            "Response speed degrades as leads increase",
            "Prioritization becomes reactive",
            "High-intent prospects wait too long"
        ],
        diagnosis:
            "The system cannot scale attention. As volume rises, the team spends energy deciding what to do instead of executing consistently."
    },

    SB_03: {
        headline: "Leadership is compensating for sales system gaps.",
        signals: [
            "Founder steps in to unblock deals",
            "Authority routes upward by default",
            "Process discipline erodes under pressure"
        ],
        diagnosis:
            "Revenue appears healthy only because leadership absorbs systemic failure. This creates a hidden ceiling on growth."
    }
};

/**
 * Synthesis selection logic for Sales role
 * Maps answer combinations to appropriate synthesis blocks
 */
export function selectSalesSynthesis(answers: { Q1?: string; Q2?: string; Q3?: string }): string {
    const { Q1, Q2, Q3 } = answers;

    // Pattern 1: Manual/memory failures with individual compensation
    if (
        (Q2 === 'S2_MANUAL' || Q2 === 'S2_CONTEXT') &&
        (Q3 === 'S3_REP' || Q3 === 'S3_TEAM')
    ) {
        return 'SB_01';
    }

    // Pattern 2: Speed/volume issues
    if (Q2 === 'S2_SPEED' || Q1 === 'S1_UNKNOWN') {
        return 'SB_02';
    }

    // Pattern 3: Leadership absorption
    if (Q3 === 'S3_FOUNDER' || Q2 === 'S2_AUTHORITY') {
        return 'SB_03';
    }

    // Default fallback
    return 'SB_01';
}
