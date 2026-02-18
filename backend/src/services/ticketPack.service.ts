import { db } from '../db/index';
import { and, eq } from 'drizzle-orm';
import {
  ticketPacks,
  ticketInstances,
  type TicketPack,
  type NewTicketPack,
  type TicketInstance,
  type NewTicketInstance,
} from '../db/schema';

export class TicketPackService {
  static async createPack(input: NewTicketPack): Promise<TicketPack> {
    const [row] = await db.insert(ticketPacks).values(input).returning();
    return row;
  }

  static async getPackForRoadmap(tenantId: string, roadmapId: string): Promise<TicketPack | null> {
    const rows = await db
      .select()
      .from(ticketPacks)
      .where(and(eq(ticketPacks.tenantId, tenantId), eq(ticketPacks.roadmapId, roadmapId)))
      .limit(1);
    return rows[0] ?? null;
  }

  static async getPackWithTickets(packId: string): Promise<{
    pack: TicketPack | null;
    tickets: TicketInstance[];
  }> {
    const [pack] = await db
      .select()
      .from(ticketPacks)
      .where(eq(ticketPacks.id, packId))
      .limit(1);

    if (!pack) return { pack: null, tickets: [] };

    const ticketsRows = await db
      .select()
      .from(ticketInstances)
      .where(eq(ticketInstances.ticketPackId, packId));

    return { pack, tickets: ticketsRows };
  }

  static async createTicketInstance(input: NewTicketInstance): Promise<TicketInstance> {
    const [row] = await db.insert(ticketInstances).values(input).returning();
    return row;
  }

  static async updateTicketStatus(params: {
    ticketInstanceId: string;
    status: TicketInstance['status'];
    notes?: string;
  }): Promise<{ ticket: TicketInstance; pack: TicketPack | null }> {
    const now = new Date();

    const [existing] = await db
      .select()
      .from(ticketInstances)
      .where(eq(ticketInstances.id, params.ticketInstanceId))
      .limit(1);

    if (!existing) {
      throw new Error('Ticket instance not found');
    }

    const completedAt =
      params.status === 'done' ? now : existing.completedAt ?? null;
    const startedAt =
      params.status !== 'not_started' && !existing.startedAt ? now : existing.startedAt;

    const [row] = await db
      .update(ticketInstances)
      .set({
        status: params.status,
        notes: params.notes ?? existing.notes,
        startedAt,
        completedAt,
        updatedAt: now,
      })
      .where(eq(ticketInstances.id, params.ticketInstanceId))
      .returning();

    // Auto-recompute pack totals
    const pack = await this.recomputeTotals(existing.ticketPackId);

    return { ticket: row, pack };
  }

  static async recomputeTotals(packId: string): Promise<TicketPack | null> {
    const tickets = await db
      .select()
      .from(ticketInstances)
      .where(eq(ticketInstances.ticketPackId, packId));

    const totals = {
      tickets: tickets.length,
      done: 0,
      in_progress: 0,
      blocked: 0,
      not_started: 0,
    };

    for (const t of tickets) {
      if (t.status === 'done') totals.done++;
      else if (t.status === 'in_progress') totals.in_progress++;
      else if (t.status === 'blocked') totals.blocked++;
      else if (t.status === 'not_started') totals.not_started++;
    }

    const [pack] = await db
      .update(ticketPacks)
      .set({
        totals,
        totalTickets: totals.tickets,
        updatedAt: new Date(),
      })
      .where(eq(ticketPacks.id, packId))
      .returning();

    return pack ?? null;
  }

  /**
   * Compute system-level completion from ticket instances
   * Assumes tickets have metadata indicating which system they belong to
   */
  static computeSystemCompletion(tickets: TicketInstance[]): Record<string, { done: number; total: number; pct: number }> {
    // Group tickets by system (extracted from ticketId prefix like "T1." for System 1)
    const systems: Record<string, { done: number; total: number }> = {};

    for (const ticket of tickets) {
      const match = ticket.ticketId.match(/^T(\d+)\./); // E.g. "T1.3.1" -> system "1"
      const systemId = match ? `System ${match[1]}` : 'Other';

      if (!systems[systemId]) {
        systems[systemId] = { done: 0, total: 0 };
      }

      systems[systemId].total++;
      if (ticket.status === 'done') {
        systems[systemId].done++;
      }
    }

    // Convert to percentages
    const result: Record<string, { done: number; total: number; pct: number }> = {};
    for (const [systemId, counts] of Object.entries(systems)) {
      result[systemId] = {
        ...counts,
        pct: counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0,
      };
    }

    return result;
  }
}
