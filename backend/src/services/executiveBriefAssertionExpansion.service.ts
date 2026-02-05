import OpenAI from 'openai';
import { createHash } from 'crypto';

/**
 * EXEC-BRIEF-ASSERTION-EXPANSION-011
 * Mode 2 — Assertion Expansion Fallback (Track B)
 */

export interface ExpansionFact {
    id: string;
    text: string;
    role: string;
    source_ref: string;
}

export interface ExpansionPattern {
    pattern_id: string;
    description: string;
    supporting_facts: string[];
    roles_observed: string[];
    recurrence_level: "low" | "medium" | "high";
    confidence: number;
}

export interface ExpansionCandidate {
    primarySection: string; // Will be validated against ExecutiveBriefSectionKey
    assertion: string;
    evidence_fact_ids: string[];
    implication: string;
    constraint_signal: string;
}

export interface ExpansionOptions {
    tenantId: string;
    briefId?: string;
    action: string;
    maxCandidates?: number;
}

// Initialized lazily
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
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

const ALLOWED_SECTIONS = [
    'OPERATING_REALITY',
    'CONSTRAINT_LANDSCAPE',
    'BLIND_SPOT_RISKS',
    'ALIGNMENT_SIGNALS'
];

const CONSTRAINT_SIGNALS = [
    'ECONOMIC_CAPACITY',
    'TECHNICAL_READINESS',
    'GOVERNANCE_VELOCITY',
    'OPERATIONAL_LATENCY',
    'STRATEGIC_ALIGNMENT',
    'DATA_INTEGRITY'
];

/**
 * Service to expand candidate pool using LLM (Track B)
 */
export class ExecutiveBriefAssertionExpansionService {
    /**
     * Propose additional candidate assertions grounded in facts
     */
    static async proposeCandidates(
        facts: ExpansionFact[],
        patterns: ExpansionPattern[],
        options: ExpansionOptions
    ): Promise<ExpansionCandidate[]> {
        const { tenantId, action, maxCandidates = 6 } = options;

        console.log(`[ExecutiveBriefExpansion] tenantId=${tenantId} action=${action} invoked=true`);

        try {
            const systemPrompt = this.buildSystemPrompt(maxCandidates);
            const userPrompt = this.buildUserPrompt(facts, patterns);

            const response = await getOpenAIClient().chat.completions.create({
                model: 'gpt-4o', // Using gpt-4o for better JSON adherence if available, fallback to gpt-4
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('LLM returned empty response');
            }

            const parsed = JSON.parse(content);
            const candidates: ExpansionCandidate[] = parsed.candidates || [];

            // Preliminary sanitization
            const validCandidates = candidates.filter(c => this.isCandidateStructurallyValid(c));

            console.log(`[ExecutiveBriefExpansion] tenantId=${tenantId} result=success candidatesReturned=${candidates.length} candidatesAccepted=${validCandidates.length}`);

            return validCandidates;
        } catch (error) {
            console.error(`[ExecutiveBriefExpansion] invoked=true result=fail reason=${error instanceof Error ? error.message : 'Unknown'} fallback=TrackA`);
            // Fail-soft: return empty array so pipeline proceeds with Track A
            return [];
        }
    }

    private static buildSystemPrompt(maxCandidates: number): string {
        return `You are an Executive Brief Synthesis Agent (Track B Expansion).
Your task is to propose up to ${maxCandidates} high-quality candidate assertions grounded strictly in the provided facts.

RULES:
1. ASSERTION: EXACTLY 24 words or fewer. Must be declarative, present tense, and executive-grade.
2. EVIDENCE: Exactly 1 to 3 fact IDs. No quoting raw text.
3. IMPLICATION: 1 to 2 sentences max. Focus on cost, risk, or strategic leverage.
4. CONSTRAINT_SIGNAL: Use ONLY from the allowed list.
5. JSON ONLY: Return a JSON object with a "candidates" array.

ALLOWED PRIMARY SECTIONS:
${ALLOWED_SECTIONS.join(', ')}

ALLOWED CONSTRAINT SIGNALS:
${CONSTRAINT_SIGNALS.join(', ')}

Output Schema:
{
  "candidates": [
    {
      "primarySection": "string",
      "assertion": "string",
      "evidence_fact_ids": ["string"],
      "implication": "string",
      "constraint_signal": "string"
    }
  ]
}`;
    }

    private static buildUserPrompt(facts: ExpansionFact[], patterns: ExpansionPattern[]): string {
        const factsLite = facts.map(f => ({ id: f.id, text: f.text, role: f.role }));
        const patternsLite = patterns.map(p => ({ id: p.pattern_id, desc: p.description, fact_ids: p.supporting_facts }));

        return `FACTS:
${JSON.stringify(factsLite, null, 2)}

PATTERNS (EXISTING CLUSTERS):
${JSON.stringify(patternsLite, null, 2)}

Propose additional unique executive assertions. Do not duplicate the themes already captured in the patterns if they are already broad enough. Focus on deep-seated structural issues indicated by the evidence.`;
    }

    private static isCandidateStructurallyValid(c: any): c is ExpansionCandidate {
        if (!c || typeof c !== 'object') return false;
        if (!ALLOWED_SECTIONS.includes(c.primarySection)) return false;
        if (!CONSTRAINT_SIGNALS.includes(c.constraint_signal)) return false;
        if (typeof c.assertion !== 'string' || c.assertion.length === 0) return false;
        if (typeof c.implication !== 'string' || c.implication.length === 0) return false;
        if (!Array.isArray(c.evidence_fact_ids) || c.evidence_fact_ids.length < 1 || c.evidence_fact_ids.length > 3) return false;
        return true;
    }
}
