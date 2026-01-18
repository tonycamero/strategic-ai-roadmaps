// Executive Brief Rendering Contract (v3) - SOURCE OF TRUTH
export type RenderMode = 'PROSE_NARRATIVE' | 'PATTERN_LIST' | 'METRIC_CALLOUT' | 'BULLET_LIST';

export interface MetricBlock {
    level: 'Low' | 'Medium' | 'High';
    interpretation: string;
    capacityScore?: number;
}

export interface ExecutiveBriefSection {
    id: string;
    title: string;
    sublabel?: string;
    intro?: string;
    content: string | string[] | MetricBlock;
    renderMode: RenderMode;
}

export type ViewProjection = 'PRIVATE' | 'SYSTEM';

/**
 * Pure helper for text normalization
 */
export function normalizeText(s: unknown): string {
    if (!s) return "";
    let text = String(s).replace(/\r\n/g, '\n').trim();
    text = text.replace(/[ \t]+/g, ' ');
    const lines = text.split('\n').map(l => l.trim());
    const cleanLines = lines.filter(line => {
        if (!line) return true;
        const junk = /^(,|,,|;|—|-)$/;
        return !junk.test(line);
    });
    return cleanLines.join('\n');
}

/**
 * Pure helper for signal meaningfulness
 */
export function isMeaningfulValue(x: unknown): boolean {
    if (x === null || x === undefined) return false;
    const s = String(x).trim();
    const lower = s.toLowerCase();
    if (lower === "" || lower === "," || lower === ",," || lower === ";" || lower === "unknown" || lower === "n/a") return false;
    if (/^[.,;!?\- ]+$/.test(s)) return false;
    return true;
}

/**
 * Cognitive Paragraph Splitting
 */
export function splitSentences(text: string, every: number = 4): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const groups: string[] = [];
    for (let i = 0; i < sentences.length; i += every) {
        groups.push(sentences.slice(i, i + every).join(" ").trim());
    }
    return groups;
}

/**
 * Signal Normalization for METRIC mode
 */
export function normalizeToMetric(input: any, type: "RISK" | "READINESS"): MetricBlock {
    const rawValues = Array.isArray(input) ? input : [String(input)];
    const interpretation: string[] = [];
    let level: "Low" | "Medium" | "High" = "Medium";
    let capacityScore: number | undefined;

    rawValues.forEach(v => {
        let s = String(v).trim();
        if (!isMeaningfulValue(s)) return;

        const levelPrefixReg = /^(low|medium|high)\b[\s,:]*/i;
        while (levelPrefixReg.test(s)) {
            const match = s.match(levelPrefixReg);
            if (match) {
                level = (match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()) as any;
                s = s.replace(levelPrefixReg, "").trim();
            }
        }

        if (!s) return;

        if (type === "READINESS") {
            const scoreMatch = s.match(/^(\d+)(?:\s*\/10)?\b/);
            if (scoreMatch) {
                capacityScore = parseInt(scoreMatch[1]);
                if (s.replace(/^(\d+)(?:\s*\/10)?[\s,.]*/, "").trim().length === 0) return;
            }
        }

        const cleanVal = s.replace(/[,;]+$/, "").trim();
        if (cleanVal && !interpretation.includes(cleanVal)) {
            interpretation.push(cleanVal);
        }
    });

    return {
        level,
        capacityScore,
        interpretation: interpretation.join(". ").replace(/\.\s+\./g, ".").trim()
    };
}

/**
 * Semantic Reduction for System View
 */
export function projectToSystem(text: string): string {
    return text
        .replace(/\b(I feel|We found|I observed|In my opinion|Personally|The team feels)\b/gi, "Observed evidence suggests")
        .replace(/\b(He|She|They) (said|mentioned|noted)\b/gi, "Field signals indicate")
        .replace(/\b(it's critical to|important to|must)\b/gi, "system requirement:")
        .replace(/!/g, ".")
        .trim();
}

/**
 * Contract Validation (Fail-Closed)
 */
export function validateSection(section: ExecutiveBriefSection): boolean {
    if (!section.content) return false;

    if (section.renderMode === 'BULLET_LIST') {
        if (!Array.isArray(section.content)) return false;
        const validBullets = section.content.filter(s => String(s).trim().length > 5);
        if (validBullets.length < 2) return false;
    }

    if (section.renderMode === 'METRIC_CALLOUT') {
        const m = section.content as MetricBlock;
        if (!m.level || !m.interpretation || m.interpretation.length < 20) return false;
    }

    if (section.renderMode === 'PROSE_NARRATIVE') {
        if (typeof section.content !== 'string') return false;
        if (section.content.trim().length < 40) return false;
    }

    if (section.renderMode === 'PATTERN_LIST') {
        if (typeof section.content !== 'string' && !Array.isArray(section.content)) return false;
        if (!section.intro) return false;
    }

    return true;
}
