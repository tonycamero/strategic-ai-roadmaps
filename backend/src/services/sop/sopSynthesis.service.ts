import { db } from '../../db';
import { sasProposals, sopTickets } from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { resolveLatestRunId } from "../tenantStateAggregation.service";

export class SopSynthesisService {
  /**
   * Transform approved SAS proposals into persistent SOP tickets.
   * META-TICKET: Stage-7 Ticket Synthesis from Moderated Signals
   */
  static async synthesizeTickets(tenantId: string, sasRunId: string) {
    // 0. Run Guard: Block synthesis if not the latest run
    const latestRunId = await resolveLatestRunId(tenantId);
    if (sasRunId !== latestRunId) {
      console.warn("RUN_GUARD_TRIGGERED", {
        tenantId,
        requestedRunId: sasRunId,
        latestRunId
      });
      throw new Error("Synthesis blocked: stale SAS run");
    }

    // 1. Fetch approved proposals for the specific run
    const approvedProposals = await db
      .select()
      .from(sasProposals)
      .where(
        and(
          eq(sasProposals.tenantId, tenantId),
          eq(sasProposals.sasRunId, sasRunId),
          eq(sasProposals.moderationStatus, 'APPROVED')
        )
      );

    if (approvedProposals.length === 0) {
      return [];
    }

    // 2. Map to ticket structure
    const ticketRows = approvedProposals.map((p, idx) => {
      const anchors = p.sourceAnchors as any;
      const capabilityNamespace = anchors?.capabilityNamespace || 'generic';
      
      // Generate a stable ticket ID for the run (e.g., S7-T1)
      const ticketId = `S7-P${p.id.substring(0, 4)}`;
      const ticketKey = `syn:${p.id}`;

      return {
        tenantId,
        proposalId: p.id,
        ticketId,
        ticketKey,
        title: p.content.substring(0, 200),
        description: p.content,
        capabilityNamespace,
        sourceAnchors: p.sourceAnchors,
        status: 'generated',
        moderationStatus: 'pending' // Stage-7 tickets start as pending SOP review
      };
    });

    // 3. Ticket Generation Guard (redundant but safe)
    if (sasRunId !== latestRunId) {
      throw new Error("Ticket generation blocked: stale SAS run");
    }

    const createdTickets = await db
      .insert(sopTickets)
      .values(ticketRows as any)
      .onConflictDoUpdate({
        target: sopTickets.ticketKey,
        set: {
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          capabilityNamespace: sql`excluded.capability_namespace`,
          sourceAnchors: sql`excluded.source_anchors`,
          updatedAt: new Date()
        }
      })
      .returning();

    return createdTickets;
  }

  static async getTickets(tenantId: string) {
    return db
      .select()
      .from(sopTickets)
      .where(eq(sopTickets.tenantId, tenantId))
      .orderBy(desc(sopTickets.createdAt));
  }
}
