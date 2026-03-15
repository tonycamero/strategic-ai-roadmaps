import { db } from '../db/index';
import { userSurfaceAssignments } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get surface assignment for a specific user in a tenant.
 */
export async function getSurfaceAssignment(tenantId: string, email: string) {
  const [result] = await db
    .select({
      surface: userSurfaceAssignments.surface,
    })
    .from(userSurfaceAssignments)
    .where(
      and(
        eq(userSurfaceAssignments.tenantId, tenantId),
        eq(userSurfaceAssignments.userEmail, email)
      )
    )
    .limit(1);

  return result || null;
}

/**
 * List all surface assignments for a tenant.
 */
export async function listSurfaceAssignments(tenantId: string) {
  return await db
    .select({
      userEmail: userSurfaceAssignments.userEmail,
      surface: userSurfaceAssignments.surface,
    })
    .from(userSurfaceAssignments)
    .where(eq(userSurfaceAssignments.tenantId, tenantId));
}

/**
 * Upsert surface assignment for a user in a tenant.
 */
export async function setSurfaceAssignment(tenantId: string, email: string, surface: string) {
  // EXEC-078E: UPSERT logic
  // INSERT INTO user_surface_assignments (tenant_id, user_email, surface)
  // VALUES ($1,$2,$3)
  // ON CONFLICT (tenant_id, user_email)
  // DO UPDATE SET surface = EXCLUDED.surface, updated_at = now()

  await db
    .insert(userSurfaceAssignments)
    .values({
      tenantId,
      userEmail: email,
      surface,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userSurfaceAssignments.tenantId, userSurfaceAssignments.userEmail],
      set: {
        surface,
        updatedAt: new Date(),
      },
    });

  return { ok: true };
}
