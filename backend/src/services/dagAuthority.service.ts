import { db } from '../db/index';
import { selectionEnvelopes, selectionEnvelopeItems, sasProposals } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import crypto from 'crypto';
import { DagValidator, ValidationNode, ValidationEdge } from '../lib/dagValidation';

export class DagAuthorityService {
    /**
     * Verifies the cryptographic integrity of a sealed envelope.
     */
    static async verifyEnvelopeHash(envelopeId: string): Promise<boolean> {
        const [envelope] = await db
            .select({ storedHash: selectionEnvelopes.envelopeHash })
            .from(selectionEnvelopes)
            .where(eq(selectionEnvelopes.id, envelopeId))
            .limit(1);

        if (!envelope || !envelope.storedHash) return false;

        // Fetch current items to re-calculate hash
        const currentProposals = await db
            .select({
                proposalId: sasProposals.id,
                content: sasProposals.content,
                type: sasProposals.proposalType
            })
            .from(selectionEnvelopeItems)
            .innerJoin(sasProposals, eq(selectionEnvelopeItems.proposalId, sasProposals.id))
            .where(eq(selectionEnvelopeItems.selectionEnvelopeId, envelopeId))
            .orderBy(asc(sasProposals.id)); // Must match sealing order

        if (!currentProposals.length) return false;

        const serialized = JSON.stringify(currentProposals);
        const calculatedHash = crypto
            .createHash('sha256')
            .update(serialized)
            .digest('hex');

        const isValid = calculatedHash === envelope.storedHash;
        
        if (!isValid) {
            console.error(`[DagAuthority] Hash mismatch for envelope ${envelopeId}. Stored: ${envelope.storedHash.substring(0,8)}, Calculated: ${calculatedHash.substring(0,8)}`);
        }

        return isValid;
    }

    /**
     * Comprehensive validation for a Roadmap DAG.
     */
    static async validateRoadmapDag(envelopeId: string, nodes: ValidationNode[], edges: ValidationEdge[]) {
        // 1. Verify Envelope Integrity first
        const isIntegrityValid = await this.verifyEnvelopeHash(envelopeId);
        if (!isIntegrityValid) {
            return { valid: false, reason: "ENVELOPE_INTEGRITY_VIOLATION: Hash mismatch or invalid envelope" };
        }

        // 2. Fetch allowed proposal IDs in the envelope
        const envelopeItems = await db
            .select({ proposalId: selectionEnvelopeItems.proposalId })
            .from(selectionEnvelopeItems)
            .where(eq(selectionEnvelopeItems.selectionEnvelopeId, envelopeId));
        
        const allowedProposalIds = envelopeItems.map(i => i.proposalId);

        // 3. Delegate to lib/dagValidation
        return DagValidator.validate(nodes, edges, allowedProposalIds);
    }
}
