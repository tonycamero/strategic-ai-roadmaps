/**
 * EXEC-BRIEF-MIRROR-VOICE-016
 * Executive Brief Mirror Narrative Layer
 * 
 * Transforms diagnostic assertions into executive-grade narrative.
 * Uses LLM to generate business-focused language while maintaining strict evidence anchoring.
 */

import OpenAI from 'openai';
import { ExecutiveAssertionBlock, Pattern, ExecutiveBriefSectionKey, MirrorSection } from '../types/executiveBrief.ts';

// Lazy initialization
let openai: OpenAI | null = null;

const LEAD_OPENERS = [
    "Today, we’re seeing",
    "On the floor, it’s showing up as",
    "Lately, what’s been real for us is",
    "In practice, the issue is",
    "The pattern we keep running into is",
    "If we’re being honest, the truth is",
    "As it stands, we’re operating with",
    "This week, it’s been clear that",
    "At the moment, we’re stuck in",
    "What’s actually playing out day to day is"
];

export function getOpenAIClient(): OpenAI {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY missing (env not loaded).');
        }
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openai;
}

export interface MirrorNarrativeInput {
    selectedAssertions: ExecutiveAssertionBlock[];
    briefId?: string;
    patterns?: Pattern[];
    perceptionVsReality?: {
        statedPriority?: string;
        observedReality?: string;
    };
}

export interface MirrorNarrativeOutput {
    sections: Record<ExecutiveBriefSectionKey, MirrorSection>;
    summary: string;
    mirrorPatternIds?: Record<string, string>;
}

const SECTION_LABELS = {
    OPERATING_REALITY: 'Operating Reality',
    CONSTRAINT_LANDSCAPE: 'Constraint Landscape',
    BLIND_SPOT_RISKS: 'Blind Spot Risks',
    ALIGNMENT_SIGNALS: 'Alignment & Leverage'
};

/**
 * Generate executive mirror narrative from selected assertions
 */
export async function generateMirrorNarrative(input: MirrorNarrativeInput): Promise<MirrorNarrativeOutput> {
    const { selectedAssertions, patterns, perceptionVsReality } = input;

    // Group assertions by section
    const assertionsBySection: Record<string, ExecutiveAssertionBlock[]> = {
        OPERATING_REALITY: [],
        CONSTRAINT_LANDSCAPE: [],
        BLIND_SPOT_RISKS: [],
        ALIGNMENT_SIGNALS: []
    };

    selectedAssertions.forEach(a => {
        if (assertionsBySection[a.primarySection]) {
            assertionsBySection[a.primarySection].push(a);
        }
    });

    // MOCK FOR TESTS (Ticket MT-2026-02-04-STRICT-002)
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.EXEC_BRIEF_MIRROR_OFFLINE === 'true') {
        process.stdout.write('[MirrorNarrative] Offline bypass active for test environment.\n');

        const sections: any = {
            OPERATING_REALITY: generateOfflineSection('OPERATING_REALITY', assertionsBySection.OPERATING_REALITY),
            CONSTRAINT_LANDSCAPE: generateOfflineSection('CONSTRAINT_LANDSCAPE', assertionsBySection.CONSTRAINT_LANDSCAPE),
            BLIND_SPOT_RISKS: generateOfflineSection('BLIND_SPOT_RISKS', assertionsBySection.BLIND_SPOT_RISKS),
            ALIGNMENT_SIGNALS: generateOfflineSection('ALIGNMENT_SIGNALS', assertionsBySection.ALIGNMENT_SIGNALS)
        };

        return {
            sections,
            summary: "Decisions: prioritize execution focus, enforce operating standards, and instrument accountability.\n\nOffline mirror narrative generated for test deterministic baseline.",
            mirrorPatternIds: {}
        };
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt();

    // Build user prompt
    const userPrompt = buildUserPrompt(assertionsBySection, perceptionVsReality);

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.4 // Slightly higher for more creative narrative depth
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('LLM returned empty response');
        }

        const parsed = JSON.parse(content);

        // Validate structure
        if (!parsed.executive_summary || !parsed.sections) {
            throw new Error('Invalid narrative structure returned from LLM');
        }

        // Map to output format (Structured MirrorSection)
        const sections: Record<ExecutiveBriefSectionKey, MirrorSection> = {
            EXEC_SUMMARY: {
                livedReality: parsed.executive_summary,
                costOfStatusQuo: '',
                theCall: ''
            },
            OPERATING_REALITY: parsed.sections.OPERATING_REALITY || { livedReality: '', costOfStatusQuo: '', theCall: '' },
            CONSTRAINT_LANDSCAPE: parsed.sections.CONSTRAINT_LANDSCAPE || { livedReality: '', costOfStatusQuo: '', theCall: '' },
            BLIND_SPOT_RISKS: parsed.sections.BLIND_SPOT_RISKS || { livedReality: '', costOfStatusQuo: '', theCall: '' },
            ALIGNMENT_SIGNALS: parsed.sections.ALIGNMENT_SIGNALS || { livedReality: '', costOfStatusQuo: '', theCall: '' }
        };

        // Seed for rotation (Ticket 026C)
        const briefSeed = (input.briefId || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Track pattern IDs for audit (Ticket 026C)
        const mirrorPatternIds: Record<string, string> = {};
        const sectionKeys: ExecutiveBriefSectionKey[] = ['OPERATING_REALITY', 'CONSTRAINT_LANDSCAPE', 'BLIND_SPOT_RISKS', 'ALIGNMENT_SIGNALS'];

        sectionKeys.forEach((key, idx) => {
            const section = sections[key];
            if (!section) return;

            // v2.2 Anchor-First Enforcement (Ticket EXEC-MIRROR-VOICE-OPENERFIX-001)
            // Never inject canned opener templates.
            section.livedReality = ensureAnchorFirstMinimalPatch(key, section.livedReality || '');

            mirrorPatternIds[key] = `lead_anchor_check`;
        });

        return {
            sections,
            summary: parsed.executive_summary,
            mirrorPatternIds
        };
    } catch (error) {
        console.error('[MirrorNarrative] Generation failed:', error);
        throw new Error(`Mirror narrative generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Single-pass repair for violated sections
 */
export async function repairMirrorNarrative(synthesis: any, violations: any[]): Promise<boolean> {
    // Only repair if enabled and violations exist (EXEC-BRIEF-MIRROR-VOICE-FORENSICS-025)
    if (process.env.EXEC_BRIEF_MIRROR_REPAIR_ONCE !== 'true' || violations.length === 0) {
        return false;
    }

    // Identify unique sections to repair
    const sectionKeysToRepair = [...new Set(violations.map(v => v.sectionKey))] as ExecutiveBriefSectionKey[];

    console.log(`[MirrorNarrative][REPAIR] Attempting repair for sections: ${sectionKeysToRepair.join(', ')}. Hard violations: ${violations.length}`);

    // Build map of original texts for the prompt
    const originalTexts: Record<string, any> = {};
    sectionKeysToRepair.forEach(key => {
        const section = key === 'EXEC_SUMMARY'
            ? { livedReality: synthesis.content.mirrorSummary }
            : synthesis.content.mirrorSections?.[key];
        if (section) originalTexts[key] = section;
    });

    if (Object.keys(originalTexts).length === 0) return false;

    // SINGLE REPAIR PASS: Ask for all sections to be rewritten in one JSON response
    const systemPrompt = `You are a strict editor for an executive confidant. 
Your task is to REWRITE the provided sections to comply with these rules:
- Use "we", "us", "our" (first-person plural)
- NEVER use "I", "me", "my", "you", "your"
- NEVER use consulting jargon (stakeholders, leverage, operational efficiency, framework, strategy as a noun, organization, synergies, best practices, execution velocity, etc.)
- Maintain DEPTH: 80-160 words per section.
- Avoid repetitive openers.
- Return the final rewritten sections as a JSON object where each value is a Structured MirrorSection { livedReality, costOfStatusQuo, theCall }.`;

    const userPrompt = `ORIGINAL SECTIONS:\n${JSON.stringify(originalTexts, null, 2)}\n\nREWRITE TO COMPLY NOW (JSON ONLY):`;

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
        });

        const content = response.choices[0].message.content;
        if (!content) return false;

        const repairedSections = JSON.parse(content);

        let anyRepaired = false;
        Object.entries(repairedSections).forEach(([key, repairedSection]: [string, any]) => {
            const sectionKey = key as ExecutiveBriefSectionKey;

            if (sectionKey === 'EXEC_SUMMARY') {
                synthesis.content.mirrorSummary = repairedSection.livedReality;
                if (!synthesis.content.mirrorSections) synthesis.content.mirrorSections = {} as any;
                synthesis.content.mirrorSections![sectionKey] = repairedSection;
            } else {
                if (!synthesis.content.mirrorSections) synthesis.content.mirrorSections = {} as any;
                synthesis.content.mirrorSections![sectionKey] = repairedSection;
            }
            console.log(`[MirrorNarrative][REPAIR] Section ${sectionKey} repaired and synced to mirror layer.`);
            anyRepaired = true;
        });

        return anyRepaired;
    } catch (err) {
        console.error('[MirrorNarrative][REPAIR] Failed:', err);
    }
    return false;
}

/**
 * Validates triad block depth and forces expansion via LLM if shallow.
 * Sentence Requirements: livedReality >= 3, costOfStatusQuo >= 2, theCall >= 1.
 */
export async function enforceTriadDepth(
    sections: Record<ExecutiveBriefSectionKey, MirrorSection>,
    assertionsBySection: Record<string, ExecutiveAssertionBlock[]>
): Promise<void> {
    const minDepth = { livedReality: 3, costOfStatusQuo: 2, theCall: 1 };
    const sectionKeys: ExecutiveBriefSectionKey[] = ['OPERATING_REALITY', 'CONSTRAINT_LANDSCAPE', 'BLIND_SPOT_RISKS', 'ALIGNMENT_SIGNALS'];

    for (const key of sectionKeys) {
        const section = sections[key];
        const assertions = assertionsBySection[key] || [];
        if (!section || assertions.length === 0) continue;

        const blocksToExpand: string[] = [];
        if (countSentences(section.livedReality) < minDepth.livedReality) blocksToExpand.push('livedReality');
        if (countSentences(section.costOfStatusQuo) < minDepth.costOfStatusQuo) blocksToExpand.push('costOfStatusQuo');
        if (countSentences(section.theCall) < minDepth.theCall) blocksToExpand.push('theCall');

        if (blocksToExpand.length > 0) {
            console.log(`[MirrorNarrative][DEPTH] Expanding shallow blocks in ${key}: ${blocksToExpand.join(', ')}`);
            const expanded = await performExpansionPass(key, section, blocksToExpand, assertions);
            if (expanded) {
                sections[key] = { ...section, ...expanded };
            }
        }
    }
}

function countSentences(text: string): number {
    if (!text) return 0;
    return text.split(/[.!?]+/).filter(s => s.trim().length > 10).length; // Filter short fragments
}

async function performExpansionPass(
    sectionKey: string,
    currentSection: MirrorSection,
    blocks: string[],
    evidence: ExecutiveAssertionBlock[]
): Promise<Partial<MirrorSection> | null> {
    const systemPrompt = `You are an executive confidant. Expand the provided shallow narrative blocks.
RULES:
- Maintain "we/our" voice.
- Use only the provided EVIDENCE ANCHORS to add concrete detail.
- Target depth: livedReality (3-4 sentences), costOfStatusQuo (2-3 sentences).
- RETURN JSON ONLY: { "livedReality": "...", "costOfStatusQuo": "...", "theCall": "..." } only for the requested blocks.`;

    const userPrompt = `SECTION: ${sectionKey}
CURRENT CONTENT: ${JSON.stringify(currentSection)}
BLOCKS REQUIRING EXPANSION: ${blocks.join(', ')}
EVIDENCE ANCHORS:
${evidence.map(e => `- ${e.assertion}: ${e.evidence.join('; ')}`).join('\n')}

EXPAND NOW (JSON ONLY):`;

    try {
        const response = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3
        });

        const content = response.choices[0].message.content;
        return content ? JSON.parse(content) : null;
    } catch (err) {
        console.error(`[MirrorNarrative][EXPANSION] Failed for ${sectionKey}:`, err);
        return null;
    }
}

/**
 * v2.2 rule: DO NOT inject canned openers.
 * Only apply a minimal, anchor-first patch if the first sentence lacks BOTH
 * a role label and an operational anchor.
 */
function ensureAnchorFirstMinimalPatch(sectionKey: string, text: string): string {
    const first = (text || "").trim();
    if (!first) return first;

    const hasRole = /\b(owner|gm|general manager|supervisor|ops lead|shift supervisor)\b/i.test(first);
    const hasAnchor = /\b(dispatch|scheduling|handoff|phones|inventory|estimates|follow-up|field)\b/i.test(first);

    // v2.2: only patch if missing BOTH. Never inject an opener template.
    if (hasRole || hasAnchor) return first;

    // Minimal patch: add a short, non-templated anchor prefix.
    const prefixBySection: Record<string, string> = {
        OPERATING_REALITY: "In day-to-day dispatch and handoffs, ",
        CONSTRAINT_LANDSCAPE: "In scheduling and execution flow, ",
        BLIND_SPOT_RISKS: "In handoffs, follow-up, and missed calls, ",
        ALIGNMENT_SIGNALS: "Across dispatch, sales, and the field, ",
        EXEC_SUMMARY: "",
    };

    const prefix = prefixBySection[sectionKey] ?? "";
    if (!prefix) return first;

    return `${prefix}${first.charAt(0).toLowerCase()}${first.slice(1)}`.trim();
}

function buildSystemPrompt(): string {
    return `You are not an external analyst, consultant, or advisor.

You are the executive’s closest internal confidant — someone on the inside, carrying shared responsibility for outcomes.

Voice: first-person plural only (“we”, “our”, “us”). 
Tone: grounded, specific, lived, supportive, and decisive. 

CONTENT RULES (SPECIFICITY & DEPTH)
- Each section total length: 80–160 words.
- Minimum sentences per section: 6.
- Minimum 2 role references per section (e.g., "the shop floor", "the owner", "ops").
- Concrete anchors required: mention specific operational friction (handoffs, inventory, scheduling, escalations).
- NO vague abstractions (e.g., "operational efficiency", "systematic review").

GLOBAL REPETITION BANS (MANDATORY)
- Do not use “This isn’t about …” more than once in the entire document.
- Do not use “The call in front of us is …” more than once in the entire document.
- Do not use any opener (1-10 above) more than once.

MIRROR SECTION STRUCTURE (JSON ONLY):
For each section, provide:
1. livedReality: 2 paragraphs. Ground truth, sensory and operational.
2. costOfStatusQuo: 1 paragraph. Concrete impacts on friction, morale, or hidden taxes.
3. theCall: 1 paragraph. One internal decision + one immediate first move.

Strict bans:
- No consulting jargon (stakeholders, leverage, organizational debt, framework, strategy as a noun, synergies, best practices).
- No second person ("you", "your").
- No first-person singular ("I", "me", "my").

OUTPUT FORMAT (JSON):
{
  "executive_summary": "string",
  "sections": {
    "OPERATING_REALITY": { "livedReality": "...", "costOfStatusQuo": "...", "theCall": "..." },
    "CONSTRAINT_LANDSCAPE": { "livedReality": "...", "costOfStatusQuo": "...", "theCall": "..." },
    "BLIND_SPOT_RISKS": { "livedReality": "...", "costOfStatusQuo": "...", "theCall": "..." },
    "ALIGNMENT_SIGNALS": { "livedReality": "...", "costOfStatusQuo": "...", "theCall": "..." }
  }
}

This is a mirror, not a lecture. Write as if we're in the building together.`;
}

function buildUserPrompt(
    assertionsBySection: Record<string, ExecutiveAssertionBlock[]>,
    perceptionVsReality?: { statedPriority?: string; observedReality?: string }
): string {
    let prompt = '';

    // Perception vs Reality (if available)
    if (perceptionVsReality?.statedPriority && perceptionVsReality?.observedReality) {
        prompt += `PERCEPTION VS REALITY GAP:\n`;
        prompt += `Stated Priority: ${perceptionVsReality.statedPriority}\n`;
        prompt += `Observed Reality: ${perceptionVsReality.observedReality}\n\n`;
    }

    // Assertions by section
    Object.entries(assertionsBySection).forEach(([sectionKey, assertions]) => {
        if (assertions.length === 0) return;

        prompt += `${SECTION_LABELS[sectionKey as keyof typeof SECTION_LABELS]}:\n`;
        assertions.forEach((a, idx) => {
            prompt += `${idx + 1}. ${a.assertion}\n`;
            prompt += `   Implication: ${a.implication}\n`;
            prompt += `   Evidence:\n`;
            a.evidence.forEach(e => prompt += `   - ${e}\n`);
            if (a.roles_observed && a.roles_observed.length > 0) {
                prompt += `   Roles: ${a.roles_observed.join(', ')}\n`;
            }
            prompt += `\n`;
        });
    });

    prompt += `\nGenerate executive mirror narrative following the system requirements. Be concise, direct, and decision-oriented.`;

    return prompt;
}

/**
 * Deterministic offline section generator for tests
 */
function generateOfflineSection(key: string, assertions: ExecutiveAssertionBlock[]): MirrorSection {
    if (assertions.length === 0) {
        return {
            livedReality: "Offline baseline: No patterns observed for this section.",
            costOfStatusQuo: "No impact signals available.",
            theCall: "Maintain current observation until next diagnostic cycle."
        };
    }

    const sanitize = (text: string) => {
        let out = text;
        const replacements: Record<string, string> = {
            'Contextual understanding shapes execution strategy': 'Operational context informs leadership decisions',
            'Alignment signals detected': 'Teams show functional alignment',
            'Risk exposure identified': 'Operational risks are present',
            'Structural constraints limit execution capacity': 'Resource constraints impact throughput',
            'Resource allocation requires systematic review': 'Allocation requires focus',
            'Execution velocity constrained by structural factors': 'Velocity is limited by resources',
            'Unmitigated risks accumulate execution debt': 'Risks impact long-term execution',
            'Cross-functional alignment enables coordinated execution': 'Team alignment improves productivity',
            'signals detected': 'patterns observed',
            'risk exposure identified': 'risks found',
            'execution drag': 'process friction',
            'resource inefficiency': 'allocation gaps',
            'coordination overhead': 'management load'
        };
        Object.entries(replacements).forEach(([bad, good]) => {
            out = out.replace(new RegExp(bad, 'gi'), good);
        });
        return out;
    };

    // Paragraph 1: First 2 assertions
    const livedReality = assertions.slice(0, 2)
        .map(a => sanitize(`${a.assertion} Evidence: ${a.evidence.join(", ")}.`))
        .join("\n\n");

    // Paragraph 2: Implications
    const costOfStatusQuo = assertions.slice(0, 2)
        .map(a => sanitize(a.implication))
        .join(" ");

    // Paragraph 3: Decisions/Calls
    const theCall = assertions.slice(0, 1)
        .map(a => sanitize(`Decision: prioritize resolution of ${a.assertion.toLowerCase()} via ${a.leverage_direction || 'standardized protocol'}.`))
        .join(" ");

    return {
        livedReality,
        costOfStatusQuo,
        theCall
    };
}
