/**
 * Role-Targeted Operational Surfaces - Resolver
 * Maps user metadata (email/role) to the authoritative operational surface.
 */

export interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

import { getSurfaceAssignment, mapSurfaceToRoute } from '../services/surfaceAssignmentService';

export async function resolveRoute(user: User, tenantId: string = 'demo'): Promise<string> {
  console.log('DEBUG: resolveRoute called for:', { email: user.email, role: user.role, tenantId });

  // 1. Explicit Surface Assignment (SA Control) - DB backed
  // We prioritize the assignment if it exists
  try {
    const assignment = await getSurfaceAssignment(user.email, tenantId);
    console.log('DEBUG: DB Assignment:', assignment);
    if (assignment) {
      return mapSurfaceToRoute(assignment);
    }
  } catch (err) {
    console.error('Error resolving custom surface assignment:', err);
  }

  // 2. Pilot Team Static Rules (Development Overrides)
  if (user.email === "jerome@gfbev.com") {
    return "/journey";
  }

  if (user.email === "tre.d@gfbev.com") {
    return "/ops/execution";
  }

  if (user.email === "hootie@gfbev.com") {
    return "/ops/exceptions";
  }

  if (user.email === "kaitlin.g@gfbev.com") {
    return "/ops/coordination";
  }

  // 3. System Defaults
  const normalizedRole = user.role?.toLowerCase();
  console.log('DEBUG: Normalized Role:', normalizedRole);
  
  if (normalizedRole === "superadmin" || normalizedRole === "super_admin") {
    return "/superadmin/firms";
  }

  // Fallback
  return "/dashboard";
}
