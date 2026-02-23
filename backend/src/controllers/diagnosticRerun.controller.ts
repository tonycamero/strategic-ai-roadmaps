import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db/index';
import { tenants, executiveBriefs, diagnostics } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { buildNormalizedIntakeContext } from '../services/intakeNormalizer';
import { generateSop01Outputs } from '../services/sop01Engine';
import { persistSop01OutputsForTenant } from '../services/sop01Persistence';

/**
 * UUID validation (strict enough for routing / guards)
 */
function isUuid(val: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(val);
}

/**
 * Fail-closed SuperAdmin-only gate.
 * Return 404 to avoid tenant existence inference.
 */
function requireSuperadmin(req: AuthRequest, res: Response): boolean {
  if (!req.user || req.user.role !== 'superadmin') {
    res.status(404).json({ error: 'Not Found' });
    return false;
  }
  return true;
}

/**
 * POST /api/superadmin/diagnostic/rerun/:tenantId
 *
 * IMPORTANT:
 * - This endpoint is currently DISABLED unless explicitly enabled.
 * - When enabled, it MUST remain SuperAdmin-only (not owner/exec_sponsor).
 */
export async function rerunSop01ForFirm(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const requestedTenantId = String(req.params.tenantId || '').trim();
  console.log('[SOP-01 RERUN] Handler called for tenantId:', requestedTenantId);

  try {
    // 0) SuperAdmin-only (fail-closed)
    if (!requireSuperadmin(req, res)) return;

    // 1) Validate tenantId early
    if (!requestedTenantId || !isUuid(requestedTenantId)) {
      console.log('[SOP-01 RERUN] Invalid tenantId format:', requestedTenantId);
      return res
        .status(400)
        .json({ error: 'Invalid tenant ID format (UUID expected)' });
    }

    // 2) HARD DISABLE BEFORE ANY DB MUTATION OR DISCLOSURE
    // This prevents “disabled endpoint” from still doing work.
    if (process.env.ENABLE_SOP01_RERUN !== '1') {
      console.log('[SOP-01 RERUN] BLOCKED: Endpoint disabled (ENABLE_SOP01_RERUN!=1)');
      return res.status(410).json({
        code: 'LEGACY_ENDPOINT_DISABLED',
        message:
          'Diagnostic rerun is disabled. Enable canonical Discovery Synthesis integration before re-enabling this endpoint.',
        details:
          'Set ENABLE_SOP01_RERUN=1 only after wiring Discovery Synthesis + canonical ticket generation.',
      });
    }

    const tenantId = requestedTenantId;

    // ENTRY CONDITION 1: Tenant + lastDiagnosticId must exist
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant || !tenant.lastDiagnosticId) {
      // For superadmin it’s okay to be explicit; still avoid oversharing.
      return res.status(409).json({
        code: 'DIAGNOSTIC_NOT_ELIGIBLE_FOR_RERUN',
        message: 'No diagnostic exists to re-run.',
      });
    }

    // ENTRY CONDITION 2: Tickets must be zero total, zero pending
    const { getModerationStatus } = await import('../services/ticketModeration.service');
    const ticketStats = await getModerationStatus(tenantId, tenant.lastDiagnosticId);

    if (ticketStats.total > 0 || ticketStats.pending > 0) {
      return res.status(409).json({
        code: 'DIAGNOSTIC_NOT_ELIGIBLE_FOR_RERUN',
        message:
          'Cannot re-run diagnostic when tickets already exist or are pending moderation.',
        ticketStats,
      });
    }

    // ENTRY CONDITION 3: Executive Brief must still be APPROVED (deterministic latest)
    const brief = await db.query.executiveBriefs.findFirst({
      where: eq(executiveBriefs.tenantId, tenantId),
      orderBy: [desc(executiveBriefs.updatedAt)], // if you have approvedAt, prefer that
    });

    if (!brief || brief.status !== 'APPROVED') {
      return res.status(409).json({
        code: 'DIAGNOSTIC_NOT_ELIGIBLE_FOR_RERUN',
        message: 'Executive Brief must be APPROVED to re-run diagnostic.',
      });
    }

    console.log(
      `[SOP-01 RERUN] Starting rerun for tenant ${tenantId}, superseding ${tenant.lastDiagnosticId}`
    );

    // Mark old diagnostic as superseded (intentional mutation)
    await db
      .update(diagnostics)
      .set({ status: 'superseded', updatedAt: new Date() })
      .where(eq(diagnostics.id, tenant.lastDiagnosticId));

    // Execute SOP-01 pipeline (artifact regeneration)
    const normalized = await buildNormalizedIntakeContext(tenantId);
    const outputs = await generateSop01Outputs(normalized);

    await persistSop01OutputsForTenant(tenantId, outputs);

    // NOTE: Canonical ticket generation still not wired here.
    // If you later re-enable ticket creation, do it via Discovery Synthesis canonical path.

    return res.json({
      ok: true,
      tenantId,
      supersededDiagnosticId: tenant.lastDiagnosticId,
      message:
        'SOP-01 artifacts regenerated and persisted. Canonical ticket generation is not executed by this endpoint.',
    });
  } catch (error: any) {
    console.error('[SOP-01 RERUN] Unexpected Error:', error);
    next(error);
  }

}