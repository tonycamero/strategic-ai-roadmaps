import { describe, it, expect } from 'vitest';
import { normalizeParagraphs, keepWithNext } from '../executiveBriefPdfRules.ts';

describe('PDF Pagination & Normalization', () => {

    it('normalizeParagraphs: collapses whitespace and multi-newlines', () => {
        const raw = `
        Para 1
        
        
        Para 2   
        
        Para 3
        `;
        const normalized = normalizeParagraphs(raw);
        expect(normalized).toHaveLength(3);
        expect(normalized[0]).toBe('Para 1');
        expect(normalized[1]).toBe('Para 2');
        expect(normalized[2]).toBe('Para 3');
    });

    it('keepWithNext: protects against widow/orphan headers', () => {
        const lineHeight = 15;
        const minLines = 4;

        // Plenty of space (remaining 100, needed 60)
        expect(keepWithNext(minLines, lineHeight, 100)).toBe(false);

        // Tight space (remaining 50, needed 60)
        expect(keepWithNext(minLines, lineHeight, 50)).toBe(true);
    });

});
