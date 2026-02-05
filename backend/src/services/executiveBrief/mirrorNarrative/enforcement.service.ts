/**
 * Mirror Narrative Enforcement Service (Ticket EXEC-MIRROR-VOICE-OPENERFIX-001)
 * Orchestrates surgical Jargon Lint, Banned Jargon Repair, No-Repeat Guard, and Call Spec enforcement.
 */

import {
    assertJargonMapGuardrails,
    findJargonHits,
    findBannedJargonHits,
    splitIntoSentences,
    JargonHit,
} from './jargonMap';
import { enforceNoRepeat, NoRepeatSummary } from './noRepeatGuard';
import { enforceCallSpec, CallSpecSummary } from './callSpec';
import { MirrorSection, ExecutiveBriefSectionKey } from '../../../types/executiveBrief';
import { getOpenAIClient } from '../../executiveBriefMirrorNarrative.service';

export interface EnforcementResult {
    noRepeat: NoRepeatSummary;
    jargonHitsCount: number;
    jargonHits: (JargonHit | { phrase: string; type: 'BANNED' })[];
    repairedSentences: number;
    callSpec: CallSpecSummary;
    samples: {
        beforeAfterSnippets: string[];
    };
}

export async function enforceMirrorContract(
    sections: Record<ExecutiveBriefSectionKey, MirrorSection>,
    briefId?: string
): Promise<EnforcementResult> {
    assertJargonMapGuardrails();

    const result: EnforcementResult = {
        noRepeat: { triggered: false, count: 0, rewrites: 0, collisions: [] },
        jargonHitsCount: 0,
        jargonHits: [],
        repairedSentences: 0,
        callSpec: { pass: false, patched: false, llmFix: false, count: 0 },
        samples: { beforeAfterSnippets: [] }
    };

    // 1. Jargon Lint + Banned Jargon Repair (Surgical)
    const sectionKeys = Object.keys(sections) as ExecutiveBriefSectionKey[];
    for (const key of sectionKeys) {
        const sec = sections[key];
        if (!sec?.livedReality) continue;

        // A. Multi-word safe phrases
        const safeHits = findJargonHits({ sectionKey: key, text: sec.livedReality });

        // B. Banned single-word jargon (e.g., "cross-functional")
        const bannedHits = findBannedJargonHits(sec.livedReality);

        if (safeHits.length === 0 && bannedHits.length === 0) continue;

        // Record hits
        result.jargonHits.push(...safeHits);
        bannedHits.forEach(phrase => result.jargonHits.push({ phrase, type: 'BANNED' }));
        result.jargonHitsCount = result.jargonHits.length;

        const sentences = splitIntoSentences(sec.livedReality);

        // Repair unique sentence indices
        // We'll scan each sentence for both types of hits
        for (let i = 0; i < sentences.length; i++) {
            const original = sentences[i];
            const sSafeHits = safeHits.filter(h => h.sentenceIndex === i);
            const sBannedHits = findBannedJargonHits(original);

            if (sSafeHits.length === 0 && sBannedHits.length === 0) continue;

            // LLM gated: repair ONLY this sentence
            const repaired = await repairSentence({
                sectionKey: key,
                sentence: original,
                hits: sSafeHits,
                bannedHits: sBannedHits
            });

            if (repaired && repaired !== original) {
                const before = original.substring(0, 50);
                sentences[i] = repaired.trim();
                result.repairedSentences++;

                if (result.samples.beforeAfterSnippets.length < 3) {
                    result.samples.beforeAfterSnippets.push(`[JARGON_REPAIR] ${before}... -> ${sentences[i].substring(0, 50)}...`);
                }
            }
        }

        sec.livedReality = sentences.join(" ");
    }

    // 2. No-Repeat Guard
    enforceNoRepeat(sections, result.noRepeat);

    // 3. THE CALL Spec
    enforceCallSpec(sections, result.callSpec);

    console.log(`[MirrorNarrative][ENFORCEMENT] Complete. jargonHits=${result.jargonHitsCount} repairedSentences=${result.repairedSentences} noRepeatTriggered=${result.noRepeat.triggered} callSpecPatched=${result.callSpec.patched}`);

    return result;
}

async function repairSentence(params: {
    sectionKey: string;
    sentence: string;
    hits: JargonHit[];
    bannedHits: string[];
}): Promise<string> {
    const { sectionKey, sentence, hits, bannedHits } = params;

    // MOCK FOR TESTS (Ticket MT-2026-02-04-STRICT-002)
    // Only bypass if explicitly requested offline to allow existing mocked unit tests to run
    if (process.env.EXEC_BRIEF_MIRROR_OFFLINE === 'true') {
        let out = sentence;
        // Simple deterministic "repair" for tests: replace with first replacement or generic redacted
        hits.forEach(h => {
            out = out.replace(new RegExp(h.phrase, 'gi'), h.replacement);
        });
        bannedHits.forEach(b => {
            out = out.replace(new RegExp(b, 'gi'), '[REDACTED_VOICE]');
        });
        return out;
    }

    const safeSummary = hits
        .map(h => `"${h.phrase}" -> "${h.replacement}"`)
        .slice(0, 6)
        .join(", ");

    const bannedSummary = bannedHits.join(", ");

    // STRICT: rewrite only this sentence, keep meaning, operator voice, no consulting-speak.
    const systemPrompt = `Rewrite ONE sentence. Keep meaning. Operator voice. No consulting jargon.
RULES:
- output exactly one sentence
- no placeholders, no generic abstractions
- remove or replace banned business jargon: ${bannedSummary} ${safeSummary ? `(suggested: ${safeSummary})` : ''}
- avoid: strategy/framework/synergy/optimize/velocity/manifestations/structural/systemic
- keep it concrete; if possible, add one operational anchor (dispatch, scheduling, handoffs, phones, inventory, training, customer escalations, marketing tracking)`;

    const userPrompt = `Section: ${sectionKey}
Sentence: ${sentence}

REPAIR ONE SENTENCE NOW:`;

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 120
        });

        return response.choices[0].message.content?.trim() || sentence;
    } catch (err) {
        console.error('[MirrorNarrative][REPAIR_SENTENCE] Failed:', err);
        return sentence;
    }
}
