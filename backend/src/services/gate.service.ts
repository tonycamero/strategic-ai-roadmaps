
import {
  tenants,
  executiveBriefs,
  diagnostics,
  sopTickets,
  discoveryCallNotes,
  roadmaps,
  intakes,
  auditEvents,
  intakeClarifications
} from '../db/schema';
import { db } from '../db/index';
import { eq, desc, and } from 'drizzle-orm';
import { getTenantLifecycleView } from "./tenantStateAggregation.service";

// ============================================================================
// TYPES (Should match schema enums, enforced here for logic)
// ============================================================================

export type GateCheckResult = {
  allowed: boolean;
  reason?: string;
  nextState?: string;
};

// ============================================================================
// GATE DEFINITIONS
// ============================================================================

/**
 * Gate 1: CAN LOCK INTAKE?
 * Requirement: Intake Window CLOSED + Brief REVIEWED.
 */
export async function canLockIntake(tenantId: string): Promise<GateCheckResult> {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) return { allowed: false, reason: 'Tenant not found' };

  if (tenant.intakeClosedAt) {
    return { allowed: false, reason: 'Intake is already locked' };
  }

  if (tenant.intakeWindowState !== 'OPEN') {
    return { allowed: false, reason: 'Intake Window must be OPEN to lock it' };
  }

  const [brief] = await db
    .select()
    .from(executiveBriefs)
    .where(eq(executiveBriefs.tenantId, tenantId))
    .orderBy(desc(executiveBriefs.createdAt))
    .limit(1);

  if (!brief) {
    return { allowed: false, reason: 'Executive Brief has not been generated' };
  }

  // "REVIEWED" status on brief is the key consultation signal
  // (Legacy support for 'APPROVED', and allow DELIVERED as it implies approved)
  if (brief.status !== 'REVIEWED' && brief.status !== 'APPROVED' && brief.status !== 'DELIVERED') {
    return { allowed: false, reason: 'Executive Brief must be marked as REVIEWED or APPROVED' };
  }

  return { allowed: true };
}

/**
 * Gate 2: CAN GENERATE DIAGNOSTICS?
 * Requirement: Intake LOCKED.
 */
export async function canGenerateDiagnostics(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canGenerateDiagnostic) {
    if (view.lifecycle.intakeWindowState !== 'CLOSED') {
      return { allowed: false, reason: 'Intake must be locked before generating diagnostics' };
    }
    if (view.governance.executiveBriefStatus !== 'APPROVED' && view.governance.executiveBriefStatus !== 'DELIVERED') {
      return { allowed: false, reason: 'Executive Brief must be approved before generating diagnostics.' };
    }
    return { allowed: false, reason: 'READINESS_CONDITION_FAILED' };
  }

  // B3: Block while Consultant Feedback is PENDING
  const tenantIntakes = await db.select().from(intakes).where(eq(intakes.tenantId, tenantId));
  for (const intake of tenantIntakes) {
    const fb = (intake.coachingFeedback as any) || {};
    const hasPending = Object.values(fb).some((item: any) =>
      item.isFlagged || (item.requests && item.requests.some((r: any) => r.status === 'PENDING'))
    );
    if (hasPending) {
      return { allowed: false, reason: 'Pending Consultant Feedback/Coaching must be resolved before generating diagnostics.' };
    }
  }

  // D3: Enforce Operator Knowledge Gate
  const [sufficiencyConfirmation] = await db
    .select()
    .from(auditEvents)
    .where(and(
      eq(auditEvents.tenantId, tenantId),
      eq(auditEvents.eventType, 'OPERATOR_CONFIRMED_DIAGNOSTIC_SUFFICIENCY')
    ))
    .orderBy(desc(auditEvents.createdAt))
    .limit(1);

  if (!sufficiencyConfirmation) {
    return { allowed: false, reason: 'Operator must explicitly confirm knowledge sufficiency before generating diagnostics.' };
  }

  // B4: Block if there are BLOCKING unresponded intake clarifications
  const outstandingBlocking = await db
    .select()
    .from(intakeClarifications)
    .where(and(
      eq(intakeClarifications.tenantId, tenantId),
      eq(intakeClarifications.status, 'requested'),
      eq(intakeClarifications.blocking, true)
    ));

  if (outstandingBlocking.length > 0) {
    return { allowed: false, reason: 'Outstanding blocking clarifications must be responded to before generating diagnostics.' };
  }

  return { allowed: true };
}

/**
 * Gate 2a: CAN LOCK DIAGNOSTICS?
 * Requirement: Status must be GENERATED.
 */
export async function canLockDiagnostic(diagnosticId: string): Promise<GateCheckResult> {
  const [diag] = await db.select().from(diagnostics).where(eq(diagnostics.id, diagnosticId)).limit(1);
  if (!diag) return { allowed: false, reason: 'Diagnostic not found' };

  if (diag.status !== 'generated') {
    return { allowed: false, reason: 'Diagnostic must be in GENERATED status to lock.' };
  }
  return { allowed: true };
}

/**
 * Gate 3: CAN PUBLISH DIAGNOSTICS?
 * Requirement: Diagnostics must be in LOCKED state.
 */
export async function canPublishDiagnostics(diagnosticId: string): Promise<GateCheckResult> {
  const [diag] = await db.select().from(diagnostics).where(eq(diagnostics.id, diagnosticId)).limit(1);
  if (!diag) return { allowed: false, reason: 'Diagnostic not found' };

  if (diag.status !== 'locked') {
    return { allowed: false, reason: 'Diagnostic must be locked before publishing' };
  }

  return { allowed: true };
}

/**
 * Gate 4: CAN INGEST DISCOVERY NOTES?
 * Requirement: Current Diagnostic must be PUBLISHED.
 *
 * Deterministic rule:
 * - Tenant must have lastDiagnosticId set
 * - That diagnostic must exist
 * - That diagnostic.status === 'published'
 *
 * Fail-closed posture:
 * - If tenant or diagnostic cannot be resolved, deny.
 */
export async function canIngestDiscoveryNotes(tenantId: string): Promise<GateCheckResult> {
  // Resolve tenant deterministically
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    return { allowed: false, reason: 'Tenant not found.' };
  }

  if (!tenant.lastDiagnosticId) {
    return { allowed: false, reason: 'No diagnostic cycle found for this tenant.' };
  }

  const [currentDiag] = await db
    .select()
    .from(diagnostics)
    .where(eq(diagnostics.id, tenant.lastDiagnosticId))
    .limit(1);

  if (!currentDiag) {
    return { allowed: false, reason: 'Referenced diagnostic record not found.' };
  }

  if (currentDiag.status !== 'published') {
    return { allowed: false, reason: 'Current Diagnostic must be PUBLISHED before discovery notes.' };
  }

  return { allowed: true };
}

/**
 * Gate 5: CAN GENERATE SOP TICKETS?
 * Requirement: Current Diagnostic is PUBLISHED + at least one Discovery Note is INGESTED.
 *
 * Fail-closed posture:
 * - If discovery note ingestion cannot be verified deterministically, deny.
 */
export async function canGenerateSopTickets(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canGenerateTickets) {
    if (view.artifacts.hasDiagnostic === false) {
      return { allowed: false, reason: 'Current Diagnostic must be PUBLISHED before discovery notes.' };
    }
    // Note: Gate 4 (canIngestDiscoveryNotes) is technically checked by view.derived.canGenerateTickets 
    // implicitly via workflow.discoveryComplete.
    return { allowed: false, reason: 'READINESS_CONDITION_FAILED' };
  }

  // Require: at least one ingested discovery note for this tenant.
  try {
    const ingested = await db
      .select({ id: discoveryCallNotes.id })
      .from(discoveryCallNotes)
      .where(and(
        eq(discoveryCallNotes.tenantId, tenantId),
        eq(discoveryCallNotes.status, 'ingested')
      ))
      .limit(1);

    if (ingested.length === 0) {
      return { allowed: false, reason: 'Must have at least one INGESTED discovery note.' };
    }

    return { allowed: true };
  } catch (err: any) {
    console.error('[Gate] canGenerateSopTickets failed to verify ingested discovery notes:', err);
    return {
      allowed: false,
      reason: 'Cannot verify discovery note ingestion state (query failure).',
    };
  }
}

/**
 * Gate 6: CAN ASSEMBLE ROADMAP?
 * Requirement: SOP Tickets Generated + ALL Tickets "APPROVED" or "REJECTED" (Moderation Complete).
 * If any are "PENDING", we block.
 */
export async function canAssembleRoadmap(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canAssembleRoadmap) {
    if (view.artifacts.hasDiagnostic === false) {
      return { allowed: false, reason: 'No diagnostic generated yet.' };
    }
    if (view.workflow.intakesComplete === false) {
      return { allowed: false, reason: 'Intakes must be complete.' };
    }
    return { allowed: false, reason: 'READINESS_CONDITION_FAILED' };
  }

  const tickets = await db
    .select()
    .from(sopTickets)
    .where(eq(sopTickets.tenantId, tenantId));

  if (tickets.length === 0) {
    return { allowed: false, reason: 'No SOP tickets generated yet.' };
  }

  const pending = tickets.filter(t => t.status === 'pending' || t.status === 'generated');
  if (pending.length > 0) {
    return { allowed: false, reason: `Cannot assemble: ${pending.length} tickets are still pending moderation.` };
  }

  return { allowed: true };
}
