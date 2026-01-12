import type { Request } from 'express';

/**
 * User data attached to authenticated requests by auth middleware
 */
export interface AuthUser {
  id: string;
  tenantId: string | null;
  role: string;
  isInternal: boolean;
  email?: string;
  name?: string;
}

/**
 * Express Request with authenticated user
 */
export interface RequestWithUser extends Request {
  user?: AuthUser;
}
