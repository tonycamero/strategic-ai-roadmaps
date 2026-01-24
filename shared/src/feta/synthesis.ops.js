"use strict";
/**
 * FE-TA Operations Synthesis Blocks
 * Maps answer patterns to diagnostic insights
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPS_SYNTHESIS = void 0;
exports.selectOpsSynthesis = selectOpsSynthesis;
exports.OPS_SYNTHESIS = {
    SB_01: {
        headline: "Operations rely on informal coordination.",
        signals: [
            "Handoffs depend on people noticing problems",
            "Visibility is reconstructed after the fact",
            "Errors are corrected manually"
        ],
        diagnosis: "The system functions only while people actively compensate. Under stress, fragility becomes visible and costly."
    },
    SB_02: {
        headline: "Work scales faster than control.",
        signals: [
            "Manual processes multiply",
            "No single source of truth exists",
            "Confidence in data erodes"
        ],
        diagnosis: "Operational load grows without structural reinforcement, creating compounding risk and burnout."
    },
    SB_03: {
        headline: "Firefighting has become the operating model.",
        signals: [
            "Meetings replace execution",
            "Priority shifts constantly",
            "Stability depends on specific people"
        ],
        diagnosis: "The organization is reactive by default. Without systemic correction, this pattern hardens."
    }
};
/**
 * Synthesis selection logic for Operations role
 * Maps answer combinations to appropriate synthesis blocks
 */
function selectOpsSynthesis(answers) {
    const { Q1, Q2, Q3 } = answers;
    // Pattern 1: Informal coordination / manual processes
    if ((Q1 === 'O1_HANDOFFS' || Q1 === 'O1_VISIBILITY') &&
        Q2 === 'O2_MANUAL') {
        return 'SB_01';
    }
    // Pattern 2: Scaling issues
    if (Q1 === 'O1_DATA' || Q2 === 'O2_TOOLS' || Q1 === 'O1_ALL') {
        return 'SB_02';
    }
    // Pattern 3: Firefighting mode
    if (Q3 === 'O3_FIRE' || Q3 === 'O3_MEETINGS' || Q3 === 'O3_HERO') {
        return 'SB_03';
    }
    // Default fallback
    return 'SB_01';
}
