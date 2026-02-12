import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSynthesisPipeline, SynthesisError, extractFacts } from '../../services/executiveBriefSynthesis.service.ts';
import { ExecutiveBriefAssertionExpansionService } from '../../services/executiveBriefAssertionExpansion.service.ts';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('../../services/executiveBriefAssertionExpansion.service', () => ({
    ExecutiveBriefAssertionExpansionService: {
        proposeCandidates: vi.fn()
    }
}));

describe('Executive Brief Mode 2 — Assertion Expansion Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.EXEC_BRIEF_MODE2_EXPANSION_ENABLED = 'true';
    });

    const mockVectors = [
        {
            id: 'v1',
            tenantId: 't1',
            roleType: 'owner',
            roleLabel: 'Owner',
            perceivedConstraints: 'Limited budget for R&D.'
        },
        {
            id: 'v2',
            tenantId: 't1',
            roleType: 'ops',
            roleLabel: 'Operations',
            perceivedConstraints: 'Inefficient manual processes.'
        }
    ];

    it('should NOT invoke expansion if Track A yields enough assertions', async () => {
        // Load fixture_typical_valid.json which yields 4 assertions
        const fixturePath = path.join(__dirname, '../fixtures/executiveBriefSynthesis/fixture_typical_valid.json');
        const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

        const result = await executeSynthesisPipeline(fixture.vectors as any);

        // Should have 4 assertions from Track A
        expect(result.executiveAssertionBlock.length).toBe(4);
        expect(ExecutiveBriefAssertionExpansionService.proposeCandidates).not.toHaveBeenCalled();
    });

    it('should invoke expansion when Track A yield < 4', async () => {
        const facts = extractFacts(mockVectors as any);
        const factId1 = facts[0].id;
        const factId2 = facts[1].id;

        (ExecutiveBriefAssertionExpansionService.proposeCandidates as any).mockResolvedValue([
            {
                primarySection: 'OPERATING_REALITY',
                assertion: 'Expanded assertion 1 from Track B.',
                evidence_fact_ids: [factId1],
                implication: 'Strategic leverage point.',
                constraint_signal: 'ECONOMIC_CAPACITY'
            },
            {
                primarySection: 'OPERATING_REALITY',
                assertion: 'Expanded assertion 2 from Track B.',
                evidence_fact_ids: [factId2],
                implication: 'Operational risk mitigation.',
                constraint_signal: 'SUPPLY_CHAIN_RESILIENCE'
            }
        ]);

        const result = await executeSynthesisPipeline(mockVectors as any);

        expect(ExecutiveBriefAssertionExpansionService.proposeCandidates).toHaveBeenCalled();
        expect(result.executiveAssertionBlock.some(a => a.assertion === 'Expanded assertion 1 from Track B.')).toBe(true);
        // Track A (1) + Track B (2) = 3 (Minimum met)
        expect(result.executiveAssertionBlock.length).toBeGreaterThanOrEqual(3);
    });

    it('should fail-soft if expansion service throws', async () => {
        (ExecutiveBriefAssertionExpansionService.proposeCandidates as any).mockRejectedValue(new Error('LLM Timeout'));

        try {
            await executeSynthesisPipeline(mockVectors as any);
            throw new Error('Should have thrown INSUFFICIENT_SIGNAL');
        } catch (error: any) {
            expect(error.code).toBe('INSUFFICIENT_SIGNAL');
            expect(error.details.expansionInvoked).toBe(true);
            expect(error.details.expansionAcceptedCount).toBe(0);
        }
    });

    it('should reject Track B candidates with unknown fact IDs', async () => {
        (ExecutiveBriefAssertionExpansionService.proposeCandidates as any).mockResolvedValue([
            {
                primarySection: 'OPERATING_REALITY',
                assertion: 'Invalid assertion with bad fact ID.',
                evidence_fact_ids: ['non_existent_fact'],
                implication: 'Should be rejected.',
                constraint_signal: 'ECONOMIC_CAPACITY'
            }
        ]);

        const result = await executeSynthesisPipeline(mockVectors as any).catch(e => e);

        // Check diagnostics in error or result
        const details = result instanceof SynthesisError ? result.details : result;
        expect(details.expansionAcceptedCount).toBe(0);
    });

    it('should enforce deterministic selection even with Track B candidates', async () => {
        const facts = extractFacts(mockVectors as any);
        const factId1 = facts[0].id;

        const mockCandidates = [
            {
                bucket: 'operating_reality',
                assertion: 'Track B Assertion Alpha',
                evidence_fact_ids: [factId1],
                implication: 'I1',
                constraint_signal: 'S1'
            },
            {
                bucket: 'operating_reality',
                assertion: 'Track B Assertion Beta',
                evidence_fact_ids: [factId1],
                implication: 'I2',
                constraint_signal: 'S2'
            },
            {
                bucket: 'operating_reality',
                assertion: 'Track B Assertion Gamma',
                evidence_fact_ids: [factId1],
                implication: 'I3',
                constraint_signal: 'S3'
            }
        ];
        (ExecutiveBriefAssertionExpansionService.proposeCandidates as any).mockResolvedValue(mockCandidates);

        const result1 = await executeSynthesisPipeline(mockVectors as any);
        const result2 = await executeSynthesisPipeline(mockVectors as any);

        expect(result1.executiveAssertionBlock).toEqual(result2.executiveAssertionBlock);
    });
});
