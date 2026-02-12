import { Response } from 'express';
import { db } from '../db/index.ts';
import { intakeVectors, intakes, users, tenants, invites } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import { generateInviteToken } from '../utils/auth';
import * as emailService from '../services/email.service';

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

        // 1. Fetch vector + tenant
        const [vector] = await db
            .select()
            .from(intakeVectors)
            .where(eq(intakeVectors.id, id))
            .limit(1);

        if (!vector) {
            return res.status(404).json({ error: 'Intake vector not found' });
        }

        const [tenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.id, vector.tenantId))
            .limit(1);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant context lost' });
        }

        // 🛑 CR-UX-5: Intake Freeze Gate
        if (tenant.intakeWindowState === 'CLOSED') {
            return res.status(403).json({
                error: 'Intake window is closed',
                message: 'Invites are frozen for this cycle.'
            });
        }

        if (!vector.recipientEmail) {
            return res.status(400).json({ error: 'No recipient email specified' });
        }

        // 2. Deterministic Invite Retrieval/Creation
        const role = mapRoleTypeToUserRole(vector.roleType);

        // Find existing pending invite for this email+tenant
        let [existingInvite] = await db
            .select()
            .from(invites)
            .where(and(
                eq(invites.email, vector.recipientEmail),
                eq(invites.tenantId, tenant.id)
            ))
            .limit(1);

        if (existingInvite?.accepted) {
            // Role Sync Logic: If user already exists but role is wrong (e.g. they were promoted to Executive)
            // Fix their role in the users table so they get the right intake/dashboard
            try {
                const targetRole = role;
                const [existingUser] = await db
                    .select()
                    .from(users)
                    .where(and(
                        eq(users.email, vector.recipientEmail),
                        eq(users.tenantId, tenant.id)
                    ))
                    .limit(1);

                if (existingUser && existingUser.role !== targetRole) {
                    await db
                        .update(users)
                        .set({ role: targetRole })
                        .where(eq(users.id, existingUser.id));
                    console.log(`[RoleSync] Upgraded ${vector.recipientEmail} to ${targetRole}`);
                }

                // Also ensure the vector status shows ACCEPTED
                const [updated] = await db
                    .update(intakeVectors)
                    .set({
                        inviteStatus: 'ACCEPTED',
                        updatedAt: new Date()
                    })
                    .where(eq(intakeVectors.id, id))
                    .returning();

                // Build enriched vector (left join logic equivalent)
                const [intake] = await db
                    .select()
                    .from(intakes)
                    .where(eq(intakes.id, updated.intakeId || ''))
                    .limit(1);

                const intakeStatus = (updated.intakeId && intake) ? 'COMPLETED' : 'NOT_STARTED';

                return res.json({
                    ok: true,
                    message: "Stakeholder already accepted. Role synced to latest definition.",
                    vector: {
                        ...updated,
                        intakeStatus
                    }
                });
            } catch (syncError) {
                console.error('[RoleSync] Failed to sync existing user role:', syncError);
                return res.status(400).json({ error: 'Stakeholder has already accepted an invite' });
            }
        }

        let inviteToken = existingInvite?.token;
        if (!inviteToken) {
            inviteToken = generateInviteToken();
            const [newInvite] = await db
                .insert(invites)
                .values({
                    email: vector.recipientEmail,
                    role,
                    token: inviteToken,
                    tenantId: tenant.id,
                    accepted: false,
                })
                .returning();
            existingInvite = newInvite;
        }

        // 3. Dispatch via Resend
        const [ownerUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, tenant.ownerUserId || ''))
            .limit(1);

        const inviterName = ownerUser?.name || 'Your Team Lead';
        const emailDomain = vector.recipientEmail.split('@')[1];
        const redactedTo = `${vector.recipientEmail.slice(0, 2)}***@${emailDomain}`;

        try {
            const result = await emailService.sendInviteEmail(
                vector.recipientEmail,
                inviteToken,
                inviterName,
                tenant.name,
                vector.roleLabel
            );

            // 4. Update Status + Audit Log
            const [updated] = await db
                .update(intakeVectors)
                .set({
                    inviteStatus: 'SENT',
                    updatedAt: new Date()
                })
                .where(eq(intakeVectors.id, id))
                .returning();

            console.log(`[Email] Dispatch successful: tenant=${tenant.id} vector=${vector.id} domain=${emailDomain} msgId=${result?.id}`);

            // Determine intake status (same derivation as getIntakeVectors)
            // Since we just sent the invite, it's either COMPLETED (if linked) or NOT_STARTED
            const intakeStatus = updated.intakeId ? 'COMPLETED' : 'NOT_STARTED';

            return res.json({
                ok: true,
                messageId: result?.id,
                to: redactedTo,
                vector: {
                    ...updated,
                    intakeStatus
                }
            });
        } catch (dispatchError: any) {
            console.error(`[Email] Dispatch FAILED: tenant=${tenant.id} vector=${vector.id} domain=${emailDomain} error=${dispatchError.message}`);
            return res.status(502).json({
                error: "EMAIL_DISPATCH_FAILED",
                provider: "resend",
                details: dispatchError.message
            });
        }
    } catch (error) {
        console.error('Send intake vector invite error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Helper to map Stakeholder Vector roleType to core UI UserRole
 */
function mapRoleTypeToUserRole(roleType: string): any {
    switch (roleType) {
        case 'SALES_LEAD': return 'sales';
        case 'DELIVERY_LEAD': return 'delivery';
        case 'EXECUTIVE': return 'exec_sponsor';
        case 'FACILITATOR': return 'ops';
        case 'OPERATIONAL_LEAD': return 'ops';
        default: return 'ops';
    }
}
