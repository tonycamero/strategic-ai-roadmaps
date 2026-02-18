import { createOpenAIClient } from '../ai/openaiClient';
import { db } from '../db/index';
import { discoveryCallNotes, diagnostics, executiveBriefs, users, intakes } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * ProposedFinding Draft Schema
 * These are pre-canonical agent proposals that must be reviewed/edited/accepted by human
 */
export interface ProposedFindingItem {
    id: string;
    type: 'CurrentFact' | 'FrictionPoint' | 'Goal' | 'Constraint';
    text: string;
    anchors: Array<{
        source: 'RAW_NOTES' | 'INTAKE' | 'DISCOVERY_QA' | 'DIAGNOSTIC' | 'EXEC_BRIEF';
        speaker?: string;
        quote: string;
    }>;
    status: 'pending' | 'accepted' | 'rejected';
    editedText?: string;
    mechanical_effect?: string;
    operational_effect?: string;
    economic_vector?: string; // One of ALLOWED_ECONOMIC_VECTORS
    archetype_selected?: string; // One of 9
    runners_up_archetypes?: string[]; // exactly 2
    deciding_signal?: string;
    confidence?: 'LOW' | 'MED' | 'HIGH';
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

        // Load team member intakes (full verbatim)
        const tenantIntakes = await db
            .select({
                id: intakes.id,
                roleLabel: intakes.role,
                displayName: users.name,
                answers: intakes.answers
            })
            .from(intakes)
            .innerJoin(users, eq(intakes.userId, users.id))
            .where(eq(intakes.tenantId, tenantId));

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

        const intakeContent = tenantIntakes.map(ti => {
            const answers = typeof ti.answers === 'string' ? ti.answers : JSON.stringify(ti.answers);
            return `Role: ${ti.roleLabel}\nUser: ${ti.displayName}\nAnswers:\n${answers}`;
        }).join('\n---\n');

        // Token Risk Logging
        const totalContextSize = (rawNotes + diagnosticOverview + diagnosticOpportunities + execSummary + operatingReality + constraints + intakeContent).length;
        console.log(`[AssistedSynthesis:Bulk] Total context size: ${totalContextSize} chars`);
        if (totalContextSize > 150000) {
            console.warn(`[AssistedSynthesis:Bulk] EXTREME TOKEN PRESSURE: ${totalContextSize} chars.`);
        }

        // 4. Build strict LLM prompt
        const systemPrompt = `You are a findings extraction agent for StrategicAI. Your job is to analyze discovery artifacts and propose ATOMIC, EVIDENCE-ANCHORED findings. 

GOVERNANCE RULES (STRICT):

G1 — DISCIPLINE-FIRST GATE:
- NEVER recommend automation or tooling unless the artifacts PROVE existance of:
    (a) ownership discipline (explicit owner-of-process)
    (b) state discipline (clear definitions of states / "done")
    (c) queue discipline (how work enters / is handled)
    (d) exception discipline (what happens when it breaks)
- If artifacts are silent: classification must be "premature tooling". Framed as a discipline gap.

G2 — ECONOMIC CONCRETENESS:
- Use ONLY specific mechanisms from the ALLOWED_ECONOMIC_VECTORS list.
- BAN GENERIC TERMS: "revenue friction", "wasted resources", "efficiency", "optimize", "leverage", "synergy", "unlock".
- No invented ROI or dollar amounts.

G3 — ARCHETYPE ROTATION:
- Evaluate ALL 9 archetypes before selecting: Authority, Capacity, Data, Incentive, RevenueModel, Throughput, EscalationCulture, DemandQualification, StructuralAmbiguity.
- Output MUST include selected archetype + 2 runners-up + deciding_signal (the observable operational test).

G4 — ROOT-CAUSE COLLAPSE:
- Cite anchors for BOTH items when deduping.
- Merge or separate with a concrete deciding_signal.

ALLOWED_ECONOMIC_VECTORS:
- overtime_inflation
- idle_labor_idle_capacity
- spoilage_waste
- rework_labor
- refunds_comps_chargebacks
- missed_peak_conversion_dropped_orders
- margin_dilution_discounting_promo_leakage
- rush_insertion_schedule_thrash_cost
- escalation_time_cost_owner_manager_interruptions
- warranty_callbacks_repeat_work

OUTPUT SCHEMA (JSON):
{
  "items": [
    {
      "id": "unique-id",
      "type": "CurrentFact" | "FrictionPoint" | "Goal" | "Constraint",
      "text": "Single atomic claim statement",
      "anchors": [
        {
          "source": "RAW_NOTES" | "INTAKE" | "DISCOVERY_QA" | "DIAGNOSTIC" | "EXEC_BRIEF",
          "speaker": "Name or Role",
          "quote": "Short verbatim excerpt"
        }
      ],
      "status": "pending",
      "mechanical_effect": "State failure / queue break / etc",
      "operational_effect": "Observable delay / rework / symptom",
      "economic_vector": "One from ALLOWED_ECONOMIC_VECTORS",
      "archetype_selected": "Authority | Capacity | Data | Incentive | RevenueModel | Throughput | EscalationCulture | DemandQualification | StructuralAmbiguity",
      "runners_up_archetypes": ["Archetype", "Archetype"],
      "deciding_signal": "Operational test to confirm"
    }
  ]
}

UNLIMITED proposals are permitted if evidence-backed (Target 30+).`;

        const userPrompt = `SOURCES:

RAW DISCOVERY NOTES:
${rawNotes.substring(0, 3000)}

EXECUTIVE BRIEF - Executive Summary:
${execSummary.substring(0, 1000)}

EXECUTIVE BRIEF - Operating Reality:
${operatingReality.substring(0, 2000)}

EXECUTIVE BRIEF - Constraints:
${constraints.substring(0, 1000)}

TEAM MEMBER INTAKES (VERBATIM):
${intakeContent.substring(0, 5000)}

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
            version: 'v3.5-hardened',
            items: [],
            generatedBy: 'assistedSynthesisProposals.service',
            sourceArtifactIds,
            createdAt: new Date()
        };

        const ALLOWED_VECTORS = [
            'overtime_inflation', 'idle_labor_idle_capacity', 'spoilage_waste', 'rework_labor',
            'refunds_comps_chargebacks', 'missed_peak_conversion_dropped_orders',
            'margin_dilution_discounting_promo_leakage', 'rush_insertion_schedule_thrash_cost',
            'escalation_time_cost_owner_manager_interruptions', 'warranty_callbacks_repeat_work'
        ];

        const BANNED_REGEX = /revenue friction|wasted resources|efficiency|optimiz(e|ing|ation)|leverage|synergy|unlock/i;

        for (const item of proposedItems.items) {
            try {
                // G5: Server-side validation
                if (!item.anchors || !Array.isArray(item.anchors) || item.anchors.length === 0) {
                    console.warn(`[AssistedSynthesis:Validation] Dropping proposal: No anchors. Type: ${item.type}`);
                    continue;
                }

                if (!ALLOWED_VECTORS.includes(item.economic_vector)) {
                    console.warn(`[AssistedSynthesis:Validation] Dropping proposal: Invalid economic vector "${item.economic_vector}".`);
                    continue;
                }

                const contentToScan = `${item.text} ${item.mechanical_effect} ${item.operational_effect} ${item.deciding_signal}`;
                if (BANNED_REGEX.test(contentToScan)) {
                    console.warn(`[AssistedSynthesis:Validation] Dropping proposal: Banned words detected.`);
                    continue;
                }

                draft.items.push({
                    ...item,
                    status: 'pending'
                });
            } catch (err) {
                console.error('[AssistedSynthesis:Validation] Error validating item:', err);
            }
        }

        console.log(`[AssistedSynthesis] Generated ${draft.items.length} proposed findings (after G5 validation) for tenant ${tenantId}`);
        return draft;
    }
}
