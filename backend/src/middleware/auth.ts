import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';
import type { UserRole } from '@roadmap/shared';
import { db } from '../db/index';
import { auditEvents, tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthorityCategory } from '@roadmap/shared';

export interface AuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user?: TokenPayload;
  authorityCategory?: AuthorityCategory;
  // normalized tenant scope for downstream controllers/services
  tenantId?: string | null;
}

const TENANT_ROLES: UserRole[] = ['owner', 'ops', 'sales', 'delivery', 'staff', 'exec_sponsor'];

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    console.log('[Auth] Token verified. User:', payload.email, 'tenantId:', payload.tenantId, 'role:', payload.role);

    req.user = payload;
    return next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    return next();
  };
}

/**
 * Enforces tenant scoping and stashes a normalized tenantId on req.tenantId.
 *
 * Rules:
 * - superadmin: may access any tenant; if a route includes :tenantId, we scope to that.
 * - tenant roles: may ONLY access their own tenant; if a route includes :tenantId, it must match.
 * - legacy owner tokens with null tenantId: attempt best-effort resolution by ownerUserId.
 */
export function requireTenantAccess() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.error('[TenantAccess] No user in request');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!TENANT_ROLES.includes(req.user.role as UserRole) && req.user.role !== 'superadmin') {
      console.error('[TenantAccess] Invalid role:', req.user.role);
      return res.status(403).json({ error: 'Not a tenant member' });
    }

    const { userId, tenantId: tokenTenantId, role } = req.user as {
      userId: string;
      tenantId: string | null;
      role: string;
    };

    // 1) Resolve tenantId (prefer token)
    let resolvedTenantId: string | null = tokenTenantId ?? null;

    if (!resolvedTenantId) {
      try {
        // Legacy fallback: owner token without tenantId
        // NOTE: This is intentionally owner-only to prevent weird pivots.
        if (role === 'owner') {
          const [tenant] = await db
            .select({ id: tenants.id })
            .from(tenants)
            .where(eq(tenants.ownerUserId, userId))
            .limit(1);
          if (tenant) resolvedTenantId = tenant.id;
        }
      } catch (err) {
        console.error('[TenantAccess] Failed to resolve tenant:', err);
      }
    }

    if (!resolvedTenantId && role !== 'superadmin') {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }

    // 2) Enforce tenant scope if request carries a tenantId selector
    // (Superadmin can act cross-tenant; everyone else must match their resolved tenant.)
    const paramTenantId =
      (req.params && typeof (req.params as any).tenantId === 'string' && (req.params as any).tenantId) || null;

    const queryTenantId =
      (req.query && typeof (req.query as any).tenantId === 'string' && (req.query as any).tenantId) || null;

    const bodyTenantId =
      (req.body && typeof (req.body as any).tenantId === 'string' && (req.body as any).tenantId) || null;

    const requestedTenantId = paramTenantId || queryTenantId || bodyTenantId;

    if (requestedTenantId && role !== 'superadmin') {
      if (requestedTenantId !== resolvedTenantId) {
        console.error('[TenantAccess] Cross-tenant attempt blocked:', {
          userId,
          role,
          resolvedTenantId,
          requestedTenantId,
          path: req.originalUrl,
          method: req.method,
        });
        return res.status(403).json({ error: 'Cross-tenant access denied' });
      }
    }

    // 3) Stash canonical tenant id for controllers
    (req as any).tenantId = resolvedTenantId;

    // 4) Audit log for TEAM access (non-owner, non-superadmin)
    if (role !== 'owner' && role !== 'superadmin') {
      try {
        await db.insert(auditEvents).values({
          tenantId: resolvedTenantId,
          actorUserId: userId,
          actorRole: role,
          eventType: 'TEAM_TENANT_ACCESS',
          entityType: 'tenant',
          entityId: resolvedTenantId,
          metadata: {
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent') || null,
          },
        });
      } catch (err) {
        console.error('[TenantAccess] Failed to log team tenant access:', err);
        // don't block access on logging failure
      }
    }

    return next();
  };
}

/**
 * @deprecated Use capability profiles instead
 * Kept for backward compatibility during migration
 */
export function requireEditorMode() {
  return requireRole('owner', 'superadmin');

}