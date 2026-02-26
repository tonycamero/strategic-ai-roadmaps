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
    roadmaps
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
        status: string
    }

    lifecycle: {
        intakeWindowState: "OPEN" | "CLOSED"
        intakeVersion: number
        currentPhase: string
    }

    governance: {
        executiveBriefStatus: "NONE" | "CREATED" | "APPROVED" | "DELIVERED"
        governanceLocked: boolean
    }

    workflow: {
        intakesComplete: boolean
        rolesCompleted: string[]
        sop01Complete: boolean
        discoveryComplete: boolean
        roadmapComplete: boolean
    }

    artifacts: {
        hasExecutiveBrief: boolean
        hasDiagnostic: boolean
        hasRoadmap: boolean
    }

    derived: {
        canGenerateDiagnostic: boolean
        canGenerateTickets: boolean
        canAssembleRoadmap: boolean
        canReopenIntake: boolean
        lifecycleValid: boolean
    }

    meta: {
        projectionVersion: string
        computedAt: string
    }
}

/**
 * Authoritative entry point for tenant state projection.
 */
export async function getTenantLifecycleView(
    tenantId: string
): Promise<TenantLifecycleView> {
    // 1. Fetch Core Identity
    const [tenant] = await db
        .select({
            id: tenants.id,
            name: tenants.name,
            status: tenants.status
        })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
    }

    // INTERNAL RESOLVER STUBS (FAIL-CLOSED)
    const lifecycle = await resolveLifecycle(tenantId);
    const governance = await resolveGovernance(tenantId);
    const workflow = await resolveWorkflow(tenantId);
    const artifacts = await resolveArtifacts(tenantId);
    const derived = computeDerivedFlags({
        lifecycle,
        governance,
        workflow,
        artifacts
    });

    return {
        identity: {
            tenantId,
            tenantName: tenant.name,
            status: tenant.status
        },
        lifecycle,
        governance,
        workflow,
        artifacts,
        derived,
        meta: {
            projectionVersion: PROJECTION_VERSION,
            computedAt: new Date().toISOString()
        }
    };
}

// ============================================================================
// INTERNAL RESOLVERS
// ============================================================================

async function resolveLifecycle(tenantId: string) {
    const [tenant] = await db
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

async function resolveGovernance(tenantId: string) {
    // 1. Fetch latest Executive Brief
    const [brief] = await db
        .select({
            id: executiveBriefs.id,
            status: executiveBriefs.status,
            approvedAt: executiveBriefs.approvedAt
        })
        .from(executiveBriefs)
        .where(eq(executiveBriefs.tenantId, tenantId))
        .orderBy(desc(executiveBriefs.createdAt))
        .limit(1);

    let status: "NONE" | "CREATED" | "APPROVED" | "DELIVERED" = "NONE";
    if (brief) {
        status = "CREATED";
    }

    // 2. Check for Approval Event (Canonical Authority)
    const [lastApprovalEvent] = await db
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
    const [lastDeliveryEvent] = await db
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
        governanceLocked
    };
}

async function resolveWorkflow(tenantId: string) {
    // Fetch tenant again for discoveryComplete flag
    const [tenant] = await db
        .select({ discoveryComplete: tenants.discoveryComplete })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

    // 1. Intakes
    const allIntakes = await db
        .select()
        .from(intakes)
        .where(eq(intakes.tenantId, tenantId));

    const rolesCompleted: string[] = Array.from(new Set(
        allIntakes.filter(i => i.completedAt).map(i => i.role as string)
    ));
    const requiredRoles = ['owner', 'ops', 'sales', 'delivery'];
    const intakesComplete = requiredRoles.every(role => rolesCompleted.includes(role));

    // 2. SOP-01
    const sop01Docs = await db
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
    const [discoveryNote] = await db
        .select({ id: discoveryCallNotes.id })
        .from(discoveryCallNotes)
        .where(eq(discoveryCallNotes.tenantId, tenantId))
        .orderBy(desc(discoveryCallNotes.createdAt))
        .limit(1);

    const discoveryComplete = !!discoveryNote && !!tenant?.discoveryComplete;

    // 4. Roadmap
    const roadmapDocs = await db
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

    return {
        intakesComplete,
        rolesCompleted,
        sop01Complete,
        discoveryComplete,
        roadmapComplete
    };
}

async function resolveArtifacts(tenantId: string) {
    // 1. Executive Brief
    const [brief] = await db
        .select({ id: executiveBriefs.id })
        .from(executiveBriefs)
        .where(eq(executiveBriefs.tenantId, tenantId))
        .orderBy(desc(executiveBriefs.createdAt))
        .limit(1);

    // 2. Diagnostic
    const [diagnostic] = await db
        .select({ id: diagnostics.id })
        .from(diagnostics)
        .where(eq(diagnostics.tenantId, tenantId))
        .orderBy(desc(diagnostics.createdAt))
        .limit(1);

    // 3. Roadmap
    const [roadmap] = await db
        .select({ id: roadmaps.id })
        .from(roadmaps)
        .where(eq(roadmaps.tenantId, tenantId))
        .orderBy(desc(roadmaps.createdAt))
        .limit(1);

    return {
        hasExecutiveBrief: !!brief,
        hasDiagnostic: !!diagnostic,
        hasRoadmap: !!roadmap
    };
}

/**
 * Computes minimal derived readiness flags based ONLY on existing projection state.
 * NO direct DB queries allowed here.
 */
function computeDerivedFlags(view: {
    lifecycle: TenantLifecycleView["lifecycle"],
    governance: TenantLifecycleView["governance"],
    workflow: TenantLifecycleView["workflow"],
    artifacts: TenantLifecycleView["artifacts"]
}) {
    const { lifecycle, governance, workflow, artifacts } = view;

    const canReopenIntake =
        lifecycle.intakeWindowState === "CLOSED" &&
        governance.governanceLocked === false;

    const canAssembleRoadmap =
        workflow.roadmapComplete === false &&
        artifacts.hasDiagnostic === true &&
        workflow.intakesComplete === true;

    const canGenerateDiagnostic =
        lifecycle.intakeWindowState === "CLOSED" &&
        (governance.executiveBriefStatus === "APPROVED" ||
            governance.executiveBriefStatus === "DELIVERED");

    const canGenerateTickets =
        artifacts.hasDiagnostic === true &&
        workflow.discoveryComplete === true;

    const lifecycleValid =
        lifecycle.intakeWindowState === "OPEN" ||
        lifecycle.intakeWindowState === "CLOSED";

    return {
        canGenerateDiagnostic,
        canGenerateTickets,
        canAssembleRoadmap,
        canReopenIntake,
        lifecycleValid
    };
}

