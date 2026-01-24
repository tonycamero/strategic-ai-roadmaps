"use strict";
/**
 * FE-TA Operations Role Taxonomy
 * Deterministic question flow: H0 → Q1 → Q2 → Q3 → R1_REVEAL
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPS_TAXONOMY = void 0;
exports.OPS_TAXONOMY = {
    H0: {
        question: "Want to pinpoint where operations break under load?",
        options: [
            { id: "H0_YES", label: "Yes, let's do it" },
            { id: "H0_NO", label: "Just browsing" }
        ]
    },
    Q1: {
        question: "What fails first when things get busy?",
        options: [
            { id: "O1_HANDOFFS", label: "Cross-team handoffs" },
            { id: "O1_VISIBILITY", label: "Status visibility" },
            { id: "O1_DATA", label: "Data accuracy" },
            { id: "O1_PEOPLE", label: "Specific individuals" },
            { id: "O1_ALL", label: "Everything at once" }
        ]
    },
    Q2: {
        question: "Why does that failure occur?",
        options: [
            { id: "O2_MANUAL", label: "Manual steps dominate" },
            { id: "O2_OWNERSHIP", label: "Ownership is unclear" },
            { id: "O2_TOOLS", label: "Tools don't reflect reality" },
            { id: "O2_WORKAROUNDS", label: "Workarounds are normalized" }
        ]
    },
    Q3: {
        question: "How does the team recover?",
        options: [
            { id: "O3_FIRE", label: "Firefighting" },
            { id: "O3_MEETINGS", label: "More meetings" },
            { id: "O3_HERO", label: "A strong operator steps in" },
            { id: "O3_DELAY", label: "Work slows or stalls" }
        ]
    }
};
