import { Request, Response } from 'express';
import { db } from '../db/index';
import { invites, users, tenants, intakeVectors } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateInviteToken, hashPassword, generateToken } from '../utils/auth';
import { sendInviteEmail } from '../utils/email';
import { type AuthRequest } from '../middleware/auth';
import { CreateInviteRequest, AcceptInviteRequest } from '@roadmap/shared';
import { ZodError } from 'zod';
import { onboardingProgressService } from '../services/onboardingProgress.service';

/**
 * Invite Controller
 *
 * SECURITY HARDENING NOTES
 * - Tenant scope for authenticated endpoints derived from req.tenantId (set by requireTenantAccess()).
 * - All invite reads/writes are scoped by tenantId (prevents IDOR / cross-tenant access).
 * - Accept invite is unauthenticated by design; it binds tenantId to invite.tenantId and issues token.
 */

export async function createInvite(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create invites' });
    }

    const { email: rawEmail, role } = CreateInviteRequest.parse(req.body);
    const email = rawEmail.toLowerCase().trim();

    const tenantId = req.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant not resolved' });

    // Check if user already exists globally (email is unique in most systems)
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if invite already exists for this tenant and is pending
    const [existingInvite] = await db
      .select()
      .from(invites)
      .where(and(eq(invites.email, email), eq(invites.tenantId, tenantId)))
      .limit(1);

    if (existingInvite && !existingInvite.accepted) {
      return res.status(400).json({ error: 'Invite already sent' });
    }

    const token = generateInviteToken();

    const [invite] = await db
      .insert(invites)
      .values({
        email,
        role,
        token,
        tenantId,
        accepted: false,
      })
      .returning();

    // Best-effort: owner name for email (do not block if missing)
    const [owner] = await db.select().from(users).where(eq(users.id, req.user.userId)).limit(1);

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${token}`;

    try {
      await sendInviteEmail({
        to: email,
        role,
        inviteLink,
        ownerName: owner?.name ?? 'Your Company',
      });
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // do not fail request
    }

    // 🎯 Onboarding Hook: Mark INVITE_TEAM complete (best-effort)
    try {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
      });

      if (tenant) {
        await onboardingProgressService.markStep(tenant.id, 'INVITE_TEAM', 'completed');
      }
    } catch (error) {
      console.error('Failed to update onboarding progress:', error);
    }

    return res.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      accepted: invite.accepted,
      createdAt: invite.createdAt,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Create invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function acceptInvite(req: Request, res: Response) {
  try {
    const { token, name, password } = AcceptInviteRequest.parse(req.body);

    const [invite] = await db.select().from(invites).where(eq(invites.token, token)).limit(1);

    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.accepted) return res.status(400).json({ error: 'Invite already accepted' });

    // Edge-case: someone registered in the meantime
    const [existingUser] = await db.select().from(users).where(eq(users.email, invite.email)).limit(1);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: invite.email,
        passwordHash,
        name,
        role: invite.role as any, // Drizzle typing limitation
        tenantId: invite.tenantId, // bind from invite (critical)
      })
      .returning();

    await db.update(invites).set({ accepted: true }).where(eq(invites.id, invite.id));

    // 🎯 Sync Intake Vector status (best-effort)
    try {
      await db
        .update(intakeVectors)
        .set({ inviteStatus: 'ACCEPTED', updatedAt: new Date() })
        .where(and(eq(intakeVectors.tenantId, invite.tenantId), eq(intakeVectors.recipientEmail, invite.email)));
    } catch (err) {
      console.error('Failed to sync intake vector status on acceptance:', err);
    }

    const authToken = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role as any,
      isInternal: false,
      tenantId: newUser.tenantId,
    });

    return res.json({
      token: authToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Accept invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getInvites(req: AuthRequest, res: Response) {
  try {
    const userRole: string = req.user?.role || '';
    if (!req.user || (userRole !== 'owner' && userRole !== 'superadmin')) {
      return res.status(403).json({ error: 'Only owners can view invites' });
    }

    const tenantId = req.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant not resolved' });

    const tenantInvites = await db.select().from(invites).where(eq(invites.tenantId, tenantId));
    return res.json({ invites: tenantInvites });
  } catch (error) {
    console.error('Get invites error:', error);
    return res.status(500).json({ error: 'Failed to fetch invites' });
  }
}

export async function resendInvite(req: AuthRequest, res: Response) {
  try {
    const userRole: string = req.user?.role || '';
    if (!req.user || (userRole !== 'owner' && userRole !== 'superadmin')) {
      return res.status(403).json({ error: 'Only owners can resend invites' });
    }

    const { inviteId } = req.params;

    const tenantId = req.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant not resolved' });

    // Scoped fetch prevents IDOR
    const [invite] = await db
      .select()
      .from(invites)
      .where(and(eq(invites.id, inviteId), eq(invites.tenantId, tenantId)))
      .limit(1);

    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.accepted) return res.status(400).json({ error: 'Invite already accepted' });

    const [owner] = await db.select().from(users).where(eq(users.id, req.user.userId)).limit(1);

    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite/${invite.token}`;

    try {
      await sendInviteEmail({
        to: invite.email,
        role: invite.role,
        inviteLink,
        ownerName: owner?.name ?? 'Your Company',
      });
    } catch (emailError) {
      console.error('Failed to resend invite email:', emailError);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.json({ message: 'Invitation resent successfully' });
  } catch (error) {
    console.error('Resend invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function revokeInvite(req: AuthRequest, res: Response) {
  try {
    const userRole: string = req.user?.role || '';
    if (!req.user || (userRole !== 'owner' && userRole !== 'superadmin')) {
      return res.status(403).json({ error: 'Only owners can revoke invites' });
    }

    const { inviteId } = req.params;

    const tenantId = req.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant not resolved' });

    // Scoped fetch prevents IDOR
    const [invite] = await db
      .select()
      .from(invites)
      .where(and(eq(invites.id, inviteId), eq(invites.tenantId, tenantId)))
      .limit(1);

    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.accepted) return res.status(400).json({ error: 'Cannot revoke accepted invite' });

    // Scoped delete prevents IDOR
    await db.delete(invites).where(and(eq(invites.id, inviteId), eq(invites.tenantId, tenantId)));

    return res.json({ message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Revoke invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }

}