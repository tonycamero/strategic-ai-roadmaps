
import { describe, it, expect } from 'vitest';
import { assembleSections } from '../../services/executiveBriefSynthesis.service';
import { ExecutiveAssertionBlock } from '../../types/executiveBrief';

describe('Executive Interpretation Layer (EXEC-BRIEF-INTERPRETATION-015)', () => {

    // Helper to create empty assertions
    const getEmptyAssertions = (): ExecutiveAssertionBlock[] => [];

    // Helper to check for Forbidden Terms
    const checkForbiddenTerms = (text: string) => {
        const forbidden = [
            'intake set',
            'represented',
            'insufficient',
            'not described',
            'signals detected',
            'captured'
        ];
        forbidden.forEach(term => {
            expect(text.toLowerCase()).not.toContain(term.toLowerCase());
        });
    };

    it('should replace epistemic fallbacks with executive implications (Low Signal)', () => {
        // Mock sufficient valid assertions to pass validation, but filtering so sections are empty
        // We'll pass 3 generic assertions that don't match specific sections if we want to force fallback?
        // Actually assembleSections filters by section. So we can just pass assertions that don't map to the section we are testing.

        // Let's create dummy assertions to satisfy the minimum count (3) but put them all in 'OPERATING_REALITY'
        // so we can test fallback for 'CONSTRAINT_LANDSCAPE'.
        const dummyAssertions: ExecutiveAssertionBlock[] = [
            {
                id: 'a1', assertion: 'Ops normal', implication: 'Good', evidence: ['e1'],
                constraint_signal: 'None', primarySection: 'OPERATING_REALITY',
                confidence_score: 0.8, alignment_strength: 'high', alignment_scope: 'cross-role', source_refs: [], contrastScore: 0.5
            },
            {
                id: 'a2', assertion: 'Ops normal 2', implication: 'Good', evidence: ['e1'],
                constraint_signal: 'None', primarySection: 'OPERATING_REALITY',
                confidence_score: 0.8, alignment_strength: 'high', alignment_scope: 'cross-role', source_refs: [], contrastScore: 0.5
            },
            {
                id: 'a3', assertion: 'Ops normal 3', implication: 'Good', evidence: ['e1'],
                constraint_signal: 'None', primarySection: 'OPERATING_REALITY',
                confidence_score: 0.8, alignment_strength: 'high', alignment_scope: 'cross-role', source_refs: [], contrastScore: 0.5
            }
        ];

        const synthesis = assembleSections(dummyAssertions);

        // Test CONSTRAINT_LANDSCAPE Fallback
        const constraintText = synthesis.content.constraintLandscape;
        console.log('CONSTRAINT FALLBACK:', constraintText);
        expect(constraintText).toContain('structural stability');
        expect(constraintText).toContain('managed within local capacity');
        checkForbiddenTerms(constraintText);

        // Test BLIND_SPOT_RISKS Fallback
        const riskText = synthesis.content.blindSpotRisks;
        console.log('RISK FALLBACK:', riskText);
        expect(riskText).toContain('Systemic risk exposure remains latent');
        checkForbiddenTerms(riskText);

        // Test ALIGNMENT_SIGNALS Fallback
        const alignmentText = synthesis.content.alignmentSignals;
        console.log('ALIGNMENT FALLBACK:', alignmentText);
        expect(alignmentText).toContain('distributed coordination');
        checkForbiddenTerms(alignmentText);
    });

    it('should generate interpretive strategic summary instead of stats', () => {
        const assertions: ExecutiveAssertionBlock[] = [
            {
                id: 'a1', assertion: 'Ops normal', implication: 'Good', evidence: ['e1'],
                constraint_signal: 'None', primarySection: 'OPERATING_REALITY',
                confidence_score: 0.8, alignment_strength: 'high', alignment_scope: 'cross-role', source_refs: [], contrastScore: 0.5
            },
            {
                id: 'a2', assertion: 'Ops normal 2', implication: 'Good', evidence: ['e1'],
                constraint_signal: 'None', primarySection: 'OPERATING_REALITY',
                confidence_score: 0.8, alignment_strength: 'high', alignment_scope: 'cross-role', source_refs: [], contrastScore: 0.5
            },
            {
                id: 'a3', assertion: 'Ops normal 3', implication: 'Good', evidence: ['e1'],
                constraint_signal: 'None', primarySection: 'OPERATING_REALITY',
                confidence_score: 0.8, alignment_strength: 'high', alignment_scope: 'cross-role', source_refs: [], contrastScore: 0.5
            }
        ];

        const synthesis = assembleSections(assertions);
        const summary = synthesis.content.executiveSummary;

        console.log('SUMMARY:', summary);

        // Should NOT contain "synthesized" or "indicators detected"
        checkForbiddenTerms(summary);
        expect(summary).not.toContain('indicators detected');
        expect(summary).toContain('High-confidence signals confirm clear strategic direction');
    });

    it('should use latent stability summary for low confidence set', () => {
        const assertions: ExecutiveAssertionBlock[] = [
            {
                id: 'a1', assertion: 'Ops normal', implication: 'Good', evidence: ['e1'],
                constraint_signal: 'None', primarySection: 'OPERATING_REALITY',
                confidence_score: 0.4, alignment_strength: 'low', alignment_scope: 'fragmented', source_refs: [], contrastScore: 0.1
            },
            {
                id: 'a2', assertion: 'Ops normal 2', implication: 'Good', evidence: ['e1'],
                constraint_signal: 'None', primarySection: 'OPERATING_REALITY',
                confidence_score: 0.4, alignment_strength: 'low', alignment_scope: 'fragmented', source_refs: [], contrastScore: 0.1
            },
            {
                id: 'a3', assertion: 'Ops normal 3', implication: 'Good', evidence: ['e1'],
                constraint_signal: 'None', primarySection: 'OPERATING_REALITY',
                confidence_score: 0.4, alignment_strength: 'low', alignment_scope: 'fragmented', source_refs: [], contrastScore: 0.1
            }
        ];

        const synthesis = assembleSections(assertions);
        const summary = synthesis.content.executiveSummary;

        console.log('LOW CONF SUMMARY:', summary);
        expect(summary).toContain('points to implied stability');
    });
});
