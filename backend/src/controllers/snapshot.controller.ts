
import { Request, Response } from 'express';
import { db } from '../db/index';
import { eq, and, desc, sql } from 'drizzle-orm';
import { tenants, intakes, intakeVectors, sopTickets, users, executiveBriefs } from '../db/schema';

// Helper for type safety
interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        isInternal: boolean;
        tenantId?: string;
    };
}

/**
 * GET /api/superadmin/snapshot/:tenantId
 * Aggregates existing signals into a read-only Executive Snapshot.
 * Strictly non-financial (no cost modeling).
 */
export const getTenantSnapshot = async (req: AuthRequest, res: Response) => {
    try {
        const { tenantId } = req.params;
        const currentUser = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required' });
        }

        console.log(`[Snapshot] Request for tenantId=${tenantId} by user=${currentUser?.userId} role=${currentUser?.role} isInternal=${currentUser?.isInternal}`);

        // 1. Authority Check: Executive/Consultant Only (CR-FIX-RBAC-2)
        // ALLOW: SuperAdmin (internal), Consulting Delegate (internal), OR Owner (tenant)
        const isInternalConsultant = currentUser?.isInternal && ['superadmin', 'delegate'].includes(currentUser.role);
        const isTenantOwner = !currentUser?.isInternal && currentUser?.role === 'owner';

        if (!isInternalConsultant && !isTenantOwner) {
            console.warn(`[Snapshot] 403 - Unauthorized access attempt by ${currentUser?.role} (${currentUser?.userId}, isInternal: ${currentUser?.isInternal})`);
            return res.status(403).json({ error: 'Snapshot access restricted to Executives.' });
        }

        // 2. Validate tenant exists and get intake window state
        const [tenant] = await db
            .select({
                id: tenants.id,
                intakeWindowState: tenants.intakeWindowState
            })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

        if (!tenant) {
            console.warn(`[Snapshot] 404 - Tenant not found: ${tenantId}`);
            return res.status(404).json({
                error: 'Tenant not found',
                details: 'The requested tenant does not exist.'
            });
        }

        // 3. Check Prerequisites for Snapshot Generation
        // Count intake vectors (new contract)
        const [vectorCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(intakeVectors)
            .where(eq(intakeVectors.tenantId, tenantId));

        const totalVectors = Number(vectorCount?.count || 0);

        // Count completed intakes
        const [completedIntakeCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(intakes)
            .where(and(
                eq(intakes.tenantId, tenantId),
                eq(intakes.status, 'completed')
            ));

        const completedIntakes = Number(completedIntakeCount?.count || 0);

        // Check if owner intake exists
        const [ownerIntake] = await db
            .select({ id: intakes.id })
            .from(intakes)
            .where(and(
                eq(intakes.tenantId, tenantId),
                eq(intakes.role, 'owner'),
                eq(intakes.status, 'completed')
            ))
            .limit(1);

        const hasOwnerIntake = !!ownerIntake;

        console.log(`[Snapshot] Prerequisites: vectors=${totalVectors}, completedIntakes=${completedIntakes}, ownerIntake=${hasOwnerIntake}, intakeWindow=${tenant.intakeWindowState}`);

        // 4. Fail-Closed: Return 404 if prerequisites not met
        if (totalVectors === 0 || !hasOwnerIntake) {
            console.warn(`[Snapshot] 404 - Prerequisites not met for ${tenantId}`);
            return res.status(404).json({
                error: 'SNAPSHOT_NOT_READY',
                message: 'Snapshot not available until prerequisites are met.',
                prerequisites: {
                    hasVectors: totalVectors > 0,
                    hasOwnerIntake,
                    intakeWindowState: tenant.intakeWindowState || 'UNKNOWN',
                    vectorCount: totalVectors,
                    completedIntakeCount: completedIntakes
                }
            });
        }

        // 5. Aggregate Intake Coverage (using intake_vectors)
        const rolesInvited = totalVectors;
        const rolesCompleted = completedIntakes;

        console.log(`[Snapshot] Aggregation: ${rolesCompleted}/${rolesInvited} intakes completed`);

        // 6. Aggregate Ticket Signals (The "Work")
        const allTickets = await db
            .select({
                id: sopTickets.id,
                title: sopTickets.title,
                description: sopTickets.description,
                category: sopTickets.category,
                priority: sopTickets.priority,
                moderationStatus: sopTickets.moderationStatus,
                timeEstimateHours: sopTickets.timeEstimateHours,
            })
            .from(sopTickets)
            .where(eq(sopTickets.tenantId, tenantId));

        let totalTickets = 0;
        let rejectedCount = 0;
        let approvedCount = 0;
        let manualWorkCount = 0;
        let highPriorityCount = 0;
        let projectedHoursSaved = 0;

        const categoryDistribution: Record<string, number> = {};

        // Regex for manual work detection (simple heuristics)
        const manualKeywords = /manual|spreadsheet|hand|copy|paste|email|paper/i;

        for (const t of allTickets) {
            totalTickets++;

            // Distribution
            categoryDistribution[t.category] = (categoryDistribution[t.category] || 0) + 1;

            // Status Counts
            if (t.moderationStatus === 'rejected') rejectedCount++;
            if (t.moderationStatus === 'approved') {
                approvedCount++;
                // ROI: Recovered Capacity (Hours)
                projectedHoursSaved += (t.timeEstimateHours || 0); // Using existing time estimate
            }

            // Friction / Bottleneck Signals
            if (t.priority === 'high') highPriorityCount++;

            // "Manual Work" detection
            if (manualKeywords.test(t.title) || manualKeywords.test(t.description)) {
                manualWorkCount++;
            }
        }

        console.log(`[Snapshot] Tickets: ${totalTickets} total, ${approvedCount} approved, ${rejectedCount} rejected`);

        // 7. Fetch Executive Brief Status
        const [execBrief] = await db
            .select({
                status: executiveBriefs.status
            })
            .from(executiveBriefs)
            .where(eq(executiveBriefs.tenantId, tenantId))
            .limit(1);

        const briefStatus = execBrief?.status || null;

        // 8. Derive Execution Phase
        let executionPhase = 'INTAKE_OPEN';

        if (briefStatus === 'APPROVED') {
            executionPhase = 'EXEC_BRIEF_APPROVED';
        } else if (briefStatus === 'DRAFT') {
            executionPhase = 'EXEC_BRIEF_DRAFT';
        } else if (tenant.intakeWindowState === 'OPEN') {
            executionPhase = 'INTAKE_OPEN';
        }

        // 9. Construct Snapshot Payload
        // Strictly non-financial keys.
        const snapshot = {
            executionPhase,
            executiveBriefStatus: briefStatus,
            intakeWindowState: tenant.intakeWindowState,
            coverage: {
                rolesInvited,
                rolesCompleted,
                organizationInputPercent: rolesInvited > 0
                    ? Math.round((rolesCompleted / rolesInvited) * 100)
                    : 0
            },
            frictionMap: {
                totalTickets,
                rejectedTickets: rejectedCount,
                manualWorkflowsIdentified: manualWorkCount,
                strategicMisalignmentScore: totalTickets > 0
                    ? Math.round((rejectedCount / totalTickets) * 100)
                    : 0, // % of tickets rejected
                highPriorityBottlenecks: highPriorityCount
            },
            capacityROI: {
                projectedHoursSavedWeekly: projectedHoursSaved,
                // Qualitative Banding
                speedToValue: approvedCount > 5 ? 'HIGH' : approvedCount > 0 ? 'MEDIUM' : 'LOW'
            },
            distribution: categoryDistribution
        };

        console.log(`[Snapshot] 200 - Snapshot generated successfully for ${tenantId}`);
        return res.status(200).json({
            success: true,
            data: snapshot
        });

    } catch (error) {
        console.error('[Snapshot] 500 - Unhandled error:', error);
        console.error('[Snapshot] Stack:', error instanceof Error ? error.stack : 'No stack trace');
        return res.status(500).json({
            error: 'Internal Server Error',
            details: 'Failed to generate snapshot. Please contact support.'
        });
    }
};
