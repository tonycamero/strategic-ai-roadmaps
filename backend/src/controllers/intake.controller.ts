import { Response } from 'express';
import { db } from '../db/index';
import { intakes, users, tenants, intakeVectors } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import { SubmitIntakeRequest } from '@roadmap/shared';
import { ZodError } from 'zod';
import { onboardingProgressService } from '../services/onboardingProgress.service';
import { getTenantLifecycleView } from '../services/tenantStateAggregation.service';

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

    // CONSUME PROJECTION SPINE (Ticket EXEC-11C)
    const tenantId = (req as any).tenantId;
    if (tenantId) {
      const view = await getTenantLifecycleView(tenantId);
      if (view.lifecycle.intakeWindowState === 'CLOSED') {
        return res.status(403).json({
          error: 'Intake window is closed',
          message: 'This intake cycle has been finalized by Executive Authority. No further submissions are accepted.'
        });
      }
    }

    // Check if intake already exists (scoped to tenant + role to avoid cross-tenant collisions)
    const requestTenantId = tenantId as string;
    if (!requestTenantId) {
      return res.status(400).json({ error: 'Missing tenant context' });
    }



    const [existing] = await db
      .select()
      .from(intakes)
      .where(
        and(
          eq(intakes.userId, req.user.userId),
          eq(intakes.tenantId, tenantId),
          eq(intakes.role, role)
        )
      )
      .limit(1);

    if (existing) {
      // Resolve PENDING feedback on resubmit
      const existingFeedback = (existing.coachingFeedback as any) || {};
      let updatedFeedback = { ...existingFeedback };
      let feedbackModified = false;

      Object.keys(updatedFeedback).forEach(key => {
        const item = updatedFeedback[key];
        if (item.isFlagged || (item.requests && item.requests.some((r: any) => r.status === 'PENDING'))) {
          item.isFlagged = false;
          if (item.requests) {
            item.requests.forEach((r: any) => {
              if (r.status === 'PENDING') {
                r.status = 'RESPONDED';
                r.respondedAt = new Date().toISOString();
                r.response = (answers as any)[key];
                feedbackModified = true;
              }
            });
          }
          feedbackModified = true;
        }
      });

      await db
        .update(intakes)
        .set({
          answers,
          role,
          status: 'completed',
          completedAt: new Date(),
          coachingFeedback: feedbackModified ? updatedFeedback : existing.coachingFeedback
        })
        .where(
          and(
            eq(intakes.id, existing.id),
            eq(intakes.tenantId, tenantId) // extra guard
          )
        );

      // 🎯 Onboarding Hook: Mark Owner Intake complete (also on update)
      if (role === 'owner') {
        try {
          // ... whatever you do here (markStep / etc)
        } catch (e) {
          // log but don't fail the request
        }
      }

      return res.json({ ok: true });
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

    // 🎯 Onboarding Hook: Check if all team intakes are complete
    if (['ops', 'sales', 'delivery'].includes(role)) {
      try {
        const tenantId = (req as any).tenantId;
        const tenant = tenantId ? await db.query.tenants.findFirst({
          where: eq(tenants.id, tenantId),
        }) : null;

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
      }
    }

    const resultIntake = intake || (existing ? { ...existing, answers, role, status: 'completed', completedAt: new Date() } : null);

    // 🎯 Onboarding Hook: Link back to Intake Vector (for status sync)
    try {
      const userEmail = req.user.email;
      const tId = (req as any).tenantId;

      if (role === 'owner') {
        if (!tId) {
          return res.status(500).json({ error: 'Missing tenantId' });
        }

        const ownerVectors = await db
          .select()
          .from(intakeVectors)
          .where(and(eq(intakeVectors.tenantId, tId), eq(intakeVectors.roleLabel, 'Tenant Owner')));

        if (ownerVectors.length === 0) {
          return res.status(500).json({ error: 'OWNER_VECTOR_MISSING' });
        }
        if (ownerVectors.length > 1) {
          return res.status(500).json({ error: 'OWNER_VECTOR_DUPLICATE' });
        }

        const updateResult = await db
          .update(intakeVectors)
          .set({ intakeId: resultIntake?.id })
          .where(and(eq(intakeVectors.tenantId, tId), eq(intakeVectors.roleLabel, 'Tenant Owner')))
          .returning();

        if (updateResult.length === 0) {
          return res.status(500).json({ error: 'OWNER_VECTOR_MISSING' });
        }
        if (updateResult.length > 1) {
          return res.status(500).json({ error: 'OWNER_VECTOR_DUPLICATE' });
        }
      } else {
        if (tId && userEmail && resultIntake) {
          await db
            .update(intakeVectors)
            .set({ intakeId: resultIntake.id })
            .where(and(
              eq(intakeVectors.tenantId, tId),
              eq(intakeVectors.recipientEmail, userEmail)
            ));
        }
      }
    } catch (error) {
      console.error('Failed to link intake to vector:', error);
      if (role === 'owner') {
        return res.status(500).json({ error: 'FAILED_TO_LINK_OWNER_VECTOR' });
      }
    }

    return res.json({ intake: resultIntake });
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
