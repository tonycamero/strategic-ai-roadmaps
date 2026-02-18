import { createOpenAIClient } from '../ai/openaiClient';
import { db } from '../db/index';
import {
    assistedSynthesisAgentSessions,
    assistedSynthesisAgentMessages,
    discoveryCallNotes,
    diagnostics,
    executiveBriefs,
    tenantDocuments
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

        const proposedFindings = proposedDoc ? JSON.parse(proposedDoc.content) : null;

        return {
            discoveryNotes: discoveryRaw?.notes || null,
            diagnostic: diagnostic ? {
                overview: diagnostic.overview,
                aiOpportunities: diagnostic.aiOpportunities,
                roadmapSkeleton: diagnostic.roadmapSkeleton,
                discoveryQuestions: diagnostic.discoveryQuestions
            } : null,
            executiveBrief: execBrief?.synthesis || null,
            proposedFindings: proposedFindings?.items || []
        };
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

        return `You are an interpretive assistant for Stage 5 Assisted Synthesis in a strategic AI roadmapping tool.

STRICT SCOPE:
- You are provided with a read-only snapshot of the PROPOSED FINDINGS (Current Facts, Friction Points, etc.).
- These represent the full set of assertions derived from source artifacts that are currently being reviewed by the human operator.
- You may evaluate them individually or collectively for accuracy, completeness, bias, or omission against the source artifacts.
- You MUST NOT accept, reject, or edit any proposals. Only the human operator can do that.
- You MUST NOT discuss Stage 6 (Ticket Moderation) or Stage 7 (Roadmap Generation).
- You MUST NOT reference or modify canonical findings.
- You may cite specific evidence anchors or quote from source artifacts to justify your reasoning.

SOURCE ARTIFACTS (THE TRUTH):
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
PROPOSED_FINDINGS_SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}

Your role is to help the operator understand, verify, and resolve these proposals. Answer questions concisely and ground every claim in the SOURCE ARTIFACTS provided above.`;
    }
}
