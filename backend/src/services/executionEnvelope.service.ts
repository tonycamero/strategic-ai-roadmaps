import { db } from '../db/index';
import { selectionEnvelopes } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface ExecutionEnvelope {
    id: string;
    tenantId: string;
    allowedNamespaces: string[];
    allowedAdapters: string[];
    maxComplexity: 'T1' | 'T2' | 'T3';
    rawEnvelope: any;
}

export class ExecutionEnvelopeService {
    /**
     * Load and validate the execution envelope
     */
    static async loadEnvelope(selectionEnvelopeId: string): Promise<ExecutionEnvelope> {
        const [envelope] = await db.select()
            .from(selectionEnvelopes)
            .where(eq(selectionEnvelopes.id, selectionEnvelopeId))
            .limit(1);

        if (!envelope) {
            throw new Error('ENVELOPE_NOT_FOUND');
        }

        // Load tenant Stage-6 constraints (Phase 4 integration)
        const { getStage6ConstraintConfig } = await import('./stage6Constraint.service');
        const constraints = await getStage6ConstraintConfig(envelope.tenantId);

        return {
            id: envelope.id,
            tenantId: envelope.tenantId,
            allowedNamespaces: constraints.allowedNamespaces,
            allowedAdapters: constraints.allowedAdapters || [],
            maxComplexity: constraints.maxComplexityTier as any,
            rawEnvelope: envelope
        };
    }

    /**
   * Validate if an inventory item violates the envelope constraints
   */
    static validateInventoryItem(item: any, envelope: ExecutionEnvelope): void {
        if (!envelope.allowedNamespaces.includes(item.category)) {
            throw new Error(`ENVELOPE_VIOLATION: Namespace ${item.category} not allowed`);
        }

        // Complexity check
        const complexityMap = { 'low': 'T1', 'medium': 'T2', 'high': 'T3' };
        const tierOrder = { 'T1': 1, 'T2': 2, 'T3': 3 };
        const itemTier = (complexityMap[item.complexity] || 'T1') as keyof typeof tierOrder;
        if (tierOrder[itemTier] > tierOrder[envelope.maxComplexity]) {
            throw new Error(`ENVELOPE_VIOLATION: Complexity ${itemTier} exceeds tenant limit ${envelope.maxComplexity}`);
        }
    }
}
