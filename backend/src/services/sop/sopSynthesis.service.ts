import { db } from '../../db';
import { sasProposals, sopTickets } from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { resolveLatestRunId } from "../tenantStateAggregation.service";
import { invalidateProjection } from '../projectionCache.service';

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
      throw new Error("PIPELINE_STATE_INVALID: 0 approved signals found for synthesis.");
    }

    // 2. Map to ticket structure
    const ticketRows = approvedProposals.map((p, idx) => {
      const anchors = p.sourceAnchors as any;
      const capabilityNamespace = anchors?.capabilityNamespace || 'generic';
      
      // Generate a stable ticket ID for the run (e.g., S7-T1)
      const ticketId = `S7-P${p.id.substring(0, 4)}`;
      const ticketKey = `syn:${p.id}`;

      // PROBLEM 1 FIX: Build title with correct prefix and reference content
      let titlePrefix = '';
      switch (p.proposalType) {
        case 'FrictionPoint': titlePrefix = 'Investigate: '; break;
        case 'Goal': titlePrefix = 'Build Capability: '; break;
        case 'Constraint': titlePrefix = 'Verify Constraint: '; break;
      }

      const fullTitle = `${titlePrefix}${p.content}`;

      return {
        tenantId,
        proposalId: p.id,
        ticketId,
        ticketKey,
        title: fullTitle.substring(0, 255),
        description: p.content,
        capabilityNamespace,
        sourceAnchors: p.sourceAnchors,
        sasRunId,
        status: 'generated',
        moderationStatus: 'pending', // Stage-7 tickets start as pending SOP review
        executionStatus: 'OPEN'
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
      
    // PROBLEM 2: Implementation Snapshot Write
    const artifactState = {
      runId: sasRunId,
      findings: approvedProposals,
      tickets: createdTickets,
      generatedAt: new Date().toISOString()
    };

    try {
      // Ensure table exists (idempotent)
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS artifact_state (
          id integer PRIMARY KEY,
          jsonb_pretty jsonb
        )
      `);

      // Update or Insert Stage 6 snapshot
      await db.execute(sql`
        INSERT INTO artifact_state (id, jsonb_pretty)
        VALUES (1, ${JSON.stringify(artifactState)}::jsonb)
        ON CONFLICT (id) DO UPDATE
        SET jsonb_pretty = EXCLUDED.jsonb_pretty
      `);
      console.log("[SopSynthesis] artifact_state snapshot persisted.");
    } catch (snapshotErr) {
      console.error("[SopSynthesis] Failed to persist artifact_state snapshot:", snapshotErr);
      // Non-blocking error
    }
      
    invalidateProjection(`tenant:lifecycle:${tenantId}`);

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
