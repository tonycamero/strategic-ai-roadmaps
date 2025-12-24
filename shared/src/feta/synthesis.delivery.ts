/**
 * FE-TA Delivery Synthesis Blocks
 * Maps answer patterns to diagnostic insights
 */

export const DELIVERY_SYNTHESIS = {
    SB_01: {
        headline: "Execution loses momentum after the sale.",
        signals: [
            "Critical context drops at handoff",
            "Teams restart understanding mid-stream",
            "Customers feel the disconnect"
        ],
        diagnosis:
            "Delivery friction isn't caused by effort — it's caused by missing continuity."
    },

    SB_02: {
        headline: "Rework has been normalized.",
        signals: [
            "Scope clarifications happen late",
            "Corrections consume capacity",
            "Quality depends on vigilance"
        ],
        diagnosis:
            "Execution drag compounds quietly, extending timelines and eroding trust."
    },

    SB_03: {
        headline: "Customers absorb internal confusion.",
        signals: [
            "Status updates are reactive",
            "Expectations drift",
            "Confidence erodes over time"
        ],
        diagnosis:
            "Delivery breakdowns surface externally, even when teams work hard internally."
    }
};

/**
 * Synthesis selection logic for Delivery role
 * Maps answer combinations to appropriate synthesis blocks
 */
export function selectDeliverySynthesis(answers: { Q1?: string; Q2?: string; Q3?: string }): string {
    const { Q1, Q2, Q3 } = answers;

    // Pattern 1: Handoff/context issues
    if (
        (Q1 === 'D1_HANDOFF' || Q1 === 'D1_SCOPE') &&
        (Q2 === 'D2_CONTEXT' || Q2 === 'D2_PRIORITIES')
    ) {
        return 'SB_01';
    }

    // Pattern 2: Rework patterns
    if (Q1 === 'D1_REWORK' || Q2 === 'D2_CHANGES') {
        return 'SB_02';
    }

    // Pattern 3: Customer-facing impact
    if (Q3 === 'D3_CUSTOMER' || Q2 === 'D2_COMM' || Q1 === 'D1_STATUS') {
        return 'SB_03';
    }

    // Default fallback
    return 'SB_01';
}
