import { describe, it, expect } from 'vitest';
import { validateExecutiveBriefSynthesisOrThrow } from '../../services/executiveBriefValidation.service.ts';
import { ExecutiveBriefSynthesis } from '../../types/executiveBrief.ts';

describe('Executive Brief Narrative Integrity (EXEC-BRIEF-RENDER-INTEGRITY-012)', () => {
    const validBase: ExecutiveBriefSynthesis = {
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
        strategicSignalSummary: 'Valid summary'
    };

    it('should PASS a clean narrative', () => {
        expect(() => validateExecutiveBriefSynthesisOrThrow(validBase)).not.toThrow();
    });

    it('should REJECT narrative containing Mode 2 Expansion debug banners', () => {
        const mangled = {
            ...validBase,
            content: {
                ...validBase.content,
                operatingReality: 'Normal text. [Expansion applied: 4 candidates accepted]'
            }
        };

        try {
            validateExecutiveBriefSynthesisOrThrow(mangled);
            expect.fail('Should have thrown CONTRACT_VIOLATION');
        } catch (e: any) {
            expect(e.code).toBe('CONTRACT_VIOLATION');
            const violations = e.details.violations;
            expect(violations.some((v: any) => v.rule === 'CONTENT_DEBUG_LEAK')).toBe(true);
        }
    });

    it('should REJECT narrative containing ALL_CAPS_WITH_UNDERSCORES (internal tokens)', () => {
        const mangled = {
            ...validBase,
            content: {
                ...validBase.content,
                constraintLandscape: 'We have a problem with GOVERNANCE_VELOCITY in the system.'
            }
        };

        try {
            validateExecutiveBriefSynthesisOrThrow(mangled);
            expect.fail('Should have thrown CONTRACT_VIOLATION');
        } catch (e: any) {
            expect(e.code).toBe('CONTRACT_VIOLATION');
            const violations = e.details.violations;
            expect(violations.some((v: any) => v.rule === 'CONTENT_DEBUG_LEAK')).toBe(true);
        }
    });

    it('should REJECT if content block is missing', () => {
        const { content, ...missingContent } = validBase;
        try {
            validateExecutiveBriefSynthesisOrThrow(missingContent as any);
            expect.fail('Should have thrown CONTRACT_VIOLATION');
        } catch (e: any) {
            expect(e.code).toBe('CONTRACT_VIOLATION');
            expect(e.details.violations.some((v: any) => v.rule === 'CONTENT_MISSING')).toBe(true);
        }
    });

    it('should REJECT if meta block is missing', () => {
        const { meta, ...missingMeta } = validBase;
        try {
            validateExecutiveBriefSynthesisOrThrow(missingMeta as any);
            expect.fail('Should have thrown CONTRACT_VIOLATION');
        } catch (e: any) {
            expect(e.code).toBe('CONTRACT_VIOLATION');
            expect(e.details.violations.some((v: any) => v.rule === 'META_MISSING')).toBe(true);
        }
    });
});
