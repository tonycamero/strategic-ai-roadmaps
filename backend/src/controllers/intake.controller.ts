import { Response } from 'express';
import { db } from '../db';
import { intakes, users, tenants, intakeVectors } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import { SubmitIntakeRequest } from '@roadmap/shared';
import { ZodError } from 'zod';
import { onboardingProgressService } from '../services/onboardingProgress.service';

export async function submitIntake(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { role, answers } = SubmitIntakeRequest.parse(req.body);

    // Verify user role matches intake role
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Role mismatch' });
    }

    // 🛑 CR-UX-5: Intake Freeze Gate
    const tenantId = (req as any).tenantId;
    if (tenantId) {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { intakeWindowState: true }
      });

      if (tenant?.intakeWindowState === 'CLOSED') {
        return res.status(403).json({
          error: 'Intake window is closed',
          message: 'This intake cycle has been finalized by Executive Authority. No further submissions are accepted.'
        });
      }
    }

    // Check if intake already exists
    const [existing] = await db
      .select()
      .from(intakes)
      .where(eq(intakes.userId, req.user.userId))
      .limit(1);

    if (existing) {
      // Update existing intake
      const [updated] = await db
        .update(intakes)
        .set({
          answers,
          role,
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(intakes.id, existing.id))
        .returning();

      // 🎯 Onboarding Hook: Mark Owner Intake complete (also on update)
      if (role === 'owner') {
        try {
          const tenantId = (req as any).tenantId;
          if (tenantId) {
            await onboardingProgressService.markStep(
              tenantId,
              'OWNER_INTAKE',
              'completed'
            );
          }
        } catch (error) {
          console.error('Failed to update onboarding progress:', error);
        }
      }

      return res.json({ intake: updated });
    }

    // Create new intake
    const [intake] = await db
      .insert(intakes)
      .values({
        userId: req.user.userId,
        role,
        answers,
        tenantId: (req as any).tenantId, // 🔥 Tenant boundary
        status: 'completed',
        completedAt: new Date(),
      })
      .returning();

    // 🎯 Onboarding Hook: Mark Owner Intake complete
    if (role === 'owner') {
      try {
        // Get tenant ID from middleware
        const tenantId = (req as any).tenantId;
        const tenant = tenantId ? await db.query.tenants.findFirst({
          where: eq(tenants.id, tenantId),
        }) : null;

        if (tenant) {
          await onboardingProgressService.markStep(
            tenant.id,
            'OWNER_INTAKE',
            'completed'
          );
        }
      } catch (error) {
        console.error('Failed to update onboarding progress:', error);
        // Don't fail the intake submission if onboarding update fails
      }
    }

    // 🔗 Intake Vector Auto-Link (Contract v1: Fail-closed on ambiguity)
    const currentTenantId = (req as any).tenantId;
    if (currentTenantId && req.user && req.user.role !== 'superadmin') {
      const matchingVectors = await db
        .select()
        .from(intakeVectors)
        .where(
          and(
            eq(intakeVectors.tenantId, currentTenantId),
            eq(intakeVectors.recipientEmail, req.user.email)
          )
        );

<<<<<<< HEAD
        if (tenant) {
          // Check if all three team roles have completed intakes
          const allIntakes = await db
            .select()
            .from(intakes)
            .where(eq(intakes.tenantId, tenantId));

          const hasOps = allIntakes.some(i => i.role === 'ops');
          const hasSales = allIntakes.some(i => i.role === 'sales');
          const hasDelivery = allIntakes.some(i => i.role === 'delivery');

          if (hasOps && hasSales && hasDelivery) {
            await onboardingProgressService.markStep(
              tenant.id,
              'TEAM_INTAKES',
              'completed'
            );
          }
        }
      } catch (error) {
        console.error('Failed to update team intakes onboarding progress:', error);
=======
      // Contract v1: Fail-closed if multiple matches exist
      if (matchingVectors.length > 1) {
        return res.status(409).json({
          error: 'Multiple intake vectors found',
          message: 'Multiple stakeholder definitions exist for this email. Please contact your administrator to resolve this ambiguity before submitting your intake.',
          vectorIds: matchingVectors.map(v => v.id)
        });
>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
      }

      // Link if exactly one match
      if (matchingVectors.length === 1) {
        await db
          .update(intakeVectors)
          .set({
            intakeId: intake.id,
            updatedAt: new Date()
          })
          .where(eq(intakeVectors.id, matchingVectors[0].id));
      }

      // If 0 matches: proceed without linking (no error - user may not be part of vector system)
    }

    // 🎯 Onboarding Hook: Mark Owner Intake complete
    if (role === 'owner' && currentTenantId) {
      await onboardingProgressService.markStep(currentTenantId, 'OWNER_INTAKE', 'COMPLETED');
    }

    return res.json({ intake });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Submit intake error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


export async function getOwnerIntakes(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole: string = req.user.role;
    const isSuperAdmin = req.user.isInternal && userRole === 'superadmin';
    const isOwner = !req.user.isInternal && userRole === 'owner';

    if (!isSuperAdmin && !isOwner) {
      return res.status(403).json({ error: 'Only Owners and Internal Consultants can view all intakes' });
    }

    // Both superadmin and owner see only their own tenant's intakes when viewing dashboard
    // (Superadmin can see all tenants via SuperAdmin panel separately)
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const results = await db
      .select()
      .from(intakes)
      .innerJoin(users, eq(intakes.userId, users.id))
      .where(eq(intakes.tenantId, tenantId)); // 🔥 Multi-tenant isolation

    // Format response to match expected structure
    const formattedIntakes = results.map(row => ({
      id: row.intakes.id,
      userId: row.intakes.userId,
      role: row.intakes.role,
      answers: row.intakes.answers,
      createdAt: row.intakes.createdAt,
      userEmail: row.users.email,
      userName: row.users.name,
    }));

    return res.json({ intakes: formattedIntakes });
  } catch (error) {
    console.error('Get owner intakes error:', error);
    return res.status(500).json({ error: 'Failed to fetch intakes' });
  }
}

export async function getMyIntake(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [intake] = await db
      .select()
      .from(intakes)
      .where(eq(intakes.userId, req.user.userId))
      .limit(1);

    return res.json({ intake: intake || null });
  } catch (error) {
    console.error('Get intake error:', error);
    return res.status(500).json({ error: 'Failed to fetch intake' });
  }
}
