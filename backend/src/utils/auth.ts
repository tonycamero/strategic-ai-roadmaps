<<<<<<< HEAD
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { UserRole } from '@roadmap/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

export interface TokenPayload {
  userId: string;
<<<<<<< HEAD
  id?: string; // backward compatibility
=======
  id: string; // Alias for userId to satisfy legacy code
>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
  email: string;
  role: UserRole;
  isInternal: boolean;
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
=======
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { UserRole } from '@roadmap/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

export interface TokenPayload {
  userId: string;
  id: string; // Alias for userId to satisfy legacy code
  email: string;
  role: UserRole;
  isInternal: boolean;
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
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
