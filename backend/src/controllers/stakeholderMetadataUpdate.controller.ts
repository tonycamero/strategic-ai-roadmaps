import { Response } from 'express';
import { db } from '../db';
import { intakeVectors, intakes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/superadmin/tenants/:tenantId/update-stakeholder-metadata
 * 
 * Updates existing intake_vectors to add recipient name/email from linked users
 * EXECUTIVE ONLY - data repair operation
 */
export async function updateStakeholderMetadata(req: AuthRequest, res: Response) {
    try {
        // Executive authority required
        if (!req.user?.isInternal || req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Executive authority required' });
        }

        const { tenantId } = req.params;

        console.log(`[Update] Starting stakeholder metadata update for tenant ${tenantId}`);

        // Get all vectors for this tenant that have linked intakes but no recipient info
        const vectors = await db
            .select({
                vector: intakeVectors,
                intake: intakes
            })
            .from(intakeVectors)
            .leftJoin(intakes, eq(intakeVectors.intakeId, intakes.id))
            .where(eq(intakeVectors.tenantId, tenantId));

        console.log(`[Update] Found ${vectors.length} vectors to check`);

        const updated: any[] = [];
        for (const { vector, intake } of vectors) {
            // Skip if already has recipient info or no linked intake
            if ((vector.recipientName && vector.recipientEmail) || !intake) {
                continue;
            }

            // Fetch user data
            if (intake.userId) {
                const user = await db.query.users.findFirst({
                    where: (users, { eq }) => eq(users.id, intake.userId),
                    columns: { name: true, email: true }
                });

                if (user) {
                    await db
                        .update(intakeVectors)
                        .set({
                            recipientName: user.name,
                            recipientEmail: user.email,
                            updatedAt: new Date()
                        })
                        .where(eq(intakeVectors.id, vector.id));

                    updated.push({
                        vectorId: vector.id,
                        roleLabel: vector.roleLabel,
                        recipientName: user.name,
                        recipientEmail: user.email
                    });

                    console.log(`[Update] Updated ${vector.roleLabel} with ${user.name} (${user.email})`);
                }
            }
        }

        console.log(`[Update] Complete: updated ${updated.length} vectors`);

        return res.json({
            message: 'Stakeholder metadata update complete',
            updated: updated.length,
            details: updated
        });

    } catch (error) {
        console.error('[Update] Error:', error);
        return res.status(500).json({ error: 'Update failed' });
    }
}
