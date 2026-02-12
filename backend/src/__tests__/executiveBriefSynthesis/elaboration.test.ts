
import { describe, it, expect } from 'vitest';
import { assembleSections } from '../../services/executiveBriefSynthesis.service.ts';
import { ExecutiveAssertionBlock } from '../../types/executiveBrief.ts';

describe('Executive Brief Signal Elaboration (EXEC-BRIEF-SIGNAL-ELABORATION-014)', () => {

    const createMockAssertion = (
        id: string,
        confidence: number,
        contrast: number,
        roles: string[] = ['RoleA', 'RoleB'],
        section: 'OPERATING_REALITY' | 'CONSTRAINT_LANDSCAPE' = 'OPERATING_REALITY'
    ): ExecutiveAssertionBlock => ({
        id,
        assertion: `Assertion ${id}`,
        implication: `Implication ${id}`,
        evidence: [`Evidence ${id}-1`, `Evidence ${id}-2`],
        constraint_signal: `Constraint ${id}`,
        confidence_score: confidence,
        contrastScore: contrast,
        roles_observed: roles,
        primarySection: section,
        alignment_strength: 'medium',
        alignment_scope: 'cross-role',
        source_refs: ['ref1']
    });

    const getFillers = (): ExecutiveAssertionBlock[] => [
        createMockAssertion('filler1', 0.5, 0.1, [], 'CONSTRAINT_LANDSCAPE'),
        createMockAssertion('filler2', 0.5, 0.1, [], 'CONSTRAINT_LANDSCAPE')
    ];

    it('should expand eligible assertions into 3 paragraphs', () => {
        // High confidence (0.8), High contrast (0.5) -> Eligible
        const eligible = createMockAssertion('a1', 0.8, 0.5);
        const synthesis = assembleSections([eligible, ...getFillers()]);

        const paragraphs = synthesis.content.sections?.OPERATING_REALITY || [];

        // Only a1 is in OPERATING_REALITY
        expect(paragraphs.length).toBe(3);

        // P1: Core
        expect(paragraphs[0]).toContain('Assertion a1');
        expect(paragraphs[0]).toContain('Implication a1');

        // P2: Operational Manifestation
        expect(paragraphs[1]).toContain('This dynamic is actively observed within RoleA, RoleB workflows');
        expect(paragraphs[1]).toContain('Evidence a1-1; Evidence a1-2');

        // P3: Impact Surface
        expect(paragraphs[2]).toContain('execution drag through constraint a1');
    });

    it('should NOT expand ineligible assertions', () => {
        // Case 1: Low Confidence (0.6), High Contrast (0.5)
        const lowConf = createMockAssertion('a2', 0.6, 0.5);

        // Case 2: High Confidence (0.7), Low Contrast (0.2)
        const lowContrast = createMockAssertion('a3', 0.7, 0.2);

        const synthesis = assembleSections([lowConf, lowContrast, ...getFillers()]);

        const paragraphs = synthesis.content.sections?.OPERATING_REALITY || [];

        expect(paragraphs.length).toBe(2);

        // Check content is just P1 (Assertion + Implication)
        expect(paragraphs[0]).toContain('Assertion a3'); // a3 first (0.7 > 0.6)
        expect(paragraphs[0]).not.toContain('This dynamic is actively observed');

        expect(paragraphs[1]).toContain('Assertion a2');
    });

    it('should populate elaboration metadata correctly', () => {
        const eligible = createMockAssertion('a1', 0.8, 0.5);
        const ineligible = createMockAssertion('a2', 0.6, 0.5);

        const synthesis = assembleSections([eligible, ineligible, ...getFillers()]);

        expect(synthesis.meta.elaboration?.elaborationApplied).toBe(true);
        expect(synthesis.meta.elaboration?.elaboratedAssertionIds).toContain('a1');
        expect(synthesis.meta.elaboration?.elaboratedAssertionIds).not.toContain('a2');
        expect(synthesis.meta.elaboration?.elaborationDepthBySection['OPERATING_REALITY']).toBe(1);
    });

    it('should handle missing roles gracefully', () => {
        const noRoles = createMockAssertion('a4', 0.8, 0.5, []);
        // @ts-ignore
        delete noRoles.roles_observed;

        const synthesis = assembleSections([noRoles, ...getFillers()]);
        const paragraphs = synthesis.content.sections?.OPERATING_REALITY || [];

        expect(paragraphs[1]).toContain('observed within multiple workflows');
    });
});
