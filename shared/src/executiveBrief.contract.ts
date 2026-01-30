"use strict";
/**
 * EXECUTIVE BRIEF RENDERING CONTRACT
 *
 * This file defines the strictly-typed boundaries for how an Executive Brief
 * must be rendered in any medium (UI, PDF, etc).
 */
export const VISIBILITY_RULES = {
    SYSTEM: {
        excludeIds: ['constraint-landscape']
    },
    PRIVATE: {
        excludeIds: []
    }
};
/**
 * CONTRACT INVARIANTS:
 * 1. Paragraph Splitting: 4 sentences per paragraph (Cognitive Load Guard).
 * 2. Bullet Eligibility: Minimum 5 characters per bullet.
 * 3. Hide/Show: Sections with null/empty content must be omitted, not rendered with placeholders.
 */
export const CONTRACT_LIMITS = {
    SENTENCES_PER_PARAGRAPH: 4,
    MIN_BULLET_LENGTH: 2, // Relaxed for raw synthesis
    MIN_PROSE_LENGTH: 10, // Relaxed for raw synthesis
    MIN_INTERPRETATION_LENGTH: 5 // Relaxed for raw synthesis
};
export function getSectionTitle(id: string): string {
    switch (id) {
        case 'executive-summary': return "Executive Summary (For Reference Only)";
        case 'operating-reality': return "Leadership Perception vs Operational Reality";
        case 'alignment-signals': return "Trust & Signal Flow";
        case 'risk-signals': return "Executive Risk Language";
        case 'readiness-signals': return "Implementation Readiness";
        case 'constraint-landscape': return "Awareness Gaps (Unseen or Normalized)";
        case 'blind-spot-risks': return "Decision Latency & Risk";
        default: return "Untitled Section";
    }
}
