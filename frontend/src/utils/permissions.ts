import type { UserRole } from '@roadmap/shared';

const TENANT_ROLES: UserRole[] = ['owner', 'ops', 'sales', 'delivery', 'staff'];

export const canViewTenantDashboard = (role: UserRole): boolean =>
  TENANT_ROLES.includes(role) || role === 'superadmin';

export const canManageTeam = (role: UserRole): boolean =>
  role === 'owner' || role === 'superadmin';

export const isReadOnlyStaff = (role: UserRole): boolean =>
  role === 'staff';

export const canEditIntake = (role: UserRole): boolean =>
  ['owner', 'ops', 'sales', 'delivery'].includes(role);

/**
 * Determines if user should have read-only agent access (observer mode)
 * Observer mode: analysis and suggestions only, no mutative actions
 * Editor mode: full agent capabilities including implementations
 */
export const isAgentObserver = (role: UserRole): boolean => {
  // Staff and team roles are observers
  if (role === 'staff') return true;
  
  // Owner and superadmin are editors with full access
  if (role === 'owner' || role === 'superadmin') return false;
  
  // All other roles (ops, sales, delivery) are observers
  return true;
};
