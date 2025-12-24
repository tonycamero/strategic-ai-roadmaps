import { Request, Response } from 'express';
import { db } from '../db';
import { invites, users, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateInviteToken, hashPassword, generateToken } from '../utils/auth';
import { sendInviteEmail } from '../utils/email';
import { AuthRequest } from '../middleware/auth';
import { CreateInviteRequest, AcceptInviteRequest } from '@roadmap/shared';
import { ZodError } from 'zod';
import { onboardingProgressService } from '../services/onboardingProgress.service';

export async function createInvite(req: AuthRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can create invites' });
    }

    const { email, role } = CreateInviteRequest.parse(req.body);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if invite already exists and is pending
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
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

    // Get owner name for email
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    // Send invite email
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
      // Don't fail the whole request if email fails
      // In production, you might want to queue this for retry
    }

    // 🎯 Onboarding Hook: Mark INVITE_TEAM complete
    try {
      const tenant = tenantId ? await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
      }) : null;
      
      if (tenant) {
        await onboardingProgressService.markStep(
          tenant.id,
          'INVITE_TEAM',
          'COMPLETED'
        );
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

    // Find invite
    const [invite] = await db
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.accepted) {
      return res.status(400).json({ error: 'Invite already accepted' });
    }

    // Check if user already exists (edge case - someone registered in the meantime)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user account
    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email: invite.email,
        passwordHash,
        name,
        role: invite.role as any, // Drizzle type inference limitation with $type<UserRole>()
        tenantId: invite.tenantId, // 🔥 Tenant scoping: inherit from invite
      })
      .returning();

    // Mark invite as accepted
    await db
      .update(invites)
      .set({ accepted: true })
      .where(eq(invites.id, invite.id));

    const authToken = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
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

    // Both superadmin and owner see only their own tenant's invites when viewing dashboard
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const ownerInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.tenantId, tenantId));

    return res.json({ invites: ownerInvites });
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

    // Find invite and verify ownership
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const [invite] = await db
      .select()
      .from(invites)
      .where(and(eq(invites.id, inviteId), eq(invites.tenantId, tenantId)))
      .limit(1);

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.accepted) {
      return res.status(400).json({ error: 'Invite already accepted' });
    }

    // Get owner name for email
    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId))
      .limit(1);

    // Resend invite email
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

    // Find invite and verify ownership
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const [invite] = await db
      .select()
      .from(invites)
      .where(and(eq(invites.id, inviteId), eq(invites.tenantId, tenantId)))
      .limit(1);

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.accepted) {
      return res.status(400).json({ error: 'Cannot revoke accepted invite' });
    }

    // Delete the invite
    await db
      .delete(invites)
      .where(eq(invites.id, inviteId));

    return res.json({ message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Revoke invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
