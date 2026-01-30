import { Response } from 'express';
import { db } from '../db';
import { intakeVectors, intakes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /api/superadmin/tenants/:tenantId/repair-stakeholders
 * 
 * Backfills intake_vectors from existing intakes for legacy data
 * EXECUTIVE ONLY - data repair operation
 */
export async function repairStakeholdersForTenant(req: AuthRequest, res: Response) {
    try {
        // Executive authority required
        if (!req.user?.isInternal || req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Executive authority required' });
        }

        const { tenantId } = req.params;

        console.log(`[Repair] Starting stakeholder repair for tenant ${tenantId}`);

        // 1. Check existing vectors
        const existingVectors = await db
            .select()
            .from(intakeVectors)
            .where(eq(intakeVectors.tenantId, tenantId));

        console.log(`[Repair] Found ${existingVectors.length} existing vectors`);

        // 2. Get all intakes
        const allIntakes = await db
            .select()
            .from(intakes)
            .where(eq(intakes.tenantId, tenantId));

        console.log(`[Repair] Found ${allIntakes.length} intakes`);

        if (allIntakes.length === 0) {
            return res.json({
                message: 'No intakes to migrate',
                created: 0,
                total: existingVectors.length
            });
        }

        // 3. Create vectors for unmapped intakes
        const linkedIntakeIds = new Set(existingVectors.map(v => v.intakeId).filter(Boolean));
        const unmappedIntakes = allIntakes.filter(intake => !linkedIntakeIds.has(intake.id));

        console.log(`[Repair] Creating vectors for ${unmappedIntakes.length} unmapped intakes`);

        const created: any[] = [];
        for (const intake of unmappedIntakes) {
            // Derive role label
            const roleLabel = intake.role === 'owner' ? 'Business Owner' :
                intake.role === 'operations' ? 'Operations Lead' :
                    intake.role === 'sales' ? 'Sales Lead' :
                        intake.role === 'delivery' ? 'Delivery Lead' :
                            intake.role.charAt(0).toUpperCase() + intake.role.slice(1);

            // Derive role type
            const roleType = intake.role === 'owner' ? 'EXECUTIVE' : 'OPERATIONAL_LEAD';

            // Extract from answers JSON
            const answers = intake.answers as any || {};
            const perceivedConstraints = answers.perceivedConstraints ||
                answers.constraints ||
                answers.challenges ||
                'Migrated from legacy intake - constraints not captured in structured format';

            const anticipatedBlindSpots = answers.anticipatedBlindSpots ||
                answers.blindSpots ||
                answers.risks ||
                '';

            // Fetch user data for recipient info
            let recipientName = null;
            let recipientEmail = null;

            if (intake.userId) {
                const user = await db.query.users.findFirst({
                    where: (users, { eq }) => eq(users.id, intake.userId),
                    columns: { name: true, email: true }
                });

                if (user) {
                    recipientName = user.name;
                    recipientEmail = user.email;
                }
            }

            try {
                const [vector] = await db
                    .insert(intakeVectors)
                    .values({
                        tenantId,
                        roleLabel,
                        roleType,
                        perceivedConstraints,
                        anticipatedBlindSpots,
                        recipientEmail,
                        recipientName,
                        inviteStatus: 'NOT_SENT',
                        intakeId: intake.id,
                        metadata: {
                            sourceTag: 'LEGACY_INTAKE',
                            confidence: 0.8
                        }
                    })
                    .returning();

                created.push({ roleLabel, vectorId: vector.id, intakeId: intake.id, recipientName, recipientEmail });
                console.log(`[Repair] Created vector for ${roleLabel} (${recipientName || 'unknown'})`);
            } catch (error) {
                console.error(`[Repair] Failed to create vector for ${roleLabel}:`, error);
            }
        }

        console.log(`[Repair] Complete: created ${created.length} vectors`);

        return res.json({
            message: 'Stakeholder repair complete',
            created: created.length,
            total: existingVectors.length + created.length,
            details: created
        });

    } catch (error) {
        console.error('[Repair] Error:', error);
        return res.status(500).json({ error: 'Repair failed' });
    }
}
