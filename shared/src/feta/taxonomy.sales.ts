/**
 * FE-TA Sales Role Taxonomy
 * Deterministic question flow: H0 → Q1 → Q2 → Q3 → R1_REVEAL
 */

export const SALES_TAXONOMY = {
    H0: {
        question: "This will take about 60 seconds. Want to diagnose where revenue flow breaks?",
        options: [
            { id: "H0_YES", label: "Yes, let's do it" },
            { id: "H0_NO", label: "Just browsing" }
        ]
    },

    Q1: {
        question: "Where do deals most often stall?",
        options: [
            { id: "S1_FOLLOWUP", label: "After first contact" },
            { id: "S1_QUALIFY", label: "During qualification" },
            { id: "S1_PROPOSAL", label: "After proposal is sent" },
            { id: "S1_CLOSE", label: "At final decision" },
            { id: "S1_UNKNOWN", label: "We don't know consistently" }
        ]
    },

    Q2: {
        question: "What usually causes that stall?",
        options: [
            { id: "S2_MANUAL", label: "Manual follow-ups fall through" },
            { id: "S2_CONTEXT", label: "Context isn't captured or visible" },
            { id: "S2_SPEED", label: "Responses are too slow" },
            { id: "S2_AUTHORITY", label: "Decision authority isn't clear" },
            { id: "S2_TOOLING", label: "CRM/tools aren't trusted" }
        ]
    },

    Q3: {
        question: "Who is currently absorbing that failure?",
        options: [
            { id: "S3_FOUNDER", label: "Founder / exec steps in" },
            { id: "S3_REP", label: "Individual reps compensate" },
            { id: "S3_TEAM", label: "Team firefights together" },
            { id: "S3_CUSTOMER", label: "Customer waits or disengages" }
        ]
    }
};
