import { db } from '../../db';
import { sasProposals } from '../../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export interface SasSignalDTO {
  id: string;
  type: string;
  content: string;
  anchors: any;
  created_at: Date;
}

export class SasSignalsService {
  /**
   * Fetch Stage-6 SAS signals for a tenant
   * This is a READ-ONLY projection
   * 
   * META-TICKET: Ensure UI resolves latest SAS run deterministically
   */
  static async getSasSignals(tenantId: string): Promise<SasSignalDTO[]> {
    // 1. Resolve latest run ID from proposals
    const [latestRun] = await db
      .select({ sasRunId: sasProposals.sasRunId })
      .from(sasProposals)
      .where(eq(sasProposals.tenantId, tenantId))
      .groupBy(sasProposals.sasRunId)
      .orderBy(desc(sql`MAX(${sasProposals.createdAt})`))
      .limit(1);

    if (!latestRun) return [];

    // 2. Load proposals for that specific run
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
          eq(sasProposals.sasRunId, latestRun.sasRunId)
        )
      )
      .orderBy(sasProposals.createdAt);

    return results as SasSignalDTO[];
  }
}
