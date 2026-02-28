/**
 * PROJECTION AUTHORITY LOCK
 * 
 * This service is the CANONICAL AUTHORITY for:
 * - Tenant Lifecycle State (Intake Window, Phases)
 * - Governance State (Executive Brief Approval/Delivery)
 * - Workflow Completeness (Intake, Diagnostic, Roadmap)
 * - Readiness Interpretation (Can run Discovery, Can Moderate, etc)
 * 
 * NO interpretation logic for these domains may exist outside this file.
 * All other services must consume getTenantLifecycleView().
 */

import { db } from '../db/index';
import {
    tenants,
    executiveBriefs,
    auditEvents,
    intakes,
    tenantDocuments,
    discoveryCallNotes,
    diagnostics,
    roadmaps,
    intakeVectors,
    sopTickets,
    intakeClarifications
} from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { AUDIT_EVENT_TYPES } from '../constants/auditEventTypes';

export const PROJECTION_VERSION = "1.0.0";
/**
 * PROJECTION CONTRACT v1.0.0
 * Breaking changes require version bump.
 */

export interface TenantLifecycleView {
    identity: {
        tenantId: string
        tenantName: string
        ownerUserId?: string | null
        status: string
    }

    lifecycle: {
        intakeWindowState: "OPEN" | "CLOSED"
        intakeVersion: number
        currentPhase: string
    }

    governance: {
        executiveBriefStatus: "NONE" | "DRAFT" | "APPROVED" | "DELIVERED"
        governanceLocked: boolean
        approvedAt?: string
        approvedBy?: string
        deliveredAt?: string
        deliveredTo?: string
    }

    workflow: {
        intakesComplete: boolean
        rolesCompleted: string[]
        completedIntakeCount: number
        hasOwnerIntake: boolean
        vectorCount: number
        sop01Complete: boolean
        discoveryComplete: boolean
        findingsComplete: boolean
        roadmapComplete: boolean
        hasOutstandingClarifications: boolean
        hasPendingCoachingFeedback: boolean
        discoveryIngested: boolean
    }

    tickets: {
        total: number
        pending: number
        approved: number
        rejected: number
    }

    artifacts: {
        hasExecutiveBrief: boolean
        diagnostic: {
            exists: boolean
            status?: 'generated' | 'locked' | 'published'
        }
        hasRoadmap: boolean
        hasCanonicalFindings: boolean
    }

    operator: {
        confirmedSufficiency: boolean
        confirmedSufficiencyAt?: string | null
    }

    derived: {
        canLockIntake: boolean
        canGenerateDiagnostic: boolean
        canLockDiagnostic: boolean
        canPublishDiagnostic: boolean
        canIngestDiscoveryNotes: boolean
        canGenerateTickets: boolean
        canAssembleRoadmap: boolean
        canReopenIntake: boolean
        synthesis: {
            ready: boolean
        }
        blockingReasons: string[]
    }

    capabilities: {
        lockIntake: { allowed: boolean; reasons: string[] }
        generateDiagnostic: { allowed: boolean; reasons: string[] }
        generateSynthesis: { allowed: boolean; reasons: string[] }
        lockDiagnostic: { allowed: boolean; reasons: string[] }
        publishDiagnostic: { allowed: boolean; reasons: string[] }
        ingestDiscoveryNotes: { allowed: boolean; reasons: string[] }
        generateTickets: { allowed: boolean; reasons: string[] }
        assembleRoadmap: { allowed: boolean; reasons: string[] }
        declareCanonicalFindings: { allowed: boolean; reasons: string[] }
    }

    meta: {
        projectionVersion: string
        computedAt: string
    }
}

/**
 * Internal extended flags used for computation but hidden from public surface
 */
interface InternalDerivedFlags {
    canLockIntake: boolean
    canGenerateDiagnostic: boolean
    canLockDiagnostic: boolean
    canPublishDiagnostic: boolean
    canIngestDiscoveryNotes: boolean
    canGenerateTickets: boolean
    canAssembleRoadmap: boolean
    canReopenIntake: boolean
    lifecycleValid: boolean
    synthesis: {
        ready: boolean
    }
    blockingReasons: string[]
}

/**
 * Authoritative entry point for tenant state projection.
 */
export async function getTenantLifecycleView(
    tenantId: string,
    trx?: any
): Promise<TenantLifecycleView> {
    // 1. Fetch Core Identity
    const [tenant] = await (trx || db)
        .select({
            id: tenants.id,
            name: tenants.name,
            ownerUserId: tenants.ownerUserId,
            status: tenants.status
        })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
    }

    // INTERNAL RESOLVER STUBS (FAIL-CLOSED)
    const lifecycle = await resolveLifecycle(tenantId, trx);
    const governance = await resolveGovernance(tenantId, trx);
    const workflow = await resolveWorkflow(tenantId, trx);
    const artifacts = await resolveArtifacts(tenantId, trx);
    const tickets = await resolveTickets(tenantId, trx);
    const operator = await resolveOperator(tenantId, trx);

    // 6. Derived Flags
    const derived = computeDerivedFlags(lifecycle, governance, workflow, artifacts, tickets, operator);

    // Day-4: Omit lifecycleValid from public surface (Clean Separation)
    const { lifecycleValid, ...publicDerived } = derived;

    return {
        identity: {
            tenantId: tenant.id,
            tenantName: tenant.name,
            ownerUserId: tenant.ownerUserId,
            status: tenant.status
        },
        lifecycle,
        governance,
        workflow,
        artifacts,
        tickets,
        operator,
        derived: publicDerived,
        capabilities: buildCapabilityMatrix({ derived, artifacts }),
        meta: {
            projectionVersion: PROJECTION_VERSION,
            computedAt: new Date().toISOString()
        }
    };
}

async function resolveOperator(tenantId: string, trx?: any): Promise<TenantLifecycleView['operator']> {
    const [confirmation] = await (trx || db)
        .select({ createdAt: auditEvents.createdAt })
        .from(auditEvents)
        .where(and(
            eq(auditEvents.tenantId, tenantId),
            eq(auditEvents.eventType, 'OPERATOR_CONFIRMED_DIAGNOSTIC_SUFFICIENCY')
        ))
        .orderBy(desc(auditEvents.createdAt))
        .limit(1);

    return {
        confirmedSufficiency: !!confirmation,
        confirmedSufficiencyAt: confirmation?.createdAt ? (confirmation.createdAt as unknown as Date).toISOString() : null
    };
}

// ============================================================================
// INTERNAL RESOLVERS
// ============================================================================

async function resolveLifecycle(tenantId: string, trx?: any): Promise<TenantLifecycleView['lifecycle']> {
    const [tenant] = await (trx || db)
        .select({
            intakeWindowState: tenants.intakeWindowState
        })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    return {
        intakeWindowState: tenant?.intakeWindowState ?? "CLOSED",
        intakeVersion: 0,
        currentPhase: "UNKNOWN"
    };
}

async function resolveGovernance(tenantId: string, trx?: any): Promise<TenantLifecycleView['governance']> {
    // 1. Fetch latest Executive Brief
    const [brief] = await (trx || db)
        .select({
            id: executiveBriefs.id,
            status: executiveBriefs.status,
            approvedAt: executiveBriefs.approvedAt,
            approvedBy: executiveBriefs.approvedBy
        })
        .from(executiveBriefs)
        .where(eq(executiveBriefs.tenantId, tenantId))
        .orderBy(desc(executiveBriefs.createdAt))
        .limit(1);

    let status: "NONE" | "DRAFT" | "APPROVED" | "DELIVERED" = "NONE";
    if (brief) {
        status = "DRAFT";
    }

    // 2. Check for Approval Event (Canonical Authority)
    const [lastApprovalEvent] = await (trx || db)
        .select({ createdAt: auditEvents.createdAt })
        .from(auditEvents)
        .where(and(
            eq(auditEvents.tenantId, tenantId),
            eq(auditEvents.eventType, AUDIT_EVENT_TYPES.EXECUTIVE_BRIEF_APPROVED)
        ))
        .orderBy(desc(auditEvents.createdAt))
        .limit(1);

    // 3. Resolve Status: If delivered audit exists, it's DELIVERED. 
    // Otherwise if approved event or legacy field exists, it's APPROVED.
    const [lastDeliveryEvent] = await (trx || db)
        .select()
        .from(auditEvents)
        .where(and(
            eq(auditEvents.tenantId, tenantId),
            eq(auditEvents.eventType, AUDIT_EVENT_TYPES.EXECUTIVE_BRIEF_DELIVERED)
        ))
        .orderBy(desc(auditEvents.createdAt))
        .limit(1);

    if (lastDeliveryEvent) {
        status = 'DELIVERED';
    } else if (lastApprovalEvent || brief?.status === 'APPROVED' || brief?.approvedAt) {
        status = 'APPROVED';
    }

    // 4. Governance Lock Rule: DELIVERED state locks governance
    const governanceLocked = status === 'DELIVERED';

    return {
        executiveBriefStatus: status,
        governanceLocked,
        approvedAt: lastApprovalEvent?.createdAt ? (lastApprovalEvent.createdAt as unknown as Date).toISOString() : (brief?.approvedAt ? (brief.approvedAt as unknown as Date).toISOString() : undefined),
        approvedBy: (lastApprovalEvent as any)?.actorUserId || brief?.approvedBy || undefined,
        deliveredAt: lastDeliveryEvent?.createdAt ? (lastDeliveryEvent.createdAt as unknown as Date).toISOString() : undefined,
        deliveredTo: lastDeliveryEvent?.metadata ? (lastDeliveryEvent.metadata as any).deliveredTo : undefined
    };
}

async function resolveWorkflow(tenantId: string, trx?: any): Promise<TenantLifecycleView['workflow']> {
    // Fetch tenant again for discoveryComplete flag
    const [tenant] = await (trx || db)
        .select({ discoveryComplete: tenants.discoveryComplete })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    // 1. Intakes
    const allIntakes = await (trx || db)
        .select()
        .from(intakes)
        .where(eq(intakes.tenantId, tenantId));

    const rolesCompleted: string[] = Array.from(new Set(
        allIntakes.filter(i => i.completedAt).map(i => i.role as string)
    ));
    const completedIntakeCount = allIntakes.filter(i => i.status === 'completed').length;
    const hasOwnerIntake = rolesCompleted.includes('owner');

    const requiredRoles = ['owner', 'ops', 'sales', 'delivery'];
    const intakesComplete = requiredRoles.every(role => rolesCompleted.includes(role));

    // 2. SOP-01
    const sop01Docs = await (trx || db)
        .select()
        .from(tenantDocuments)
        .where(and(
            eq(tenantDocuments.tenantId, tenantId),
            eq(tenantDocuments.sopNumber, 'SOP-01')
        ));

    const requiredOutputs = ['Output-1', 'Output-2', 'Output-3', 'Output-4'];
    const sop01Complete = requiredOutputs.every(out =>
        sop01Docs.some(d => d.outputNumber === out)
    );

    // 3. Discovery
    const [discoveryNote] = await (trx || db)
        .select({ id: discoveryCallNotes.id })
        .from(discoveryCallNotes)
        .where(eq(discoveryCallNotes.tenantId, tenantId))
        .orderBy(desc(discoveryCallNotes.createdAt))
        .limit(1);

    const discoveryComplete = !!discoveryNote && !!tenant?.discoveryComplete;

    // 4. Roadmap
    const roadmapDocs = await (trx || db)
        .select()
        .from(tenantDocuments)
        .where(and(
            eq(tenantDocuments.tenantId, tenantId),
            eq(tenantDocuments.category, 'roadmap')
        ));

    const requiredSections = [
        'summary',
        '01-executive-summary',
        '02-diagnostic-analysis',
        '03-system-architecture',
        '04-high-leverage-systems',
        '05-implementation-plan',
        '06-sop-pack',
        '07-metrics-dashboard',
        '08-appendix',
    ];
    const roadmapComplete = requiredSections.every(section =>
        roadmapDocs.some(d => d.section === section)
    );

    const [vectorCountRes] = await (trx || db)
        .select({ count: sql<number>`count(*)` })
        .from(intakeVectors)
        .where(eq(intakeVectors.tenantId, tenantId));
    const vectorCount = Number(vectorCountRes?.count || 0);

    // 5. Outstanding blocking clarifications
    //    Fail closed on query failure (blocking signal).
    let hasOutstandingClarifications = true;
    try {
        const [blocking] = await (trx || db)
            .select({ id: intakeClarifications.id })
            .from(intakeClarifications)
            .where(and(
                eq(intakeClarifications.tenantId, tenantId),
                eq(intakeClarifications.status, 'requested'),
                eq(intakeClarifications.blocking, true)
            ))
            .limit(1);
        hasOutstandingClarifications = !!blocking;
    } catch {
        // Fail closed — assume blocking
    }

    // 6. Pending coaching feedback
    //    Reuses allIntakes already fetched above. No extra DB query.
    //    Fail closed on any processing error (blocking signal).
    let hasPendingCoachingFeedback = true;
    try {
        hasPendingCoachingFeedback = allIntakes.some(intake => {
            const fb = (intake.coachingFeedback as any) || {};
            return Object.values(fb).some((item: any) =>
                item?.isFlagged === true ||
                (Array.isArray(item?.requests) && item.requests.some((r: any) => r?.status === 'PENDING'))
            );
        });
    } catch {
        // Fail closed — assume pending
    }

    // 7. Discovery ingested
    //    Fail open on query failure (non-blocking signal).
    let discoveryIngested = false;
    try {
        const [ingestedNote] = await (trx || db)
            .select({ id: discoveryCallNotes.id })
            .from(discoveryCallNotes)
            .where(and(
                eq(discoveryCallNotes.tenantId, tenantId),
                eq(discoveryCallNotes.status, 'ingested')
            ))
            .limit(1);
        discoveryIngested = !!ingestedNote;
    } catch {
        // Fail open — non-blocking signal
        discoveryIngested = false;
    }

    return {
        intakesComplete,
        rolesCompleted,
        completedIntakeCount,
        hasOwnerIntake,
        vectorCount,
        sop01Complete,
        discoveryComplete,
        findingsComplete: roadmapDocs.length > 0,
        roadmapComplete,
        hasOutstandingClarifications,
        hasPendingCoachingFeedback,
        discoveryIngested
    };
}

async function resolveArtifacts(tenantId: string, trx?: any): Promise<TenantLifecycleView['artifacts']> {
    // 1. Executive Brief
    const [brief] = await (trx || db)
        .select({ id: executiveBriefs.id })
        .from(executiveBriefs)
        .where(eq(executiveBriefs.tenantId, tenantId))
        .orderBy(desc(executiveBriefs.createdAt))
        .limit(1);

    // 2. Diagnostic — resolved via pointer (O(1)) for deterministic status.
    //    Fail closed: if pointer exists but record is missing, treat as no diagnostic.
    const [tenantPointer] = await (trx || db)
        .select({ lastDiagnosticId: tenants.lastDiagnosticId })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    let diagnosticResult: TenantLifecycleView['artifacts']['diagnostic'] = { exists: false };

    if (tenantPointer?.lastDiagnosticId) {
        const [currentDiag] = await (trx || db)
            .select({ id: diagnostics.id, status: diagnostics.status })
            .from(diagnostics)
            .where(eq(diagnostics.id, tenantPointer.lastDiagnosticId))
            .limit(1);

        if (currentDiag) {
            diagnosticResult = {
                exists: true,
                status: currentDiag.status as 'generated' | 'locked' | 'published'
            };
        }
        // Pointer inconsistency: record missing — fail closed (exists: false)
    }

    // 3. Roadmap
    const [roadmap] = await (trx || db)
        .select({ id: roadmaps.id })
        .from(roadmaps)
        .where(eq(roadmaps.tenantId, tenantId))
        .orderBy(desc(roadmaps.createdAt))
        .limit(1);

    const [findings] = await (trx || db)
        .select({ id: tenantDocuments.id })
        .from(tenantDocuments)
        .where(and(
            eq(tenantDocuments.tenantId, tenantId),
            eq(tenantDocuments.category, 'findings_canonical')
        ))
        .orderBy(desc(tenantDocuments.createdAt))
        .limit(1);

    return {
        hasExecutiveBrief: !!brief,
        diagnostic: diagnosticResult,
        hasRoadmap: !!roadmap,
        hasCanonicalFindings: !!findings
    };
}

async function resolveTickets(tenantId: string, trx?: any): Promise<TenantLifecycleView['tickets']> {
    const stats = await (trx || db)
        .select({
            total: sql<number>`count(*)`.mapWith(Number),
            pending: sql<number>`count(*) filter (where ${sopTickets.status} = 'pending')`.mapWith(Number),
            approved: sql<number>`count(*) filter (where ${sopTickets.status} = 'approved')`.mapWith(Number),
            rejected: sql<number>`count(*) filter (where ${sopTickets.status} = 'rejected')`.mapWith(Number)
        })
        .from(sopTickets)
        .where(eq(sopTickets.tenantId, tenantId));

    const row = stats[0];
    return {
        total: row?.total || 0,
        pending: row?.pending || 0,
        approved: row?.approved || 0,
        rejected: row?.rejected || 0
    };
}

/**
 * ================================================================
 * DAY-1 INVARIANT FREEZE (DO NOT MODIFY WITHOUT META OVERRIDE)
 * ================================================================
 *
 * Signal Domain:
 * minimumIntakeSatisfied = workflow.intakesComplete (Implicitly required for both)
 * discoverySatisfied = workflow.discoveryComplete
 * briefReviewed = ['APPROVED', 'DELIVERED'].includes(governance.executiveBriefStatus)
 *
 * synthesisEligible =
 *   minimumIntakeSatisfied &&
 *   discoverySatisfied &&
 *   briefReviewed &&
 *   (artifacts.diagnostic.status === 'locked' || artifacts.diagnostic.status === 'published') &&
 *   !terminal.isHardLocked
 *
 * Governance Domain:
 * fullIntakeSatisfied = workflow.intakesComplete
 *
 * lifecycleValid =
 *   fullIntakeSatisfied &&
 *   briefReviewed &&
 *   operator.confirmedSufficiency &&
 *   artifacts.diagnostic.exists &&
 *   (valid diagnostic state) &&
 *   !workflow.hasOutstandingClarifications &&
 *   !workflow.hasPendingCoachingFeedback &&
 *   workflow.discoveryIngested &&
 *   (valid ticket state) &&
 *   !terminal.isHardLocked
 *
 * Terminal Domain:
 * isHardLocked = artifacts.hasCanonicalFindings
 *
 * NOTE:
 * These formulas are frozen for Day-1 sprint.
 * No semantic change permitted.
 */
function computeDerivedFlags(
    lifecycle: TenantLifecycleView['lifecycle'],
    governance: TenantLifecycleView['governance'],
    workflow: TenantLifecycleView['workflow'],
    artifacts: TenantLifecycleView['artifacts'],
    tickets: TenantLifecycleView['tickets'],
    operator: TenantLifecycleView['operator']
): InternalDerivedFlags {
    // 1. INPUT SATISFACTION (The "Substrate")
    const fullIntakeSatisfied = workflow.intakesComplete;
    const minimumIntakeSatisfied = workflow.completedIntakeCount >= 2;
    const discoverySatisfied = workflow.discoveryComplete;
    const briefReviewed = ['APPROVED', 'DELIVERED'].includes(governance.executiveBriefStatus);

    // 2. COMPOSITE ELIGIBILITY
    const synthesisInputsSatisfied = minimumIntakeSatisfied && discoverySatisfied && briefReviewed;

    const canLockIntake =
        lifecycle.intakeWindowState === "OPEN" &&
        fullIntakeSatisfied === true;

    const canReopenIntake =
        lifecycle.intakeWindowState === "CLOSED" &&
        governance.governanceLocked === false;

    // TCK-SSOT-004: Canonical derived readiness flags — pure function of projection state.
    // lockEligible determines if the diagnostic state is valid for progression.
    // It must persist even if status is already 'locked' (State Invariant).
    const lockEligible =
        fullIntakeSatisfied &&
        synthesisInputsSatisfied &&
        !artifacts.hasCanonicalFindings &&
        !workflow.hasOutstandingClarifications &&
        artifacts.diagnostic.exists;

    const canGenerateDiagnostic =
        lifecycle.intakeWindowState === "CLOSED" &&
        briefReviewed &&
        operator.confirmedSufficiency === true;

    const canLockDiagnostic =
        artifacts.diagnostic.exists &&
        (artifacts.diagnostic.status === 'generated' || artifacts.diagnostic.status === 'locked');

    const canPublishDiagnostic =
        artifacts.diagnostic.exists &&
        artifacts.diagnostic.status === 'locked';

    const canIngestDiscoveryNotes =
        artifacts.diagnostic.exists &&
        (artifacts.diagnostic.status === 'published' || artifacts.diagnostic.status === 'locked');

    const canGenerateTickets =
        workflow.discoveryIngested &&
        !workflow.hasOutstandingClarifications &&
        !workflow.hasPendingCoachingFeedback;

    const canAssembleRoadmap =
        artifacts.diagnostic.exists &&
        workflow.intakesComplete &&
        tickets.total > 0 &&
        tickets.pending === 0;

    const blockingReasons: string[] = [];
    if (!workflow.intakesComplete) blockingReasons.push('INTAKE_INCOMPLETE');
    if (!['APPROVED', 'DELIVERED'].includes(governance.executiveBriefStatus)) blockingReasons.push('NO_REVIEWED_BRIEF');
    if (!operator.confirmedSufficiency) blockingReasons.push('KNOWLEDGE_NOT_CONFIRMED');
    if (!artifacts.diagnostic.exists) blockingReasons.push('NO_DIAGNOSTIC');
    if (artifacts.diagnostic.exists && !canLockDiagnostic && !canPublishDiagnostic && !canIngestDiscoveryNotes) {
        blockingReasons.push('INVALID_DIAGNOSTIC_STATE');
    }
    if (workflow.hasOutstandingClarifications) blockingReasons.push('OUTSTANDING_CLARIFICATIONS');
    if (workflow.hasPendingCoachingFeedback) blockingReasons.push('PENDING_COACHING_FEEDBACK');
    if (!workflow.discoveryIngested) blockingReasons.push('DISCOVERY_NOT_INGESTED');
    if (tickets.pending > 0) blockingReasons.push('TICKETS_PENDING');
    if (artifacts.diagnostic.exists && workflow.intakesComplete && tickets.total === 0) blockingReasons.push('NO_TICKETS');

    // Phase 5 synthesis readiness: STRICT derivation
    const synthesisReady =
        lifecycle.intakeWindowState === "CLOSED" &&
        synthesisInputsSatisfied &&
        (artifacts.diagnostic.status === 'locked' || artifacts.diagnostic.status === 'published') &&
        !artifacts.hasCanonicalFindings;

    if (!synthesisReady && !blockingReasons.includes('SYNTHESIS_NOT_READY')) {
        blockingReasons.push('SYNTHESIS_NOT_READY');
    }

    if (artifacts.hasCanonicalFindings) {
        if (!blockingReasons.includes('TERMINAL_HARD_LOCK')) {
            blockingReasons.push('TERMINAL_HARD_LOCK');
        }
    }

    const lifecycleValid = blockingReasons.length === 0;

    return {
        canLockIntake,
        canGenerateDiagnostic,
        canLockDiagnostic,
        canPublishDiagnostic,
        canIngestDiscoveryNotes,
        canGenerateTickets,
        canAssembleRoadmap,
        canReopenIntake,
        lifecycleValid,
        synthesis: {
            ready: synthesisReady
        },
        blockingReasons
    };
}

// ============================================================================
// Internal Capability Adapter
// ============================================================================
function buildCapabilityMatrix(opts: { derived: InternalDerivedFlags, artifacts: TenantLifecycleView['artifacts'] }) {
    return {
        lockIntake: {
            allowed: opts.derived.canLockIntake,
            reasons: opts.derived.blockingReasons
        },
        generateDiagnostic: {
            allowed: opts.derived.canGenerateDiagnostic,
            reasons: opts.derived.blockingReasons
        },
        generateSynthesis: {
            allowed: opts.derived.synthesis.ready,
            reasons: opts.derived.blockingReasons
        },
        lockDiagnostic: {
            allowed: opts.derived.canLockDiagnostic && !opts.artifacts.hasCanonicalFindings && (opts.derived.blockingReasons.filter(r => r !== 'SYNTHESIS_NOT_READY').length === 0),
            reasons: opts.derived.blockingReasons
        },
        publishDiagnostic: {
            allowed: opts.derived.canPublishDiagnostic && opts.derived.lifecycleValid,
            reasons: opts.derived.blockingReasons
        },
        ingestDiscoveryNotes: {
            allowed: opts.derived.canIngestDiscoveryNotes && opts.derived.lifecycleValid,
            reasons: opts.derived.blockingReasons
        },
        generateTickets: {
            allowed: opts.derived.canGenerateTickets && opts.derived.lifecycleValid,
            reasons: opts.derived.blockingReasons
        },
        assembleRoadmap: {
            allowed: opts.derived.canAssembleRoadmap && opts.derived.lifecycleValid,
            reasons: opts.derived.blockingReasons
        },
        declareCanonicalFindings: {
            allowed: opts.derived.synthesis.ready && opts.derived.lifecycleValid,
            reasons: opts.derived.blockingReasons
        }
    };
}
