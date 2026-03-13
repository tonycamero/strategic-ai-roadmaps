import { db } from '../../db';
import { sasProposals } from '../../db/schema';
import * as crypto from 'crypto';
import { eq, and } from 'drizzle-orm';

/**
 * Deterministic hash function for proposals.
 * Normalizes text to lowercase, trims whitespace, and collapses multiple spaces.
 */
export function conceptHash(text: string) {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  return crypto
    .createHash("sha1")
    .update(normalized)
    .digest("hex")
    .slice(0, 8);
}

export class SasSynthesisService {
  /**
   * Persist generated proposals with deterministic hashing and deduplication.
   * META-TICKET: Populate concept_hash for SAS proposals
   */
  static async persistProposals(
    tenantId: string,
    sasRunId: string,
    draftItems: any[]
  ) {
    const proposalRows = draftItems.map(item => {
      const hash = conceptHash(item.text);
      
      const sourceAnchors = {
        capabilityId: item.capabilityId || null,
        capabilityNamespace: item.capabilityNamespace || null,
        evidenceRefs: (item.evidenceRefs || []).map((ref: any) => ({
          ...ref,
          sourceType: ref.sourceType || ref.artifact || 'evidence',
        }))
      };

      return {
        tenantId,
        sasRunId,
        proposalType: item.type,
        content: item.text,
        sourceAnchors: sourceAnchors as any,
        agentModel: 'gpt-4o-2024-08-06',
        conceptHash: hash,
      };
    });

    if (proposalRows.length === 0) return 0;

    // Use ON CONFLICT DO NOTHING for atomic deduplication
    // This activates the unique constraint: (tenant_id, sas_run_id, concept_hash)
    await db
      .insert(sasProposals)
      .values(proposalRows)
      .onConflictDoNothing({
        target: [sasProposals.tenantId, sasProposals.sasRunId, sasProposals.conceptHash]
      });

    return proposalRows.length;
  }
}
