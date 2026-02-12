/**
 * EXEC-BRIEF-MIRROR-VOICE-016
 * Mirror Narrative Contract Tests
 * 
 * Validates that mirror narrative output meets voice contract requirements:
 * - No banlist phrases
 * - No debug/taxonomy leakage
 * - Decision-oriented executive summary
 * - Proper structure (1-3 paragraphs per section)
 */

// Load env FIRST (before any OpenAI imports)
import '../helpers/loadEnv';
import { loadBackendEnv } from '../helpers/loadEnv.ts';
loadBackendEnv();

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { executeSynthesisPipeline } from '../../services/executiveBriefSynthesis.service.ts';

const FIXTURES_DIR = join(process.cwd(), 'src/__tests__/fixtures/executiveBriefSynthesis');

const BANLIST_PHRASES = [
    'signals detected',
    'risk exposure identified',
    'execution drag',
    'resource inefficiency',
    'coordination overhead',
    'resource allocation requires systematic review',
    'operational manifestations include',
    'structural constraints limit execution capacity',
    'contextual understanding shapes execution strategy',
    'insufficient contrast',
    'role-specific operating detail'
];

const DECISION_WORDS = [
    'decide', 'choose', 'commit', 'prioritize', 'tradeoff', 'stop', 'start', 'focus'
];

const TAXONOMY_TOKENS = [
    'OPERATING_REALITY', 'CONSTRAINT_LANDSCAPE', 'BLIND_SPOT_RISKS', 'ALIGNMENT_SIGNALS',
    'EXEC_SUMMARY', 'EXECUTIVE_SYNTHESIS'
];

describe('Mirror Narrative Contract Tests', () => {
    // Enable feature flag for these tests
    beforeAll(() => {
        process.env.EXEC_BRIEF_MIRROR_NARRATIVE = 'true';
        process.env.EXEC_BRIEF_MIRROR_OFFLINE = 'true';
        process.env.EXEC_BRIEF_MODE2_EXPANSION_ENABLED = 'false'; // Disable LLM expansion for determinism
    });

    // EXEC-BRIEF-MIRROR-JSON-REQ-016C: Verify JSON requirement in prompt
    it('should include "json" in prompt when using json_object response format', () => {
        // This test verifies the OpenAI API requirement:
        // When using response_format: { type: 'json_object' }, messages must contain "json"

        // We can't directly test the private buildSystemPrompt function,
        // but we can verify the requirement is documented and the fix is in place
        // by checking the source file contains the required text
        const serviceSource = readFileSync(
            join(__dirname, '../../services/executiveBriefMirrorNarrative.service.ts'),
            'utf-8'
        );

        // Verify the system prompt contains "json" (case-insensitive)
        expect(serviceSource.toLowerCase()).toContain('json only');
        expect(serviceSource.toLowerCase()).toContain('json object');
        expect(serviceSource).toContain('response_format: { type: \'json_object\' }');
    });

    const fixtures = [
        'fixture_minimal_valid.json',
        'fixture_typical_valid.json',
        'fixture_high_variance_valid.json'
    ];

    fixtures.forEach(fixtureName => {
        describe(`Fixture: ${fixtureName}`, () => {
            let result: any;

            beforeAll(async () => {
                const raw = readFileSync(join(FIXTURES_DIR, fixtureName), 'utf-8');
                const data = JSON.parse(raw);
                result = await executeSynthesisPipeline(data.vectors);
            }, 20000);

            it('should generate narrative with proper structure', () => {
                // Check sections exist
                expect(result.content.sections).toBeDefined();
                expect(result.content.sections.EXEC_SUMMARY).toBeDefined();
                expect(result.content.sections.OPERATING_REALITY).toBeDefined();
                expect(result.content.sections.CONSTRAINT_LANDSCAPE).toBeDefined();
                expect(result.content.sections.BLIND_SPOT_RISKS).toBeDefined();
                expect(result.content.sections.ALIGNMENT_SIGNALS).toBeDefined();

                // Each section should have 1-3 paragraphs
                expect(result.content.sections.EXEC_SUMMARY.length).toBeGreaterThanOrEqual(1);
                expect(result.content.sections.EXEC_SUMMARY.length).toBeLessThanOrEqual(3);

                expect(result.content.sections.OPERATING_REALITY.length).toBeGreaterThanOrEqual(1);
                expect(result.content.sections.OPERATING_REALITY.length).toBeLessThanOrEqual(3);

                expect(result.content.sections.CONSTRAINT_LANDSCAPE.length).toBeGreaterThanOrEqual(1);
                expect(result.content.sections.CONSTRAINT_LANDSCAPE.length).toBeLessThanOrEqual(3);

                expect(result.content.sections.BLIND_SPOT_RISKS.length).toBeGreaterThanOrEqual(1);
                expect(result.content.sections.BLIND_SPOT_RISKS.length).toBeLessThanOrEqual(3);

                expect(result.content.sections.ALIGNMENT_SIGNALS.length).toBeGreaterThanOrEqual(1);
                expect(result.content.sections.ALIGNMENT_SIGNALS.length).toBeLessThanOrEqual(3);
            });

            it('should not contain banlist phrases', () => {
                // Collect all narrative text from mirror narrative layer
                const allText = [
                    result.content.mirrorSummary || result.content.executiveSummary,
                    result.content.mirrorSections?.OPERATING_REALITY ?
                        `${result.content.mirrorSections.OPERATING_REALITY.livedReality} ${result.content.mirrorSections.OPERATING_REALITY.costOfStatusQuo} ${result.content.mirrorSections.OPERATING_REALITY.theCall}` :
                        result.content.operatingReality,
                    result.content.mirrorSections?.CONSTRAINT_LANDSCAPE ?
                        `${result.content.mirrorSections.CONSTRAINT_LANDSCAPE.livedReality} ${result.content.mirrorSections.CONSTRAINT_LANDSCAPE.costOfStatusQuo} ${result.content.mirrorSections.CONSTRAINT_LANDSCAPE.theCall}` :
                        result.content.constraintLandscape,
                    result.content.mirrorSections?.BLIND_SPOT_RISKS ?
                        `${result.content.mirrorSections.BLIND_SPOT_RISKS.livedReality} ${result.content.mirrorSections.BLIND_SPOT_RISKS.costOfStatusQuo} ${result.content.mirrorSections.BLIND_SPOT_RISKS.theCall}` :
                        result.content.blindSpotRisks,
                    result.content.mirrorSections?.ALIGNMENT_SIGNALS ?
                        `${result.content.mirrorSections.ALIGNMENT_SIGNALS.livedReality} ${result.content.mirrorSections.ALIGNMENT_SIGNALS.costOfStatusQuo} ${result.content.mirrorSections.ALIGNMENT_SIGNALS.theCall}` :
                        result.content.alignmentSignals
                ].join(' ').toLowerCase();

                // Check for banlist phrases
                BANLIST_PHRASES.forEach(phrase => {
                    expect(allText).not.toContain(phrase.toLowerCase());
                });
            });

            it('should not contain ALL_CAPS taxonomy tokens', () => {
                // Collect all narrative text from mirror narrative layer
                const allText = [
                    result.content.mirrorSummary || result.content.executiveSummary,
                    result.content.mirrorSections?.OPERATING_REALITY ?
                        `${result.content.mirrorSections.OPERATING_REALITY.livedReality} ${result.content.mirrorSections.OPERATING_REALITY.costOfStatusQuo} ${result.content.mirrorSections.OPERATING_REALITY.theCall}` :
                        result.content.operatingReality,
                    result.content.mirrorSections?.CONSTRAINT_LANDSCAPE ?
                        `${result.content.mirrorSections.CONSTRAINT_LANDSCAPE.livedReality} ${result.content.mirrorSections.CONSTRAINT_LANDSCAPE.costOfStatusQuo} ${result.content.mirrorSections.CONSTRAINT_LANDSCAPE.theCall}` :
                        result.content.constraintLandscape,
                    result.content.mirrorSections?.BLIND_SPOT_RISKS ?
                        `${result.content.mirrorSections.BLIND_SPOT_RISKS.livedReality} ${result.content.mirrorSections.BLIND_SPOT_RISKS.costOfStatusQuo} ${result.content.mirrorSections.BLIND_SPOT_RISKS.theCall}` :
                        result.content.blindSpotRisks,
                    result.content.mirrorSections?.ALIGNMENT_SIGNALS ?
                        `${result.content.mirrorSections.ALIGNMENT_SIGNALS.livedReality} ${result.content.mirrorSections.ALIGNMENT_SIGNALS.costOfStatusQuo} ${result.content.mirrorSections.ALIGNMENT_SIGNALS.theCall}` :
                        result.content.alignmentSignals
                ].join(' ');

                // Check for taxonomy tokens
                TAXONOMY_TOKENS.forEach(token => {
                    expect(allText).not.toContain(token);
                });
            });

            it('should not contain debug markers', () => {
                // Collect all narrative text
                const allText = [
                    result.content.executiveSummary,
                    result.content.operatingReality,
                    result.content.constraintLandscape,
                    result.content.blindSpotRisks,
                    result.content.alignmentSignals
                ].join(' ');

                // Check for debug markers
                expect(allText).not.toMatch(/\[DEBUG|TODO|FIXME|XXX\]/i);
            });

            it('should have decision-oriented executive summary', () => {
                const summaryLower = result.content.executiveSummary.toLowerCase();

                // Check for at least one decision word
                const hasDecisionWord = DECISION_WORDS.some(word =>
                    new RegExp(`\\b${word}\\b`).test(summaryLower)
                );

                expect(hasDecisionWord).toBe(true);
            });

            it('should maintain flattened content consistency', () => {
                // Flattened content should match sections joined with \n\n
                expect(result.content.operatingReality).toBe(
                    result.content.sections.OPERATING_REALITY.join('\n\n')
                );
                expect(result.content.constraintLandscape).toBe(
                    result.content.sections.CONSTRAINT_LANDSCAPE.join('\n\n')
                );
                expect(result.content.blindSpotRisks).toBe(
                    result.content.sections.BLIND_SPOT_RISKS.join('\n\n')
                );
                expect(result.content.alignmentSignals).toBe(
                    result.content.sections.ALIGNMENT_SIGNALS.join('\n\n')
                );
            });
        });
    });
});
