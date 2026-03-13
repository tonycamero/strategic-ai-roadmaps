import { db } from '../../db';
import { sasProposals, sasRuns, ticketModerationSessions } from '../../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export interface SasProposalDTO {
  id: string;
  type: string;
  content: string;
  anchors: any;
  created_at: Date;
}

export class TicketModerationService {
  /**
   * Resolve the latest SAS run for a tenant using aggregation to ensure
   * we get the run ID from the most recently created proposals.
   */
  static async getLatestSasRunId(tenantId: string): Promise<string | null> {
    const [latestRun] = await db
      .select({ sasRunId: sasProposals.sasRunId })
      .from(sasProposals)
      .where(eq(sasProposals.tenantId, tenantId))
      .groupBy(sasProposals.sasRunId)
      .orderBy(desc(sql`MAX(${sasProposals.createdAt})`))
      .limit(1);

    return latestRun?.sasRunId || null;
  }

  /**
   * Fetch proposals for a specific SAS run
   */
  static async getProposalsForRun(tenantId: string, runId: string): Promise<SasProposalDTO[]> {
    const results = await db
      .select({
        id: sasProposals.id,
        type: sasProposals.proposalType,
        content: sasProposals.content,
        anchors: sasProposals.sourceAnchors,
        created_at: sasProposals.createdAt
      })
      .from(sasProposals)
      .where(
        and(
          eq(sasProposals.tenantId, tenantId),
          eq(sasProposals.sasRunId, runId)
        )
      )
      .orderBy(sasProposals.createdAt);

    return results as SasProposalDTO[];
  }

  /**
   * Readiness check: Do proposals exist for this tenant?
   */
  static async getProposalCount(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sasProposals)
      .where(eq(sasProposals.tenantId, tenantId));
    
    return Number(result?.count || 0);
  }
}
