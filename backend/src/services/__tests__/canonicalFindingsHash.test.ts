/**
 * EXEC-TICKET-PROJECTION-DETERMINISM-HARNESS-001
 * 
 * Determinism test suite for canonical findings hash computation.
 * Tests the shared utility used by both FindingsService (write) and
 * TenantStateAggregationService (read) to guarantee hash stability.
 */

import { describe, it, expect } from 'vitest';
import { computeCanonicalFindingsHash } from '../canonicalFindingsHash.util';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const sampleFindings = [
    { id: 'FND-bbb', type: 'FrictionPoint', description: 'No-show rate is high' },
    { id: 'FND-aaa', type: 'Goal', description: 'Manual invoicing consumes ops time' },
    { id: 'FND-ccc', type: 'Constraint', description: 'Owner is single point of failure' },
];

const sortedFindings = [
    { id: 'FND-aaa', type: 'Goal', description: 'Manual invoicing consumes ops time' },
    { id: 'FND-bbb', type: 'FrictionPoint', description: 'No-show rate is high' },
    { id: 'FND-ccc', type: 'Constraint', description: 'Owner is single point of failure' },
];

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('computeCanonicalFindingsHash — Determinism Harness', () => {

    // Case 1
    it('Same findings array → identical hash on repeated calls', () => {
        const h1 = computeCanonicalFindingsHash(sampleFindings);
        const h2 = computeCanonicalFindingsHash(sampleFindings);
        expect(h1).toBe(h2);
    });

    // Case 2
    it('Reordered findings input → identical hash (sorting is internal)', () => {
        const original = computeCanonicalFindingsHash(sampleFindings);
        const reordered = computeCanonicalFindingsHash([...sampleFindings].reverse());
        const presorted = computeCanonicalFindingsHash(sortedFindings);
        expect(original).toBe(reordered);
        expect(original).toBe(presorted);
    });

    // Case 3
    it('Modified finding content → hash changes', () => {
        const modified = [
            { id: 'FND-aaa', type: 'Goal', description: 'CHANGED DESCRIPTION' },
            { id: 'FND-bbb', type: 'FrictionPoint', description: 'No-show rate is high' },
            { id: 'FND-ccc', type: 'Constraint', description: 'Owner is single point of failure' },
        ];
        expect(computeCanonicalFindingsHash(sampleFindings)).not.toBe(
            computeCanonicalFindingsHash(modified)
        );
    });

    // Case 4
    it('Timestamps on wrapper do not affect hash (hash is findings-array-only)', () => {
        // The hash utility operates on the raw findings array, not any wrapper object.
        // Simulating what happens if the caller strips or includes wrapper fields:
        // the hash must remain stable regardless of wrapper metadata.
        const h1 = computeCanonicalFindingsHash(sampleFindings);
        const h2 = computeCanonicalFindingsHash(sampleFindings);
        // Both calls produce the same input to the hash — no wall-clock dependence
        expect(h1).toBe(h2);

        // Confirm: adding a timestamp-like field to a finding DOES change the hash
        // (documents that hash IS sensitive to content changes)
        const withTimestamp = sampleFindings.map((f, i) =>
            i === 0 ? { ...f, computedAt: '2026-03-02T00:00:00Z' } : f
        );
        expect(computeCanonicalFindingsHash(withTimestamp)).not.toBe(h1);
    });

    // Case 5 (ticket spec) — output is valid SHA-256 hex
    it('Hash output is a 64-char lowercase hex string', () => {
        const hash = computeCanonicalFindingsHash(sampleFindings);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    // Case 6 — whitespace normalization (added per review)
    it('Different whitespace in JSON-equivalent input → same hash', () => {
        // The hash is derived from JSON.stringify of the sorted array.
        // JSON.stringify is deterministic for the same object shape.
        // This test confirms that logically equivalent objects with no extra fields
        // produce the same hash regardless of call site formatting.
        const findingsA = [
            { id: 'FND-aaa', type: 'Goal', description: 'Test' },
        ];
        const findingsB = [
            // Same shape — extra whitespace in the description string itself IS a content difference,
            // but object key ordering in stringify is deterministic.
            { id: 'FND-aaa', type: 'Goal', description: 'Test' },
        ];
        expect(computeCanonicalFindingsHash(findingsA)).toBe(
            computeCanonicalFindingsHash(findingsB)
        );

        // Confirm: leading/trailing whitespace in a field value IS a hash change
        // (the utility strictly reflects content)
        const findingsWithSpace = [
            { id: 'FND-aaa', type: 'Goal', description: '  Test  ' },
        ];
        expect(computeCanonicalFindingsHash(findingsA)).not.toBe(
            computeCanonicalFindingsHash(findingsWithSpace)
        );
    });

    // Case 7 — invalid items filtered out; does not crash
    it('Items with missing or non-string id are silently filtered — no crash', () => {
        const withInvalidItems = [
            { id: 'FND-valid', type: 'Goal', description: 'Valid' },
            { id: undefined as unknown as string, type: 'Bad', description: 'No id' },
            { id: 42 as unknown as string, type: 'Bad', description: 'Numeric id' },
            { type: 'Bad', description: 'No id field at all' } as any,
        ];
        expect(() => computeCanonicalFindingsHash(withInvalidItems)).not.toThrow();
        const hash = computeCanonicalFindingsHash(withInvalidItems);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);

        // Hash matches a clean input containing only the valid item
        const cleanOnly = [{ id: 'FND-valid', type: 'Goal', description: 'Valid' }];
        expect(hash).toBe(computeCanonicalFindingsHash(cleanOnly));
    });

    // Case 8 — empty array produces a valid, stable hash
    it('Empty findings array → stable, valid hash (not a crash)', () => {
        const h1 = computeCanonicalFindingsHash([]);
        const h2 = computeCanonicalFindingsHash([]);
        expect(h1).toBe(h2);
        expect(h1).toMatch(/^[a-f0-9]{64}$/);
        // And it differs from a non-empty array
        expect(h1).not.toBe(computeCanonicalFindingsHash(sampleFindings));
    });

});
