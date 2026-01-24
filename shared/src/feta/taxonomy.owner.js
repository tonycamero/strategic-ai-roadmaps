"use strict";
/**
 * Owner Role Taxonomy
 * (Migrated from canonical.js - existing content)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OWNER_TAXONOMY = void 0;
exports.OWNER_TAXONOMY = {
    "H0": {
        "question": "Hey — thanks for stopping by.\nI'm guessing you might want some help diagnosing where your operations are breaking.\nWant to take a quick look?",
        "options": [
            {
                "id": "H0_YES",
                "label": "Yes, let's do it"
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
        "question": "Here's what I see:",
        "options": []
    }
};
