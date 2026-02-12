import OpenAI from 'openai';
import { db } from '../db/index.ts';
import { tenants, users, intakes, agentConfigs, ticketInstances, roadmapSections, roadmaps, ticketPacks } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { getCustomInstructions } from '../config/agent-custom-instructions';
import { runVerifiedCompute } from './verified-compute.service';
import type { ToolConfig, AgentConfig, AgentRoleType } from '../types/agent.types';
import { ImplementationMetricsService } from './implementationMetrics.service';

type TenantRow = typeof tenants.$inferSelect;
type TenantWithOwner = TenantRow & { ownerName: string };



// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Static tool metadata for now. Later this can be merged with agent_configs.toolContext.
// For now all existing tools are non-verified; this is the future hook for EQTY Labs / Hedera VC.
const TOOL_METADATA: Record<string, { verifiedCompute: boolean }> = {
  find_firm_by_name: { verifiedCompute: false },
  get_firm_details: { verifiedCompute: false },
  get_intake_data: { verifiedCompute: false },
  list_firms: { verifiedCompute: false },
  get_roadmap_sections: { verifiedCompute: false },
  get_ticket_status: { verifiedCompute: false },
  update_ticket_status: { verifiedCompute: false },
  add_ticket_note: { verifiedCompute: false },
};

// Agent context passed from API
export interface AgentContext {
  user_id: string;
  firm_id?: string;
  role?: string;
}

// Tool function definitions
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'find_firm_by_name',
      description: 'Find a firm by name (e.g., "Hayes", "ABC Company"). Returns firm_id for use in other tools.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The firm name to search for (partial match supported)',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_firm_details',
      description: 'Get basic information about a firm including name, owner, contact info, and metadata',
      parameters: {
        type: 'object',
        properties: {
          firm_id: {
            type: 'string',
            description: 'The tenant/firm ID to get details for',
          },
        },
        required: ['firm_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_intake_data',
      description: 'Get intake form responses for a firm, including owner and team member intakes',
      parameters: {
        type: 'object',
        properties: {
          firm_id: {
            type: 'string',
            description: 'The tenant/firm ID to get intake data for',
          },
        },
        required: ['firm_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_firms',
      description: 'List all firms in the system with optional filtering',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by status: prospect, pilot, active, churned',
            enum: ['prospect', 'pilot', 'active', 'churned'],
          },
          has_completed_intakes: {
            type: 'boolean',
            description: 'Filter to firms where owner has completed intake',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_roadmap_sections',
      description: 'Get roadmap sections with metadata (pain points, goals, systems) for this firm',
      parameters: {
        type: 'object',
        properties: {
          firm_id: {
            type: 'string',
            description: 'The tenant/firm ID to get roadmap for',
          },
        },
        required: ['firm_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ticket_status',
      description: 'Get current status of all tickets for a firm, grouped by roadmap section',
      parameters: {
        type: 'object',
        properties: {
          firm_id: {
            type: 'string',
            description: 'The tenant/firm ID to get tickets for',
          },
        },
        required: ['firm_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_ticket_status',
      description: 'Update the status of a specific ticket (planned → in_progress → done)',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: {
            type: 'string',
            description: 'The ticket ID to update',
          },
          status: {
            type: 'string',
            description: 'New status for the ticket',
            enum: ['planned', 'in_progress', 'blocked', 'done'],
          },
        },
        required: ['ticket_id', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_ticket_note',
      description: 'Add a note or comment to a ticket',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: {
            type: 'string',
            description: 'The ticket ID to add note to',
          },
          note: {
            type: 'string',
            description: 'The note/comment text',
          },
        },
        required: ['ticket_id', 'note'],
      },
    },
  },
];

// Tool implementations
async function findFirmByName(name: string) {
  try {
    const firms = await db.select().from(tenants);
    
    // Case-insensitive partial match
    const searchLower = name.toLowerCase();
    const matches = firms.filter(firm => 
      firm.name.toLowerCase().includes(searchLower)
    );

    if (matches.length === 0) {
      return { error: `No firm found matching "${name}"` };
    }

    if (matches.length === 1) {
      const firm = matches[0];
      const owner = await db.query.users.findFirst({
        where: eq(users.id, firm.ownerUserId),
      });
      return {
        firm_id: firm.id,
        name: firm.name,
        ownerName: owner?.name || 'Unknown',
        status: firm.status,
        message: `Found: ${firm.name} (${firm.id})`,
      };
    }

    // Multiple matches
    return {
      message: `Found ${matches.length} firms matching "${name}":`,
      firms: matches.map(f => ({
        firm_id: f.id,
        name: f.name,
        status: f.status,
      })),
    };
  } catch (error) {
    console.error('Error finding firm by name:', error);
    return { error: 'Failed to find firm' };
  }
}

async function getFirmDetails(firmId: string) {
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, firmId),
    });

    if (!tenant) {
      return { error: `Firm with ID ${firmId} not found` };
    }

    // Get owner info
    const owner = await db.query.users.findFirst({
      where: eq(users.id, tenant.ownerUserId),
    });

    return {
      id: tenant.id,
      name: tenant?.name || "this firm",
      ownerName: owner?.name || 'Unknown',
      ownerEmail: owner?.email || 'Unknown',
      status: tenant.status,
      cohortLabel: tenant.cohortLabel,
      segment: tenant.segment,
      region: tenant.region,
      createdAt: tenant.createdAt,
    };
  } catch (error) {
    console.error('Error fetching firm details:', error);
    return { error: 'Failed to fetch firm details' };
  }
}

async function getIntakeData(firmId: string) {
  try {
    // Get tenant to find ownerId
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, firmId),
    });

    if (!tenant) {
      return { error: 'Firm not found' };
    }

    const intakeRecords = await db.query.intakes.findMany({
      where: eq(intakes.tenantId, tenant.id),
    });

    if (intakeRecords.length === 0) {
      return { message: 'No intake data found for this firm' };
    }

    // Fetch user info for each intake
    const intakesWithUsers = await Promise.all(
      intakeRecords.map(async (intake) => {
        const user = await db.query.users.findFirst({
          where: eq(users.id, intake.userId),
        });
        return {
          role: intake.role,
          userName: user?.name || 'Unknown',
          userEmail: user?.email,
          answers: intake.answers,
          completedAt: intake.completedAt,
          createdAt: intake.createdAt,
        };
      })
    );

    return intakesWithUsers;
  } catch (error) {
    console.error('Error fetching intake data:', error);
    return { error: 'Failed to fetch intake data' };
  }
}

async function listFirms(filters?: { status?: string; has_completed_intakes?: boolean }) {
  try {
const firms = await db
  .select()
  .from(tenants)
  .where(filters?.status ? eq(tenants.status, filters.status) : undefined);

    // Fetch owner names for all firms
const firmsWithOwners: TenantWithOwner[] = await Promise.all(
  firms.map(async (firm) => {
    const owner = await db.query.users.findFirst({
      where: eq(users.id, firm.ownerUserId),
    });

    return {
      ...(firm as TenantRow),
      ownerName: owner?.name ?? 'Unknown',
    } as any;
  })
);


    // If filtering by completed intakes, check for owner intakes
    if (filters?.has_completed_intakes) {
      const firmsWithIntakes = await Promise.all(
        firmsWithOwners.map(async (firm) => {
          const ownerIntake = await db.query.intakes.findFirst({
            where: and(eq(intakes.tenantId, firm.id), eq(intakes.role, 'owner')),
          });
          return ownerIntake ? firm : null;
        })
      );
      return firmsWithIntakes.filter(Boolean).map((firm) => ({
        id: firm!.id,
        name: firm!.name,
        ownerName: firm!.ownerName,
        status: firm!.status,
        createdAt: firm!.createdAt,
      }));
    }

    return firmsWithOwners.map((firm) => ({
      id: firm.id,
      name: firm.name,
      ownerName: firm.ownerName,
      status: firm.status,
      createdAt: firm.createdAt,
    }));
  } catch (error) {
    console.error('Error listing firms:', error);
    return { error: 'Failed to list firms' };
  }
}

async function getRoadmapSections(firmId: string) {
  try {
    // Get tenant to find ownerId
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, firmId),
    });

    if (!tenant) {
      return { error: 'Firm not found' };
    }

    // Get roadmap for this firm's owner
    const roadmap = await db.query.roadmaps.findFirst({
      where: eq(roadmaps.tenantId, tenant.id),
    });

    if (!roadmap) {
      return { message: 'No roadmap found for this firm' };
    }

    const sections = await db
      .select()
      .from(roadmapSections)
      .where(eq(roadmapSections.roadmapId, roadmap.id))
      .orderBy(roadmapSections.sectionNumber);

    if (sections.length === 0) {
      return { message: 'No roadmap sections found' };
    }

    // Get agent config with metadata
    const config = await db.query.agentConfigs.findFirst({
      where: and(
        eq(agentConfigs.tenantId, firmId),
        eq(agentConfigs.agentType, 'owner')
      ),
    });

    return {
      sections: sections.map(s => ({
        number: s.sectionNumber,
        name: s.sectionName,
        status: s.status,
        wordCount: s.wordCount,
        preview: s.contentMarkdown.substring(0, 200) + '...',
      })),
      metadata: config?.roadmapMetadata || null,
    };
  } catch (error) {
    console.error('Error fetching roadmap sections:', error);
    return { error: 'Failed to fetch roadmap sections' };
  }
}

async function getTicketStatus(firmId: string) {
  try {
    // Get ticket pack for this firm
    const pack = await db.query.ticketPacks.findFirst({
      where: eq(ticketPacks.tenantId, firmId),
    });

    if (!pack) {
      return { message: 'No ticket pack found for this firm' };
    }

    const tickets = await db
      .select()
      .from(ticketInstances)
      .where(eq(ticketInstances.ticketPackId, pack.id));

    if (tickets.length === 0) {
      return { message: 'No tickets found' };
    }

    // Group by section
    const bySection = tickets.reduce((acc, ticket) => {
      const key = `Section ${ticket.sectionNumber}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        id: ticket.id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        assignee: ticket.assignee,
        notes: ticket.notes,
        startedAt: ticket.startedAt,
        completedAt: ticket.completedAt,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return { tickets: bySection };
  } catch (error) {
    console.error('Error fetching ticket status:', error);
    return { error: 'Failed to fetch ticket status' };
  }
}

async function updateTicketStatus(ticketId: string, status: string) {
  try {
    const validStatuses = ['planned', 'in_progress', 'blocked', 'done'];
    if (!validStatuses.includes(status)) {
      return { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
    }

    const [updated] = await db
      .update(ticketInstances)
      .set({ 
        status: status as any,
        startedAt: status === 'in_progress' ? new Date() : undefined,
        completedAt: status === 'done' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(ticketInstances.id, ticketId))
      .returning();

    if (!updated) {
      return { error: 'Ticket not found' };
    }

    return { success: true, ticket: updated };
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return { error: 'Failed to update ticket status' };
  }
}

async function addTicketNote(ticketId: string, note: string) {
  try {
    const [ticket] = await db
      .select()
      .from(ticketInstances)
      .where(eq(ticketInstances.id, ticketId));

    if (!ticket) {
      return { error: 'Ticket not found' };
    }

    const existingNotes = ticket.notes || '';
    const newNotes = existingNotes + '\n\n' + `[${new Date().toISOString()}] ${note}`;

    await db
      .update(ticketInstances)
      .set({ notes: newNotes, updatedAt: new Date() })
      .where(eq(ticketInstances.id, ticketId));

    return { success: true, note };
  } catch (error) {
    console.error('Error adding ticket note:', error);
    return { error: 'Failed to add ticket note' };
  }
}

// Execute tool calls
async function executeToolCall(functionName: string, args: any) {
  switch (functionName) {
    case 'find_firm_by_name':
      return await findFirmByName(args.name);
    case 'get_firm_details':
      return await getFirmDetails(args.firm_id);
    case 'get_intake_data':
      return await getIntakeData(args.firm_id);
    case 'list_firms':
      return await listFirms(args);
    case 'get_roadmap_sections':
      return await getRoadmapSections(args.firm_id);
    case 'get_ticket_status':
      return await getTicketStatus(args.firm_id);
    case 'update_ticket_status':
      return await updateTicketStatus(args.ticket_id, args.status);
    case 'add_ticket_note':
      return await addTicketNote(args.ticket_id, args.note);
    default:
      return { error: `Unknown function: ${functionName}` };
  }
}

// VC-aware tool dispatcher
// For now all existing tools are non-verified; this is the future hook for EQTY Labs / Hedera VC.
async function callToolWithOptionalVC(functionName: string, args: any) {
  const meta = TOOL_METADATA[functionName] ?? { verifiedCompute: false };

  // For now all existing tools are non-verified; this is the future hook.
  if (!meta.verifiedCompute) {
    return executeToolCall(functionName, args);
  }

  // Future: This branch will call EQTY Labs / Hedera VC enclave
  const { result } = await runVerifiedCompute(
    { toolName: functionName, input: args },
    () => executeToolCall(functionName, args),
  );

  return result;
}

// Fallback system prompt (used when agent_configs not available)
function buildFallbackSystemPrompt(): string {
  return `You are a Strategic AI Roadmap assistant helping Tony Camero manage his roadmap consulting business.

Your purpose:
- Help analyze firms, intakes, and roadmap data
- Provide actionable insights and recommendations
- Reference specific data from the database when answering
- Be concise and direct

Available data:
- Firm/tenant information (names, owners, contact info)
- Owner and team intake responses
- Roadmap content (8 sections per firm)
- Documents uploaded by firms

IMPORTANT - Firm Lookup Protocol:
When asked about a specific firm by name (e.g., "Hayes", "ABC Company"):
1. First call list_firms() to get all firms and find the firm_id
2. Then use that firm_id in subsequent tool calls (get_intake_data, get_roadmap_sections, etc.)
3. Do NOT call tools that require firm_id without getting the ID first

When answering:
- Always call relevant tools to get current data
- Lead with the answer, not context
- Use bullet points and emojis for visual hierarchy
- Reference specific firms, intakes, or documents
- End with 1-3 actionable next steps

${getCustomInstructions()}

Tone: Direct, concise, actionable. No fluff, no preamble, no business jargon.`;
}

// Compose prompt from agent config (multi-field composition)
function composePromptFromConfig(config: AgentConfig): string {
  return `
${config.systemIdentity}

${config.businessContext ? `Business Context:\n${config.businessContext}\n` : ''}

${config.customInstructions ? `Owner Preferences:\n${config.customInstructions}\n` : ''}

Role Playbook:
${config.rolePlaybook}

${getCustomInstructions()}
`.trim();
}

// Load system prompt from agent_configs or fall back to hardcoded
async function getSystemPromptForContext(context: AgentContext): Promise<string> {
  const hayesTenantId = process.env.HAYES_TENANT_ID;
  
  // Use firm_id from context (scoped to owner) or fall back to env var
  const tenantId = context.firm_id || hayesTenantId;

  // If no tenant ID available, use fallback
  if (!tenantId) {
    return buildFallbackSystemPrompt();
  }

  try {
    // Get user and tenant info for personalization
    const user = await db.query.users.findFirst({
      where: eq(users.id, context.user_id),
    });

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    const configRow = await db.query.agentConfigs.findFirst({
      where: and(
        eq(agentConfigs.tenantId, tenantId),
        eq(agentConfigs.agentType, 'owner')
      ),
    });

    if (!configRow) {
      console.warn('[Agent] No agent_config found for tenant. Using fallback system prompt.', { tenantId });
      return buildFallbackSystemPrompt();
    }

    // Use configRow directly - cast to AgentConfig type
    const config = configRow as any as AgentConfig;

    console.log('[Agent] Loaded agent_config from DB:', { 
      tenantId: config.tenantId, 
      roleType: config.agentType, 
      version: config.version,
      userName: user?.name,
      firmName: tenant?.name 
    });

    // Add user context to the prompt
    let prompt = composePromptFromConfig(config);
    
    if (user && tenant) {
      prompt = `${prompt}

Current User Context:
You are currently assisting ${user.name}, the owner of ${tenant?.name || "this firm"}.
When asked "who am I" or "what firm", reference this information directly.
All data queries should be scoped to ${tenant?.name || "this firm"} unless explicitly asked about other firms.`;
    }

    // T3.9: Add metrics awareness for performance coaching
    try {
      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, tenantId),
      });

      if (roadmap) {
        const outcome = await ImplementationMetricsService.getOutcome({
          tenantId,
          roadmapId: roadmap.id,
        });

        if (outcome && outcome.deltas && outcome.realizedRoi) {
          prompt = `${prompt}

Performance Metrics Context (Act as Performance Coach):
You have access to ${tenant?.name || "this firm"}'s implementation metrics and ROI data.

Key Deltas:
- Lead Response: ${(outcome.deltas.lead_response_minutes || 0) > 0 ? '↓' : '↑'} ${Math.abs(outcome.deltas.lead_response_minutes || 0).toFixed(1)} minutes
- Lead-to-Appt Rate: ${(outcome.deltas.lead_to_appt_rate || 0) > 0 ? '↑' : '↓'} ${Math.abs(outcome.deltas.lead_to_appt_rate || 0).toFixed(1)}%
- CRM Adoption: ${(outcome.deltas.crm_adoption_rate || 0) > 0 ? '↑' : '↓'} ${Math.abs(outcome.deltas.crm_adoption_rate || 0).toFixed(1)}%
- Weekly Ops Hours: ${(outcome.deltas.weekly_ops_hours || 0) > 0 ? '↓' : '↑'} ${Math.abs(outcome.deltas.weekly_ops_hours || 0).toFixed(1)} hrs
- NPS: ${(outcome.deltas.nps || 0) > 0 ? '↑' : '↓'} ${Math.abs(outcome.deltas.nps || 0).toFixed(0)}

Realized ROI: ${outcome.realizedRoi.net_roi_percent?.toFixed(0)}% (${outcome.status})

When discussing metrics:
- Interpret trends and diagnose issues
- Recommend specific roadmap sections/tickets to improve KPIs
- Frame suggestions within business context
- Be direct about what's working and what needs attention`;
        }
      }
    } catch (error) {
      console.warn('[Agent] Could not load metrics context:', error);
    }

    return prompt;
  } catch (error) {
    console.error('[Agent] Error loading agent_config, using fallback system prompt:', error);
    return buildFallbackSystemPrompt();
  }
}

// Main agent query function
export async function queryAgent(message: string, context: AgentContext): Promise<string> {
  try {
    const systemPrompt = await getSystemPromptForContext(context);

    // Initial API call with tools
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      tools,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;

    // If no tool calls, return the response
    if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
      return responseMessage.content || 'I encountered an issue processing your request.';
    }

    // Execute tool calls
    const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
      responseMessage as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam,
    ];

    for (const toolCall of responseMessage.tool_calls) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(`[Agent] Calling tool: ${functionName}`, functionArgs);

      const toolResult = await callToolWithOptionalVC(functionName, functionArgs);

      toolMessages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    // Second API call with tool results
    const secondResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: toolMessages,
    });

    return secondResponse.choices[0].message.content || 'I encountered an issue processing your request.';
  } catch (error) {
    console.error('[Agent] Error:', error);
    if (error instanceof Error) {
      return `I encountered an error: ${error.message}`;
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
