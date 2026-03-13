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
    users,
    intakeClarifications,
    tenantStage6Config,
    discoveryNotesLog,
    sasProposals,
    selectionEnvelopes,
    sasRuns
} from '../db/schema';
import { eq, ne, and, desc, asc, sql } from 'drizzle-orm';
import { AUDIT_EVENT_TYPES } from '../constants/auditEventTypes';
import { computeCanonicalFindingsHash } from './canonicalFindingsHash.util';
import { getProjection, setProjection } from './projectionCache.service';

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
        ticketCount: number
        sopPendingCount: number
        sopApprovedCount: number
        sopRejectedCount: number
        approvedProposalCount: number
        pendingProposalCount: number
        rejectedProposalCount: number
        moderationSessionActive: boolean
        selectionEnvelopeBinding: string | null
        stageState: {
            stage6ModerationReady: boolean
            stage7SynthesisReady: boolean
            stage7TicketsExist: boolean
        }
    }

    artifacts: {
        hasExecutiveBrief: boolean
        diagnostic: {
            exists: boolean
            status?: 'generated' | 'locked' | 'published'
        }
        hasRoadmap: boolean
        hasCanonicalFindings: boolean
        canonicalFindings?: {
            documentId: string
            ids: string[]      // sorted finding IDs extracted from content
            count: number
            hash: string       // SHA-256 of normalized sorted findings array
            declaredAt: string // tenantDocuments.createdAt ISO string
        }
    }

    operator: {
        confirmedSufficiency: boolean
        confirmedSufficiencyAt?: string | null
    }

    analytics: {
        frictionMap: {
            totalTickets: number;
            rejectedTickets: number;
            manualWorkflowsIdentified: number;
            strategicMisalignmentScore: number;
            highPriorityBottlenecks: number;
        };
        capacityROI: {
            projectedHoursSavedWeekly: number;
            speedToValue: 'LOW' | 'MEDIUM' | 'HIGH';
        };
    }

    stage6: {
        constraintConfigExists: boolean
        vertical: string | null
        allowedNamespaces: string[]
        allowedAdapters: string[]
        maxComplexityTier: 'low' | 'medium' | 'high' | null
        customDevAllowed: boolean | null
    }

    stageState: {
        stage6ModerationReady: boolean
        stage7SynthesisReady: boolean
        stage7TicketsExist: boolean
    }

    derived: {
        canLockIntake: boolean
        canGenerateDiagnostic: boolean
        canLockDiagnostic: boolean
        canPublishDiagnostic: boolean
        canIngestDiscoveryNotes: boolean
        canGenerateTickets: boolean
        canAssembleRoadmap: boolean
        canSynthesizeTickets: boolean
        canReopenIntake: boolean
        mutationLocked: boolean
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
    canSynthesizeTickets: boolean
    canReopenIntake: boolean
    mutationLocked: boolean
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
    const cacheKey = `tenant:lifecycle:${tenantId}`;

    // Skip cache if in transaction
    if (!trx) {
        const cached = getProjection(cacheKey);
        if (cached) {
            return cached;
        }
    }

    const lifecycle = await buildTenantLifecycleView(tenantId, trx);

    if (!trx) {
        setProjection(cacheKey, lifecycle);
    }

    return lifecycle;
}

/**
 * Internal logic for building the tenant state projection.
 */
async function buildTenantLifecycleView(
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

    // 5.b Analytics (pure resolver)
    const allTickets = await (trx || db)
        .select()
        .from(sopTickets)
        .where(eq(sopTickets.tenantId, tenantId));

    const analytics = resolveExecutiveAnalytics({
        tickets: allTickets,
        diagnostic: {
            status: artifacts.diagnostic.status || 'generated',
            exists: artifacts.diagnostic.exists
        }
    });

    // 6. Derived Flags
    const derived = computeDerivedFlags(lifecycle, governance, workflow, artifacts, tickets, operator);

    // Day-4: Omit lifecycleValid from public surface (Clean Separation)
    const { lifecycleValid, ...publicDerived } = derived;

    // 5.c Stage 6 Constraint Config (read-through — no derivation)
    const [stage6ConfigRow] = await (trx || db)
        .select()
        .from(tenantStage6Config)
        .where(eq(tenantStage6Config.tenantId, tenantId))
        .limit(1);

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
        analytics,
        stage6: {
            constraintConfigExists: !!stage6ConfigRow,
            vertical: stage6ConfigRow?.vertical ?? null,
            allowedNamespaces: stage6ConfigRow?.allowedNamespaces ?? [],
            allowedAdapters: stage6ConfigRow?.allowedAdapters ?? [],
            maxComplexityTier: (stage6ConfigRow?.maxComplexityTier as 'low' | 'medium' | 'high') ?? null,
            customDevAllowed: stage6ConfigRow?.customDevAllowed ?? null,
        },
        stageState: tickets.stageState,
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

    const functionalRoles = rolesCompleted.filter(r => r !== 'owner');
    const intakesComplete = hasOwnerIntake && functionalRoles.length >= 2;

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
        .select({
            id: tenantDocuments.id,
            content: tenantDocuments.content,
            createdAt: tenantDocuments.createdAt,
        })
        .from(tenantDocuments)
        .where(and(
            eq(tenantDocuments.tenantId, tenantId),
            eq(tenantDocuments.category, 'findings_canonical')
        ))
        .orderBy(desc(tenantDocuments.createdAt))
        .limit(1);

    let canonicalFindings: TenantLifecycleView['artifacts']['canonicalFindings'] = undefined;
    if (findings?.content) {
        try {
            const parsed = JSON.parse(findings.content);
            const rawItems: unknown[] = Array.isArray(parsed.findings) ? parsed.findings : [];
            // Fail closed: only include items with a valid string id
            const hashableItems = rawItems.filter(
                (f): f is { id: string;[key: string]: unknown } => typeof (f as any).id === 'string'
            );
            const ids = [...hashableItems.map(f => f.id)].sort();
            const hash = computeCanonicalFindingsHash(hashableItems);
            canonicalFindings = {
                documentId: findings.id,
                ids,
                count: ids.length,
                hash,
                declaredAt: (findings.createdAt as unknown as Date).toISOString(),
            };
        } catch {
            // Content corrupt — emit undefined; hasCanonicalFindings remains true (existence preserved)
        }
    }

    return {
        hasExecutiveBrief: !!brief,
        diagnostic: diagnosticResult,
        hasRoadmap: !!roadmap,
        hasCanonicalFindings: !!findings,
        canonicalFindings,
    };
}

export async function resolveLatestRunId(tenantId: string, trx?: any) {
    const [latestRun] = await (trx || db)
        .select({ id: sasRuns.id })
        .from(sasRuns)
        .where(eq(sasRuns.tenantId, tenantId))
        .orderBy(desc(sasRuns.createdAt))
        .limit(1);

    return latestRun?.id ?? null;
}

async function resolveTickets(tenantId: string, trx?: any): Promise<TenantLifecycleView['tickets']> {
    const runId = await resolveLatestRunId(tenantId, trx);

    const [sasStats] = runId 
        ? await (trx || db)
            .select({
                approved: sql<number>`count(*) filter (where ${sasProposals.moderationStatus} = 'APPROVED')`.mapWith(Number),
                pending: sql<number>`count(*) filter (where ${sasProposals.moderationStatus} = 'PENDING')`.mapWith(Number),
                rejected: sql<number>`count(*) filter (where ${sasProposals.moderationStatus} = 'REJECTED')`.mapWith(Number),
                total: sql<number>`count(*)`.mapWith(Number)
            })
            .from(sasProposals)
            .where(and(
                eq(sasProposals.tenantId, tenantId),
                eq(sasProposals.sasRunId, runId)
            ))
        : [{ approved: 0, pending: 0, rejected: 0, total: 0 }];

    const [sopStats] = runId
        ? await (trx || db)
            .select({
                total: sql<number>`count(*)`.mapWith(Number),
                pending: sql<number>`count(*) filter (where ${sopTickets.status} = 'pending')`.mapWith(Number),
                approved: sql<number>`count(*) filter (where ${sopTickets.status} = 'approved')`.mapWith(Number),
                rejected: sql<number>`count(*) filter (where ${sopTickets.status} = 'rejected')`.mapWith(Number)
            })
            .from(sopTickets)
            .innerJoin(selectionEnvelopes, eq(sopTickets.selectionEnvelopeId, selectionEnvelopes.id))
            .where(and(
                eq(selectionEnvelopes.tenantId, tenantId),
                eq(selectionEnvelopes.sasRunId, runId)
            ))
        : [{ total: 0, pending: 0, approved: 0, rejected: 0 }];

    const [latestEnvelope] = await (trx || db)
        .select({
            id: selectionEnvelopes.id,
            selectionHash: selectionEnvelopes.selectionHash
        })
        .from(selectionEnvelopes)
        .where(eq(selectionEnvelopes.tenantId, tenantId))
        .orderBy(desc(selectionEnvelopes.createdAt))
        .limit(1);

    const proposalCount = sasStats?.total || 0;
    const approvedProposalCount = sasStats?.approved || 0;
    const ticketCount = sopStats?.total || 0;

    return {
        ticketCount,
        sopPendingCount: sopStats?.pending || 0,
        sopApprovedCount: sopStats?.approved || 0,
        sopRejectedCount: sopStats?.rejected || 0,
        approvedProposalCount,
        pendingProposalCount: sasStats?.pending || 0,
        rejectedProposalCount: sasStats?.rejected || 0,
        moderationSessionActive: proposalCount > 0,
        selectionEnvelopeBinding: latestEnvelope?.selectionHash || latestEnvelope?.id || null,
        stageState: {
            stage6ModerationReady: proposalCount > 0,
            stage7SynthesisReady: approvedProposalCount > 0,
            stage7TicketsExist: ticketCount > 0
        }
    };
}

/**
 * ================================================================
 * DAY-1 INVARIANT FREEZE (DO NOT MODIFY WITHOUT META OVERRIDE)
 * ================================================================
 *
 * Signal Domain:
 * minimumIntakeSatisfied = workflow.hasOwnerIntake
 * discoverySatisfied = workflow.discoveryComplete
 * briefReviewed = ['APPROVED', 'DELIVERED'].includes(governance.executiveBriefStatus)
 *
 * synthesisEligible =
 *   minimumIntakeSatisfied &&
 *   discoverySatisfied &&
 *   briefReviewed &&
 *   (artifacts.diagnostic.status === 'locked' || artifacts.diagnostic.status === 'published')
 *
 * Governance Domain:
 * fullIntakeSatisfied = workflow.hasOwnerIntake
 *
 * lifecycleValid =
 *   fullIntakeSatisfied &&
 *   briefReviewed &&
 *   operator.confirmedSufficiency &&
 *   artifacts.diagnostic.exists &&
 *   workflow.discoveryIngested &&
 *   !workflow.hasOutstandingClarifications &&
 *   !workflow.hasPendingCoachingFeedback
 *
 * Terminal Domain:
 * isHardLocked = false
 // Iterative SaaS doctrine.
 // No artifact implies terminal.
 // Hard lock reserved for explicit archive state (future).
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
    const fullIntakeSatisfied = workflow.hasOwnerIntake;
    const minimumIntakeSatisfied = workflow.hasOwnerIntake;
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
        tickets.ticketCount > 0;

    const canSynthesizeTickets = tickets.approvedProposalCount > 0;

    const blockingReasons: string[] = [];
    if (!workflow.hasOwnerIntake) blockingReasons.push('INTAKE_INCOMPLETE');
    if (!['APPROVED', 'DELIVERED'].includes(governance.executiveBriefStatus)) blockingReasons.push('NO_REVIEWED_BRIEF');
    if (!operator.confirmedSufficiency) blockingReasons.push('KNOWLEDGE_NOT_CONFIRMED');
    if (!artifacts.diagnostic.exists) blockingReasons.push('NO_DIAGNOSTIC');
    if (artifacts.diagnostic.exists && !canLockDiagnostic && !canPublishDiagnostic && !canIngestDiscoveryNotes) {
        blockingReasons.push('INVALID_DIAGNOSTIC_STATE');
    }
    if (workflow.hasOutstandingClarifications) blockingReasons.push('OUTSTANDING_CLARIFICATIONS');
    if (workflow.hasPendingCoachingFeedback) blockingReasons.push('PENDING_COACHING_FEEDBACK');
    if (!workflow.discoveryIngested) blockingReasons.push('DISCOVERY_NOT_INGESTED');
    // Ticket generation is enabled even if 0 tickets exist (Phase 6 entry)

    // Phase 5 synthesis readiness: ITERATIVE doctrine (decoupled from proposal state)
    const synthesisReady =
        lifecycle.intakeWindowState === "CLOSED" &&
        artifacts.diagnostic.exists &&
        workflow.discoveryComplete;

    if (!synthesisReady && !blockingReasons.includes('SYNTHESIS_NOT_READY')) {
        blockingReasons.push('SYNTHESIS_NOT_READY');
    }

    const isHardLocked = false;
    if (isHardLocked) {
        if (!blockingReasons.includes('TERMINAL_HARD_LOCK')) {
            blockingReasons.push('TERMINAL_HARD_LOCK');
        }
    }

    const lifecycleValid =
        fullIntakeSatisfied &&
        briefReviewed &&
        operator.confirmedSufficiency &&
        artifacts.diagnostic.exists &&
        workflow.discoveryIngested &&
        !workflow.hasOutstandingClarifications &&
        !workflow.hasPendingCoachingFeedback;

    return {
        canLockIntake,
        canGenerateDiagnostic,
        canLockDiagnostic,
        canPublishDiagnostic,
        canIngestDiscoveryNotes,
        canGenerateTickets,
        canAssembleRoadmap,
        canSynthesizeTickets,
        canReopenIntake,
        mutationLocked: governance.governanceLocked || isHardLocked,
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
            allowed: opts.derived.canLockDiagnostic && (opts.artifacts.diagnostic.status !== 'locked' && opts.artifacts.diagnostic.status !== 'published'),
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
            allowed: opts.derived.synthesis.ready && opts.derived.lifecycleValid && !opts.artifacts.hasCanonicalFindings,
            reasons: opts.derived.blockingReasons
        }
    };
}

// ============================================================================
// Executive Analytics Pure Resolver
// ============================================================================
function resolveExecutiveAnalytics(input: {
    tickets: any[];
    diagnostic: { status: string; exists: boolean };
}) {
    const totalTickets = input.tickets.length;
    const approvedTickets = input.tickets.filter(t => t.status === 'approved');
    const rejectedTickets = input.tickets.filter(t => t.status === 'rejected').length;

    const manualKeywords = /manual|spreadsheet|hand|copy|paste|email|paper/i;
    const manualWorkflowsIdentified = input.tickets.filter(t =>
        manualKeywords.test(t.title || '') || manualKeywords.test(t.description || '')
    ).length;

    const highPriorityBottlenecks = input.tickets.filter(t => t.priority === 'high').length;

    const strategicMisalignmentScore = totalTickets > 0
        ? Math.round((rejectedTickets / totalTickets) * 100)
        : 0;

    const projectedHoursSavedWeekly = approvedTickets.reduce((sum, t) => sum + (t.timeEstimateHours || 0), 0);

    let speedToValue: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (approvedTickets.length > 5) {
        speedToValue = 'HIGH';
    } else if (approvedTickets.length > 0) {
        speedToValue = 'MEDIUM';
    }

    return {
        frictionMap: {
            totalTickets,
            rejectedTickets,
            manualWorkflowsIdentified,
            strategicMisalignmentScore,
            highPriorityBottlenecks
        },
        capacityROI: {
            projectedHoursSavedWeekly,
            speedToValue
        }
    };
}

/**
 * Normalizes artifact content to ensure it follows the canonical Stage-5 shape.
 * [SNAPSHOT_ARTIFACT_BACKFILL]
 */
export function normalizeArtifact(artifact: any) {
    if (!artifact) return null;

    // Helper to parse content if it is stringified JSON
    const parseIfJSON = (val: any) => {
        if (typeof val !== 'string') return val;
        try {
            const parsed = JSON.parse(val);
            if (typeof parsed === 'string') return JSON.parse(parsed);
            return parsed;
        } catch {
            return val;
        }
    };

    let rawOutputs =
        artifact.outputs ??
        artifact.content ??
        artifact.notes ??
        artifact.markdown ??
        artifact.delta ??
        artifact.synthesis ??
        artifact.payload ??
        artifact.overview;

    let outputs = parseIfJSON(rawOutputs);

    return {
        id: artifact.id ?? null,
        type: artifact.type ?? artifact.category ?? null,
        createdAt: artifact.createdAt ?? artifact.created_at ?? null,
        outputs: outputs,
        raw: artifact
    };
}

export async function getStage5Artifacts(tenantId: string) {
    console.log(`[SAS] getStage5Artifacts for tenant: ${tenantId}`);

    // 1. Notes (Discovery Notes Log)
    // Returns all entries for the history panel, normalized.
    const rawNotes = await db
        .select({
            id: discoveryNotesLog.id,
            source: discoveryNotesLog.source,
            delta: discoveryNotesLog.delta,
            createdAt: discoveryNotesLog.createdAt,
            createdByUserId: discoveryNotesLog.createdByUserId,
        })
        .from(discoveryNotesLog)
        .where(eq(discoveryNotesLog.tenantId, tenantId))
        .orderBy(discoveryNotesLog.createdAt); // Order by createdAt ASC for chronological history

    const notes = rawNotes.map(n => normalizeArtifact(n));

    // 2. Diagnostic
    const [diagRecord] = await db
        .select()
        .from(diagnostics)
        .where(and(
            eq(diagnostics.tenantId, tenantId),
            ne(diagnostics.status, 'not_generated')
        ))
        .orderBy(desc(diagnostics.updatedAt))
        .limit(1);

    const diagnostic = diagRecord ? normalizeArtifact(diagRecord) : null;

    // 3. Exec Brief
    const [briefRecord] = await db
        .select()
        .from(executiveBriefs)
        .where(eq(executiveBriefs.tenantId, tenantId))
        .orderBy(desc(executiveBriefs.createdAt))
        .limit(1);

    const execBrief = briefRecord ? normalizeArtifact(briefRecord) : null;

    // 4. Q&A (Legacy fallback or future qna_canonical)
    const [qnaRecord] = await db
        .select()
        .from(tenantDocuments)
        .where(and(
            eq(tenantDocuments.tenantId, tenantId),
            eq(tenantDocuments.category, 'qna_canonical')
        ))
        .orderBy(desc(tenantDocuments.createdAt))
        .limit(1);

    const qa = qnaRecord ? normalizeArtifact(qnaRecord) : null;

    return {
        notes,
        diagnostic,
        execBrief,
        qa
    };
}

/**
 * TENANT LIFECYCLE SNAPSHOT (SSOT)
 * 
 * Centralized interface for the complete tenant state.
 * Prevents structural drift between backend and frontend.
 */
export interface TenantLifecycleSnapshot {
    tenantId: string;
    projection: any;
    tenant: any | null;
    owner: any | null;
    teamMembers: any[];
    intakes: any[];
    intakeRoles: any[];
    artifacts: {
        notes: any[];
        diagnostic: any | null;
        executiveBrief: any | null;
        discoveryNotes: any | null;
        qa: any | null;
    };
    roadmap: {
        latest: any | null;
        all: any[];
    };
    tickets: any[];
    recentActivity: any[];
}

/**
 * Service helper to fetch the latest roadmap.
 */
async function getLatestRoadmap(tenantId: string) {
    const rows = await db
        .select()
        .from(roadmaps)
        .where(eq(roadmaps.tenantId, tenantId))
        .orderBy(desc(roadmaps.createdAt))
        .limit(1);

    return rows?.[0] ?? null;
}

/**
 * Normalizes artifacts for the snapshot payload.
 * Ensures UI always receives a stable { outputs } contract.
 */
function normalizeArtifacts({
    executiveBrief,
    diagnostic,
    discoveryNotes
}: {
    executiveBrief: any;
    diagnostic: any;
    discoveryNotes: any;
}) {
    return {
        executiveBrief: normalizeArtifact(executiveBrief),
        diagnostic: normalizeArtifact(diagnostic),
        discoveryNotes: normalizeArtifact(discoveryNotes)
    };
}

/**
 * Resolves the complete tenant lifecycle snapshot.
 * Acts as the SSOT for the /snapshot endpoint.
 */
export async function resolveTenantLifecycleSnapshot(
    tenantId: string
): Promise<TenantLifecycleSnapshot> {
    // === CANONICAL PROJECTION SPINE ===
    const projection = await getTenantLifecycleView(tenantId);

    // === DATA ORCHESTRATION ===
    const [
        tenantDetails,
        ownerDetails,
        members,
        intakeList,
        vectorList,
        roadmapList,
        activityList,
        ticketList,
        artifactsFromService
    ] = await Promise.all([
        db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1),

        projection.identity.ownerUserId
            ? db
                .select()
                .from(users)
                .where(eq(users.id, projection.identity.ownerUserId))
                .limit(1)
            : Promise.resolve([]),

        db.select().from(users).where(eq(users.tenantId, tenantId)).limit(50),

        db.select().from(intakes).where(eq(intakes.tenantId, tenantId)),

        db.select().from(intakeVectors).where(eq(intakeVectors.tenantId, tenantId)),

        db
            .select()
            .from(roadmaps)
            .where(eq(roadmaps.tenantId, tenantId))
            .orderBy(desc(roadmaps.createdAt)),

        db
            .select()
            .from(auditEvents)
            .where(eq(auditEvents.tenantId, tenantId))
            .orderBy(desc(auditEvents.createdAt))
            .limit(30),

        db.select().from(sopTickets).where(eq(sopTickets.tenantId, tenantId)),

        // Stage-5 Artifact SSOT
        getStage5Artifacts(tenantId)
    ]);

    const tenantRow = tenantDetails[0] ?? null;
    const ownerRow = ownerDetails[0] ?? null;

    // === ARTIFACT RESOLUTION [SNAPSHOT_ARTIFACT_STABILIZATION] ===
    const executiveBrief = await db
        .select()
        .from(executiveBriefs)
        .where(eq(executiveBriefs.tenantId, tenantId))
        .orderBy(desc(executiveBriefs.createdAt))
        .limit(1);

    const diagnostic = await db
        .select({
            id: diagnostics.id,
            overview: diagnostics.overview,
            aiOpportunities: diagnostics.aiOpportunities,
            roadmapSkeleton: diagnostics.roadmapSkeleton,
            createdAt: diagnostics.createdAt
        })
        .from(diagnostics)
        .where(eq(diagnostics.tenantId, tenantId))
        .orderBy(desc(diagnostics.createdAt))
        .limit(1);

    const discoveryNotes = await db
        .select()
        .from(discoveryCallNotes)
        .where(eq(discoveryCallNotes.tenantId, tenantId))
        .orderBy(asc(discoveryCallNotes.createdAt))
        .limit(1);

    const normalizedArtifacts = normalizeArtifacts({
        executiveBrief: executiveBrief[0],
        diagnostic: diagnostic[0],
        discoveryNotes: discoveryNotes[0]
    });

    return {
        tenantId,
        projection,
        tenant: tenantRow,
        owner: ownerRow,
        teamMembers: members,
        intakes: intakeList,
        intakeRoles: vectorList,
        artifacts: {
            ...normalizedArtifacts,
            notes: artifactsFromService.notes ?? [],
            qa: artifactsFromService.qa ?? null
        },
        roadmap: {
            latest: roadmapList[0] ?? null,
            all: roadmapList
        },
        tickets: ticketList,
        recentActivity: activityList
    };
}


