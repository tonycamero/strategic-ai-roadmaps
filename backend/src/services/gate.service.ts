/**
 * GATE SERVICE — TCK-SSOT-005
 *
 * Pure projection consumer. Zero direct DB access.
 * All readiness decisions derived from TenantLifecycleView.
 * Fail closed on all lifecycle gates.
 *
 * Compliant with: META-SSOT-PROJECTION-EXPANSION-001 / SCEND CANON 001
 */

import { getTenantLifecycleView } from './tenantStateAggregation.service';

// ============================================================================
// TYPES
// ============================================================================

export type GateCheckResult = {
  allowed: boolean;
  reason?: string;
  blockingReasons?: string[];
  nextState?: string;
};

// ============================================================================
// GATE DEFINITIONS
// ============================================================================

/**
 * Gate 1: CAN LOCK INTAKE?
 * Projection flag: derived.canLockIntake
 */
export async function canLockIntake(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canLockIntake) {
    return {
      allowed: false,
      reason: 'READINESS_CONDITION_FAILED',
      blockingReasons: view.derived.blockingReasons
    };
  }

  return { allowed: true };
}

/**
 * Gate 2: CAN GENERATE DIAGNOSTICS?
 * Projection flag: derived.canGenerateDiagnostic
 */
export async function canGenerateDiagnostics(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canGenerateDiagnostic) {
    return {
      allowed: false,
      reason: 'READINESS_CONDITION_FAILED',
      blockingReasons: view.derived.blockingReasons
    };
  }

  return { allowed: true };
}

/**
 * Gate 2a: CAN LOCK DIAGNOSTIC?
 * Projection flag: derived.canLockDiagnostic
 *
 * NOTE: Signature changed from (diagnosticId) to (tenantId) — TCK-SSOT-005.
 * Callers updated in TCK-SSOT-006.
 */
export async function canLockDiagnostic(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canLockDiagnostic) {
    return {
      allowed: false,
      reason: 'READINESS_CONDITION_FAILED',
      blockingReasons: view.derived.blockingReasons
    };
  }

  return { allowed: true };
}

/**
 * Gate 3: CAN PUBLISH DIAGNOSTIC?
 * Projection flag: derived.canPublishDiagnostic
 *
 * NOTE: Signature changed from (diagnosticId) to (tenantId) — TCK-SSOT-005.
 * Callers updated in TCK-SSOT-006.
 */
export async function canPublishDiagnostics(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canPublishDiagnostic) {
    return {
      allowed: false,
      reason: 'READINESS_CONDITION_FAILED',
      blockingReasons: view.derived.blockingReasons
    };
  }

  return { allowed: true };
}

/**
 * Gate 4: CAN INGEST DISCOVERY NOTES?
 * Projection flag: derived.canIngestDiscoveryNotes
 */
export async function canIngestDiscoveryNotes(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canIngestDiscoveryNotes) {
    return {
      allowed: false,
      reason: 'READINESS_CONDITION_FAILED',
      blockingReasons: view.derived.blockingReasons
    };
  }

  return { allowed: true };
}

/**
 * Gate 5: CAN GENERATE SOP TICKETS?
 * Projection flag: derived.canGenerateTickets
 */
export async function canGenerateSopTickets(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canGenerateTickets) {
    return {
      allowed: false,
      reason: 'READINESS_CONDITION_FAILED',
      blockingReasons: view.derived.blockingReasons
    };
  }

  return { allowed: true };
}

/**
 * Gate 6: CAN ASSEMBLE ROADMAP?
 * Projection flag: derived.canAssembleRoadmap
 */
export async function canAssembleRoadmap(tenantId: string): Promise<GateCheckResult> {
  const view = await getTenantLifecycleView(tenantId);

  if (!view.derived.canAssembleRoadmap) {
    return {
      allowed: false,
      reason: 'READINESS_CONDITION_FAILED',
      blockingReasons: view.derived.blockingReasons
    };
  }

  return { allowed: true };
}
