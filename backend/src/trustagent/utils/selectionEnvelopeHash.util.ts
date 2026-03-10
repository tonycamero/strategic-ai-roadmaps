/**
 * Selection Envelope Hash Utility
 * EXEC-TICKET-SELECTION-ENGINE-IMPLEMENTATION-001
 *
 * Shared SHA-256 hash for SelectionEnvelope determinism.
 * Used by SelectionEngine (build) and moderation binding (verify).
 * Mirrors pattern of canonicalFindingsHash.util.ts.
 */
import { createHash } from 'crypto';
import type { ExecutionEnvelope } from '../types/selectionEnvelope';

export interface SelectionHashInput {
    canonicalFindingsHash: string;
    registryVersion: string;
    envelopeVersion: string;
    executionEnvelope: {
        namespaces: string[];
        adapters: string[];
        maxComplexityTier: string;
        customDevAllowed: boolean;
        vertical: string;
    };
    inventoryIds: string[];  // sorted
    adapterIds: string[];    // sorted
    findingIds: string[];    // sorted — full canonical input set
}

/**
 * Compute deterministic selection hash.
 * All arrays are sorted internally — call site order does not affect output.
 * Timestamps are structurally excluded (not in SelectionHashInput type).
 */
export function computeSelectionHash(input: SelectionHashInput): string {
    const normalized: SelectionHashInput = {
        canonicalFindingsHash: input.canonicalFindingsHash,
        registryVersion: input.registryVersion,
        envelopeVersion: input.envelopeVersion,
        executionEnvelope: {
            namespaces: [...input.executionEnvelope.namespaces].sort(),
            adapters: [...input.executionEnvelope.adapters].sort(),
            maxComplexityTier: input.executionEnvelope.maxComplexityTier,
            customDevAllowed: input.executionEnvelope.customDevAllowed,
            vertical: input.executionEnvelope.vertical,
        },
        inventoryIds: [...input.inventoryIds].sort(),
        adapterIds: [...input.adapterIds].sort(),
        findingIds: [...input.findingIds].sort(),
    };
    return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}
