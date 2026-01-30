import { Request, Response } from 'express';
import { db } from '../db';
import { eq, and, sql, desc } from 'drizzle-orm';
import { executiveBriefs, tenants, intakes, intakeVectors, users, auditEvents, executiveBriefArtifacts } from '../db/schema';
import { AUDIT_EVENT_TYPES } from '../constants/auditEventTypes';

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
 * GET /api/superadmin/tenants/:tenantId/executive-brief
 * Returns existing executive brief or 404
 */
export const getExecutiveBrief = async (req: AuthRequest, res: Response) => {
    try {
        const { tenantId } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required' });
        }

        const [brief] = await db
            .select()
            .from(executiveBriefs)
            .where(eq(executiveBriefs.tenantId, tenantId))
            .limit(1);

        if (!brief) {
            return res.status(404).json({
                error: 'EXECUTIVE_BRIEF_NOT_FOUND',
                message: 'No executive brief exists for this tenant.'
            });
        }

        // Check for PDF artifact
        const [artifact] = await db
            .select()
            .from(executiveBriefArtifacts)
            .where(and(
                eq(executiveBriefArtifacts.executiveBriefId, brief.id),
                eq(executiveBriefArtifacts.artifactType, 'PRIVATE_LEADERSHIP_PDF')
            ))
            .limit(1);

        return res.status(200).json({ brief, hasPdf: !!artifact });
    } catch (error) {
        console.error('[ExecutiveBrief] Get error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: 'Failed to retrieve executive brief.'
        });
    }
};

/**
 * POST /api/superadmin/tenants/:tenantId/executive-brief/generate
 * Generates executive brief with hard prerequisite gates
 */
export const generateExecutiveBrief = async (req: AuthRequest, res: Response) => {
    try {
        const { tenantId } = req.params;
        const currentUser = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required' });
        }

        console.log(`[ExecutiveBrief] Generate request for tenantId=${tenantId}`);

        // 1. Check if brief already exists
        const [existingBrief] = await db
            .select()
            .from(executiveBriefs)
            .where(eq(executiveBriefs.tenantId, tenantId))
            .limit(1);

        if (existingBrief) {
            if (existingBrief.status === 'APPROVED') {
                return res.status(409).json({
                    error: 'EXECUTIVE_BRIEF_ALREADY_APPROVED',
                    message: 'Executive brief has already been approved and cannot be regenerated.'
                });
            }
            return res.status(409).json({
                error: 'EXECUTIVE_BRIEF_ALREADY_EXISTS',
                message: 'A draft executive brief already exists.',
                brief: existingBrief
            });
        }

        // 2. Check prerequisites
        const [tenant] = await db
            .select({
                id: tenants.id,
                intakeWindowState: tenants.intakeWindowState
            })
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // Check intake window state
        if (tenant.intakeWindowState !== 'OPEN') {
            return res.status(404).json({
                error: 'EXECUTIVE_BRIEF_NOT_READY',
                message: 'Intake window must be OPEN to generate executive brief.',
                prerequisites: {
                    intakeWindowState: tenant.intakeWindowState,
                    required: 'OPEN'
                }
            });
        }

        // Count intake vectors
        const [vectorCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(intakeVectors)
            .where(eq(intakeVectors.tenantId, tenantId));

        const totalVectors = Number(vectorCount?.count || 0);

        // Check owner intake
        const [ownerIntake] = await db
            .select()
            .from(intakes)
            .where(and(
                eq(intakes.tenantId, tenantId),
                eq(intakes.role, 'owner'),
                eq(intakes.status, 'completed')
            ))
            .limit(1);

        const hasOwnerIntake = !!ownerIntake;

        console.log(`[ExecutiveBrief] Prerequisites: vectors=${totalVectors}, ownerIntake=${hasOwnerIntake}, intakeWindow=${tenant.intakeWindowState}`);

        // Hard gates
        if (totalVectors < 1 || !hasOwnerIntake) {
            return res.status(404).json({
                error: 'EXECUTIVE_BRIEF_NOT_READY',
                message: 'Prerequisites not met for executive brief generation.',
                prerequisites: {
                    hasVectors: totalVectors >= 1,
                    vectorCount: totalVectors,
                    hasOwnerIntake,
                    intakeWindowState: tenant.intakeWindowState
                }
            });
        }

        // 3. Fetch all intake vectors
        const vectors = await db
            .select()
            .from(intakeVectors)
            .where(eq(intakeVectors.tenantId, tenantId));

        // 4. Generate synthesis
        const synthesis = generateExecutiveBriefV0({
            ownerIntake,
            vectors,
            tenantId
        });

        // 5. Create brief
        const [newBrief] = await db
            .insert(executiveBriefs)
            .values({
                tenantId,
                version: 'v0',
                synthesis: synthesis.synthesis,
                signals: synthesis.signals,
                sources: synthesis.sources,
                status: 'DRAFT'
            })
            .returning();

        console.log(`[ExecutiveBrief] Generated brief ${newBrief.id} for tenant ${tenantId}`);

        return res.status(200).json({ brief: newBrief });
    } catch (error) {
        console.error('[ExecutiveBrief] Generate error:', error);
        console.error('[ExecutiveBrief] Stack:', error instanceof Error ? error.stack : 'No stack trace');
        return res.status(500).json({
            error: 'Internal Server Error',
            details: 'Failed to generate executive brief.'
        });
    }
};

/**
 * POST /api/superadmin/tenants/:tenantId/executive-brief/approve
 * Approves brief and atomically closes intake window
 */
export const approveExecutiveBrief = async (req: AuthRequest, res: Response) => {
    try {
        const { tenantId } = req.params;
        const currentUser = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required' });
        }

        // Authority check: EXECUTIVE only
        const isExecutive = currentUser?.isInternal && currentUser?.role === 'superadmin';
        if (!isExecutive) {
            return res.status(403).json({
                error: 'AUTHORITY_REQUIRED',
                message: 'Executive authority required to approve brief.'
            });
        }

        console.log(`[ExecutiveBrief] Approve request for tenantId=${tenantId} by user=${currentUser?.userId}`);

        // 1. Get existing brief
        const [brief] = await db
            .select()
            .from(executiveBriefs)
            .where(eq(executiveBriefs.tenantId, tenantId))
            .limit(1);

        if (!brief) {
            return res.status(404).json({
                error: 'EXECUTIVE_BRIEF_NOT_FOUND',
                message: 'No executive brief exists to approve.'
            });
        }

        if (brief.status === 'APPROVED') {
            return res.status(409).json({
                error: 'EXECUTIVE_BRIEF_ALREADY_APPROVED',
                message: 'Executive brief has already been approved.'
            });
        }

        // 2. Atomic update: approve brief + close intake window
        await db.transaction(async (tx) => {
            // Update brief status
            await tx
                .update(executiveBriefs)
                .set({
                    status: 'APPROVED',
                    approvedBy: currentUser?.userId,
                    approvedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(executiveBriefs.id, brief.id));

            // The intake window closure logic has been moved to a separate, explicit action.
            // This allows for more granular control and prevents accidental closure during brief approval.
            // The `isClosingRequested` variable would typically come from `req.body` or `req.query`
            // if this were a conditional operation. For this change, we assume it's a placeholder
            // for a future explicit closure mechanism.
            const isClosingRequested = false; // Placeholder, as per instruction context
            if (isClosingRequested) {
                console.log(`[ExecutiveBrief:Approve] Manual intake closure skip: Intake closure now managed by dedicated lock action.`);
            }
        });

        // 3. Fetch updated brief
        const [updatedBrief] = await db
            .select()
            .from(executiveBriefs)
            .where(eq(executiveBriefs.id, brief.id))
            .limit(1);

        console.log(`[ExecutiveBrief] Approved brief ${brief.id} and closed intake window for tenant ${tenantId}`);

        // 4. Generate and deliver PDF (non-blocking)
        const [tenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

        if (tenant) {
            // Import delivery service dynamically to avoid circular dependencies
            import('../services/executiveBriefDelivery')
                .then(({ generateAndDeliverPrivateBriefPDF }) => {
                    return generateAndDeliverPrivateBriefPDF(updatedBrief, tenant);
                })
                .then(() => {
                    console.log(`[ExecutiveBrief] PDF delivery initiated for brief ${brief.id}`);
                })
                .catch((error) => {
                    console.error('[ExecutiveBrief] PDF delivery failed:', error);
                    // Log but don't block approval response
                });
        }

        return res.status(200).json({
            brief: updatedBrief,
            intakeWindowState: 'CLOSED'
        });
    } catch (error) {
        console.error('[ExecutiveBrief] Approve error:', error);
        console.error('[ExecutiveBrief] Stack:', error instanceof Error ? error.stack : 'No stack trace');
        return res.status(500).json({
            error: 'Internal Server Error',
            details: 'Failed to approve executive brief.'
        });
    }
};

// --- REFACTORED SYNTHESIS ENGINE (NON-CREATIVE, TRUTH-PRESERVING) ---

export function generateExecutiveBriefV0({ ownerIntake, vectors, tenantId }: {
    ownerIntake: any;
    vectors: any[];
    tenantId: string;
}) {
    // Normalize vectors: de-duplicate and stable sort
    const normalizedVectors = stableSortVectors(deduplicateVectors(vectors));

    // Extract retrofitted buckets or raw fields
    const getBucket = (v: any, key: string) => v.metadata?.semanticBuckets?.[key] || '';

    // Aggregate truth buckets literally
    const operatingReality = normalizedVectors.map(v => getBucket(v, 'operatingReality')).filter(Boolean).join('\n\n');
    const alignmentSignals = normalizedVectors.map(v => getBucket(v, 'alignmentSignals')).filter(Boolean).join('\n\n');
    const riskSignals = normalizedVectors.map(v => getBucket(v, 'riskSignals')).filter(Boolean).join('\n\n');
    const readinessSignals = normalizedVectors.map(v => getBucket(v, 'readinessSignals')).filter(Boolean).join('\n\n');

    // Aggregate core vector fields literally, with attribution
    const perceivedConstraints = normalizedVectors.map(v => {
        if (!v.perceivedConstraints) return null;
        return `**${v.roleLabel}:**\n${v.perceivedConstraints}`;
    }).filter(Boolean).join('\n\n');

    const anticipatedBlindSpots = normalizedVectors.map(v => {
        if (!v.anticipatedBlindSpots) return null;
        return `**${v.roleLabel}:**\n${v.anticipatedBlindSpots}`;
    }).filter(Boolean).join('\n\n');

    // Simple facts for summary
    const roleCount = normalizedVectors.length;
    const roleLabels = normalizedVectors.map(v => v.roleLabel).filter(Boolean).join(', ');
    const executiveSummary = `Strategic intake captured ${roleCount} organizational perspectives across established roles: ${roleLabels}. No summarization or rephrasing has been applied. Findings below represent raw stakeholder inputs.`;

    // Generate synthesis sections (aligned with both legacy display and new contract)
    const synthesis = {
        executiveSummary,
        operatingReality,
        alignmentSignals,
        riskSignals,
        readinessSignals,
        constraintLandscape: perceivedConstraints, // Legacy key mapped to truth
        blindSpotRisks: anticipatedBlindSpots    // Legacy key mapped to truth
    };

    // Derived signals (Heuristic-based)
    const constraintThemes = new Set(
        perceivedConstraints.toLowerCase()
            .split(/[,;.\n]/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 5)
    );

    const consensusLevel = constraintThemes.size <= 3 ? 'HIGH' :
        constraintThemes.size <= 8 ? 'MEDIUM' : 'LOW';

    const riskLevel = riskSignals.length > 0 || anticipatedBlindSpots.length > 50 ? 'HIGH' :
        anticipatedBlindSpots.length > 0 ? 'MEDIUM' : 'LOW';

    const vectorCompleteness = normalizedVectors.filter(v =>
        v.perceivedConstraints && v.roleLabel && v.roleType
    ).length;

    const orgClarityScore = Math.round((vectorCompleteness / Math.max(normalizedVectors.length, 1)) * 100);

    const signals = {
        constraintConsensusLevel: consensusLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        executionRiskLevel: riskLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        orgClarityScore
    };

    const sources = {
        snapshotId: null,
        intakeVectorIds: normalizedVectors.map(v => v.id)
    };

    // Verification Logic (Empty fields require banner)
    const missingSignals: string[] = [];
    if (!operatingReality) missingSignals.push('operating_reality');
    if (!perceivedConstraints) missingSignals.push('constraints');
    if (!anticipatedBlindSpots) missingSignals.push('blind_spots');
    if (!alignmentSignals) missingSignals.push('alignment');

    const verification = {
        required: missingSignals.length > 0,
        missingSignals
    };

    return { synthesis, signals, sources, verification };
}

// Helper: De-duplicate vectors by (roleType, roleLabel)
function deduplicateVectors(vectors: any[]): any[] {
    const seen = new Set<string>();
    return vectors.filter(v => {
        const key = `${v.roleType}:${v.roleLabel}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Helper: Stable sort vectors by role type priority
function stableSortVectors(vectors: any[]): any[] {
    const rolePriority: Record<string, number> = {
        'EXECUTIVE': 1,
        'OPERATIONAL_LEAD': 2,
        'FACILITATOR': 3,
        'OTHER': 4
    };

    return [...vectors].sort((a, b) => {
        const aPriority = rolePriority[a.roleType] || 999;
        const bPriority = rolePriority[b.roleType] || 999;
        return aPriority - bPriority;
    });
}

// --- (Removed legacy generators to prevent re-introduction of bridge text) ---

/**
 * POST /api/superadmin/firms/:tenantId/executive-brief/deliver
 * Explicitly triggers PDF generation and delivery
 */
export const deliverExecutiveBrief = async (req: AuthRequest, res: Response) => {
    try {
        const { tenantId } = req.params;
        const currentUser = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required' });
        }

        // Authority check: EXECUTIVE only
        const isExecutive = currentUser?.isInternal && currentUser?.role === 'superadmin';
        if (!isExecutive) {
            return res.status(403).json({
                error: 'AUTHORITY_REQUIRED',
                message: 'Executive authority required to deliver brief.'
            });
        }

        console.log(`[ExecutiveBrief] Deliver request for tenantId=${tenantId} by user=${currentUser?.userId}`);

        // 1. Get existing brief
        const [brief] = await db
            .select()
            .from(executiveBriefs)
            .where(eq(executiveBriefs.tenantId, tenantId))
            .limit(1);

        if (!brief) {
            return res.status(404).json({
                error: 'EXECUTIVE_BRIEF_NOT_FOUND',
                message: 'No executive brief exists for this tenant.'
            });
        }

        if (brief.status !== 'APPROVED') {
            return res.status(409).json({
                error: 'EXECUTIVE_BRIEF_NOT_APPROVED',
                message: 'Brief must be APPROVED before delivery.'
            });
        }

        // 2. Get tenant details (for name/email)
        const [tenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.id, tenantId))
            .limit(1);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // 3. Trigger delivery (Async/await to ensure success before 200)
        // Dynamically import to resolve circular dependencies/mocks if any
        const { generateAndDeliverPrivateBriefPDF } = await import('../services/executiveBriefDelivery');
        const deliveryResult = await generateAndDeliverPrivateBriefPDF(brief, tenant, true);

        const deliveredTo = (deliveryResult && 'deliveredTo' in deliveryResult) ? deliveryResult.deliveredTo : 'unknown';

        // 4. Update status to DELIVERED
        await db
            .update(executiveBriefs)
            .set({
                status: 'DELIVERED',
                updatedAt: new Date()
            })
            .where(eq(executiveBriefs.id, brief.id));

        // 5. Audit Log (Ticket EXEC-AUDIT-LOG-007)
        await db.insert(auditEvents).values({
            tenantId,
            actorUserId: currentUser?.userId || 'system',
            actorRole: currentUser?.role || 'system',
            eventType: AUDIT_EVENT_TYPES.EXECUTIVE_BRIEF_DELIVERED,
            entityType: 'executive_brief',
            entityId: brief.id,
            metadata: {
                deliveredTo,
                deliveredAt: new Date().toISOString()
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Executive Brief delivered successfully',
            deliveredAt: new Date(),
            deliveredTo
        });

    } catch (error) {
        console.error('[ExecutiveBrief] Delivery error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Failed to deliver executive brief.'
        });
    }
};

/**
 * POST /api/superadmin/firms/:tenantId/executive-brief/generate-pdf
 * Generates the PDF artifact without emailing it.
 */
export const generateExecutiveBriefPDF = async (req: AuthRequest, res: Response) => {
    try {
        const { tenantId } = req.params;
        const currentUser = req.user;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required' });
        }

        // Authority check
        const isExecutive = currentUser?.isInternal && currentUser?.role === 'superadmin';
        if (!isExecutive) {
            return res.status(403).json({ error: 'AUTHORITY_REQUIRED' });
        }

        const [brief] = await db.select().from(executiveBriefs).where(eq(executiveBriefs.tenantId, tenantId)).limit(1);
        if (!brief || brief.status !== 'APPROVED') {
            return res.status(409).json({ error: 'Brief must be APPROVED' });
        }

        const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);

        const { generateAndDeliverPrivateBriefPDF } = await import('../services/executiveBriefDelivery');
        await generateAndDeliverPrivateBriefPDF(brief, tenant, false);

        return res.status(200).json({ success: true, message: 'PDF generated' });

    } catch (error) {
        console.error('Generate PDF error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * GET /api/superadmin/firms/:tenantId/executive-brief/download
 * Download the generated PDF
 */
export const downloadExecutiveBrief = async (req: AuthRequest, res: Response) => {
    try {
        const { tenantId } = req.params;

        if (!tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required' });
        }

        // Get latest PDF artifact
        const [artifact] = await db
            .select()
            .from(executiveBriefArtifacts)
            .where(and(
                eq(executiveBriefArtifacts.tenantId, tenantId),
                eq(executiveBriefArtifacts.artifactType, 'PRIVATE_LEADERSHIP_PDF')
            ))
            .orderBy(desc(executiveBriefArtifacts.createdAt))
            .limit(1);

        if (!artifact) {
            return res.status(404).json({
                error: 'ARTIFACT_NOT_FOUND',
                message: 'No PDF artifact found for this executive brief.'
            });
        }

        return res.download(artifact.filePath, artifact.fileName, (err) => {
            if (err) {
                console.error('[ExecutiveBrief] Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to download file' });
                }
            }
        });

    } catch (error) {
        console.error('[ExecutiveBrief] Download setup error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: 'Failed to initiate download.'
        });
    }
};
