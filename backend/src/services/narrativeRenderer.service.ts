import { createOpenAIClient } from '../ai/openaiClient.ts';

/**
 * Global Insight Narrative Rendering Standard (Prose + Bullet Hybrid)
 * 
 * Implements EXEC-INSIGHT-NARRATIVE-STANDARD-001.
 * Governs how SAR transforms factual diagnostic outputs into premium, 
 * executive-grade decision artifacts.
 */

export interface NarrativeRendererInput {
    sectionTitle: string;
    facts: string[]; // Raw facts/bullets/statements
    roleAttributions?: Record<string, string[]>; // Optional: role-specific facts
    context?: string; // Optional: additional alignment context
}

export class NarrativeRendererService {
    private static readonly GLOBAL_SYSTEM_PROMPT = `You are a Global Insight Narrative Renderer for Strategic AI Roadmaps (SAR).
Your task is to transform raw diagnostic data into high-end executive narrative.

MODE: Deterministic Renderer-only transformation
TONE: Neutral, authoritative, sophisticated, executive-grade.
AUDIENCE: Boards of Directors and Executive Leadership.

CORE STANDARD (EXEC-INSIGHT-NARRATIVE-STANDARD-001):
1. NARRATIVE FIRST, BULLETS SECOND:
   - Every section must start with an Opening Narrative Paragraph (prose-rich, interprets meaning, board-safe).
   - Followed by Supported Bullets (3–7 max, concise, reinforcement of narrative).
   - End with a Closing Synthesis Paragraph (describes current state, no advice).

2. NON-INVENTIVE CONSTRAINT (HARD RULE):
   - ❌ Do NOT introduce new facts.
   - ❌ Do NOT add causal claims not present in data.
   - ❌ Do NOT speculate beyond evidence.
   - ❌ Do NOT assign intent, blame, or motive.
   - If data is weak or ambiguous, reflect that uncertainty explicitly.

3. EXECUTIVE TONE REQUIREMENTS:
   - Calm, Neutral, Observational, Board-safe.
   - ❌ No sales/marketing language or "motivational fluff".
   - ❌ No AI self-references or methodology explanations.
   - ❌ No emojis or casual phrasing.

4. STRUCTURAL BALANCE:
   - Paragraphs: 3–6 sentences max.
   - Bullets: Use the "•" character. 1 line preferred, 2 lines max.

NARRATIVE TRANSFORMATION RULES:
- Aggregate Before Writing: Combine related facts; remove redundancy.
- System Perspective Framing: Use "From this role, the organization appears..." instead of personal job descriptions.
- Temporal Language Only: Use "currently", "at present", "tends to", "frequently".
- Constraint Language: Use "constrained", "limited", "uneven", "misaligned", "under-defined".`;

    /**
     * Renders a specific insight section using the Global Standard.
     */
    static async renderInsight(input: NarrativeRendererInput, requestId?: string): Promise<string> {
        const openai = createOpenAIClient();

        const userPrompt = `SECTION TITLE: ${input.sectionTitle}
${input.context ? `CONTEXT: ${input.context}\n` : ''}
RAW FACTS/INPUTS:
${input.facts.join('\n')}

${input.roleAttributions && Object.keys(input.roleAttributions).length > 0
                ? `ROLE-ATTRIBUTED PERSPECTIVES:\n${Object.entries(input.roleAttributions).map(([role, facts]) => `[${role}]:\n${facts.join('\n')}`).join('\n\n')}`
                : ''}

Render this into the 3-part Executive Narrative format (Opening Prose, Bullet Block, Closing Prose) as defined by the Global Standard.`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: this.GLOBAL_SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0,
                max_tokens: 1500
            });

            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error(`[NarrativeRenderer:${requestId}] Insight rendering failed:`, error);
            // Fallback: return raw facts if rendering fails
            return input.facts.join('\n\n');
        }
    }

    /**
     * Legacy/Support method for Executive Brief rendering
     */
    static async renderSection(input: NarrativeRendererInput, requestId?: string): Promise<string> {
        return this.renderInsight(input, requestId);
    }

    /**
     * Helper to render multiple sections in sequence for the Executive Brief
     */
    static async renderFullBrief(synthesis: any, requestId?: string): Promise<any> {
        const renderedSynthesis: any = { ...synthesis };

        const sectionsToTransform = [
            { key: 'executiveSummary', title: 'Executive Summary' },
            { key: 'operatingReality', title: 'Operating Reality' },
            { key: 'alignmentSignals', title: 'Alignment Signals' },
            { key: 'riskSignals', title: 'Risk Signals' },
            { key: 'readinessSignals', title: 'Readiness Signals' },
            { key: 'constraintLandscape', title: 'Constraint Landscape' },
            { key: 'blindSpotRisks', title: 'Blind Spot Risks' }
        ];

        for (const section of sectionsToTransform) {
            if (synthesis[section.key]) {
                const facts = synthesis[section.key].split('\n\n');
                renderedSynthesis[section.key] = await this.renderInsight({
                    sectionTitle: section.title,
                    facts,
                    roleAttributions: {}
                }, requestId);
            }
        }

        return renderedSynthesis;
    }
}
