import { sql, eq } from 'drizzle-orm';
import { sopTickets } from '../../db/schema';
import { invalidateProjection } from '../projectionCache.service';

/**
 * Updates the execution status of a specific SOP ticket.
 * CYCLE-2: Execution Status Lifecycle
 */
export async function updateTicketStatus(db: any, ticketId: string, status: string) {
  const transitions: Record<string, string[]> = {
    OPEN: ["IN_PROGRESS", "BLOCKED"],
    IN_PROGRESS: ["BLOCKED", "COMPLETE"],
    BLOCKED: ["IN_PROGRESS"],
    COMPLETE: []
  };

  const ticket = await db.execute(sql`
    SELECT execution_status, tenant_id
    FROM sop_tickets
    WHERE id = ${ticketId}
  `);

  if (!ticket.rows?.[0]) {
    throw new Error("Ticket not found");
  }

  const current = ticket.rows[0].execution_status;
  const tenantId = ticket.rows[0].tenant_id;

  // Allow same-status update (idempotency)
  if (current === status) return;

  const allowedTransitions = transitions[current] || [];

  if (!allowedTransitions.includes(status)) {
    throw new Error(`Invalid status transition: ${current} → ${status}`);
  }

  await db.execute(sql`
    UPDATE sop_tickets
    SET execution_status = ${status},
        updated_at = NOW()
    WHERE id = ${ticketId}
  `);

  invalidateProjection(`tenant:lifecycle:${tenantId}`);
}
