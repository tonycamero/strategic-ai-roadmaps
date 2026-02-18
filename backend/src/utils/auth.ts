import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { UserRole } from '@roadmap/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

export interface TokenPayload {
  userId: string;
  id?: string; // backward compatibility
  email: string;
  role: UserRole;
  isInternal: boolean;
  tenantId: string | null; // Multi-tenant: tenant key
  // Hardened Impersonation Claims
  act?: { sub: string; email: string }; // Actor (SuperAdmin)
  typ?: 'auth' | 'impersonation';
  jti?: string; // Session ID binding
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload as any, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function generateImpersonationToken(
  targetUser: { id: string; email: string; role: UserRole; isInternal: boolean; tenantId: string | null },
  actorUser: { id: string; email: string },
  sessionId: string
): string {
  const payload: TokenPayload = {
    userId: targetUser.id,
    id: targetUser.id,
    email: targetUser.email,
    role: targetUser.role,
    isInternal: targetUser.isInternal,
    tenantId: targetUser.tenantId,
    // Impersonation Claims
    act: {
      sub: actorUser.id,
      email: actorUser.email
    },
    typ: 'impersonation',
    jti: sessionId
  };

  // Hardened: 15 minute expiry
  return jwt.sign(payload as any, JWT_SECRET, { expiresIn: '15m' as any });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
