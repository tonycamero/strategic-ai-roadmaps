/**
 * EXEC-BRIEF-SYNTHESIS-DETERMINISM-TESTS-002
 * Determinism + Golden Fixture Test Harness
 * 
 * Tests prove:
 * - Identical inputs → identical outputs (deep equality)
 * - Section caps enforced
 * - Invalid inputs fail closed with stage-coded errors
 * - Stable ordering (no nondeterministic permutations)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    executeSynthesisPipeline,
    extractFacts,
    extractPatterns,
    synthesizeAssertions,
    assembleSections,
    SynthesisError
} from '../../services/executiveBriefSynthesis.service.ts';
import { validateExecutiveBriefSynthesisOrThrow } from '../../services/executiveBriefValidation.service.ts';
import type { ExecutiveBriefSynthesis } from '../../types/executiveBrief.ts';

const FIXTURES_DIR = join(__dirname, '../fixtures/executiveBriefSynthesis');
const GOLDEN_DIR = join(FIXTURES_DIR, 'golden');

function loadFixture(filename: string): any {
    const path = join(FIXTURES_DIR, filename);
    return JSON.parse(readFileSync(path, 'utf-8'));
}

function loadGolden(filename: string): ExecutiveBriefSynthesis {
    const path = join(GOLDEN_DIR, filename);
    return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * Helper to wrap partial synthesis for validation tests
 */
function wrapWithValid(partial: any): ExecutiveBriefSynthesis {
    return {
        content: {
            executiveSummary: 'Valid summary',
            operatingReality: 'Valid reality',
            constraintLandscape: 'Valid landscape',
            blindSpotRisks: 'Valid risks',
            alignmentSignals: 'Valid signals'
        },
        meta: {
            signalQuality: {
                status: 'SUFFICIENT',
                assertionCount: 4,
                targetCount: 4
            }
        },
        executiveAssertionBlock: [],
        topRisks: [],
        leverageMoves: [],
        strategicSignalSummary: 'Valid summary',
        ...partial
    };
}

describe('Executive Brief Synthesis - Determinism Tests', () => {
    describe('Repeatability Tests', () => {
        it('should produce identical output for identical minimal input (run 1 vs run 2)', async () => {
            const fixture = loadFixture('fixture_minimal_valid.json');

            const result1 = await executeSynthesisPipeline(fixture.vectors);
            const result2 = await executeSynthesisPipeline(fixture.vectors);

            expect(result1).toEqual(result2);
        });

        it('should produce identical output for identical typical input (run 1 vs run 2)', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result1 = await executeSynthesisPipeline(fixture.vectors);
            const result2 = await executeSynthesisPipeline(fixture.vectors);

            expect(result1).toEqual(result2);
        });

        it('should produce deterministic IDs for facts', () => {
            const fixture = loadFixture('fixture_minimal_valid.json');

            const facts1 = extractFacts(fixture.vectors);
            const facts2 = extractFacts(fixture.vectors);

            expect(facts1.map(f => f.id)).toEqual(facts2.map(f => f.id));
        });

        it('should produce deterministic IDs for patterns', () => {
            const fixture = loadFixture('fixture_minimal_valid.json');

            const facts = extractFacts(fixture.vectors);
            const patterns1 = extractPatterns(facts);
            const patterns2 = extractPatterns(facts);

            expect(patterns1.map(p => p.pattern_id)).toEqual(patterns2.map(p => p.pattern_id));
        });

        it('should produce deterministic IDs for assertions', () => {
            const fixture = loadFixture('fixture_minimal_valid.json');

            const facts = extractFacts(fixture.vectors);
            const patterns = extractPatterns(facts);
            const assertions1 = synthesizeAssertions(patterns);
            const assertions2 = synthesizeAssertions(patterns);

            expect(assertions1.map(a => a.id)).toEqual(assertions2.map(a => a.id));
        });
    });

    describe('Golden Output Tests', () => {
        it('should match golden output for minimal valid fixture', async () => {
            const fixture = loadFixture('fixture_minimal_valid.json');
            const golden = loadGolden('fixture_minimal_valid.ExecutiveBriefSynthesis.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            expect(result).toEqual(golden);
        });

        it('should match golden output for typical valid fixture', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');
            const golden = loadGolden('fixture_typical_valid.ExecutiveBriefSynthesis.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            expect(result).toEqual(golden);
        });
    });

    describe('Section Caps Enforcement Tests', () => {
        it('should enforce maximum 4 executive assertions in executiveAssertionBlock', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            expect(result.executiveAssertionBlock.length).toBeLessThanOrEqual(4);
        });

        it('should enforce maximum 5 top risks', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            expect(result.topRisks.length).toBeLessThanOrEqual(5);
        });

        it('should enforce maximum 5 leverage moves', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            expect(result.leverageMoves.length).toBeLessThanOrEqual(5);
        });

        it('should include required strategicSignalSummary', async () => {
            const fixture = loadFixture('fixture_minimal_valid.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            expect(result.strategicSignalSummary).toBeDefined();
            expect(typeof result.strategicSignalSummary).toBe('string');
            expect(result.strategicSignalSummary.length).toBeGreaterThan(0);
        });
    });

    describe('Ordering Stability Tests', () => {
        it('should maintain stable ordering in executiveAssertionBlock', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result1 = await executeSynthesisPipeline(fixture.vectors);
            const result2 = await executeSynthesisPipeline(fixture.vectors);

            const ids1 = result1.executiveAssertionBlock.map(a => a.id);
            const ids2 = result2.executiveAssertionBlock.map(a => a.id);

            expect(ids1).toEqual(ids2);
        });

        it('should maintain stable ordering in topRisks', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result1 = await executeSynthesisPipeline(fixture.vectors);
            const result2 = await executeSynthesisPipeline(fixture.vectors);

            const ids1 = result1.topRisks.map(a => a.id);
            const ids2 = result2.topRisks.map(a => a.id);

            expect(ids1).toEqual(ids2);
        });

        it('should maintain stable ordering in leverageMoves', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result1 = await executeSynthesisPipeline(fixture.vectors);
            const result2 = await executeSynthesisPipeline(fixture.vectors);

            const ids1 = result1.leverageMoves.map(a => a.id);
            const ids2 = result2.leverageMoves.map(a => a.id);

            expect(ids1).toEqual(ids2);
        });

        it('should sort assertions by confidence then ID for determinism', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            // Verify assertions are sorted by confidence (descending), then ID (ascending)
            for (let i = 0; i < result.executiveAssertionBlock.length - 1; i++) {
                const current = result.executiveAssertionBlock[i];
                const next = result.executiveAssertionBlock[i + 1];

                if (current.confidence_score === next.confidence_score) {
                    const contrastA = current.contrastScore || 0;
                    const contrastB = next.contrastScore || 0;

                    if (contrastA === contrastB) {
                        expect(current.id.localeCompare(next.id)).toBeLessThan(0);
                    } else {
                        // Higher contrast comes first
                        expect(contrastA).toBeGreaterThan(contrastB);
                    }
                } else {
                    expect(current.confidence_score).toBeGreaterThanOrEqual(next.confidence_score);
                }
            }
        });
    });

    describe('Fail-Closed Tests', () => {
        it('should throw SynthesisError with stage code when no vectors provided', async () => {
            const fixture = loadFixture('fixture_invalid_missing_data.json');

            await expect(async () => {
                await executeSynthesisPipeline(fixture.vectors);
            }).rejects.toThrow(SynthesisError);

            try {
                await executeSynthesisPipeline(fixture.vectors);
            } catch (error) {
                expect(error).toBeInstanceOf(SynthesisError);
                expect((error as SynthesisError).stage).toBe('FACT_EXTRACTION');
                expect((error as SynthesisError).code).toBe('INSUFFICIENT_DATA');
            }
        });

        it('should throw SynthesisError when facts cannot be extracted', () => {
            expect(() => {
                extractFacts([]);
            }).toThrow(SynthesisError);

            try {
                extractFacts([]);
            } catch (error) {
                expect(error).toBeInstanceOf(SynthesisError);
                expect((error as SynthesisError).stage).toBe('FACT_EXTRACTION');
                expect((error as SynthesisError).code).toBe('INSUFFICIENT_DATA');
            }
        });

        it('should throw SynthesisError when patterns cannot be extracted', () => {
            expect(() => {
                extractPatterns([]);
            }).toThrow(SynthesisError);

            try {
                extractPatterns([]);
            } catch (error) {
                expect(error).toBeInstanceOf(SynthesisError);
                expect((error as SynthesisError).stage).toBe('PATTERN_SYNTHESIS');
                expect((error as SynthesisError).code).toBe('INSUFFICIENT_DATA');
            }
        });

        it('should throw SynthesisError when assertions cannot be synthesized', () => {
            expect(() => {
                synthesizeAssertions([]);
            }).toThrow(SynthesisError);

            try {
                synthesizeAssertions([]);
            } catch (error) {
                expect(error).toBeInstanceOf(SynthesisError);
                expect((error as SynthesisError).stage).toBe('ASSERTION_SYNTHESIS');
                expect((error as SynthesisError).code).toBe('INSUFFICIENT_DATA');
            }
        });

        it('should not return partial output on failure', async () => {
            const fixture = loadFixture('fixture_invalid_missing_data.json');

            let result: any = null;
            try {
                result = await executeSynthesisPipeline(fixture.vectors);
            } catch (error) {
                // Expected to throw
            }

            expect(result).toBeNull();
        });

        it('should throw INSUFFICIENT_SIGNAL when only 2 signals are provided (Min Required 3)', async () => {
            const fixture = loadFixture('fixture_2_signals.json');

            try {
                await executeSynthesisPipeline(fixture.vectors);
                throw new Error('Should have thrown INSUFFICIENT_SIGNAL');
            } catch (error) {
                if (error instanceof SynthesisError) {
                    expect(error.code).toBe('INSUFFICIENT_SIGNAL');
                    expect(error.details.assertionCount).toBe(2);
                    expect(error.details.invalidAssertions.total).toBeGreaterThanOrEqual(0);
                    expect(error.details.invalidAssertions.byRule).toBeDefined();
                } else {
                    throw error;
                }
            }
        });
    });

    describe('Constraint Validation Tests', () => {
        it('should enforce 24-word limit on assertions', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            result.executiveAssertionBlock.forEach(assertion => {
                const wordCount = assertion.assertion.split(/\s+/).length;
                expect(wordCount).toBeLessThanOrEqual(24);
            });
        });

        it('should enforce 1-3 evidence items per assertion', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            result.executiveAssertionBlock.forEach(assertion => {
                expect(assertion.evidence.length).toBeGreaterThanOrEqual(1);
                expect(assertion.evidence.length).toBeLessThanOrEqual(3);
            });
        });

        it('should require implication field on all assertions', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            result.executiveAssertionBlock.forEach(assertion => {
                expect(assertion.implication).toBeDefined();
                expect(assertion.implication.trim().length).toBeGreaterThan(0);
            });
        });

        it('should require constraint_signal field on all assertions', async () => {
            const fixture = loadFixture('fixture_typical_valid.json');

            const result = await executeSynthesisPipeline(fixture.vectors);

            result.executiveAssertionBlock.forEach(assertion => {
                expect(assertion.constraint_signal).toBeDefined();
                expect(assertion.constraint_signal.trim().length).toBeGreaterThan(0);
            });
        });
    });

    describe('Contract Validation Tests (EXEC-BRIEF-VALIDATION-KIT-003)', () => {
        it('should pass validation for all valid fixtures', async () => {
            const validFixtures = [
                'fixture_minimal_valid.json',
                'fixture_typical_valid.json',
                'fixture_high_variance_valid.json'
            ];

            for (const fixtureName of validFixtures) {
                const fixture = loadFixture(fixtureName);
                const result = await executeSynthesisPipeline(fixture.vectors);

                // Should not throw
                expect(() => {
                    validateExecutiveBriefSynthesisOrThrow(result);
                }).not.toThrow();
            }
        });

        it('should throw CONTRACT_VIOLATION for assertion exceeding 24-word limit', () => {
            const invalidSynthesis = {
                executiveAssertionBlock: [{
                    id: 'test-id',
                    assertion: 'This is a very long assertion that exceeds the twenty four word limit and should trigger a contract violation error when validated by the canonical validator',
                    evidence: ['Evidence 1'],
                    implication: 'Test implication',
                    constraint_signal: 'Test signal',
                    alignment_strength: 'high',
                    alignment_scope: 'cross-role',
                    confidence_score: 0.8,
                    source_refs: ['ref-1']
                }],
                strategicSignalSummary: 'Test summary',
                topRisks: [],
                leverageMoves: []
            };

            try {
                validateExecutiveBriefSynthesisOrThrow(wrapWithValid(invalidSynthesis));
                throw new Error('Expected validation to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(SynthesisError);
                expect((error as SynthesisError).code).toBe('CONTRACT_VIOLATION');
                expect((error as SynthesisError).stage).toBe('ASSEMBLY_VALIDATION');

                const violations = (error as SynthesisError).details?.violations || [];
                expect(violations.length).toBeGreaterThan(0);

                const wordLimitViolation = violations.find((v: any) => v.rule === 'EAB_ASSERTION_WORD_LIMIT');
                expect(wordLimitViolation).toBeDefined();
                expect(wordLimitViolation.path).toBe('executiveAssertionBlock[0].assertion');
            }
        });

        it('should throw CONTRACT_VIOLATION for invalid evidence count', () => {
            const invalidSynthesis = {
                executiveAssertionBlock: [{
                    id: 'test-id',
                    assertion: 'Test assertion within word limit',
                    evidence: [], // Invalid: must have 1-3 items
                    implication: 'Test implication',
                    constraint_signal: 'Test signal',
                    alignment_strength: 'high',
                    alignment_scope: 'cross-role',
                    confidence_score: 0.8,
                    source_refs: ['ref-1']
                }],
                strategicSignalSummary: 'Test summary',
                topRisks: [],
                leverageMoves: []
            };

            try {
                validateExecutiveBriefSynthesisOrThrow(wrapWithValid(invalidSynthesis));
                throw new Error('Expected validation to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(SynthesisError);
                expect((error as SynthesisError).code).toBe('CONTRACT_VIOLATION');

                const violations = (error as SynthesisError).details?.violations || [];
                const evidenceViolation = violations.find((v: any) => v.rule === 'EAB_EVIDENCE_COUNT');
                expect(evidenceViolation).toBeDefined();
            }
        });

        it('should throw CONTRACT_VIOLATION for missing required fields', () => {
            const invalidSynthesis = {
                executiveAssertionBlock: [{
                    id: 'test-id',
                    assertion: 'Test assertion',
                    evidence: ['Evidence 1'],
                    // Missing: implication, constraint_signal, etc.
                }],
                strategicSignalSummary: 'Test summary',
                topRisks: [],
                leverageMoves: []
            };

            try {
                validateExecutiveBriefSynthesisOrThrow(wrapWithValid(invalidSynthesis) as any);
                throw new Error('Expected validation to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(SynthesisError);
                expect((error as SynthesisError).code).toBe('CONTRACT_VIOLATION');

                const violations = (error as SynthesisError).details?.violations || [];
                const requiredFieldViolations = violations.filter((v: any) => v.rule === 'EAB_REQUIRED_FIELD');
                expect(requiredFieldViolations.length).toBeGreaterThan(0);
            }
        });

        it('should enforce section caps and throw CONTRACT_VIOLATION', () => {
            // Create 5 valid assertions (exceeds cap of 4)
            const validAssertion = {
                id: 'test-id',
                assertion: 'Test assertion within limits',
                evidence: ['Evidence 1'],
                implication: 'Test implication',
                constraint_signal: 'Test signal',
                alignment_strength: 'high',
                alignment_scope: 'cross-role',
                confidence_score: 0.8,
                source_refs: ['ref-1']
            };

            const invalidSynthesis = {
                executiveAssertionBlock: [
                    { ...validAssertion, id: 'id-1' },
                    { ...validAssertion, id: 'id-2' },
                    { ...validAssertion, id: 'id-3' },
                    { ...validAssertion, id: 'id-4' },
                    { ...validAssertion, id: 'id-5' } // Exceeds cap
                ],
                strategicSignalSummary: 'Test summary',
                topRisks: [],
                leverageMoves: []
            };

            try {
                validateExecutiveBriefSynthesisOrThrow(wrapWithValid(invalidSynthesis));
                throw new Error('Expected validation to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(SynthesisError);
                expect((error as SynthesisError).code).toBe('CONTRACT_VIOLATION');

                const violations = (error as SynthesisError).details?.violations || [];
                const capViolation = violations.find((v: any) => v.rule === 'SECTION_CAP_EXEC_ASSERTIONS');
                expect(capViolation).toBeDefined();
                expect(capViolation.context.count).toBe(5);
                expect(capViolation.context.cap).toBe(4);
            }
        });

        it('should sort violations deterministically (path ASC, then rule ASC)', () => {
            const invalidSynthesis = {
                executiveAssertionBlock: [
                    {
                        id: 'test-id-1',
                        assertion: 'This is a very long assertion that exceeds the twenty four word limit and should trigger a contract violation error when validated',
                        evidence: [], // Also invalid
                        // Missing required fields
                    },
                    {
                        id: 'test-id-2',
                        assertion: 'Another long assertion that exceeds the twenty four word limit and should trigger a contract violation error when validated',
                        evidence: ['E1', 'E2', 'E3', 'E4'], // Too many
                        // Missing required fields
                    }
                ],
                strategicSignalSummary: '', // Invalid: empty
                topRisks: [],
                leverageMoves: []
            };

            try {
                validateExecutiveBriefSynthesisOrThrow(invalidSynthesis as any);
                throw new Error('Expected validation to throw');
            } catch (error) {
                expect(error).toBeInstanceOf(SynthesisError);

                const violations = (error as SynthesisError).details?.violations || [];
                expect(violations.length).toBeGreaterThan(0);

                // Verify deterministic sorting
                for (let i = 0; i < violations.length - 1; i++) {
                    const current = violations[i];
                    const next = violations[i + 1];

                    if (current.path === next.path) {
                        expect(current.rule.localeCompare(next.rule)).toBeLessThanOrEqual(0);
                    } else {
                        expect(current.path.localeCompare(next.path)).toBeLessThan(0);
                    }
                }
            }
        });
    });

    describe('Signal Gate (EXEC-BRIEF-SIGNAL-GATE-009A)', () => {
        it('should pass with LOW_SIGNAL quality when assertion count === 3', async () => {
            const fixture = loadFixture('fixture_3_signals.json');
            const result = await executeSynthesisPipeline(fixture.vectors);

            expect(result.assertionCount).toBe(3);
            expect(result.signalQuality).toBe('LOW_SIGNAL');
            expect(result.targetCount).toBe(4);
        });

        it('should pass with SUFFICIENT signal quality when assertion count === 4', async () => {
            const fixture = loadFixture('fixture_4_signals.json');
            const result = await executeSynthesisPipeline(fixture.vectors);

            expect(result.assertionCount).toBe(4);
            expect(result.signalQuality).toBe('SUFFICIENT');
            expect(result.targetCount).toBe(4);
        });

        it('should throw INSUFFICIENT_SIGNAL with enriched diagnostic payload (EXEC-BRIEF-SIGNAL-TRACE-010)', async () => {
            const fixture = loadFixture('fixture_2_signals.json');

            try {
                await executeSynthesisPipeline(fixture.vectors, { tenantId: 'test-tenant', action: 'regen' });
                throw new Error('Expected synthesis to fail');
            } catch (error: any) {
                expect(error.code).toBe('INSUFFICIENT_SIGNAL');
                // Enriched diagnostics
                expect(error.details.vectorCount).toBe(2);
                expect(error.details.factCount).toBeDefined();
                expect(error.details.patternCount).toBeDefined();
                expect(error.details.invalidAssertions).toBeDefined();
                expect(error.details.invalidAssertions.total).toBeDefined();
                expect(error.details.invalidAssertions.byRule).toBeDefined();
                expect(error.details.tenantId).toBe('test-tenant');
            }
        });
    });
});
