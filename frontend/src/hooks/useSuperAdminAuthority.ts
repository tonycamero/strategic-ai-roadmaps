import { useAuth } from '../context/AuthContext';
import { AuthorityCategory, RoleToAuthorityMap } from '@roadmap/shared';

/**
 * Foundational hook for SuperAdmin Role Visibility & Authority Enforcement.
 * 
 * Implements Ticket 2 logic: WHO can see WHAT and WHEN based on 
 * structural authority categories instead of job titles.
 */
export function useSuperAdminAuthority() {
    const { user } = useAuth();

    // Default to DELEGATE if role is missing or unmapped for safety (Fail-Closed)
    const role = user?.role;
    const category = role ? (RoleToAuthorityMap[role] || AuthorityCategory.DELEGATE) : AuthorityCategory.DELEGATE;

    return {
        /** The primary authority category for the current user */
        category,

        /** Boolean flags for render-level visibility checks */
        isExecutive: category === AuthorityCategory.EXECUTIVE,
        isDelegate: category === AuthorityCategory.DELEGATE,
        isOperator: category === AuthorityCategory.OPERATOR,
        isSystem: category === AuthorityCategory.AGENT,

        /** Gating rule: Absolute invisibility for non-executives on specific zones */
        canSeeExecutiveZones: category === AuthorityCategory.EXECUTIVE,

        /** Gating rule: Action trigger accessibility */
        canTriggerFinalization: category === AuthorityCategory.EXECUTIVE,

        /** 
         * Structural Authority Check.
         * Prevents non-executives from triggering authoritative transitions.
         */
        enforceAuthority: (requiredCategory: AuthorityCategory): boolean => {
            // Executive Sponsor bypasses all checks
            if (category === AuthorityCategory.EXECUTIVE) return true;
            return category === requiredCategory;
        }
    };
}
