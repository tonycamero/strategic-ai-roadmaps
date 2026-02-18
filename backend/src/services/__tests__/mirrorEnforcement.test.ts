import { describe, it, expect, vi } from 'vitest';
import { enforceMirrorContract } from '../executiveBrief/mirrorNarrative/enforcement.service';
import { SAFE_JARGON_PHRASES, assertJargonMapGuardrails, BANNED_JARGON_TERMS } from '../executiveBrief/mirrorNarrative/jargonMap';

// Mock getOpenAIClient to avoid actual API calls
vi.mock('../executiveBriefMirrorNarrative.service', () => ({
    getOpenAIClient: () => ({
        chat: {
            completions: {
                create: vi.fn().mockImplementation(({ messages }) => {
                    const prompt = messages[0].content + ' ' + messages[1].content;
                    if (prompt.toLowerCase().includes('cross-functional') || prompt.toLowerCase().includes('go-to-market')) {
                        return { choices: [{ message: { content: 'This is a repaired sentence using teams across the board.' } }] };
                    }
                    return { choices: [{ message: { content: 'This is a generic repaired sentence.' } }] };
                })
            }
        }
    })
}));

describe('Mirror Narrative Enforcement (v2.2 Operator Voice)', () => {

    it('jargon map guardrails: small + multi-word only + banned tokens not present', () => {
        expect(Object.keys(SAFE_JARGON_PHRASES).length).toBeLessThanOrEqual(25);
        expect(() => assertJargonMapGuardrails()).not.toThrow();
    });

    it('rejects single-word keys (regression: cross-functional)', () => {
        expect(Object.keys(SAFE_JARGON_PHRASES)).not.toContain("cross-functional");
    });

    it('repairs banned jargon "cross-functional" and "go-to-market" via sentence-only rewrite', async () => {
        const sections: any = {
            ALIGNMENT_SIGNALS: {
                livedReality: "Cross-functional execution is proceeding. Go-to-market strategy is pending. Phones go unanswered during rush.",
                costOfStatusQuo: "Friction is high.",
                theCall: "Fix it now."
            }
        };

        const result = await enforceMirrorContract(sections);

        const text = sections.ALIGNMENT_SIGNALS.livedReality as string;
        expect(text.toLowerCase()).not.toContain("cross-functional");
        expect(text.toLowerCase()).not.toContain("go-to-market");
        expect(text).toContain("across the board"); // from mock
        expect(text).toContain("Phones go unanswered"); // surgical: next sentence exists
        expect(result.jargonHitsCount).toBeGreaterThanOrEqual(1);
        expect(result.repairedSentences).toBeGreaterThanOrEqual(1);
    });

    it('jargon repair is surgical: only the sentence containing jargon changes', async () => {
        const sections: any = {
            OPERATING_REALITY: {
                livedReality: "We keep trying to move the needle with new promos. Phones go unanswered during rush and handoffs get sloppy.",
                costOfStatusQuo: "Friction is high.",
                theCall: "Fix it now."
            }
        };

        const result = await enforceMirrorContract(sections);

        const text = sections.OPERATING_REALITY.livedReality as string;
        expect(text).toContain("Phones go unanswered"); // second sentence remains intact
        expect(text).not.toContain("move the needle"); // jargon sentence should be replaced
        expect(result.jargonHitsCount).toBeGreaterThanOrEqual(1);
        expect(result.repairedSentences).toBeGreaterThanOrEqual(1);
    });

    it('should patch missing tokens in THE CALL Spec', async () => {
        const sections: any = {
            OPERATING_REALITY: {
                livedReality: 'Reality is here.',
                costOfStatusQuo: 'Cost is high.',
                theCall: 'We need to move.' // Missing owner, timebox, artifact, success signal
            }
        };

        const result = await enforceMirrorContract(sections);

        const patchedCall = sections.OPERATING_REALITY.theCall;
        expect(patchedCall).toMatch(/(GM|Owner|Operations Lead|Shift Supervisor)/);
        expect(patchedCall).toMatch(/(Friday|days|weeks|month)/);
        expect(patchedCall).toMatch(/(SOP|sheet|scoreboard|log|checklist|tree|doc|list|script|model)/);
        expect(patchedCall).toMatch(/(verify|confirm|threshold|worked)/);
        expect(result.callSpec.patched).toBe(true);
    });

});
