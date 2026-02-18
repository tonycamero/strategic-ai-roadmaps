import { Request, Response } from 'express';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import {
    tenants,
    firmBaselineIntake,
    baselineReviewCycles,
    implementationSnapshots,
    auditEvents,
    users,
} from '../db/schema';
import { ImplementationMetricsService } from '../services/implementationMetrics.service';
import { getOrCreateRoadmapForTenant } from '../services/roadmapOs.service';

// Type helper for Request with User
type AuthRequest<P = any, B = any, Q = any> = Request<P, B, B, Q> & {
    user?: {
        userId: string;
        role: string;
        tenantId?: string;
    };
};

function requireSuperAdmin(req: AuthRequest, res: Response): boolean {
    if (req.user?.role !== 'superadmin') {
        res.status(403).json({ error: 'Superadmin access required' });
        return false;
    }
    return true;
}

// ============================================================================
// GET /api/tenants/:tenantId/baseline-intake
// ============================================================================

export async function getBaselineIntake(req: AuthRequest<{ tenantId: string }>, res: Response) {
    try {
        const { tenantId } = req.params;

        // Security check: Superadmin or Tenant Owner
        if (req.user?.role !== 'superadmin' && req.user?.tenantId !== tenantId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch baseline
        const [baseline] = await db
            .select()
            .from(firmBaselineIntake)
            .where(eq(firmBaselineIntake.tenantId, tenantId))
            .limit(1);

        if (!baseline) {
            return res.status(404).json({ error: 'Baseline not found' });
        }

        // Fetch latest review cycle
        const [latestReview] = await db
            .select()
            .from(baselineReviewCycles)
            .where(eq(baselineReviewCycles.tenantId, tenantId))
            .orderBy(desc(baselineReviewCycles.cycleNumber))
            .limit(1);

        return res.json({
            baseline,
            latestReview: latestReview || null,
        });
    } catch (error) {
        console.error('Get baseline intake error:', error);
        return res.status(500).json({ error: 'Failed to fetch baseline' });
    }
}

// ============================================================================
// POST /api/tenants/:tenantId/baseline-intake
// ============================================================================

export async function upsertBaselineIntake(req: AuthRequest<{ tenantId: string }>, res: Response) {
    try {
        const { tenantId } = req.params;

        // Security check: Superadmin only (Operator-Governed)
        if (!requireSuperAdmin(req, res)) return;

        const {
            monthlyLeadVolume,
            avgResponseTimeMinutes,
            closeRatePercent,
            avgJobValue,
            currentTools,
            salesRepsCount,
            opsAdminCount,
            primaryBottleneck,
            // Economic Fields
            weeklyRevenue,
            peakHourRevenuePct,
            laborPct,
            overtimePct,
            grossMarginPct,
            averageTicket,
            economicConfidenceLevel,
            // Actions
            isLocked, // Boolean trigger from UI
        } = req.body;

        const existingBaseline = await db
            .select()
            .from(firmBaselineIntake)
            .where(eq(firmBaselineIntake.tenantId, tenantId))
            .limit(1)
            .then((rows) => rows[0]);

        let baselineId: string;

        const payload: any = {
            updatedAt: new Date(),
            monthlyLeadVolume,
            avgResponseTimeMinutes,
            closeRatePercent,
            avgJobValue,
            currentTools,
            salesRepsCount,
            opsAdminCount,
            primaryBottleneck,
            weeklyRevenue,
            peakHourRevenuePct,
            laborPct,
            overtimePct,
            grossMarginPct,
            averageTicket,
            economicConfidenceLevel,
        };

        // Handle Locking Logic
        if (isLocked && (!existingBaseline || !existingBaseline.baselineLockedAt)) {
            payload.baselineLockedAt = new Date();
            payload.lockedByUserId = req.user!.userId;
            payload.status = 'COMPLETE';
        }

        if (existingBaseline) {
            baselineId = existingBaseline.id;
            await db
                .update(firmBaselineIntake)
                .set(payload)
                .where(eq(firmBaselineIntake.id, baselineId));
        } else {
            payload.tenantId = tenantId;
            payload.status = isLocked ? 'COMPLETE' : 'DRAFT';
            const [newBaseline] = await db
                .insert(firmBaselineIntake)
                .values(payload)
                .returning();
            baselineId = newBaseline.id;
        }

        // Mirror to Implementation Snapshots if Locked
        if (isLocked) {
            const roadmap = await getOrCreateRoadmapForTenant(tenantId);

            // Calculate derived metrics for snapshot
            const snapshotMetrics = {
                // Map baseline fields to snapshot metrics schema
                lead_response_minutes: avgResponseTimeMinutes || 0,
                lead_to_appt_rate: 0, // Not directly in baseline, assume 0 or derived
                close_rate: closeRatePercent || 0,
                crm_adoption_rate: 0, // Baseline assumption
                weekly_ops_hours: (opsAdminCount || 0) * 40,
                nps: 0,
                // Custom fields for economic baseline could be added to metrics json,
                // but schema enforces specific keys strictly.
                // We will stick to the strict schema for now.
            };

            // Check if baseline snapshot exists using the service to avoid duplication
            // Actually, service creates new one. We want to update distinct "baseline_v1_locked".

            const existingSnapshot = await db
                .select()
                .from(implementationSnapshots)
                .where(and(
                    eq(implementationSnapshots.tenantId, tenantId),
                    eq(implementationSnapshots.label, 'baseline_v1_locked')
                ))
                .limit(1);

            if (existingSnapshot.length > 0) {
                await db.update(implementationSnapshots)
                    .set({
                        metrics: snapshotMetrics,
                        snapshotDate: new Date(),
                        source: 'api'
                    })
                    .where(eq(implementationSnapshots.id, existingSnapshot[0].id));
            } else {
                await db.insert(implementationSnapshots).values({
                    tenantId,
                    roadmapId: roadmap.id,
                    snapshotDate: new Date(),
                    label: 'baseline_v1_locked',
                    source: 'api',
                    metrics: snapshotMetrics,
                    notes: `Locked by Operator ${req.user!.userId} at ${new Date().toISOString()}`
                });
            }
        }

        // Log Audit
        await db.insert(auditEvents).values({
            tenantId,
            actorUserId: req.user!.userId,
            actorRole: req.user!.role,
            eventType: isLocked ? 'BASELINE_LOCKED' : 'BASELINE_UPDATED',
            entityType: 'firm_baseline_intake',
            entityId: baselineId,
            metadata: { isLocked, confidence: economicConfidenceLevel },
        });

        return res.json({ ok: true, baselineId });
    } catch (error) {
        console.error('Upsert baseline intake error:', error);
        return res.status(500).json({ error: 'Failed to upsert baseline' });
    }
}
