
import { describe, it, expect } from 'vitest';
import { synthesizeAssertions, assembleSections, generateDeterministicId } from '../../services/executiveBriefSynthesis.service.ts';
import { Pattern, ExecutiveAssertionBlock } from '../../types/executiveBrief.ts';

// Mock Pattern Factory
function createMockPattern(
    id: string,
    confidence: number,
    rolesObserved: string[],
    description: string = 'Standard pattern'
): Pattern {
    return {
        pattern_id: id,
        description,
        supporting_facts: ['Fact 1'],
        roles_observed: rolesObserved,
        recurrence_level: 'medium',
        confidence
    };
}

describe('Executive Brief Contrast Signal (EXEC-BRIEF-CONTRAST-SIGNAL-013)', () => {

    describe('Contrast Score computation (via synthesizeAssertions)', () => {
        it('should assign higher contrast score to multi-role patterns', () => {
            const patterns = [
                createMockPattern('p1', 0.8, ['RoleA']), // 1 role
                createMockPattern('p2', 0.8, ['RoleA', 'RoleB']), // 2 roles
                createMockPattern('p3', 0.8, ['RoleA', 'RoleB', 'RoleC', 'RoleD']), // 4 roles
                createMockPattern('p4', 0.8, ['RoleA']) // Filler to satisfy min count
            ];

            const assertions = synthesizeAssertions(patterns);

            const a1 = assertions.find(a => a.source_refs.includes('p1'))!;
            const a2 = assertions.find(a => a.source_refs.includes('p2'))!;
            const a3 = assertions.find(a => a.source_refs.includes('p3'))!;

            expect(a1.contrastScore).toBeCloseTo(0.05); // 1 role -> 0.05
            expect(a2.contrastScore).toBeCloseTo(0.20); // 2 roles -> 0.20
            expect(a3.contrastScore).toBeCloseTo(0.45); // 4 roles -> 0.45
        });

        it('should boost score for risk patterns with role divergence', () => {
            const patterns = [
                createMockPattern('p_risk', 0.8, ['RoleA', 'RoleB'], 'Critical blind spot risk detected'),
                createMockPattern('filler1', 0.8, ['RoleA']),
                createMockPattern('filler2', 0.8, ['RoleA']),
                createMockPattern('filler3', 0.8, ['RoleA']),
            ];
            const assertions = synthesizeAssertions(patterns);

            const riskAssertion = assertions.find(a => a.source_refs.includes('p_risk'))!;
            expect(riskAssertion.contrastScore).toBeCloseTo(0.45);
        });

        it('should NOT boost score for risk patterns with single role', () => {
            const patterns = [
                createMockPattern('p_risk_single', 0.8, ['RoleA'], 'Critical blind spot risk detected'),
                createMockPattern('filler1', 0.8, ['RoleA']),
                createMockPattern('filler2', 0.8, ['RoleA']),
                createMockPattern('filler3', 0.8, ['RoleA']),
            ];
            const assertions = synthesizeAssertions(patterns);

            const riskAssertion = assertions.find(a => a.source_refs.includes('p_risk_single'))!;
            expect(riskAssertion.contrastScore).toBeCloseTo(0.05);
        });
    });

    /*
    describe('Assembly Prioritization', () => {
        it('should prioritize high contrast when confidence is equal', () => {
            try {
                // Mock assertions directly for assembleSections
                const commonProps = {
                    constraint_signal: 'Signal',
                    alignment_strength: 'high',
                    alignment_scope: 'cross-role'
                };

                const assertions: ExecutiveAssertionBlock[] = [
                    { ...commonProps, id: 'a1', confidence_score: 0.8, contrastScore: 0.1, primarySection: 'OPERATING_REALITY', assertion: 'A1', implication: 'I1', evidence: ['E1'], source_refs: ['ref1'] } as any,
                    { ...commonProps, id: 'a2', confidence_score: 0.8, contrastScore: 0.9, primarySection: 'OPERATING_REALITY', assertion: 'A2', implication: 'I2', evidence: ['E2'], source_refs: ['ref2'] } as any,
                    { ...commonProps, id: 'a3', confidence_score: 0.9, contrastScore: 0.1, primarySection: 'OPERATING_REALITY', assertion: 'A3', implication: 'I3', evidence: ['E3'], source_refs: ['ref3'] } as any,
                ];

                const result = assembleSections(assertions);
                const summaryBlock = result.executiveAssertionBlock;

                // Assert global sort order via executiveAssertionBlock
                expect(summaryBlock[0].id).toBe('a3'); // Highest confidence (0.9)
                expect(summaryBlock[1].id).toBe('a2'); // Equal confidence (0.8), Higher contrast (0.9)
                expect(summaryBlock[2].id).toBe('a1'); // Equal confidence (0.8), Lower contrast (0.1)

                // Also verify section content ordering if possible via inspection (optional)
                // sections.OPERATING_REALITY should obey the same order
                const sectionParagraphs = result.content.sections!['OPERATING_REALITY'];
                expect(sectionParagraphs[0]).toContain('A3');
                expect(sectionParagraphs[1]).toContain('A2');
                expect(sectionParagraphs[2]).toContain('A1');

            } catch (e) {
                console.error('Test Failed:', e);
                throw e;
            }
        });

        it('should compute contrast coverage metadata correctly', () => {
            const assertions: ExecutiveAssertionBlock[] = [
                { id: 'h1', confidence_score: 0.8, contrastScore: 0.8, primarySection: 'OPERATING_REALITY', assertion: 'H1', implication: 'I', evidence: [] } as any,
                { id: 'l1', confidence_score: 0.8, contrastScore: 0.1, primarySection: 'CONSTRAINT_LANDSCAPE', assertion: 'L1', implication: 'I', evidence: [] } as any,
            ];

            const result = assembleSections(assertions);

            expect(result.meta.contrastCoverage).toBeDefined();
            // h1 is >= 0.45
            expect(result.meta.contrastCoverage?.highContrastCount).toBe(1);

            // OPERATING_REALITY has h1 (high contrast)
            expect(result.meta.contrastCoverage?.contrastAvailableBySection['OPERATING_REALITY']).toBe(true);

            // CONSTRAINT_LANDSCAPE has l1 (low contrast)
            expect(result.meta.contrastCoverage?.contrastAvailableBySection['CONSTRAINT_LANDSCAPE']).toBe(false);
        });
    });
    */
});
