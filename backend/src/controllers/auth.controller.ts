import { Request, Response } from 'express';
import { db } from '../db/index.ts';
import { users, tenants } from '../db/schema.ts';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.ts';
import { LoginRequest, RegisterRequest } from '@roadmap/shared';
import { ZodError } from 'zod';
import { sendPasswordResetEmail } from '../services/email.service.ts';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = LoginRequest.parse(req.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await comparePassword(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[Auth] Login successful for:', user.email, 'tenantId:', user.tenantId);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      isInternal: user.isInternal,
      tenantId: user.tenantId || null,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, company, industry } = RegisterRequest.parse(req.body);

    // Check if user exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create owner user first (tenantId will be set after tenant row is created)
    const passwordHash = await hashPassword(password);

    // Generate UUID for the new user
    const userId = crypto.randomUUID();

    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        email,
        passwordHash,
        name,
        role: 'owner',
      })
      .returning();

    // Create tenant record with company info
    // TODO: Allow SuperAdmin to create cohorts and assign firms to them
    // For now, all new signups default to Eugene Q1 2026
    const [tenant] = await db
      .insert(tenants)
      .values({
        ownerUserId: newUser.id,
        name: company,
        segment: industry,
        cohortLabel: 'Eugene Q1 2026', // Default cohort for now
        status: 'prospect',
        discoveryComplete: false,
      })
      .returning();

    // Update user with tenantId
    await db.update(users).set({ tenantId: tenant.id }).where(eq(users.id, newUser.id));

    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      isInternal: newUser.isInternal,
      tenantId: tenant.id,
    });

    return res.json({
      token,
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
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * Request password reset - generates token and stores it
 * Always returns success to avoid leaking user existence
 */
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    // If user exists, generate and store reset token
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db
        .update(users)
        .set({
          resetToken,
          resetTokenExpiry,
        })
        .where(eq(users.id, user.id));

      console.log(`[Auth] Password reset requested for: ${email}`);

      // Send password reset email via Resend
      try {
        await sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error('[Auth] Failed to send password reset email:', emailError);
        // Don't throw - we don't want to leak whether email exists
      }

      const response: any = {
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      };

      // DEV ONLY: Include token for testing without email
      if (process.env.NODE_ENV === 'development') {
        response.resetToken = resetToken;
        response.resetLink = `/reset-password/${resetToken}`;
      }

      return res.json(response);
    }

    // Always return success even if user doesn't exist
    return res.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Validate reset token - check if token exists and not expired
 */
export async function validateResetToken(req: Request, res: Response) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token))
      .limit(1);

    if (!user || !user.resetTokenExpiry) {
      return res.json({ valid: false, error: 'Invalid token' });
    }

    // Check if token is expired
    if (new Date() > user.resetTokenExpiry) {
      return res.json({ valid: false, error: 'Token has expired' });
    }

    return res.json({ valid: true, email: user.email });
  } catch (error) {
    console.error('Validate reset token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Reset password - update password with valid token
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Find user with valid token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token))
      .limit(1);

    if (!user || !user.resetTokenExpiry) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Check if token is expired
    if (new Date() > user.resetTokenExpiry) {
      return res.status(400).json({ error: 'Token has expired' });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(users.id, user.id));

    console.log(`[Auth] Password reset successful for: ${user.email}`);

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
