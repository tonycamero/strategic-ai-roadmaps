/**
 * Executive Brief PDF Presentation Rules
 * Pure functions for PDF markup pass (presentation only)
 * 
 * SCOPE: Typography, spacing, suppression, repetition mitigation
 * NOT ALLOWED: Content generation, synthesis logic, scoring
 */

// ============================================================================
// GLOBAL SUPPRESSIONS
// ============================================================================

const SUPPRESSED_PATTERNS = [
    /Mode 2 Expansion Applied/gi,
    /methodology/gi,
    /generation process/gi,
    /stages/gi,
    /These inputs will be used to/gi,
    /No synthesis has been applied/gi,
    /factual substrate/gi,
    /diagnostic/gi,
    /alignment explanation/gi,
    /signal quality/gi,
    /assertion count/gi,
];

/**
 * Remove meta-language and process explanations from PDF content
 */
export function stripPdfSuppressedMeta(text: string): string {
    if (!text) return '';

    let cleaned = text;

    // Apply suppression patterns
    SUPPRESSED_PATTERNS.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // Remove empty lines created by suppressions
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

    return cleaned.trim();
}

// ============================================================================
// REPETITION MITIGATION
// ============================================================================

const REPETITION_SUBSTITUTIONS: Record<string, string> = {
    'Your team': 'The organization',
    'Your execution': 'Execution today',
    'Your business': 'The business',
    'Your organization': 'The organization',
};

/**
 * Mitigate repetitive paragraph openers within a section
 * Changes ONLY the subject phrase of the FIRST sentence
 * Maximum one change per section
 */
export function mitigateRepetition(paragraphs: string[]): string[] {
    if (!paragraphs || paragraphs.length <= 1) return paragraphs;

    const result = [...paragraphs];
    const openers = paragraphs.map(p => {
        const firstSentence = p.split(/[.!?]/)[0];
        const words = firstSentence.trim().split(/\s+/);
        return words.slice(0, 2).join(' '); // First two words
    });

    // Find first repeated opener
    const seen = new Set<string>();
    let mitigated = false;

    for (let i = 0; i < openers.length && !mitigated; i++) {
        const opener = openers[i];

        if (seen.has(opener)) {
            // Found repetition - apply substitution to this paragraph
            for (const [pattern, replacement] of Object.entries(REPETITION_SUBSTITUTIONS)) {
                if (result[i].startsWith(pattern)) {
                    result[i] = result[i].replace(pattern, replacement);
                    mitigated = true;
                    break;
                }
            }
        }

        seen.add(opener);
    }

    return result;
}

/**
 * Generate clean footer line
 * Format: "{Company Name} | {Date} | Page {X}"
 */
export function footerLine(companyName: string, date: string, pageNumber: number): string {
    return `${companyName} | ${date} | Page ${pageNumber}`;
}

/**
 * Collapse whitespace-only lines to avoid empty paragraphs consuming vertical spacing.
 */
export function normalizeParagraphs(raw: string): string[] {
    return raw
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .split("\n\n")
        .map(s => s.trim())
        .filter(Boolean);
}

/**
 * Widow/orphan protection for headings (approximation)
 */
export function keepWithNext(minLines: number, lineHeight: number, remaining: number): boolean {
    return remaining < (minLines * lineHeight);
}

// ============================================================================
// TYPOGRAPHY CONSTANTS (EXEC-BRIEF-PDF-TYPOGRAPHY-REALIGN-025)
// ============================================================================

export const PDF_TYPOGRAPHY = {
    // Title
    title: {
        font: 'Helvetica-Bold',
        size: 15,
        color: '#1E293B', // Dark Slate 800
        marginBottom: 0.8,
    },

    // Body
    body: {
        font: 'Helvetica',
        size: 11.5,
        color: '#334155', // Slate 700 (Readable dark gray)
        lineHeight: 1.45,
        maxLineWidth: 512,
        paragraphSpacing: 1.3,
    },

    // Background (Optional, default is white)
    background: '#FFFFFF',
};
