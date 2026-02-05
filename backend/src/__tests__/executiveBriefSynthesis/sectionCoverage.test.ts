import { describe, it, expect } from 'vitest';
import { assembleSections } from '../../services/executiveBriefSynthesis.service';
import { ExecutiveAssertionBlock } from '../../types/executiveBrief';

describe('Executive Brief Section Coverage (EXEC-BRIEF-SECTION-COVERAGE-012)', () => {
    const mockAssertion = (id: string, section: any): ExecutiveAssertionBlock => ({
        id,
        assertion: `Assertion ${id}`,
        evidence: ['Evidence'],
        implication: 'Implication',
        constraint_signal: 'Signal',
        primarySection: section,
        alignment_strength: 'medium',
        alignment_scope: 'cross-role',
        confidence_score: 0.8,
        source_refs: ['ref']
    });

    it('should use assertions for all sections if provided', () => {
        const assertions = [
            mockAssertion('1', 'OPERATING_REALITY'),
            mockAssertion('2', 'CONSTRAINT_LANDSCAPE'),
            mockAssertion('3', 'BLIND_SPOT_RISKS'),
            mockAssertion('4', 'ALIGNMENT_SIGNALS')
        ];

        const synthesis = assembleSections(assertions);

        expect(synthesis.content.operatingReality).toContain('Assertion 1');
        expect(synthesis.content.constraintLandscape).toContain('Assertion 2');
        expect(synthesis.content.blindSpotRisks).toContain('Assertion 3');
        expect(synthesis.content.alignmentSignals).toContain('Assertion 4');

        expect(synthesis.meta.sectionCoverage?.['OPERATING_REALITY'].usedFallback).toBe(false);
        expect(synthesis.meta.sectionCoverage?.['CONSTRAINT_LANDSCAPE'].usedFallback).toBe(false);
        expect(synthesis.meta.sectionCoverage?.['BLIND_SPOT_RISKS'].usedFallback).toBe(false);
        expect(synthesis.meta.sectionCoverage?.['ALIGNMENT_SIGNALS'].usedFallback).toBe(false);

        // Verify structured sections (v1.1)
        expect(synthesis.content.sections).toBeDefined();
        expect(synthesis.content.sections?.OPERATING_REALITY.length).toBe(1);
        expect(synthesis.content.sections?.OPERATING_REALITY[0]).toContain('Assertion 1');
    });

    it('should inject deterministic fallback for empty sections', () => {
        const assertions = [
            mockAssertion('1', 'ALIGNMENT_SIGNALS'),
            mockAssertion('2', 'ALIGNMENT_SIGNALS'),
            mockAssertion('3', 'ALIGNMENT_SIGNALS')
        ];

        const synthesis = assembleSections(assertions);

        // Operating Reality should have fallback
        expect(synthesis.content.operatingReality).toBe("Current operating signals indicate a normalized execution environment characterized by routine workflows. No acute friction points have surfaced to the level of executive visibility.");
        expect(synthesis.meta.sectionCoverage?.['OPERATING_REALITY'].usedFallback).toBe(true);

        // Alignment should NOT have fallback
        expect(synthesis.content.alignmentSignals).toContain('Assertion 1');
        expect(synthesis.meta.sectionCoverage?.['ALIGNMENT_SIGNALS'].usedFallback).toBe(false);
    });

    it('should attempt re-mapping from secondarySections before using fallback', () => {
        const assertions = [
            {
                ...mockAssertion('1', 'ALIGNMENT_SIGNALS'),
                secondarySections: ['OPERATING_REALITY']
            }
        ];

        // Need at least 3 assertions to pass validateAssertions
        const allAssertions = [
            assertions[0],
            mockAssertion('2', 'ALIGNMENT_SIGNALS'),
            mockAssertion('3', 'ALIGNMENT_SIGNALS')
        ];

        const synthesis = assembleSections(allAssertions as any);

        expect(synthesis.content.operatingReality).toContain('Assertion 1');
        expect(synthesis.meta.sectionCoverage?.['OPERATING_REALITY'].usedFallback).toBe(false);
    });
});
