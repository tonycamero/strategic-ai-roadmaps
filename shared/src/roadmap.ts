import { SECTION_CONFIG } from "./roadmap.contract";

/**
 * DETERMINISTIC ROADMAP COMPILER
 * Converts raw moderated signals into a structured Strategic Roadmap.
 */
export function assembleRoadmap(inputs: any) {
    const { firmId, version, executiveBrief, diagnostics, intakeMetadata, snapshotId } = inputs;

    // 1. Initialize Sections from Contract
    const sections = (Object.keys(SECTION_CONFIG) as Array<keyof typeof SECTION_CONFIG>).map(id => {
        const config = SECTION_CONFIG[id];
        return {
            id: id,
            title: config.title,
            order: config.order,
            horizon: config.horizon,
            renderMode: config.renderMode,
            maxItems: config.maxItems,
            items: [] as any[],
            summary: undefined as string | undefined
        };
    }).sort((a, b) => a.order - b.order);

    // 2. Map Diagnostics to Items (The Substance)
    const allItems = diagnostics.map((diag: any) => {
        // Derive stability hash from source and intent
        const sourceId = diag.id || diag.ticket_id;
        const stableId = `itm-${sourceId.slice(0, 8)}`;

        return {
            id: stableId,
            title: diag.title || diag.ticketId,
            description: diag.description || diag.summary || "",
            rationale: diag.moveRationale || diag.reasoning || "Based on operational signal flow.",
            sourceRefs: [{ type: 'DIAGNOSTIC', id: sourceId }],
            riskLevel: diag.riskLevel || 'MEDIUM',
            horizon: mapDiagnosticToHorizon(diag.priority, diag.type),
            isInternalOnly: diag.isInternalOnly || false
        };
    });

    // 3. Perform Priority Arbitration
    const sortedItems = allItems.sort((a: any, b: any) => {
        // 1. Executive Brief constraints (assumed diagnostics are already filtered by moderation)
        // 2. Execution Risk (Higher risk/impact goes first)
        const riskPriority: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const riskA = riskPriority[a.riskLevel as keyof typeof riskPriority] || 0;
        const riskB = riskPriority[b.riskLevel as keyof typeof riskPriority] || 0;

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
                .filter((item: any) => item.riskLevel === 'HIGH')
                .slice(0, section.maxItems);
            return;
        }

        // Map initiatives to horizons
        if (section.horizon) {
            section.items = sortedItems
                .filter((item: any) => item.horizon === section.horizon)
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
            diagnosticIds: diagnostics.map((d: any) => d.id || d.ticket_id)
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
export function projectRoadmap(model: any, mode: any): any {
    if (mode === 'EXECUTIVE') return model;

    // DELEGATE Projection: Remove internal-only items and redactions
    return {
        ...model,
        sections: model.sections.map((section: any) => ({
            ...section,
            items: section.items.filter((item: any) => !item.isInternalOnly)
        })).filter((section: any) => section.items.length > 0 || section.summary)
    };
}

/**
 * INTERNAL HELPERS
 */
function mapDiagnosticToHorizon(priority: any, type: any): number {
    const p = String(priority).toUpperCase();
    if (p === 'HIGH' || p === 'CRITICAL' || p === 'IMMEDIATE') return 30;
    if (p === 'MEDIUM' || type === 'INFRASTRUCTURE') return 90;
    return 180;
}
