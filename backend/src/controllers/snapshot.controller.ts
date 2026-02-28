
import { Request, Response } from 'express';
import { db } from '../db/index';
import { eq, and, desc, sql } from 'drizzle-orm';
import { tenants, intakes, intakeVectors, sopTickets, users, executiveBriefs, discoveryCallNotes, roadmaps, auditEvents, diagnostics } from '../db/schema';
import { getTenantLifecycleView } from '../services/tenantStateAggregation.service';

// Helper for type safety
interface AuthRequest extends Request {
    params: {
        tenantId: string;
    };
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

        // CONSUME PROJECTION SPINE (Ticket EXEC-11C)
        const view = await getTenantLifecycleView(tenantId);

        // 5. Aggregate COMPREHENSIVE Data in Parallel (Phase 2 - Backend Collapse)
        const [
            tenantDetails,
            ownerDetails,
            members,
            intakeList,
            vectorList,
            roadmapList,
            activityList,
            briefList,
            discoveryNotesList,
            diagnosticDataList
        ] = await Promise.all([
            // Tenant Summary
            db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1),
            // Owner (if exists)
            view.identity.ownerUserId
                ? db.select().from(users).where(eq(users.id, view.identity.ownerUserId)).limit(1)
                : Promise.resolve([]),
            // Team Members
            db.select().from(users).where(eq(users.tenantId, tenantId)).limit(50),
            // Intakes
            db.select().from(intakes).where(eq(intakes.tenantId, tenantId)),
            // Intake Vectors
            db.select().from(intakeVectors).where(eq(intakeVectors.tenantId, tenantId)),
            // Roadmaps
            db.select().from(roadmaps).where(eq(roadmaps.tenantId, tenantId)).orderBy(desc(roadmaps.createdAt)),
            // Activity log
            db.select().from(auditEvents).where(eq(auditEvents.tenantId, tenantId)).orderBy(desc(auditEvents.createdAt)).limit(30),
            // Executive Briefs
            db.select().from(executiveBriefs).where(eq(executiveBriefs.tenantId, tenantId)).orderBy(desc(executiveBriefs.createdAt)).limit(1),
            // Discovery Notes
            db.select().from(discoveryCallNotes).where(eq(discoveryCallNotes.tenantId, tenantId)).orderBy(desc(discoveryCallNotes.createdAt)).limit(1),
            // Diagnostics
            db.select().from(diagnostics).where(eq(diagnostics.tenantId, tenantId)).orderBy(desc(diagnostics.createdAt)).limit(1)
        ]);

        const tenantRow = tenantDetails[0];
        const ownerRow = ownerDetails[0];
        const latestBrief = briefList[0];
        const latestRoadmap = roadmapList[0];
        const lastDiscovery = discoveryNotesList[0];
        const latestDiagRow = diagnosticDataList[0];

        // 6. Aggregate Ticket Status (already handled by projection, but we need counts and manualWorkflow flags)
        // We reuse the projection results from resolveTickets
        const diagnosticStatus = view.tickets;

        // 7. Manual Heuristics for Friction Map (Legacy Compat)
        const allTickets = await db.select().from(sopTickets).where(eq(sopTickets.tenantId, tenantId));
        const manualKeywords = /manual|spreadsheet|hand|copy|paste|email|paper/i;
        const manualWorkCount = allTickets.filter(t => manualKeywords.test(t.title) || manualKeywords.test(t.description)).length;

        // 8. Construct Unified payload
        const unifiedData = {
            tenant: tenantRow,
            owner: ownerRow || null,
            teamMembers: members,
            intakes: intakeList,
            intakeRoles: vectorList,
            roadmaps: roadmapList,
            latestRoadmap: latestRoadmap || null,
            recentActivity: activityList,
            diagnosticStatus: {
                ...diagnosticStatus,
                readyForRoadmap: view.artifacts.diagnostic.status === 'published' && diagnosticStatus.pending === 0 && diagnosticStatus.total > 0
            },
            latestDiagnostic: view.artifacts.diagnostic.exists ? {
                id: latestDiagRow?.id || tenantRow?.lastDiagnosticId || 'unknown',
                status: view.artifacts.diagnostic.status,
                createdAt: latestDiagRow?.createdAt || tenantRow?.createdAt,
                updatedAt: latestDiagRow?.updatedAt || new Date().toISOString(),
                outputs: latestDiagRow ? {
                    overview: latestDiagRow.overview,
                    aiOpportunities: latestDiagRow.aiOpportunities,
                    roadmapSkeleton: latestDiagRow.roadmapSkeleton,
                    discoveryQuestions: latestDiagRow.discoveryQuestions
                } : null
            } : null,
            truthProbe: view, // Use the projection itself as the truth probe
            execBrief: latestBrief || null,
            discoveryNotes: lastDiscovery || null,
            tickets: allTickets, // REQUIRED for DiagnosticModerationSurface
            // ROI Snapshot Data
            snapshot: {
                executionPhase: view.governance.executiveBriefStatus === 'DELIVERED' ? 'EXEC_BRIEF_APPROVED' : (view.lifecycle.intakeWindowState === 'OPEN' ? 'INTAKE_OPEN' : 'INTAKE_CLOSED'),
                executiveBriefStatus: view.governance.executiveBriefStatus,
                intakeWindowState: view.lifecycle.intakeWindowState,
                coverage: {
                    rolesInvited: view.workflow.vectorCount,
                    rolesCompleted: view.workflow.completedIntakeCount,
                    organizationInputPercent: view.workflow.vectorCount > 0
                        ? Math.round((view.workflow.completedIntakeCount / view.workflow.vectorCount) * 100)
                        : 0
                },
                frictionMap: {
                    totalTickets: diagnosticStatus.total,
                    rejectedTickets: diagnosticStatus.rejected,
                    manualWorkflowsIdentified: manualWorkCount,
                    strategicMisalignmentScore: diagnosticStatus.total > 0
                        ? Math.round((diagnosticStatus.rejected / diagnosticStatus.total) * 100)
                        : 0,
                    highPriorityBottlenecks: allTickets.filter(t => t.priority === 'high').length
                },
                capacityROI: {
                    projectedHoursSavedWeekly: allTickets.reduce((sum, t) => sum + (t.status === 'approved' ? (t.timeEstimateHours || 0) : 0), 0),
                    speedToValue: diagnosticStatus.approved > 5 ? 'HIGH' : diagnosticStatus.approved > 0 ? 'MEDIUM' : 'LOW'
                },
                distribution: allTickets.reduce((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + 1 }), {}),
                discovery: lastDiscovery ? { exists: true, ...lastDiscovery } : { exists: false }
            }
        };

        console.log(`[Snapshot] 200 - Unified Snapshot generated for ${tenantId}`);
        return res.status(200).json({
            success: true,
            data: unifiedData
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
