import crypto from 'crypto';
import type { CapabilityProfile } from '../shared/types/capability-profile';
import type { AgentConfig } from '../db/schema.ts';

export interface AgentPromptContext {
  firmName: string;
  businessContext?: string;
  roadmapSummary?: string;
  roadmapSections?: Array<{ title: string; key?: string }>;
  diagnosticSummary?: string;
  roadmapSignals?: string;
  tacticalFrame?: string;
}

export interface BuiltAgentInstructions {
  instructions: string;
  instructionsHash: string;
}

/**
 * Build the unified 6-layer system prompt for the Strategic AI Roadmap Coach.
 * 
 * Layers:
 * 1. Core Identity - strategic execution partner
 * 2. Business Context - firm-specific details
 * 3. Safety & Guardrails - what the assistant cannot do
 * 4. Capability Profile - what the assistant can do in this context
 * 5. Persona & Tone - how the assistant speaks based on user role
 * 6. Roadmap Map & Navigation - how to use the roadmap
 */
export function buildAgentSystemPrompt(
  ctx: AgentPromptContext,
  capabilities: CapabilityProfile
): BuiltAgentInstructions {
  const {
    firmName,
    businessContext = '(Context pending - ask clarifying questions)',
    roadmapSummary = '',
    roadmapSections = [],
    diagnosticSummary = '(No diagnostic summary was provided.)',
    roadmapSignals = '(No structured signals provided.)',
    tacticalFrame = '(No tactical frame was provided. Default to general roadmap-aware coaching.)'
  } = ctx;

  const roadmapSectionsBlock = roadmapSections
    .map(s => `- ${s.title}${s.key ? ` (${s.key})` : ''}`)
    .join('\n') || '(No sections available yet)';

  const personaInstructions = {
    owner: `
If persona = owner:
- Treat the user as an owner/founder.
- Focus on prioritization, ROI, tradeoffs, and where to deploy the team's time first.
- Show the cost of inaction when relevant (lost leads, wasted time, owner burnout).
- Help them choose: "If you only do one thing this week, do this."
- You may gently challenge the owner's focus if diagnostics point to a different bottleneck.
- Use roadmap + diagnostics + tactical frame to make concrete calls about what's broken and what to fix first.`,
    staff: `
If persona = staff:
- Treat the user as an implementer/operator.
- Give step-by-step guidance, checklists, and concrete actions they can execute.
- Make sure each suggestion is realistic in the context of their role.
- Clarify what they should do themselves vs. what to escalate to leadership.`,
    advisor: `
If persona = advisor:
- Treat the user as a consultant or external advisor.
- Focus on best practices, risks, and communication strategies.
- Help them translate roadmap insights into recommendations for the firm.
- Emphasize how to explain tradeoffs and priorities to non-technical stakeholders.`
  };

  const instructions = `
You are the Strategic AI Roadmap Coach.

Your job is to help small business owners and their teams understand, prioritize, and execute their AI-powered business roadmap.

On every message, you will receive a [STRATEGY_CONTEXT] JSON block followed by a user message.

Rules:
- Treat the STRATEGY_CONTEXT as the source of truth about the business.
- Ground all recommendations in the pains, leverage points, workflow gaps, quick wins, and objectives in that context.
- If something is ambiguous or missing, ask 1–2 concise clarifying questions before prescribing a plan.
- Prefer concrete next steps over abstract theory.
- When possible, translate recommendations into small, doable actions that fit into a busy operator's week.

STRICT ANTI-INVENTION RULES:
- NEVER invent ticket IDs, ticket titles, dependencies, or dollar amounts.
- ONLY reference tickets that exist in the FULL CONTEXT JSON provided in the business context.
- Sprint assignments come ONLY from the sprint breakdown in the context - DO NOT invent sprint numbers.
- ROI numbers (costs, hours, savings) come ONLY from the rollup data in the context.
- When the user asks about tickets, cite the actual ticketId and title from the context.
- If you don't have specific information about a ticket or metric, say so explicitly.
- Never hallucinate implementation steps, dependencies, or cost estimates.

Never invent business details that contradict the STRATEGY_CONTEXT.
Never ignore obvious constraints described in the context.
`.trim();

  const instructionsHash = crypto
    .createHash('sha256')
    .update(instructions, 'utf8')
    .digest('hex');

  return { instructions, instructionsHash };
}

/**
 * Build context from AgentConfig for use with buildAgentSystemPrompt
 * 
 * Optionally loads diagnostics from database if enableDiagnostics is true
 */
export async function buildContextFromConfig(
  config: AgentConfig,
  tenantName: string,
  options?: { enableDiagnostics?: boolean }
): Promise<AgentPromptContext> {
  const roadmapSections: Array<{ title: string; key?: string }> = [];
  
  if (config.roadmapMetadata) {
    const metadata = config.roadmapMetadata as any;
    
    // Extract section names if available
    if (metadata.sections && Array.isArray(metadata.sections)) {
      roadmapSections.push(...metadata.sections);
    }
  }

  let diagnosticSummary: string | undefined;
  let roadmapSignals: string | undefined;

  // Optionally load diagnostics and compute signals
  if (options?.enableDiagnostics) {
    try {
      const { deriveRoadmapSignals, formatSignalsForPrompt } = await import('./roadmapAnalysis/metadataParser');
      const { db } = await import('../db');
      const { roadmapSections: roadmapSectionsTable, roadmaps, intakes } = await import('../db/schema');
      const { eq } = await import('drizzle-orm');

      // Load roadmap sections via join on roadmaps table for tenant filtering
      const sections = await db
        .select({
          id: roadmapSectionsTable.id,
          roadmapId: roadmapSectionsTable.roadmapId,
          sectionNumber: roadmapSectionsTable.sectionNumber,
          sectionName: roadmapSectionsTable.sectionName,
          contentMarkdown: roadmapSectionsTable.contentMarkdown,
          status: roadmapSectionsTable.status,
        })
        .from(roadmapSectionsTable)
        .innerJoin(roadmaps, eq(roadmaps.id, roadmapSectionsTable.roadmapId))
        .where(eq(roadmaps.tenantId, config.tenantId));

      // Load latest intake
      const latestIntake = await db.query.intakes.findFirst({
        where: eq(intakes.tenantId, config.tenantId),
        orderBy: (intakes, { desc }) => [desc(intakes.createdAt)],
      });

      if (sections.length > 0) {
        // Simple diagnostic summary from intake
        if (latestIntake?.answers) {
          const answers = latestIntake.answers as any;
          const painKeys = Object.keys(answers).filter(k => k.toLowerCase().includes('pain'));
          if (painKeys.length > 0) {
            diagnosticSummary = `Diagnostic data available (${painKeys.length} pain areas measured).`;
          }
        }

        // Compute signals
        const roadmapSectionsData = sections.map(s => ({
          id: s.id,
          sectionKey: s.sectionNumber.toString(),
          sectionName: s.sectionName,
          status: s.status as 'implemented' | 'in_progress' | 'planned',
          contentMarkdown: s.contentMarkdown || '',
        }));

        const signals = deriveRoadmapSignals({
          roadmapSections: roadmapSectionsData,
          diagnostics: undefined, // Don't include diagnostics in system prompt (too static)
        });

        roadmapSignals = formatSignalsForPrompt(signals);
      }
    } catch (error) {
      console.error('[PromptBuilder] Failed to load diagnostics:', error);
      // Continue without diagnostics rather than failing provisioning
    }
  }

  return {
    firmName: tenantName,
    businessContext: config.businessContext || undefined,
    roadmapSummary: undefined,
    roadmapSections,
    diagnosticSummary,
    roadmapSignals,
  };
}
