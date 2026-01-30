import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { tenants, executiveBriefs, diagnostics } from '../db/schema';
import { eq } from 'drizzle-orm';
import { buildNormalizedIntakeContext } from '../services/intakeNormalizer';
import { generateSop01Outputs } from '../services/sop01Engine';
import { persistSop01OutputsForTenant } from '../services/sop01Persistence';
import { ingestDiagnostic } from '../services/diagnosticIngestion.service';

function isUuid(val: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(val);
}

/**
 * Authority check for Executive-only surfaces.
 * Maps roles to the Executive category.
 */
function requireExecutiveAuthority(req: AuthRequest, res: Response): boolean {
    const executiveRoles = ['superadmin', 'exec_sponsor', 'owner'];
    if (!req.user || !executiveRoles.includes(req.user.role as string)) {
        // Structural Gating: Return 404/Null to prevent inference of existence
        res.status(404).json({ error: 'Not Found' });
        return false;
    }
    return true;
}

/**
 * POST /api/superadmin/diagnostic/rerun/:tenantId
 * Re-run SOP-01 when diagnostic exists but produced zero findings
 * EXECUTIVE AUTHORITY REQUIRED
 * 
 * Entry Conditions:
 * - Diagnostic exists (lastDiagnosticId IS NOT NULL)
 * - Zero tickets (total === 0)
 * - No pending moderation
 * - Executive Brief still APPROVED
 */
export async function rerunSop01ForFirm(req: AuthRequest, res: Response, next: NextFunction) {
    console.log('[SOP-01 RERUN] Handler called for tenantId:', req.params.tenantId);

    try {
        // SECURITY: Executive Authority required
        if (!requireExecutiveAuthority(req, res)) {
            console.log('[SOP-01 RERUN] Authority check failed');
            return;
        }

        const { tenantId } = req.params;

        // Assertion: Ensure tenantId is a valid UUID
        if (!isUuid(tenantId)) {
            console.log('[SOP-01 RERUN] Invalid tenantId format:', tenantId);
            return res.status(400).json({ error: 'Invalid tenant ID format (UUID expected)' });
        }

        console.log('[SOP-01 RERUN] Authority check passed, proceeding with rerun');

        // ENTRY CONDITION 1: Diagnostic must exist
        const [tenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

        if (!tenant || !tenant.lastDiagnosticId) {
            console.log('[SOP-01 RERUN] No diagnostic exists');
            return res.status(409).json({
                code: 'DIAGNOSTIC_NOT_ELIGIBLE_FOR_RERUN',
                message: 'No diagnostic exists to re-run.'
            });
        }

        // ENTRY CONDITION 2: Check ticket stats (must be zero total, zero pending)
        const { getModerationStatus } = await import('../services/ticketModeration.service');
        const ticketStats = await getModerationStatus(tenantId, tenant.lastDiagnosticId);
        console.log('[SOP-01 RERUN] Ticket stats:', ticketStats);

        if (ticketStats.total > 0 || ticketStats.pending > 0) {
            console.log('[SOP-01 RERUN] Tickets already exist or pending');
            return res.status(409).json({
                code: 'DIAGNOSTIC_NOT_ELIGIBLE_FOR_RERUN',
                message: 'Cannot re-run diagnostic when tickets already exist or are pending moderation.',
                ticketStats
            });
        }

        // ENTRY CONDITION 3: Brief must still be approved
        const [brief] = await db
            .select()
            .from(executiveBriefs)
            .where(eq(executiveBriefs.tenantId, tenantId))
            .limit(1);

        if (!brief || brief.status !== 'APPROVED') {
            console.log('[SOP-01 RERUN] Brief not approved');
            return res.status(403).json({
                code: 'INSUFFICIENT_AUTHORITY',
                message: 'Executive Brief must be APPROVED to re-run diagnostic.'
            });
        }

        console.log(`[SOP-01 RERUN] All entry conditions met. Starting rerun for tenant ${tenantId}, superseding ${tenant.lastDiagnosticId}`);

        // Mark old diagnostic as superseded
        try {
            await db
                .update(diagnostics)
                .set({
                    status: 'superseded',
                    updatedAt: new Date()
                })
                .where(eq(diagnostics.id, tenant.lastDiagnosticId));

            console.log(`[SOP-01 RERUN] Superseded old diagnostic: ${tenant.lastDiagnosticId}`);
        } catch (error) {
            console.error('[SOP-01 RERUN] Failed to supersede old diagnostic:', error);
            // Non-fatal, continue
        }

        // Execute SOP-01 pipeline (same as initial generation)
        console.log('[SOP-01 RERUN] Building normalized context...');
        const normalized = await buildNormalizedIntakeContext(tenantId);

        console.log('[SOP-01 RERUN] Generating SOP-01 outputs...');
        const outputs = await generateSop01Outputs(normalized);

        if (process.env.DEBUG_TICKETS_PIPELINE === '1') {
            console.log('[DEBUG_TICKETS_PIPELINE] SOP-01 Outputs Generated:', {
                diagnosticKeys: Object.keys(outputs),
                diagnosticLength: outputs.sop01DiagnosticMarkdown?.length,
                skeletonLength: outputs.sop01RoadmapSkeletonMarkdown?.length
            });
        }

        console.log('[SOP-01 RERUN] Persisting outputs...');
        try {
            await persistSop01OutputsForTenant(tenantId, outputs);
            if (process.env.DEBUG_TICKETS_PIPELINE === '1') {
                console.log('[DEBUG_TICKETS_PIPELINE] SOP-01 Outputs Persisted to tenant_documents');
            }
        } catch (error: any) {
            console.error('[SOP-01 RERUN] Persistence Failed:', error);
            return res.status(500).json({
                code: 'SOP01_RERUN_FAILED',
                message: 'Failed to persist diagnostic artifacts.',
                details: error.message
            });
        }

        // CANONICAL ENFORCEMENT: Diagnostic rerun requires Discovery Synthesis
        // This endpoint is disabled because it previously used ingestDiagnostic() which generates
        // non-canonical tickets (INV-DERIVED-*). To re-enable:
        // 1. Create Discovery Synthesis from SOP-01 outputs
        // 2. Call generateTicketsFromDiscovery() instead
        // 3. Ensure minimum 12 canonical inventory items selected
        console.log('[SOP-01 RERUN] BLOCKED: Canonical enforcement requires Discovery Synthesis');
        return res.status(410).json({
            code: 'LEGACY_ENDPOINT_DISABLED',
            message: 'Diagnostic rerun is temporarily disabled pending canonical Discovery Synthesis integration. ' +
                'Contact engineering to enable canonical ticket generation for this tenant.',
            details: 'This endpoint previously generated non-canonical tickets (INV-DERIVED-*). ' +
                'Canonical path requires Discovery Synthesis + generateTicketsFromDiscovery().'
        });
    } catch (error: any) {
        console.error('[SOP-01 RERUN] Unexpected Error:', error);
        console.error('[SOP-01 RERUN] Error stack:', error?.stack);
        next(error);
    }
}
