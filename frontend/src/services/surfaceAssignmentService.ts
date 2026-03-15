import { api } from '../lib/api';

/**
 * EXEC-078E: Surface Assignment System (DB-BACKED)
 * Manages which operational surface a stakeholder lands on at login.
 * Persisted in the database.
 */

export type OperationalSurface = 'STRATEGIC' | 'EXECUTION' | 'EXCEPTIONS' | 'COORDINATION' | 'DASHBOARD';

export function mapSurfaceToRoute(surface: OperationalSurface | string): string {
  switch (surface) {
    case 'STRATEGIC':
      return '/journey';
    case 'EXECUTION':
      return '/ops/execution';
    case 'EXCEPTIONS':
      return '/ops/exceptions';
    case 'COORDINATION':
      return '/ops/coordination';
    case 'DASHBOARD':
    default:
      return '/dashboard';
  }
}

/**
 * Get surface assignment from DB.
 */
export async function getSurfaceAssignment(email: string, tenantId: string): Promise<OperationalSurface | null> {
  try {
    const response = await api.getSurfaceAssignment(tenantId, email);
    return (response.assignment?.surface as OperationalSurface) || null;
  } catch (error) {
    console.error('Failed to get surface assignment from DB:', error);
    return null;
  }
}

/**
 * Set surface assignment in DB.
 */
export async function setSurfaceAssignment(email: string, tenantId: string, surface: OperationalSurface): Promise<void> {
  try {
    await api.setSurfaceAssignment(tenantId, email, surface);
  } catch (error) {
    console.error('Failed to set surface assignment in DB:', error);
    throw error;
  }
}

/**
 * List all surface assignments for a tenant as a map of email -> surface.
 */
export async function listSurfaceAssignments(tenantId: string): Promise<Record<string, OperationalSurface>> {
  try {
    const response = await api.listSurfaceAssignments(tenantId);
    const map: Record<string, OperationalSurface> = {};
    response.assignments.forEach(a => {
      map[a.userEmail] = a.surface as OperationalSurface;
    });
    return map;
  } catch (error) {
    console.error('Failed to list surface assignments from DB:', error);
    return {};
  }
}
