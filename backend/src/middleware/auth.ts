import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';
import type { UserRole } from '@roadmap/shared';
import { db } from '../db';
import { auditEvents, tenants } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

const TENANT_ROLES: UserRole[] = ['owner', 'ops', 'sales', 'delivery', 'staff'];

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
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

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

    const { userId, tenantId, role } = req.user as {
      userId: string;
      tenantId: string | null;
      role: string;
    };

    console.log('[TenantAccess] User:', userId, 'tenantId from token:', tenantId, 'role:', role);

    // Resolve tenantId directly from token when present
    let resolvedTenantId: string | null = tenantId ?? null;

    if (!resolvedTenantId) {
      try {
        // Fallback: fetch by ownerUserId match (legacy tokens); best-effort
        const [tenant] = await db
          .select({ id: tenants.id })
          .from(tenants)
          .where(eq(tenants.ownerUserId, userId))
          .limit(1);
        if (tenant) {
          resolvedTenantId = tenant.id;
        }
      } catch (err) {
        console.error('Failed to resolve tenant for access logging:', err);
      }
    }

    // Stash on request for later use in controllers
    (req as any).tenantId = resolvedTenantId;

    // Additional audit logging for TEAM access (non-owner, non-superadmin)
    if (role !== 'owner' && role !== 'superadmin') {
      try {
        await db.insert(auditEvents).values({
          tenantId: resolvedTenantId,
          actorUserId: userId,
          actorRole: role,
          eventType: 'TEAM_TENANT_ACCESS',
          entityType: 'tenant',
          entityId: tenantId,
          metadata: {
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('user-agent') || null,
          },
        });
      } catch (err) {
        console.error('Failed to log team tenant access:', err);
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
