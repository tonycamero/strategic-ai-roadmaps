<<<<<<< HEAD
"use strict";
=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
/**
 * EXECUTIVE BRIEF RENDERING CONTRACT
 *
 * This file defines the strictly-typed boundaries for how an Executive Brief
 * must be rendered in any medium (UI, PDF, etc).
 */
<<<<<<< HEAD
export const VISIBILITY_RULES = {
    SYSTEM: {
        excludeIds: ['constraint-landscape']
    },
    PRIVATE: {
        excludeIds: []
    }
};
=======

export type RenderMode =
    | 'PROSE_NARRATIVE'  // Standard paragraph flow
    | 'PATTERN_LIST'     // Intro text + bulleted patterns
    | 'METRIC_CALLOUT'   // High/Medium/Low + interpretation
    | 'BULLET_LIST';     // Raw bulleted list

export type ViewProjection = 'PRIVATE' | 'SYSTEM';

export interface MetricBlock {
    level: 'Low' | 'Medium' | 'High';
    interpretation: string;
    capacityScore?: number;
}

export type SectionId =
    | 'executive-summary'
    | 'operating-reality'
    | 'alignment-signals'
    | 'risk-signals'
    | 'readiness-signals'
    | 'constraint-landscape'
    | 'blind-spot-risks';

export interface ExecutiveBriefSection {
    id: SectionId;
    title: string;
    sublabel?: string;
    intro?: string;
    content: string | string[] | MetricBlock;
    renderMode: RenderMode;
}

/**
 * VISIBILITY RULES
 * Rules for content exclusion based on view projection.
 */
export const VISIBILITY_RULES = {
    SYSTEM: {
        excludeIds: ['constraint-landscape'] as SectionId[]
    },
    PRIVATE: {
        excludeIds: [] as SectionId[]
    }
} as const;

>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
/**
 * CONTRACT INVARIANTS:
 * 1. Paragraph Splitting: 4 sentences per paragraph (Cognitive Load Guard).
 * 2. Bullet Eligibility: Minimum 5 characters per bullet.
 * 3. Hide/Show: Sections with null/empty content must be omitted, not rendered with placeholders.
 */
export const CONTRACT_LIMITS = {
    SENTENCES_PER_PARAGRAPH: 4,
<<<<<<< HEAD
    MIN_BULLET_LENGTH: 2, // Relaxed for raw synthesis
    MIN_PROSE_LENGTH: 10, // Relaxed for raw synthesis
    MIN_INTERPRETATION_LENGTH: 5 // Relaxed for raw synthesis
};
export function getSectionTitle(id: string): string {
=======
    MIN_BULLET_LENGTH: 5,
    MIN_PROSE_LENGTH: 40,
    MIN_INTERPRETATION_LENGTH: 20
} as const;

export function getSectionTitle(id: SectionId): string {
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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
