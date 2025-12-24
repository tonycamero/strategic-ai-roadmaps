/**
 * FE-TA Delivery Role Taxonomy
 * Deterministic question flow: H0 → Q1 → Q2 → Q3 → R1_REVEAL
 */

export const DELIVERY_TAXONOMY = {
    H0: {
        question: "Want to see where execution drags or breaks?",
        options: [
            { id: "H0_YES", label: "Yes, let's do it" },
            { id: "H0_NO", label: "Just browsing" }
        ]
    },

    Q1: {
        question: "Where does work slow down after it's sold?",
        options: [
            { id: "D1_HANDOFF", label: "Sales → delivery handoff" },
            { id: "D1_SCOPE", label: "Scope clarity" },
            { id: "D1_STATUS", label: "Status tracking" },
            { id: "D1_REWORK", label: "Rework and corrections" }
        ]
    },

    Q2: {
        question: "What causes that slowdown?",
        options: [
            { id: "D2_CONTEXT", label: "Missing context" },
            { id: "D2_CHANGES", label: "Late changes" },
            { id: "D2_COMM", label: "Customer communication gaps" },
            { id: "D2_PRIORITIES", label: "Unclear priorities" }
        ]
    },

    Q3: {
        question: "Who absorbs the impact?",
        options: [
            { id: "D3_TEAM", label: "Delivery team" },
            { id: "D3_LEAD", label: "Project lead" },
            { id: "D3_CUSTOMER", label: "Customer" },
            { id: "D3_ALL", label: "Everyone involved" }
        ]
    }
};
