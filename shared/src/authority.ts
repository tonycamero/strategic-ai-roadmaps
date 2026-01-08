import { UserRole } from './types';

/**
 * Foundational Authority Categories for Strategic AI Control Plane.
 * These are implementation-facing categories that govern visibility and gating.
 */
export enum AuthorityCategory {
    /** EXECUTIVE_SPONSOR: Absolute authority. Sees everything. Can trigger irreversible transitions. */
    EXECUTIVE = 'EXECUTIVE_SPONSOR',

    /** DELEGATE_FACILITATOR: Preparatory work only. Structural gating prevents access to Zone 3. */
    DELEGATE = 'DELEGATE_FACILITATOR',

    /** INTERNAL_OPERATOR: Scend internal staff for operational support. Limited authoritative action. */
    OPERATOR = 'INTERNAL_OPERATOR',

    /** SYSTEM_AGENT: Non-human automated agents. Specific restricted execution context. */
    AGENT = 'SYSTEM_AGENT'
}

/**
 * Maps raw UserRoles to AuthorityCategories.
 * This is the source of truth for structural authority enforcement.
 */
export const RoleToAuthorityMap: Record<UserRole, AuthorityCategory> = {
    // Executive Roles
    superadmin: AuthorityCategory.EXECUTIVE,
    exec_sponsor: AuthorityCategory.EXECUTIVE,
    owner: AuthorityCategory.EXECUTIVE,

    // Delegate Roles
    delegate: AuthorityCategory.DELEGATE,
    ops: AuthorityCategory.DELEGATE,
    sales: AuthorityCategory.DELEGATE,
    delivery: AuthorityCategory.DELEGATE,
    staff: AuthorityCategory.DELEGATE,

    // Operator Roles
    operator: AuthorityCategory.OPERATOR,

    // System Roles
    agent: AuthorityCategory.AGENT,
};

/**
 * Helper to check if a role has Executive authority.
 */
export function isExecutiveRole(role: UserRole): boolean {
    return RoleToAuthorityMap[role] === AuthorityCategory.EXECUTIVE;
}

/**
 * Helper to check if a role is a Delegate.
 */
export function isDelegateRole(role: UserRole): boolean {
    return RoleToAuthorityMap[role] === AuthorityCategory.DELEGATE;
}
