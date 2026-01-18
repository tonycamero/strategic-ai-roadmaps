<<<<<<< HEAD
import { CONTRACT_LIMITS, getSectionTitle, VISIBILITY_RULES } from "./executiveBrief.contract";

/**
 * Pure helper for text normalization
 */
export function normalizeText(s: any): string {
    if (!s)
        return "";
    let text = String(s).replace(/\r\n/g, '\n').trim();
    text = text.replace(/[ \t]+/g, ' ');
    const lines = text.split('\n').map(l => l.trim());
    const cleanLines = lines.filter(line => {
        if (!line)
            return true; // keep blank lines for paragraph splitting
        const junk = /^(,|,,|;|—|-)$/;
        return !junk.test(line);
    });
    return cleanLines.join('\n');
}

/**
 * Pure helper for signal meaningfulness
 */
export function isMeaningfulValue(x: any): boolean {
    if (x === null || x === undefined)
        return false;
    const s = String(x).trim();
    const lower = s.toLowerCase();
    // List of garbage/placeholder tokens
    if (lower === "" || lower === "," || lower === ",," || lower === ";" || lower === "unknown" || lower === "n/a")
        return false;
    // Standalone punctuation/operators
    if (/^[.,;!?\- ]+$/.test(s))
        return false;
    return true;
}

/**
 * Cognitive Paragraph Splitting
 */
export function splitSentences(text: string, every = CONTRACT_LIMITS.SENTENCES_PER_PARAGRAPH): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const groups = [];
    for (let i = 0; i < sentences.length; i += every) {
        groups.push(sentences.slice(i, i + every).join(" ").trim());
    }
    return groups;
}

/**
 * Signal Normalization for METRIC mode
 */
export function normalizeToMetric(input: any, type: string) {
    const rawValues = Array.isArray(input) ? input : [String(input)];
    const interpretation: string[] = [];
    let level = "Medium";
    let capacityScore: number | undefined;
    rawValues.forEach((v: any) => {
        let s = String(v).trim();
        if (!isMeaningfulValue(s))
            return;
        const levelPrefixReg = /^(low|medium|high)\b[\s,:]*/i;
        while (levelPrefixReg.test(s)) {
            const match = s.match(levelPrefixReg);
            if (match) {
                level = (match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase());
                s = s.replace(levelPrefixReg, "").trim();
            }
        }
        if (!s)
            return;
        if (type === "READINESS") {
            const scoreMatch = s.match(/^(\d+)(?:\s*\/10)?\b/);
            if (scoreMatch) {
                capacityScore = parseInt(scoreMatch[1]);
                if (s.replace(/^(\d+)(?:\s*\/10)?[\s,.]*/, "").trim().length === 0)
                    return;
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
export function validateSection(section: any): boolean {
    if (!section.content)
        return false;
    if (section.renderMode === 'BULLET_LIST') {
        if (!Array.isArray(section.content))
            return false;
        const validBullets = section.content.filter((s: any) => String(s).trim().length >= CONTRACT_LIMITS.MIN_BULLET_LENGTH);
        if (validBullets.length < 2)
            return false;
    }
    if (section.renderMode === 'METRIC_CALLOUT') {
        const m = section.content;
        if (!m.level || !m.interpretation || m.interpretation.length < CONTRACT_LIMITS.MIN_INTERPRETATION_LENGTH)
            return false;
    }
    if (section.renderMode === 'PROSE_NARRATIVE') {
        if (typeof section.content !== 'string')
            return false;
        if (section.content.trim().length < CONTRACT_LIMITS.MIN_PROSE_LENGTH)
            return false;
    }
    if (section.renderMode === 'PATTERN_LIST') {
        if (typeof section.content !== 'string' && !Array.isArray(section.content))
            return false;
        if (!section.intro)
            return false;
    }
    return true;
}

/**
 * Helper to convert missing signals to human-readable text
 */
export function missingSignalsToHuman(missing: string[]): string {
    return missing.map((m) => {
        if (m === "constraints")
            return "Constraints not explicitly articulated";
        if (m === "blind_spots" || m === "blindSpots")
            return "Blind spots not explicitly articulated";
        if (m === "operating_reality")
            return "Operational reality context missing";
        if (m === "alignment")
            return "Alignment/Conflict signals missing";
        return `Missing signal: ${m}`;
    }).join(", ");
}

/**
 * Synthesis Mapper (Zero Drift)
 * Maps raw synthesis and signals to the canonical section model.
 */
export function mapSynthesisToSections(synthesis: any, signals?: any) {
    const rawLandscape = Array.isArray(synthesis.constraintLandscape)
        ? synthesis.constraintLandscape
        : [synthesis.constraintLandscape];
    const sections = [
        {
            id: 'operating-reality',
            title: getSectionTitle('operating-reality'),
            content: synthesis.operatingReality,
            renderMode: 'PATTERN_LIST',
            intro: "This section surfaces recurring execution patterns where leadership intent and day-to-day operations diverge, based on cross-role intake synthesis."
        },
        {
            id: 'constraint-landscape',
            title: getSectionTitle('constraint-landscape'),
            content: rawLandscape.filter((x: any) => isMeaningfulValue(x)),
            renderMode: 'BULLET_LIST'
        },
        {
            id: 'alignment-signals',
            title: getSectionTitle('alignment-signals'),
            content: synthesis.alignmentSignals,
            renderMode: 'PROSE_NARRATIVE',
            sublabel: "Future-state signal mapping and desired operational transparency."
        },
        {
            id: 'blind-spot-risks',
            title: getSectionTitle('blind-spot-risks'),
            content: synthesis.blindSpotRisks,
            renderMode: 'PROSE_NARRATIVE'
        },
        {
            id: 'risk-signals',
            title: getSectionTitle('risk-signals'),
            content: normalizeToMetric(synthesis.riskSignals, "RISK"),
            renderMode: 'METRIC_CALLOUT'
        },
        {
            id: 'readiness-signals',
            title: getSectionTitle('readiness-signals'),
            content: normalizeToMetric(synthesis.readinessSignals, "READINESS"),
            renderMode: 'METRIC_CALLOUT'
        },
        {
            id: 'executive-summary',
            title: getSectionTitle('executive-summary'),
            content: synthesis.executiveSummary,
            renderMode: 'PROSE_NARRATIVE'
        }
    ];
    return sections.filter(validateSection);
}

/**
 * projectSections
 * Applies visibility rules and semantic reduction to a list of sections.
 */
export function projectSections(sections: any[], view: 'SYSTEM' | 'PRIVATE') {
    const rules = VISIBILITY_RULES[view];
    return sections
        .filter(s => !(rules.excludeIds as string[]).includes(s.id))
        .map(section => {
            const s = { ...section };
            const isSystem = view === 'SYSTEM';
            if (isSystem) {
                if (typeof s.content === 'string') {
                    s.content = projectToSystem(s.content);
                }
                else if (Array.isArray(s.content)) {
                    s.content = s.content.map((c: any) => projectToSystem(c));
                }
                else {
                    const m = { ...s.content };
                    m.interpretation = projectToSystem(m.interpretation);
                    s.content = m;
                }
            }
            return s;
        });
}
=======
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
>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
