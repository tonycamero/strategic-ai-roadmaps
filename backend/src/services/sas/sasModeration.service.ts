import { db } from '../../db';
import { sasProposals } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class SasModerationService {
  /**
   * Approve a SAS proposal, making it eligible for Stage-7 synthesis.
   */
  static async approveProposal(proposalId: string) {
    const [updated] = await db
      .update(sasProposals)
      .set({ moderationStatus: 'APPROVED' })
      .where(eq(sasProposals.id, proposalId))
      .returning();
    
    return updated;
  }

  /**
   * Reject a SAS proposal, removing it from the synthesis path.
   */
  static async rejectProposal(proposalId: string) {
    const [updated] = await db
      .update(sasProposals)
      .set({ moderationStatus: 'REJECTED' })
      .where(eq(sasProposals.id, proposalId))
      .returning();
    
    return updated;
  }
}
