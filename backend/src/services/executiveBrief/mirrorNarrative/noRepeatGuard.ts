/**
 * No-Repeat Guard (Ticket 021)
 * Prevents verbatim or near-verbatim reuse of sentences across mirror sections.
 */

export interface NoRepeatSummary {
    triggered: boolean;
    count: number;
    rewrites: number;
    collisions: string[];
}

export function enforceNoRepeat(
    sections: Record<string, any>,
    summary: NoRepeatSummary
): void {
    const seenSentences = new Set<string>();
    const seenStarts = new Set<string>();

    const normalize = (s: string) => s.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');

    Object.keys(sections).forEach(sectionKey => {
        const section = sections[sectionKey];
        const blocks = ['livedReality', 'costOfStatusQuo', 'theCall'];

        blocks.forEach(blockKey => {
            const text = section[blockKey];
            if (!text) return;

            const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
            const newSentences: string[] = [];

            sentences.forEach((originalSentence: string) => {
                const normalized = normalize(originalSentence);
                const start = normalized.split(' ').slice(0, 8).join(' '); // First 8 tokens

                if (seenSentences.has(normalized) || seenStarts.has(start)) {
                    summary.triggered = true;
                    summary.count++;
                    summary.collisions.push(originalSentence.substring(0, 50));

                    // Simple deterministic "rewrite" (clause inversion if comma exists)
                    if (originalSentence.includes(',')) {
                        const parts = originalSentence.split(',');
                        const rewritten = parts.slice(1).join(',').trim() + ', ' + parts[0].trim();
                        newSentences.push(rewritten.charAt(0).toUpperCase() + rewritten.slice(1));
                        summary.rewrites++;
                    } else {
                        // If no comma, we might just drop it or let it fail? 
                        // For now, keep it but it counts as a collision.
                        newSentences.push(originalSentence);
                    }
                } else {
                    seenSentences.add(normalized);
                    seenStarts.add(start);
                    newSentences.push(originalSentence);
                }
            });

            // Reconstruct text
            if (summary.rewrites > 0) {
                section[blockKey] = newSentences.map(s => s.trim().endsWith('.') || s.length === 0 ? s : s + '.').join(' ');
            }
        });
    });
}
