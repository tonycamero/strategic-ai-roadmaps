import type { Response, NextFunction } from 'express';
import { AuthorityCategory, RoleToAuthorityMap, hasAuthority } from '@roadmap/shared';
import type { AuthRequest } from './auth';

/**
 * Authority middleware
 *
 * - deriveAuthority MUST run after authenticate (so req.user exists).
 * - downstream guards use req.authorityCategory (derived from role).
 *
 * NOTE: We deliberately do NOT “default allow” if role is unknown.
 * Unknown role -> no authorityCategory -> 403 on any protected route.
 */
export function deriveAuthority(req: AuthRequest, _res: Response, next: NextFunction) {
  const role = req.user?.role;

  if (!role) {
    req.authorityCategory = undefined;
    return next();
  }

  // Map role → authority category (centralized in @roadmap/shared)
  // If the role is unrecognized, we set undefined and let guards fail closed.
  req.authorityCategory = (RoleToAuthorityMap as Record<string, AuthorityCategory | undefined>)[role];

  return next();
}

/**
 * Require a specific authority category (or higher).
 * Uses hasAuthority() for hierarchy comparisons.
 */
export function requireAuthority(required: AuthorityCategory) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const actual = req.authorityCategory;

    if (!actual) {
      return res.status(403).json({
        error: 'Invalid authority category',
        required,
        actual: actual ?? null,
      });
    }

    if (!hasAuthority(actual, required)) {
      return res.status(403).json({
        error: 'Insufficient authority',
        required,
        actual,
      });
    }

    return next();
  };
}

/**
 * Sugar: require Executive authority
 * Used for: exec brief, diagnostic synthesis, roadmap finalization, snapshots, superadmin assistant query
 */
export function requireExecutive() {
  return requireAuthority(AuthorityCategory.EXECUTIVE);
}

/**
 * Sugar: require Delegate or higher
 * Used for: ticket moderation, readiness signals
 */
export function requireDelegateOrHigher() {
  return requireAuthority(AuthorityCategory.DELEGATE);

}