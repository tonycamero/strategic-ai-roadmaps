
import { Request, Response } from 'express';
import { db } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { tenants, intakes, invites, sopTickets, users } from '../db/schema';

// Helper for type safety
interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
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

        // 1. Authority Check: Executive Only
        // Delegates (ops, etc.) must NOT see this panel.
        if (!currentUser || !['superadmin', 'owner'].includes(currentUser.role)) {
            console.warn(`[Snapshot] Unauthorized access attempt by ${currentUser?.role} (${currentUser?.userId})`);
            return res.status(403).json({ error: 'Snapshot access restricted to Executives.' });
        }

        // 2. Aggregate Intake Coverage
        // Invited vs Completed
        const [inviteCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(invites)
            .where(eq(invites.tenantId, tenantId));

        const [intakeCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(intakes)
            .where(and(
                eq(intakes.tenantId, tenantId),
                eq(intakes.status, 'completed')
            ));

        // 3. Aggregate Ticket Signals (The "Work")
        const allTickets = await db
            .select()
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

        // 4. Construct Snapshot Payload
        // Strictly non-financial keys.
        const snapshot = {
            coverage: {
                rolesInvited: Number(inviteCount?.count || 0),
                rolesCompleted: Number(intakeCount?.count || 0),
                organizationInputPercent: Number(inviteCount?.count) > 0
                    ? Math.round((Number(intakeCount?.count) / Number(inviteCount?.count)) * 100)
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

        return res.status(200).json({
            success: true,
            data: snapshot
        });

    } catch (error) {
        console.error('[Snapshot] Error generating snapshot:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
