/**
 * STRATEGIC ROADMAP CANONICAL CONTRACT
 * 
 * This file defines the strictly-typed boundaries for the Roadmap assembly.
 */

export type RoadmapHorizon = 30 | 90 | 180;

export type RoadmapSectionId =
    | 'executive-logic'
    | 'operational-integrity'
    | 'operational-infrastructure'
    | 'strategic-capabilities'
    | 'risk-watchpoints';

export type RoadmapRenderMode =
    | 'NARRATIVE'        // Prose summary
    | 'INITIATIVE_GRID'  // Structured grid of items
    | 'RISK_MATRIX';     // Specific for watchpoints

export interface RoadmapItem {
    id: string;             // Stable, hash-derived
    title: string;
    description: string;
    rationale: string;
    sourceRefs: {
        type: 'DIAGNOSTIC' | 'BRIEF' | 'SIGNAL';
        id: string;
    }[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    horizon: RoadmapHorizon | null;
    isInternalOnly: boolean; // For delegate redaction
}

export interface RoadmapSection {
    id: RoadmapSectionId;
    title: string;
    order: number;
    horizon: RoadmapHorizon | null;
    renderMode: RoadmapRenderMode;
    maxItems: number;
    items: RoadmapItem[];
    summary?: string;
}

export interface RoadmapModel {
    id: string;
    firmId: string;
    version: string;
    status: 'DRAFT' | 'PUBLISHED';
    sections: RoadmapSection[];
    snapshotId?: string;
    sourceRefs: {
        briefId: string;
        diagnosticIds: string[];
    };
    metadata: {
        generatedAt: string;
        publishedAt?: string;
        orgClarityScore: number;
        executionRiskLevel: string;
    };
}

export type RoadmapViewMode = 'EXECUTIVE' | 'DELEGATE';

/**
 * CONTRACT INVARIANTS (SECTION METADATA)
 */
export const SECTION_CONFIG: Record<RoadmapSectionId, {
    title: string;
    order: number;
    horizon: RoadmapHorizon | null;
    renderMode: RoadmapRenderMode;
    maxItems: number;
}> = {
    'executive-logic': {
        title: 'Executive Logic & Guardrails',
        order: 10,
        horizon: null,
        renderMode: 'NARRATIVE',
        maxItems: 1
    },
    'operational-integrity': {
        title: 'Operational Integrity (0-30 Days)',
        order: 20,
        horizon: 30,
        renderMode: 'INITIATIVE_GRID',
        maxItems: 5
    },
    'operational-infrastructure': {
        title: 'Operational Infrastructure (30-90 Days)',
        order: 30,
        horizon: 90,
        renderMode: 'INITIATIVE_GRID',
        maxItems: 5
    },
    'strategic-capabilities': {
        title: 'Strategic AI Capabilities (90-180 Days)',
        order: 40,
        horizon: 180,
        renderMode: 'INITIATIVE_GRID',
        maxItems: 3
    },
    'risk-watchpoints': {
        title: 'Risks & Watchpoints',
        order: 50,
        horizon: null,
        renderMode: 'RISK_MATRIX',
        maxItems: 5
    }
};
