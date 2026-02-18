import { createOpenAIClient } from '../ai/openaiClient';
import { db } from '../db/index';
import { discoveryCallNotes, diagnostics, executiveBriefs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * ProposedFinding Draft Schema
 * These are pre-canonical agent proposals that must be reviewed/edited/accepted by human
 */
export interface ProposedFindingItem {
    id: string;
    type: 'CurrentFact' | 'FrictionPoint' | 'Goal' | 'Constraint';
    text: string;
    evidenceRefs: Array<{
        artifact: 'raw' | 'execBrief' | 'diagnostic' | 'qna';
        quote: string;
        location?: string;
    }>;
    status: 'pending' | 'accepted' | 'rejected';
    editedText?: string;
}

export interface ProposedFindingsDraft {
    version: string;
    items: ProposedFindingItem[];
    generatedBy: string;
    sourceArtifactIds: string[];
    createdAt: Date;
}

export class ProposalGenerationError extends Error {
    constructor(message: string, public details?: any) {
        super(message);
        this.name = 'ProposalGenerationError';
    }
}

/**
 * Assisted Synthesis Proposals Service
 * CRITICAL: This generates PRE-CANONICAL proposals using LLM synthesis
 * NOT deterministic extraction from raw notes
 */
export class AssistedSynthesisProposalsService {

    /**
     * Generate proposal findings using LLM synthesis of all available artifacts
     */
    static async generateProposals(tenantId: string, requestId?: string): Promise<ProposedFindingsDraft> {
        const openai = createOpenAIClient();

        // 1. Load all source artifacts
        const [discoveryRaw] = await db
            .select()
            .from(discoveryCallNotes)
            .where(eq(discoveryCallNotes.tenantId, tenantId))
            .orderBy(desc(discoveryCallNotes.createdAt))
            .limit(1);

        const [diagnostic] = await db
            .select()
            .from(diagnostics)
            .where(eq(diagnostics.tenantId, tenantId))
            .orderBy(desc(diagnostics.createdAt))
            .limit(1);

        const [execBrief] = await db
            .select()
            .from(executiveBriefs)
            .where(eq(executiveBriefs.tenantId, tenantId))
            .orderBy(desc(executiveBriefs.createdAt))
            .limit(1);

        if (!discoveryRaw) {
            throw new Error('NO_DISCOVERY_NOTES: Cannot generate proposals without discovery notes');
        }

        // 2. Parse discovery notes
        let parsedNotes: any;
        try {
            parsedNotes = typeof discoveryRaw.notes === 'string'
                ? JSON.parse(discoveryRaw.notes)
                : discoveryRaw.notes;
        } catch (e) {
            throw new Error('INVALID_DISCOVERY_NOTES: Cannot parse discovery notes JSON');
        }

        // 3. Assemble context for LLM
        const rawNotes = parsedNotes.currentBusinessReality || '';
        const diagnosticOverview = diagnostic?.overview ? JSON.stringify(diagnostic.overview) : '';
        const diagnosticOpportunities = diagnostic?.aiOpportunities ? JSON.stringify(diagnostic.aiOpportunities) : '';
        const execSummary = execBrief?.synthesis?.content?.executiveSummary || (execBrief?.synthesis as any)?.executiveSummary || '';
        const operatingReality = execBrief?.synthesis?.content?.operatingReality || (execBrief?.synthesis as any)?.operatingReality || '';
        const constraints = execBrief?.synthesis?.content?.constraintLandscape || (execBrief?.synthesis as any)?.constraintLandscape || '';

        // 4. Build strict LLM prompt
        const systemPrompt = `You are a findings extraction agent. Your job is to analyze discovery artifacts and propose ATOMIC, EVIDENCE-ANCHORED findings.

RULES (STRICT):
1. Output ONLY valid JSON matching the schema below
2. Each finding must be a SINGLE atomic claim (one fact, one friction point, one goal, one constraint)
3. Each finding MUST include at least 1 evidenceRef with a SHORT direct quote from sources
4. Do NOT infer, assume, or create findings without evidence
5. Do NOT include solution language, implementation steps, or recommendations
6. Do NOT create narrative text - only structured findings
7. If evidence is insufficient for a claim, OMIT that finding

FINDING TYPES:
- CurrentFact: Verifiable statements about the current state (from raw notes, exec brief)
- FrictionPoint: Explicit pain points, problems, or gaps (from raw notes, exec brief, diagnostic)
- Goal: Explicit desired outcomes or future states (from raw notes, diagnostic)
- Constraint: Explicit limitations, boundaries, or requirements (from raw notes, exec brief)

OUTPUT SCHEMA:
{
  "items": [
    {
      "id": "unique-id",
      "type": "CurrentFact" | "FrictionPoint" | "Goal" | "Constraint",
      "text": "Single atomic claim statement",
      "evidenceRefs": [
        {
          "artifact": "raw" | "execBrief" | "diagnostic",
          "quote": "Short excerpt from source (max 100 chars)",
          "location": "optional section name"
        }
      ],
      "status": "pending"
    }
  ]
}`;

        const userPrompt = `SOURCES:

RAW DISCOVERY NOTES:
${rawNotes.substring(0, 3000)}

EXECUTIVE BRIEF - Executive Summary:
${execSummary.substring(0, 1000)}

EXECUTIVE BRIEF - Operating Reality:
${operatingReality.substring(0, 2000)}

EXECUTIVE BRIEF - Constraints:
${constraints.substring(0, 1000)}

DIAGNOSTIC - Overview:
${diagnosticOverview.substring(0, 1500)}

DIAGNOSTIC - AI Opportunities:
${diagnosticOpportunities.substring(0, 1500)}

Extract and propose atomic findings. Return ONLY valid JSON.`;

        // 5. Call LLM
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-2024-08-06',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) {
            throw new Error('LLM_NO_RESPONSE: No response from LLM');
        }

        // 6. Parse and validate response
        let proposedItems: any;
        try {
            proposedItems = JSON.parse(responseText);
        } catch (e) {
            console.error('[AssistedSynthesis] LLM response invalid JSON:', responseText);
            throw new Error('LLM_INVALID_JSON: Response is not valid JSON');
        }

        if (!proposedItems.items || !Array.isArray(proposedItems.items)) {
            throw new Error('LLM_INVALID_SCHEMA: Response does not match expected schema');
        }

        // 7. Build provenance
        const sourceArtifactIds: string[] = [];
        if (discoveryRaw.id) sourceArtifactIds.push(discoveryRaw.id);
        if (diagnostic?.id) sourceArtifactIds.push(diagnostic.id);
        if (execBrief?.id) sourceArtifactIds.push(execBrief.id);

        const draft: ProposedFindingsDraft = {
            version: 'v2.0-proposal-1',
            items: proposedItems.items.map((item: any) => ({
                ...item,
                status: 'pending'
            })),
            generatedBy: 'assistedSynthesisProposals.service',
            sourceArtifactIds,
            createdAt: new Date()
        };

        console.log(`[AssistedSynthesis] Generated ${draft.items.length} proposed findings for tenant ${tenantId}`);
        return draft;
    }
}
