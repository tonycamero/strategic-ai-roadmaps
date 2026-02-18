import { createOpenAIClient } from '../ai/openaiClient';
import { db } from '../db/index';
import {
    assistedSynthesisAgentSessions,
    assistedSynthesisAgentMessages,
    discoveryCallNotes,
    diagnostics,
    executiveBriefs,
    tenantDocuments,
    users,
    intakes
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Structured error for agent operations
 */
export class AgentOperationError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'AgentOperationError';
    }
}

interface AgentMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

interface AgentSession {
    sessionId: string;
    messages: AgentMessage[];
    contextVersion: string;
    phaseState: 'active' | 'resolved';
}

/**
 * Assisted Synthesis Agent Service
 * 
 * Provides interpretive Q&A assistance for Stage 5 with bounded persistence.
 * Session persists ONLY while Current Facts have pending items.
 */
export class AssistedSynthesisAgentService {

    /**
     * Get or create agent session for tenant
     */
    static async getOrCreateSession(
        tenantId: string,
        contextVersion: string,
        requestId: string
    ): Promise<AgentSession> {
        console.log(`[AssistedSynthesisAgent:${requestId}] Get/create session for tenant ${tenantId}, version ${contextVersion}`);

        // Try to find existing session with matching context
        const [existingSession] = await db
            .select()
            .from(assistedSynthesisAgentSessions)
            .where(and(
                eq(assistedSynthesisAgentSessions.tenantId, tenantId),
                eq(assistedSynthesisAgentSessions.stage, 'assisted_synthesis'),
                eq(assistedSynthesisAgentSessions.phase, 'current_facts'),
                eq(assistedSynthesisAgentSessions.contextVersion, contextVersion)
            ))
            .orderBy(desc(assistedSynthesisAgentSessions.createdAt))
            .limit(1);

        let sessionId: string;

        if (existingSession) {
            sessionId = existingSession.id;
            console.log(`[AssistedSynthesisAgent:${requestId}] Found existing session ${sessionId}`);
        } else {
            // Create new session
            const [newSession] = await db
                .insert(assistedSynthesisAgentSessions)
                .values({
                    tenantId,
                    stage: 'assisted_synthesis',
                    phase: 'current_facts',
                    contextVersion
                })
                .returning();

            sessionId = newSession.id;
            console.log(`[AssistedSynthesisAgent:${requestId}] Created new session ${sessionId}`);
        }

        // Load messages
        const messages = await db
            .select()
            .from(assistedSynthesisAgentMessages)
            .where(eq(assistedSynthesisAgentMessages.sessionId, sessionId))
            .orderBy(assistedSynthesisAgentMessages.createdAt);

        return {
            sessionId,
            messages: messages.map(m => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                createdAt: m.createdAt
            })),
            contextVersion,
            phaseState: 'active' //  Will be set to 'resolved' when CF pending ==0
        };
    }

    /**
     * Send message to agent and get response
     */
    static async sendMessage(
        tenantId: string,
        sessionId: string,
        userMessage: string,
        requestId: string
    ): Promise<{ reply: string; messageId: string }> {
        console.log(`[AssistedSynthesisAgent:${requestId}] Sending message to session ${sessionId}`);

        // Validate OpenAI client
        if (!process.env.OPENAI_API_KEY) {
            throw new AgentOperationError(
                'LLM_CONFIG_MISSING',
                'OpenAI API key not configured. Contact system administrator.',
                { env: 'OPENAI_API_KEY' }
            );
        }

        const openai = createOpenAIClient();

        // Load context for this tenant
        const context = await this.loadTenantContext(tenantId, requestId);

        // Load existing conversation
        const existingMessages = await db
            .select()
            .from(assistedSynthesisAgentMessages)
            .where(eq(assistedSynthesisAgentMessages.sessionId, sessionId))
            .orderBy(assistedSynthesisAgentMessages.createdAt);

        // Build messages array for OpenAI
        const conversationMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            {
                role: 'system',
                content: this.buildSystemPrompt(context)
            },
            ...existingMessages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            })),
            {
                role: 'user',
                content: userMessage
            }
        ];

        // Call OpenAI
        let assistantReply: string;
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-2024-08-06',
                messages: conversationMessages,
                temperature: 0.3,
                max_tokens: 1000
            });

            assistantReply = response.choices[0]?.message?.content || '';

            if (!assistantReply) {
                throw new AgentOperationError(
                    'LLM_BAD_RESPONSE',
                    'Agent returned empty response.',
                    {}
                );
            }
        } catch (error: any) {
            console.error(`[AssistedSynthesisAgent:${requestId}] OpenAI API error:`, error);
            throw new AgentOperationError(
                'LLM_API_FAILED',
                'Failed to get response from AI agent. Please try again.',
                { originalError: error.message }
            );
        }

        // Store both messages
        await db.insert(assistedSynthesisAgentMessages).values({
            sessionId,
            role: 'user',
            content: userMessage
        });

        const [assistantMessage] = await db.insert(assistedSynthesisAgentMessages).values({
            sessionId,
            role: 'assistant',
            content: assistantReply
        }).returning();

        console.log(`[AssistedSynthesisAgent:${requestId}] Stored user + assistant messages`);

        return {
            reply: assistantReply,
            messageId: assistantMessage.id
        };
    }

    /**
     * Reset session (clear all messages)
     */
    static async resetSession(
        tenantId: string,
        sessionId: string,
        requestId: string
    ): Promise<void> {
        console.log(`[AssistedSynthesisAgent:${requestId}] Resetting session ${sessionId}`);

        // Delete all messages (cascade will handle this, but being explicit)
        await db
            .delete(assistedSynthesisAgentMessages)
            .where(eq(assistedSynthesisAgentMessages.sessionId, sessionId));

        // Delete session
        await db
            .delete(assistedSynthesisAgentSessions)
            .where(and(
                eq(assistedSynthesisAgentSessions.id, sessionId),
                eq(assistedSynthesisAgentSessions.tenantId, tenantId)
            ));

        console.log(`[AssistedSynthesisAgent:${requestId}] Session reset complete`);
    }

    /**
     * Load tenant context for agent
     */
    private static async loadTenantContext(tenantId: string, requestId: string) {
        console.log(`[AssistedSynthesisAgent:${requestId}] Loading context for tenant ${tenantId}`);

        // Load discovery notes
        const [discoveryRaw] = await db
            .select()
            .from(discoveryCallNotes)
            .where(eq(discoveryCallNotes.tenantId, tenantId))
            .orderBy(desc(discoveryCallNotes.createdAt))
            .limit(1);

        // Load diagnostic
        const [diagnostic] = await db
            .select()
            .from(diagnostics)
            .where(eq(diagnostics.tenantId, tenantId))
            .orderBy(desc(diagnostics.createdAt))
            .limit(1);

        // Load executive brief
        const [execBrief] = await db
            .select()
            .from(executiveBriefs)
            .where(eq(executiveBriefs.tenantId, tenantId))
            .orderBy(desc(executiveBriefs.createdAt))
            .limit(1);

        // Load proposed findings
        const [proposedDoc] = await db
            .select()
            .from(tenantDocuments)
            .where(and(
                eq(tenantDocuments.tenantId, tenantId),
                eq(tenantDocuments.category, 'findings_proposed')
            ))
            .orderBy(desc(tenantDocuments.createdAt))
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
            .where(and(
                eq(intakes.tenantId, tenantId)
            ));

        const proposedFindings = proposedDoc ? JSON.parse(proposedDoc.content) : null;

        const context = {
            discoveryNotes: discoveryRaw?.notes || null,
            diagnostic: diagnostic ? {
                overview: diagnostic.overview,
                aiOpportunities: diagnostic.aiOpportunities,
                roadmapSkeleton: diagnostic.roadmapSkeleton,
                discoveryQuestions: diagnostic.discoveryQuestions
            } : null,
            executiveBrief: execBrief?.synthesis || null,
            proposedFindings: proposedFindings?.items || [],
            teamMemberIntakes: tenantIntakes.map(ti => ({
                id: ti.id,
                roleLabel: ti.roleLabel,
                displayName: ti.displayName,
                contentText: typeof ti.answers === 'string' ? ti.answers : JSON.stringify(ti.answers)
            }))
        };

        // Token Risk Logging
        const estimatedChars = JSON.stringify(context).length;
        console.log(`[AssistedSynthesisAgent:${requestId}] Loaded context size: ${estimatedChars} chars`);

        // TODO: If estimatedChars > threshold, implement selective injection by relevance.
        // For now, fail loudly if extreme token pressure detected.
        if (estimatedChars > 150000) {
            console.warn(`[AssistedSynthesisAgent:${requestId}] EXTREME TOKEN PRESSURE: ${estimatedChars} chars. Context may be truncated.`);
        }

        return context;
    }

    /**
     * Build system prompt with context
     */
    private static buildSystemPrompt(context: {
        discoveryNotes: string | null;
        diagnostic: any;
        executiveBrief: any;
        proposedFindings: Array<{
            id: string;
            text: string;
            type: 'CurrentFact' | 'FrictionPoint' | 'Goal' | 'Constraint';
            sources?: string[];
            status: 'pending' | 'accepted' | 'rejected';
        }>;
        teamMemberIntakes: Array<{
            id: string;
            roleLabel: string;
            displayName: string;
            contentText: string;
        }>;
    }): string {
        const snapshot = {
            snapshotId: randomUUID(),
            generatedAt: new Date().toISOString(),
            items: context.proposedFindings.map(f => ({
                id: f.id,
                text: f.text,
                type: f.type,
                sources: f.sources || [],
                status: f.status
            })),
            invariants: [
                "read-only",
                "pre-canonical",
                "derived-from-source-artifacts",
                "ui-resolved-state"
            ]
        };

        const discoveryContent = context.discoveryNotes ? JSON.stringify(context.discoveryNotes, null, 2) : 'No discovery notes available.';
        const diagnosticContent = context.diagnostic ? JSON.stringify(context.diagnostic, null, 2) : 'No diagnostic data available.';
        const execBriefContent = context.executiveBrief ? JSON.stringify(context.executiveBrief, null, 2) : 'No executive brief available.';
        const intakeContent = context.teamMemberIntakes.length > 0
            ? JSON.stringify(context.teamMemberIntakes, null, 2)
            : 'No team member intakes available.';

        return `You are an interpretive assistant for StrategicAI Stage 5 Assisted Synthesis.
Your job is to help the operator understand, verify, and resolve findings while strictly adhering to corporate discipline.

GOVERNANCE RULES (STRICT):

G1 — DISCIPLINE-FIRST GATE:
- NEVER recommend automation or tooling unless artifacts (Intakes, Raw Notes) PROVE:
    (a) ownership discipline (explicit owner-of-process)
    (b) state discipline (clear definitions of states/transitions)
    (c) queue discipline (how work enters/is handled)
    (d) exception discipline (what happens when it breaks)
- If silent on any: automation is "premature tooling". State this explicitly.

G2 — ECONOMIC CONCRETENESS:
- Use specific mechanisms from ALLOWED_ECONOMIC_VECTORS.
- BAN GENERIC TERMS: "revenue friction", "wasted resources", "efficiency", "optimize", "leverage", "synergy", "unlock".
- "Trace to cash" must identify one of the structural mechanisms below.

G3 — ARCHETYPE ROTATION:
- Evaluate all 9 archetypes for Constraint identification: Authority, Capacity, Data, Incentive, RevenueModel, Throughput, EscalationCulture, DemandQualification, StructuralAmbiguity.
- Propose with selected archetype + 2 runners-up + deciding_signal.

G4 — ROOT-CAUSE COLLAPSE:
- When asked if two items are the same root cause: Cite anchors for BOTH items, then merge OR separate with a concrete deciding_signal (observable operational test).

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

STRICT "NO EVIDENCE" PROTOCOL:
If a user asks for facts, metrics, or turnover rates not present in the SOURCE ARTIFACTS below:
- Reply only: "I do not see evidence for X in the artifacts available in Stage 5. Which artifact contains this data?"
- Do not speculate or coach.

SOURCE ARTIFACTS (THE TRUTH):
---
TEAM_MEMBER_INTAKES_VERBATIM:
${intakeContent}

---
DISCOVERY NOTES:
${discoveryContent}

---
DIAGNOSTIC DATA:
${diagnosticContent}

---
EXECUTIVE BRIEF SYNTHESIS:
${execBriefContent}

---
PROPOSED_FINDINGS_EXISTING:
${JSON.stringify(snapshot, null, 2)}

TOOL: DRAFTING PROPOSALS
If user asks to "draft a constraint" or "extract a finding", use:

<SAR_PROPOSAL>
{
  "type": "FrictionPoint" | "Goal" | "Constraint" | "Fact",
  "text": "Finding text",
  "anchors": [
    {
      "source": "RAW_NOTES" | "INTAKE" | "DIAGNOSTIC" | "EXEC_BRIEF",
      "speaker": "Role/Name",
      "quote": "verbatim"
    }
  ],
  "mechanical_effect": "State-level failure mechanism",
  "operational_effect": "Observable symptom/pattern",
  "economic_vector": "One from ALLOWED_ECONOMIC_VECTORS",
  "archetype_selected": "one of 9",
  "runners_up_archetypes": ["archetype", "archetype"],
  "deciding_signal": "Operational test to confirm"
}
</SAR_PROPOSAL>

RULES: NO invented numbers. Mandatory archetype for Constraints. No anchor = No proposal.`;
    }
}
