import React from 'react';
import { useSuperAdminAuthority } from '../hooks/useSuperAdminAuthority';
import { AuthorityCategory } from '@roadmap/shared';

interface AuthorityGuardProps {
    /** 
     * The authority category required to render the children.
     * 'executive-only' is a convenience shorthand for strict executive bypass logic.
     */
    requiredCategory: AuthorityCategory | 'executive-only';

    /** 
     * Optional fallback to render if authority check fails.
     * Defaults to null to enforce "Structural Invisibility" (no DOM presence).
     */
    fallback?: React.ReactNode;

    children: React.ReactNode;
}

/**
 * Structural Authority Guard Component.
 * 
 * Enforces UX Principle 6: "The Executive Authority Zone is completely invisible 
 * to delegates (not just disabled, but non-existent in the DOM)."
 */
export function AuthorityGuard({
    requiredCategory,
    fallback = null,
    children
}: AuthorityGuardProps) {
    const { category, isExecutive } = useSuperAdminAuthority();

    let hasAuthority = false;

    if (requiredCategory === 'executive-only') {
        hasAuthority = isExecutive;
    } else {
        // Executives inherently have authority of all sub-categories
        hasAuthority = isExecutive || category === requiredCategory;
    }

    if (!hasAuthority) {
        // Enforce invisibility by rendering the fallback (usually null)
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
