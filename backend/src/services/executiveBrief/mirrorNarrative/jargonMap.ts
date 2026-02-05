/**
 * LINT-ONLY JARGON MAP
 * This file is intentionally SMALL and HIGH-CONFIDENCE.
 * Do NOT expand into a “business translation engine”.
 *
 * Rules:
 * - multi-word phrases only (no single-word swaps)
 * - no context-dependent noun replacements (e.g. “strategy”, “framework”, “systemic”)
 * - used for detection + targeted sentence repair only
 */

export type JargonHit = {
    phrase: string;
    replacement: string;
    sectionKey: string;
    sentenceIndex: number;
    severity: "LOW" | "MEDIUM" | "HIGH";
};

// Keep <= 25 entries. Multi-word phrases only.
export const SAFE_JARGON_PHRASES: Record<string, { replacement: string; severity: JargonHit["severity"] }> = {
    "leveraging synergies": { replacement: "working together", severity: "HIGH" },
    "execution velocity": { replacement: "overall pace", severity: "MEDIUM" },
    "best practices": { replacement: "what works", severity: "MEDIUM" },
    "key stakeholders": { replacement: "the team leads", severity: "MEDIUM" },
    "strategic alignment": { replacement: "shared focus", severity: "MEDIUM" },
    "value proposition": { replacement: "the pitch", severity: "LOW" },
    "north star": { replacement: "the target", severity: "LOW" },
    "low-hanging fruit": { replacement: "easy win", severity: "LOW" },
    "move the needle": { replacement: "change results", severity: "LOW" },
    "at scale": { replacement: "as volume grows", severity: "LOW" },
    "pain point": { replacement: "the problem", severity: "LOW" },
    "bandwidth constraints": { replacement: "time constraints", severity: "LOW" },
    "resource allocation": { replacement: "where time and money go", severity: "MEDIUM" },
    "operating model": { replacement: "how we run", severity: "LOW" },
    "feedback loop": { replacement: "a simple check-in loop", severity: "LOW" },
    "single source of truth": { replacement: "one place everyone trusts", severity: "LOW" },
};

// “Banned jargon” is NOT the jargon map. It is a detection list that triggers
// sentence-only repair via LLM (no global replace).
export const BANNED_JARGON_TERMS: string[] = [
    // keep this list short + stable; use enforcement repair, not substitution
    "cross-functional",
    "go-to-market",
];

export const BANNED_MAP_TOKENS = [
    // prevent future context-dependent noun swaps
    "strategy",
    "framework",
    "systemic",
    "structural",
    "manifestations",
    "alignment signals",
];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function splitIntoSentences(text: string): string[] {
    // simple deterministic sentence split; we don’t need perfect NLP here
    const t = (text || "").trim();
    if (!t) return [];
    return t
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);
}

export function findJargonHits(params: { sectionKey: string; text: string }): JargonHit[] {
    const { sectionKey, text } = params;
    const sentences = splitIntoSentences(text);
    const hits: JargonHit[] = [];

    const entries = Object.entries(SAFE_JARGON_PHRASES);

    for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        for (const [phrase, cfg] of entries) {
            const re = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i");
            if (re.test(s)) {
                hits.push({
                    phrase,
                    replacement: cfg.replacement,
                    sectionKey,
                    sentenceIndex: i,
                    severity: cfg.severity,
                });
            }
        }
    }

    return hits;
}

export function findBannedJargonHits(text: string): string[] {
    const hits: string[] = [];
    const lower = (text || "").toLowerCase();
    for (const term of BANNED_JARGON_TERMS) {
        if (lower.includes(term.toLowerCase())) hits.push(term);
    }
    return hits;
}

export function assertJargonMapGuardrails(): void {
    const entries = Object.entries(SAFE_JARGON_PHRASES);
    const size = entries.length;
    if (size > 25) {
        throw new Error(`[MirrorNarrative][JARGON_MAP] Too many entries: ${size} (max 25). Keep map small.`);
    }

    // disallow single-word keys/values (must be multi-word phrases)
    // definition: contains at least one whitespace boundary after trimming
    const isMultiWord = (s: string) => /\s+/.test(s.trim());

    for (const [k, cfg] of entries) {
        if (!isMultiWord(k)) {
            throw new Error(`[MirrorNarrative][JARGON_MAP] Single-word mapping disallowed: "${k}"`);
        }
        if (!isMultiWord(cfg.replacement)) {
            throw new Error(`[MirrorNarrative][JARGON_MAP] Single-word replacement disallowed for key: "${k}" value: "${cfg.replacement}"`);
        }

        const lower = k.toLowerCase();
        for (const banned of BANNED_MAP_TOKENS) {
            if (lower.includes(banned)) {
                throw new Error(`[MirrorNarrative][JARGON_MAP] Banned token "${banned}" found in phrase "${k}"`);
            }
        }
    }
}
