// frontend/src/superadmin/hooks/useCanonicalStageState.ts
// EXEC-19: Canonical State Adapter
//
// Derives explicit stage booleans from canonical DB-backed fields only.
// Does NOT use: stages[], color state, hasNotes, or derived ladder booleans.
//
// FIELD MAPPING (verified against SuperAdminControlPlaneFirmDetailPage.tsx):
//   discovery.exists      ← tenant.discoveryComplete (boolean, L46 of ControlPlane)
//   intake.complete       ← tenant.intakeWindowState === 'CLOSED'
//   executiveBrief.status ← tenant.executiveBriefStatus ('DRAFT'|'APPROVED'|'ACKNOWLEDGED'|'WAIVED'|null)
//   diagnostic.exists     ← !!latestDiagnostic
//   diagnostic.complete   ← latestDiagnostic?.status === 'locked' || 'published' (not just 'generated')
//   diagnostic.published  ← latestDiagnostic?.status === 'published'
//   synthesis.ready       ← discovery.exists && diagnostic.complete && intake.complete

export interface CanonicalStageState {
    discovery: {
        /** True when discovery notes have been ingested (tenant.discoveryComplete) */
        exists: boolean;
        /** True when append mode applies (same as exists — system routes automatically) */
        appendMode: boolean;
        /** True when moderation is NOT active (editable window) */
        editable: boolean;
    };
    intake: {
        /** True when intake window is CLOSED */
        complete: boolean;
        /** True when intake window is OPEN */
        editable: boolean;
    };
    executiveBrief: {
        /** Raw status string from DB, null if not generated */
        status: string | null;
        /** True if brief is in an approved/delivered state */
        reviewable: boolean;
    };
    diagnostic: {
        /** True when a diagnostic record exists */
        exists: boolean;
        /** True when diagnostic is locked or published (no longer just generated) */
        complete: boolean;
        /** True when diagnostic is published */
        published: boolean;
    };
    synthesis: {
        /** True when all prerequisite stages are satisfied */
        ready: boolean;
    };
}

interface TenantShape {
    discoveryComplete?: boolean;
    intakeWindowState?: 'OPEN' | 'CLOSED';
    executiveBriefStatus?: string | null;
}

interface DiagnosticShape {
    id: string;
    status: 'generated' | 'locked' | 'published' | 'archived';
}

interface WorkflowShape {
    moderationActive?: boolean;
    discovery?: {
        hasNotes?: boolean;
        complete?: boolean;
    };
}

export function useCanonicalStageState(
    tenant: TenantShape | null | undefined,
    latestDiagnostic: DiagnosticShape | null | undefined,
    workflowStatus?: WorkflowShape | null
): CanonicalStageState {
    // --- DISCOVERY ---
    // Canonical source: tenant.discoveryComplete (boolean field on tenants table)
    const discoveryExists = !!(tenant?.discoveryComplete);
    const moderationActive = !!(workflowStatus?.moderationActive);

    const discovery = {
        exists: discoveryExists,
        appendMode: discoveryExists,          // system auto-routes; same signal
        editable: !moderationActive,
    };

    // --- INTAKE ---
    // Canonical source: tenant.intakeWindowState
    const intakeWindowState = tenant?.intakeWindowState ?? 'OPEN';
    const intake = {
        complete: intakeWindowState === 'CLOSED',
        editable: intakeWindowState === 'OPEN',
    };

    // --- EXECUTIVE BRIEF ---
    // Canonical source: tenant.executiveBriefStatus
    const briefStatus = tenant?.executiveBriefStatus ?? null;
    const BRIEF_APPROVED_STATES = ['APPROVED', 'DELIVERED', 'REVIEWED', 'ACKNOWLEDGED', 'WAIVED'];
    const executiveBrief = {
        status: briefStatus,
        reviewable: briefStatus !== null && BRIEF_APPROVED_STATES.includes(briefStatus),
    };

    // --- DIAGNOSTIC ---
    // Canonical source: latestDiagnostic (fed from data.latestDiagnostic)
    // 'generated' = draft, 'locked' = ready for publish, 'published' = authoritative
    const diagnosticExists = !!latestDiagnostic;
    const diagnosticStatus = latestDiagnostic?.status ?? null;
    const diagnostic = {
        exists: diagnosticExists,
        complete: diagnosticStatus === 'locked' || diagnosticStatus === 'published',
        published: diagnosticStatus === 'published',
    };

    // --- SYNTHESIS ---
    // Ready only when all upstream stages are satisfied
    const synthesis = {
        ready: discovery.exists && diagnostic.complete && intake.complete,
    };

    return { discovery, intake, executiveBrief, diagnostic, synthesis };
}
