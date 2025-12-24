import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { UserRole } from '@roadmap/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string | null; // Multi-tenant: tenant key
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
