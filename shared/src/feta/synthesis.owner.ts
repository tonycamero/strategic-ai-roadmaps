/**
 * Owner Role Synthesis
 * (Migrated from canonical.js - existing content)
 */

export const OWNER_SYNTHESIS = {
    "SB-01": {
        "headline": "You rely on talent to bridge gaps that systems should handle.",
        "signals": [
            "Follow-ups stall → revenue leaks silently",
            "Workarounds replace process → inconsistency grows",
            "No clear owner → issues recycle forever"
        ],
        "diagnosis": "This pattern usually means the business is operating on memory + urgency, not infrastructure."
    },
    "SB-02": {
        "headline": "You have a Vacuum of Ownership.",
        "signals": [
            "Follow-ups stall → revenue leaks silently",
            "Workarounds replace process → inconsistency grows",
            "No clear owner → issues recycle forever"
        ],
        "diagnosis": "Because no one explicitly owns the 'fix', the friction compounds daily."
    },
    "SB-03": {
        "headline": "You are facing a Scale Ceiling.",
        "signals": [
            "Follow-ups stall → revenue leaks silently",
            "Workarounds replace process → inconsistency grows",
            "No clear owner → issues recycle forever"
        ],
        "diagnosis": "Your current manual bridges work for 50 clients but will break at 100."
    }
};

export function selectOwnerSynthesis(answers: { Q1?: string; Q2?: string; Q3?: string }): string {
    const { Q1, Q2, Q3 } = answers;
    if (Q3 === 'A3_NONE') return 'SB-02';
    if (Q1 === 'A1_LOAD' || Q2 === 'A2_MAN' || Q2 === 'A2_FOUN') return 'SB-03';
    return 'SB-01';
}
