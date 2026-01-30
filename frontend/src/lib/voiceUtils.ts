/**
 * AG-TICKET-08: Voice utilities for sanitizing and validating user voice notes
 * Phase 2: Evidence injection (no AI calls, purely deterministic rules)
 */

const FILLER_PATTERNS = [
    /^n\/?a$/i,
    /^none$/i,
    /^idk$/i,
    /^no$/i,
    /^nope$/i,
    /^asdf$/i,
    /^\.+$/,
    /^-+$/,
    /^_+$/,
    /^skip$/i,
    /^pass$/i,
];

const PLACEHOLDER_TEXT = "What happened the last time this occurred?";

/**
 * Sanitizes voice input by trimming, collapsing whitespace, and removing quotes
 */
export function sanitizeVoice(input: string): string {
    if (!input) return '';

    let sanitized = input.trim();

    // Collapse multiple whitespaces into single space
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Remove leading/trailing quotes
    sanitized = sanitized.replace(/^["']+|["']+$/g, '');

    // Hard cap at 240 chars with ellipsis
    if (sanitized.length > 240) {
        sanitized = sanitized.substring(0, 237) + '…';
    }

    return sanitized;
}

/**
 * Checks if voice input is usable for evidence injection
 */
export function isUsableVoice(input: string): boolean {
    const sanitized = sanitizeVoice(input);

    // Must be at least 12 characters
    if (sanitized.length < 12) return false;

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(sanitized)) return false;

    // Must not match filler patterns
    for (const pattern of FILLER_PATTERNS) {
        if (pattern.test(sanitized)) return false;
    }

    // Must not be identical to placeholder text
    if (sanitized.toLowerCase() === PLACEHOLDER_TEXT.toLowerCase()) return false;

    return true;
}

/**
 * Formats sanitized voice input as a quoted evidence string
 */
export function formatEvidenceQuote(input: string): string {
    const sanitized = sanitizeVoice(input);
    return `"${sanitized}"`;
}
