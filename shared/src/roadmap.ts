import {
    RoadmapModel,
    RoadmapSectionId,
    RoadmapItem,
    SECTION_CONFIG,
    RoadmapViewMode,
    RoadmapSection
} from './roadmap.contract';

export * from './roadmap.contract';

export interface AssembleRoadmapInputs {
    firmId: string;
    version: string;
    executiveBrief: any;      // Acknowledged or Waived Brief
    diagnostics: any[];       // List of Approved Diagnostic Tickets
    intakeMetadata: {
        orgClarityScore: number;
        executionRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        constraintConsensusLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    snapshotId?: string;
    generatedBy: string;      // User ID of the SuperAdmin
}

/**
 * DETERMINISTIC ROADMAP COMPILER
 * Converts raw moderated signals into a structured Strategic Roadmap.
 */
export function assembleRoadmap(inputs: AssembleRoadmapInputs): RoadmapModel {
    const {
        firmId,
        version,
        executiveBrief,
        diagnostics,
        intakeMetadata,
        snapshotId
    } = inputs;

    // 1. Initialize Sections from Contract
    const sections: RoadmapSection[] = Object.keys(SECTION_CONFIG).map(id => {
        const config = SECTION_CONFIG[id as RoadmapSectionId];
        return {
            id: id as RoadmapSectionId,
            title: config.title,
            order: config.order,
            horizon: config.horizon,
            renderMode: config.renderMode,
            maxItems: config.maxItems,
            items: []
        };
    }).sort((a, b) => a.order - b.order);

    // 2. Map Diagnostics to Items (The Substance)
    const allItems: RoadmapItem[] = diagnostics.map(diag => {
        // Derive stability hash from source and intent
        const sourceId = diag.id || diag.ticket_id;
        const stableId = `itm-${sourceId.slice(0, 8)}`;

        return {
            id: stableId,
            title: diag.title || diag.ticketId,
            description: diag.description || diag.summary || "",
            rationale: diag.moveRationale || diag.reasoning || "Based on operational signal flow.",
            sourceRefs: [{ type: 'DIAGNOSTIC', id: sourceId }],
            riskLevel: (diag.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM',
            horizon: mapDiagnosticToHorizon(diag.priority, diag.type),
            isInternalOnly: diag.isInternalOnly || false
        };
    });

    // 3. Perform Priority Arbitration
    const sortedItems = allItems.sort((a, b) => {
        // 1. Executive Brief constraints (assumed diagnostics are already filtered by moderation)
        // 2. Execution Risk (Higher risk/impact goes first)
        const riskPriority = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const riskA = riskPriority[a.riskLevel];
        const riskB = riskPriority[b.riskLevel];
        if (riskA !== riskB) return riskB - riskA;

        // 3. Constraint Consensus (Fallback, placeholder for now)
        return 0;
    });

    // 4. Populate Sections based on Horizon & Render Mode
    sections.forEach(section => {
        if (section.id === 'executive-logic') {
            section.summary = executiveBrief.content?.substring(0, 500) || "Leadership alignment established.";
            return;
        }

        if (section.id === 'risk-watchpoints') {
            section.items = sortedItems
                .filter(item => item.riskLevel === 'HIGH')
                .slice(0, section.maxItems);
            return;
        }

        // Map initiatives to horizons
        if (section.horizon) {
            section.items = sortedItems
                .filter(item => item.horizon === section.horizon)
                .slice(0, section.maxItems);
        }
    });

    // 5. Final Model Assembly
    return {
        id: `rdm-${firmId}-${version}`,
        firmId,
        version,
        status: 'DRAFT',
        sections: sections.filter(s => s.items.length > 0 || s.summary),
        snapshotId,
        sourceRefs: {
            briefId: executiveBrief.id,
            diagnosticIds: diagnostics.map(d => d.id || d.ticket_id)
        },
        metadata: {
            generatedAt: new Date().toISOString(),
            orgClarityScore: intakeMetadata.orgClarityScore,
            executionRiskLevel: intakeMetadata.executionRiskLevel
        }
    };
}

/**
 * PURE PROJECTION
 * Redacts content based on view mode without re-sorting.
 */
export function projectRoadmap(model: RoadmapModel, mode: RoadmapViewMode): RoadmapModel {
    if (mode === 'EXECUTIVE') return model;

    // DELEGATE Projection: Remove internal-only items and redactions
    return {
        ...model,
        sections: model.sections.map(section => ({
            ...section,
            items: section.items.filter(item => !item.isInternalOnly)
        })).filter(section => section.items.length > 0 || section.summary)
    };
}

/**
 * INTERNAL HELPERS
 */

function mapDiagnosticToHorizon(priority: string, type: string): 30 | 90 | 180 {
    const p = String(priority).toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL' || p === 'IMMEDIATE') return 30;
    if (p === 'MEDIUM' || type === 'INFRASTRUCTURE') return 90;
    return 180;
}
