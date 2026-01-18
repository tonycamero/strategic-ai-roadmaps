<<<<<<< HEAD
import { Response } from 'express';
import { db } from '../db';
import { intakeVectors, intakes, users, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

/**
 * Create a new intake vector (stakeholder role definition)
 * 
 * DUAL MOUNT POINTS (intentional aliasing for RBAC separation):
 * - POST /api/tenants/:tenantId/intake-vectors (Tenant self-service)
 * - POST /api/superadmin/tenants/:tenantId/intake-vectors (SuperAdmin cross-tenant)
 * 
 * CONTRACT v1 ENFORCEMENT:
 * - perceivedConstraints is MANDATORY
 * - Fails with 403 if intakeWindowState === 'CLOSED'
 */
export async function createIntakeVector(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { tenantId } = req.params;

        // 🛑 CR-UX-5: Intake Freeze Gate
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
            columns: { intakeWindowState: true }
        });

        if (tenant?.intakeWindowState === 'CLOSED') {
            return res.status(403).json({
                error: 'Intake window is closed',
                message: 'This intake cycle has been finalized. No new stakeholders can be defined.'
            });
        }

        const {
            roleLabel,
            roleType,
            perceivedConstraints,
            anticipatedBlindSpots,
            recipientEmail,
            recipientName
        } = req.body;

        // Validate required fields (perceivedConstraints is MANDATORY as per Contract v1)
        if (!roleLabel || !roleType || !perceivedConstraints) {
            return res.status(400).json({ error: 'Missing required fields: roleLabel, roleType, perceivedConstraints' });
        }

        // Create intake vector
        const [vector] = await db
            .insert(intakeVectors)
            .values({
                tenantId,
                roleLabel,
                roleType,
                perceivedConstraints,
                anticipatedBlindSpots: anticipatedBlindSpots || '',
                recipientEmail: recipientEmail || null,
                recipientName: recipientName || null,
                inviteStatus: 'NOT_SENT',
                intakeId: null
            })
            .returning();

        // Derive intake status from linked intake
        const intakeStatus = vector.intakeId ? 'COMPLETED' : 'NOT_STARTED';

        return res.json({
            vector: {
                ...vector,
                intakeStatus
            }
        });
    } catch (error) {
        console.error('Create intake vector error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get all intake vectors for a tenant
 * 
 * DUAL MOUNT POINTS:
 * - GET /api/tenants/:tenantId/intake-vectors
 * - GET /api/superadmin/tenants/:tenantId/intake-vectors
 */
export async function getIntakeVectors(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { tenantId } = req.params;

        // LEFT JOIN intakes to derive intakeStatus deterministically
        const vectors = await db
            .select({
                vector: intakeVectors,
                intake: intakes
            })
            .from(intakeVectors)
            .leftJoin(intakes, eq(intakeVectors.intakeId, intakes.id))
            .where(eq(intakeVectors.tenantId, tenantId))
            .orderBy(intakeVectors.createdAt);

        // Derive intakeStatus from linked intake (NOT stored in DB)
        const enrichedVectors = vectors.map(({ vector, intake }) => {
            let intakeStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';

            if (vector.intakeId && intake) {
                if (intake.status === 'completed') {
                    intakeStatus = 'COMPLETED';
                } else if (intake.status === 'in_progress') {
                    intakeStatus = 'IN_PROGRESS';
                }
            }

            return {
                ...vector,
                intakeStatus
            };
        });

        return res.json({ vectors: enrichedVectors });
    } catch (error) {
        console.error('Get intake vectors error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Update an intake vector
 * 
 * DUAL MOUNT POINTS:
 * - PATCH /api/tenants/intake-vectors/:id
 * - PATCH /api/superadmin/intake-vectors/:id
 * 
 * CONTRACT v1: Fails with 403 if intakeWindowState === 'CLOSED'
 */
export async function updateIntakeVector(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;

        // Get the existing vector to find tenantId
        const [existing] = await db
            .select()
            .from(intakeVectors)
            .where(eq(intakeVectors.id, id))
            .limit(1);

        if (!existing) {
            return res.status(404).json({ error: 'Intake vector not found' });
        }

        // 🛑 CR-UX-5: Intake Freeze Gate
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, existing.tenantId),
            columns: { intakeWindowState: true }
        });

        if (tenant?.intakeWindowState === 'CLOSED') {
            return res.status(403).json({
                error: 'Intake window is closed',
                message: 'Stakeholder definitions are frozen.'
            });
        }

        const {
            roleLabel,
            roleType,
            perceivedConstraints,
            anticipatedBlindSpots,
            recipientEmail,
            recipientName
        } = req.body;

        const [updated] = await db
            .update(intakeVectors)
            .set({
                roleLabel,
                roleType,
                perceivedConstraints,
                anticipatedBlindSpots,
                recipientEmail,
                recipientName,
                updatedAt: new Date()
            })
            .where(eq(intakeVectors.id, id))
            .returning();

        const intakeStatus = updated.intakeId ? 'COMPLETED' : 'NOT_STARTED';

        return res.json({
            vector: {
                ...updated,
                intakeStatus
            }
        });
    } catch (error) {
        console.error('Update intake vector error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Send invite for an intake vector
 * 
 * DUAL MOUNT POINTS:
 * - POST /api/tenants/intake-vectors/:id/send-invite
 * - POST /api/superadmin/intake-vectors/:id/send-invite
 * 
 * CONTRACT v1: Fails with 403 if intakeWindowState === 'CLOSED'
 */
export async function sendIntakeVectorInvite(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;

        // Get the vector
        const [vector] = await db
            .select()
            .from(intakeVectors)
            .where(eq(intakeVectors.id, id))
            .limit(1);

        if (!vector) {
            return res.status(404).json({ error: 'Intake vector not found' });
        }

        // 🛑 CR-UX-5: Intake Freeze Gate
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, vector.tenantId),
            columns: { intakeWindowState: true }
        });

        if (tenant?.intakeWindowState === 'CLOSED') {
            return res.status(403).json({
                error: 'Intake window is closed',
                message: 'Invites are frozen for this cycle.'
            });
        }

        if (!vector.recipientEmail) {
            return res.status(400).json({ error: 'No recipient email specified' });
        }

        // TODO: Implement actual invite sending logic (email, etc.)
        // For now, just update the status

        const [updated] = await db
            .update(intakeVectors)
            .set({
                inviteStatus: 'SENT',
                updatedAt: new Date()
            })
            .where(eq(intakeVectors.id, id))
            .returning();

        const intakeStatus = updated.intakeId ? 'COMPLETED' : 'IN_PROGRESS';

        return res.json({
            vector: {
                ...updated,
                intakeStatus
            }
        });
    } catch (error) {
        console.error('Send intake vector invite error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
=======
import { Response } from 'express';
import { db } from '../db';
import { intakeVectors, intakes, users, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

/**
 * Create a new intake vector (stakeholder role definition)
 * 
 * DUAL MOUNT POINTS (intentional aliasing for RBAC separation):
 * - POST /api/tenants/:tenantId/intake-vectors (Tenant self-service)
 * - POST /api/superadmin/tenants/:tenantId/intake-vectors (SuperAdmin cross-tenant)
 * 
 * CONTRACT v1 ENFORCEMENT:
 * - perceivedConstraints is MANDATORY
 * - Fails with 403 if intakeWindowState === 'CLOSED'
 */
export async function createIntakeVector(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { tenantId } = req.params;

        // 🛑 CR-UX-5: Intake Freeze Gate
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
            columns: { intakeWindowState: true }
        });

        if (tenant?.intakeWindowState === 'CLOSED') {
            return res.status(403).json({
                error: 'Intake window is closed',
                message: 'This intake cycle has been finalized. No new stakeholders can be defined.'
            });
        }

        const {
            roleLabel,
            roleType,
            perceivedConstraints,
            anticipatedBlindSpots,
            recipientEmail,
            recipientName
        } = req.body;

        // Validate required fields (perceivedConstraints is MANDATORY as per Contract v1)
        if (!roleLabel || !roleType || !perceivedConstraints) {
            return res.status(400).json({ error: 'Missing required fields: roleLabel, roleType, perceivedConstraints' });
        }

        // Create intake vector
        const [vector] = await db
            .insert(intakeVectors)
            .values({
                tenantId,
                roleLabel,
                roleType,
                perceivedConstraints,
                anticipatedBlindSpots: anticipatedBlindSpots || '',
                recipientEmail: recipientEmail || null,
                recipientName: recipientName || null,
                inviteStatus: 'NOT_SENT',
                intakeId: null
            })
            .returning();

        // Derive intake status from linked intake
        const intakeStatus = vector.intakeId ? 'COMPLETED' : 'NOT_STARTED';

        return res.json({
            vector: {
                ...vector,
                intakeStatus
            }
        });
    } catch (error) {
        console.error('Create intake vector error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Get all intake vectors for a tenant
 * 
 * DUAL MOUNT POINTS:
 * - GET /api/tenants/:tenantId/intake-vectors
 * - GET /api/superadmin/tenants/:tenantId/intake-vectors
 */
export async function getIntakeVectors(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { tenantId } = req.params;

        // LEFT JOIN intakes to derive intakeStatus deterministically
        const vectors = await db
            .select({
                vector: intakeVectors,
                intake: intakes
            })
            .from(intakeVectors)
            .leftJoin(intakes, eq(intakeVectors.intakeId, intakes.id))
            .where(eq(intakeVectors.tenantId, tenantId))
            .orderBy(intakeVectors.createdAt);

        // Derive intakeStatus from linked intake (NOT stored in DB)
        const enrichedVectors = vectors.map(({ vector, intake }) => {
            let intakeStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';

            if (vector.intakeId && intake) {
                if (intake.status === 'completed') {
                    intakeStatus = 'COMPLETED';
                } else if (intake.status === 'in_progress') {
                    intakeStatus = 'IN_PROGRESS';
                }
            }

            return {
                ...vector,
                intakeStatus
            };
        });

        return res.json({ vectors: enrichedVectors });
    } catch (error) {
        console.error('Get intake vectors error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Update an intake vector
 * 
 * DUAL MOUNT POINTS:
 * - PATCH /api/tenants/intake-vectors/:id
 * - PATCH /api/superadmin/intake-vectors/:id
 * 
 * CONTRACT v1: Fails with 403 if intakeWindowState === 'CLOSED'
 */
export async function updateIntakeVector(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;

        // Get the existing vector to find tenantId
        const [existing] = await db
            .select()
            .from(intakeVectors)
            .where(eq(intakeVectors.id, id))
            .limit(1);

        if (!existing) {
            return res.status(404).json({ error: 'Intake vector not found' });
        }

        // 🛑 CR-UX-5: Intake Freeze Gate
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, existing.tenantId),
            columns: { intakeWindowState: true }
        });

        if (tenant?.intakeWindowState === 'CLOSED') {
            return res.status(403).json({
                error: 'Intake window is closed',
                message: 'Stakeholder definitions are frozen.'
            });
        }

        const {
            roleLabel,
            roleType,
            perceivedConstraints,
            anticipatedBlindSpots,
            recipientEmail,
            recipientName
        } = req.body;

        const [updated] = await db
            .update(intakeVectors)
            .set({
                roleLabel,
                roleType,
                perceivedConstraints,
                anticipatedBlindSpots,
                recipientEmail,
                recipientName,
                updatedAt: new Date()
            })
            .where(eq(intakeVectors.id, id))
            .returning();

        const intakeStatus = updated.intakeId ? 'COMPLETED' : 'NOT_STARTED';

        return res.json({
            vector: {
                ...updated,
                intakeStatus
            }
        });
    } catch (error) {
        console.error('Update intake vector error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Send invite for an intake vector
 * 
 * DUAL MOUNT POINTS:
 * - POST /api/tenants/intake-vectors/:id/send-invite
 * - POST /api/superadmin/intake-vectors/:id/send-invite
 * 
 * CONTRACT v1: Fails with 403 if intakeWindowState === 'CLOSED'
 */
export async function sendIntakeVectorInvite(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { id } = req.params;

        // Get the vector
        const [vector] = await db
            .select()
            .from(intakeVectors)
            .where(eq(intakeVectors.id, id))
            .limit(1);

        if (!vector) {
            return res.status(404).json({ error: 'Intake vector not found' });
        }

        // 🛑 CR-UX-5: Intake Freeze Gate
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, vector.tenantId),
            columns: { intakeWindowState: true }
        });

        if (tenant?.intakeWindowState === 'CLOSED') {
            return res.status(403).json({
                error: 'Intake window is closed',
                message: 'Invites are frozen for this cycle.'
            });
        }

        if (!vector.recipientEmail) {
            return res.status(400).json({ error: 'No recipient email specified' });
        }

        // TODO: Implement actual invite sending logic (email, etc.)
        // For now, just update the status

        const [updated] = await db
            .update(intakeVectors)
            .set({
                inviteStatus: 'SENT',
                updatedAt: new Date()
            })
            .where(eq(intakeVectors.id, id))
            .returning();

        const intakeStatus = updated.intakeId ? 'COMPLETED' : 'IN_PROGRESS';

        return res.json({
            vector: {
                ...updated,
                intakeStatus
            }
        });
    } catch (error) {
        console.error('Send intake vector invite error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
