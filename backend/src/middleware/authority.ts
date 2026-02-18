import { Request, Response, NextFunction } from 'express';
import { AuthorityCategory, RoleToAuthorityMap, hasAuthority } from '@roadmap/shared';
import { AuthRequest } from './auth';

// Augment Express Request type to include authorityCategory
declare global {
    namespace Express {
        interface Request {
            authorityCategory?: AuthorityCategory;
        }
    }
}

/**
 * Derive and attach authority category to request.
 * Call this AFTER authenticate middleware.
 * 
 * Phase 1.2: No JWT changes - derive category at runtime from role.
 */
export function deriveAuthority(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user?.role) {
        req.authorityCategory = undefined;
        return next();
    }

    req.authorityCategory = RoleToAuthorityMap[req.user.role];
    next();
}

/**
 * Require specific authority category or higher.
 * Implements hierarchical authority checking.
 * 
 * Phase 1.3: Core middleware for authority enforcement.
 */
export function requireAuthority(required: AuthorityCategory) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const actual = req.authorityCategory;
        if (!actual) {
            return res.status(403).json({ error: 'Invalid authority category' });
        }

        if (!hasAuthority(actual, required)) {
            return res.status(403).json({
                error: 'Insufficient authority',
                required,
                actual,
            });
        }

        next();
    };
}

/**
 * Sugar: require Executive authority
 * Used for: exec brief, diagnostic synthesis, roadmap finalization, snapshots
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
