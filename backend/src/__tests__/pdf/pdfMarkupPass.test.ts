/**
 * PDF Markup Pass Tests
 * Verifies presentation rules are applied correctly
 */

import { describe, it, expect } from 'vitest';
import { stripPdfSuppressedMeta, mitigateRepetition, footerLine } from '../../services/pdf/executiveBriefPdfRules';

describe('PDF Markup Pass - Presentation Rules', () => {
    describe('stripPdfSuppressedMeta', () => {
        it('should remove "Mode 2 Expansion Applied" banner', () => {
            const input = 'Mode 2 Expansion Applied\n\nThis is the content.';
            const result = stripPdfSuppressedMeta(input);
            expect(result).not.toContain('Mode 2 Expansion Applied');
            expect(result).toContain('This is the content');
        });

        it('should remove methodology language', () => {
            const input = 'The methodology used here is diagnostic.';
            const result = stripPdfSuppressedMeta(input);
            expect(result).not.toContain('methodology');
            expect(result).not.toContain('diagnostic');
        });

        it('should remove "These inputs will be used to" phrases', () => {
            const input = 'These inputs will be used to generate insights.';
            const result = stripPdfSuppressedMeta(input);
            expect(result).not.toContain('These inputs will be used to');
        });

        it('should remove "factual substrate" language', () => {
            const input = 'This represents the factual substrate of the analysis.';
            const result = stripPdfSuppressedMeta(input);
            expect(result).not.toContain('factual substrate');
        });
    });

    describe('mitigateRepetition', () => {
        it('should replace repeated "Your team" openers', () => {
            const paragraphs = [
                'Your team is executing well.',
                'Your team faces challenges.',
                'Different content here.'
            ];
            const result = mitigateRepetition(paragraphs);

            expect(result[0]).toContain('Your team');
            expect(result[1]).toContain('The organization');
            expect(result[1]).not.toContain('Your team');
        });

        it('should replace repeated "Your execution" openers', () => {
            const paragraphs = [
                'Your execution is strong.',
                'Your execution shows gaps.'
            ];
            const result = mitigateRepetition(paragraphs);

            expect(result[0]).toContain('Your execution');
            expect(result[1]).toContain('Execution today');
        });

        it('should only mitigate once per section', () => {
            const paragraphs = [
                'Your team is working.',
                'Your team is struggling.',
                'Your team is adapting.'
            ];
            const result = mitigateRepetition(paragraphs);

            // First should be unchanged
            expect(result[0]).toContain('Your team');
            // Second should be mitigated
            expect(result[1]).toContain('The organization');
            // Third should NOT be mitigated (only once per section)
            expect(result[2]).toContain('Your team');
        });

        it('should not modify non-repetitive paragraphs', () => {
            const paragraphs = [
                'Your team is executing well.',
                'The business shows strength.',
                'Execution today is solid.'
            ];
            const result = mitigateRepetition(paragraphs);

            expect(result).toEqual(paragraphs);
        });
    });

    describe('footerLine', () => {
        it('should format footer correctly', () => {
            const result = footerLine('Acme Corp', 'Feb 3, 2026', 1);
            expect(result).toBe('Acme Corp | Feb 3, 2026 | Page 1');
        });

        it('should not include "of X" or metadata', () => {
            const result = footerLine('Test Co', 'Jan 1, 2026', 2);
            expect(result).not.toContain('of');
            expect(result).not.toContain('End of Brief');
            expect(result).not.toContain('Prepared by');
        });
    });
});
