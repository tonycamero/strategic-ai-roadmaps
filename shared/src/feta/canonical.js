/**
 * ⚠️ EXECUTION LOCK — DO NOT MODIFY CASUALLY
 *
 * This file is governed by /working_protocol.md
 *
 * Default mode: NON-DESTRUCTIVE
 * Forbidden unless explicitly authorized:
 * - Refactors
 * - File moves or deletions
 * - API contract changes
 * - Dropping fields (e.g. cta, reveal)
 *
 * If unsure: STOP and ask before editing.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FETA_CANONICAL_SYNTHESIS = exports.FETA_CANONICAL_TAXONOMY = void 0;
/**
 * AUTO-GENERATED FROM /canonical/feta
 * DO NOT EDIT MANUALLY
 */
exports.FETA_CANONICAL_TAXONOMY = {
    "H0": {
        "question": "Hey — thanks for stopping by.\nI’m guessing you might want some help diagnosing where your operations are breaking.\nWant to take a quick look?",
        "options": [
            {
                "id": "H0_YES",
                "label": "Yes, let’s do it"
            },
            {
                "id": "H0_NO",
                "label": "Just browsing"
            }
        ]
    },
    "Q1": {
        "question": "Where does execution most often break?",
        "options": [
            {
                "id": "A1_FU",
                "label": "Leads or follow-ups stall"
            },
            {
                "id": "A1_RESP",
                "label": "Responses take too long"
            },
            {
                "id": "A1_HAND",
                "label": "Internal handoffs break"
            },
            {
                "id": "A1_LOAD",
                "label": "Things break under volume"
            },
            {
                "id": "A1_CHAOS",
                "label": "Everything feels reactive"
            }
        ]
    },
    "Q2": {
        "question": "When that happens, what usually fills the gap?",
        "options": [
            {
                "id": "A2_MAN",
                "label": "Manual grunt work"
            },
            {
                "id": "A2_MEET",
                "label": "More meetings/slack"
            },
            {
                "id": "A2_FOUN",
                "label": "Founder steps in"
            },
            {
                "id": "A2_LOST",
                "label": "Nothing (opportunity lost)"
            }
        ]
    },
    "Q3": {
        "question": "When execution fails, who actually owns fixing it?",
        "options": [
            {
                "id": "A3_FOUN",
                "label": "Founder / Partner (Me)"
            },
            {
                "id": "A3_OPS",
                "label": "Ops Lead / Manager"
            },
            {
                "id": "A3_NONE",
                "label": "No one (it just lingers)"
            },
            {
                "id": "A3_VEND",
                "label": "External Vendor/Agency"
            }
        ]
    },
    "R1_REVEAL": {
        "question": "Here’s what I see:",
        "options": []
    }
};
exports.FETA_CANONICAL_SYNTHESIS = {
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
