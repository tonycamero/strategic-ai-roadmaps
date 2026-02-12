import { db } from '../db/index.ts';
import { intakes, tenants, intakeClarifications } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { NormalizedIntakeContext, RawIntakeAnswers } from '../types/intake';

/**
 * Fetch the latest intake for each role for a tenant
 */
export async function getTenantIntakes(tenantId: string): Promise<{
  owner?: any;
  ops?: any;
  sales?: any;
  delivery?: any;
}> {
  // First, get the tenant to find the ownerId
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    console.error(`[getTenantIntakes] Tenant not found: ${tenantId}`);
    return {};
  }

  // Now query intakes for this tenant
  const allIntakes = await db
    .select()
    .from(intakes)
    .where(and(eq(intakes.tenantId, tenantId), eq(intakes.status, 'completed')))
    .orderBy(desc(intakes.createdAt));

  console.log(`[getTenantIntakes] Found ${allIntakes.length} completed intakes for tenant ${tenantId}`);

  const result: any = {};

  // Get latest intake per role
  for (const intake of allIntakes) {
    const role = intake.role as 'owner' | 'ops' | 'sales' | 'delivery';
    if (!result[role]) {
      result[role] = intake;
      console.log(`[getTenantIntakes]   - ${role}: ${intake.id}`);
    }
  }

  return result;
}

/**
 * Normalize Owner intake answers to standard keys
 */
function normalizeOwner(raw: any): Record<string, string | null> {
  if (!raw?.answers) return {};

  const answers = raw.answers;

  return {
    owner_pri: answers.top_priorities || null,
    owner_frustrations: answers.biggest_frustration || null,
    owner_ideal: answers.ideal_state || null,
    owner_slow: answers.workflow_stuck || null,
    owner_overload: answers.team_bottlenecks || null,
    owner_bottlenecks: answers.owner_bottlenecks || null,
    owner_systems: answers.systems_struggles || null,
    owner_comm: answers.communication_breakdown || null,
    owner_manual: answers.manual_firefighting || null,
    owner_barrier: answers.growth_barriers || null,
    owner_break: answers.volume_breaking_point || null,
    owner_ai: answers.ai_opportunities || null,
  };
}

/**
 * Normalize Sales intake answers to standard keys
 * 
 * Note: For Chamber tenants (businessType === 'chamber'):
 * - sales_* keys correspond to membership acquisition/retention
 * - Same field keys are used but semantic meaning shifts to member-centric context
 */
function normalizeSales(raw: any): Record<string, string | null> {
  if (!raw?.answers) return {};

  const answers = raw.answers;

  return {
    sales_process: answers.sales_process || null,
    sales_channels: answers.lead_generation || null,
    sales_tools: answers.crm_tools || null,
    sales_conv: answers.conversion_challenges || null,
    sales_insights: answers.customer_insights || null,
    sales_automation: answers.automation_opportunities || null,
  };
}

/**
 * Normalize Ops intake answers to standard keys
 * 
 * Note: For Chamber tenants (businessType === 'chamber'):
 * - ops_* keys focus on coordination between membership, events, and executive
 * - Same field keys but semantic meaning includes board reporting and member data quality
 */
function normalizeOps(raw: any): Record<string, string | null> {
  if (!raw?.answers) return {};

  const answers = raw.answers;

  return {
    ops_systems: answers.current_systems || null,
    ops_stack: answers.tech_stack || null,
    ops_auto: answers.automation_level || null,
    ops_pain: answers.pain_points || null,
    ops_data: answers.data_quality || null,
    ops_integrations: answers.integration_challenges || null,
  };
}

/**
 * Normalize Delivery intake answers to standard keys
 * 
 * Note: For Chamber tenants (businessType === 'chamber'):
 * - del_* keys correspond to events/programs operations
 * - Same field keys are used but semantic meaning shifts to event-centric context
 */
function normalizeDelivery(raw: any): Record<string, string | null> {
  if (!raw?.answers) return {};

  const answers = raw.answers;

  return {
    del_process: answers.delivery_process || null,
    del_tools: answers.project_management || null,
    del_team: answers.team_size || null,
    del_bottlenecks: answers.bottlenecks || null,
    del_kpi: answers.quality_metrics || null,
    del_feedback: answers.client_feedback || null,
  };
}

/**
 * Build matrix view joining themes across roles
 */
function buildMatrixView(roles: {
  owner: Record<string, string | null>;
  ops: Record<string, string | null>;
  sales: Record<string, string | null>;
  delivery: Record<string, string | null>;
}): Array<{
  theme: string;
  owner?: string | null;
  ops?: string | null;
  sales?: string | null;
  delivery?: string | null;
}> {
  return [
    {
      theme: 'Strategic Priorities',
      owner: roles.owner.owner_pri,
    },
    {
      theme: 'Lead Flow & Assignment',
      owner: roles.owner.owner_break,
      sales: roles.sales.sales_process,
    },
    {
      theme: 'Sales Process & Conversion',
      owner: roles.owner.owner_frustrations,
      sales: roles.sales.sales_conv,
    },
    {
      theme: 'Systems & Tech Stack',
      owner: roles.owner.owner_systems,
      ops: roles.ops.ops_systems,
      sales: roles.sales.sales_tools,
    },
    {
      theme: 'Automation & Manual Work',
      owner: roles.owner.owner_manual,
      ops: roles.ops.ops_pain,
      sales: roles.sales.sales_automation,
    },
    {
      theme: 'Data Quality & Integration',
      ops: roles.ops.ops_data,
    },
    {
      theme: 'Delivery Bottlenecks',
      owner: roles.owner.owner_slow,
      delivery: roles.delivery.del_bottlenecks,
    },
    {
      theme: 'Team Overload',
      owner: roles.owner.owner_overload,
      delivery: roles.delivery.del_team,
    },
    {
      theme: 'Owner Bottlenecks',
      owner: roles.owner.owner_bottlenecks,
    },
    {
      theme: 'Communication Breakdown',
      owner: roles.owner.owner_comm,
      delivery: roles.delivery.del_feedback,
    },
    {
      theme: 'Growth Barriers',
      owner: roles.owner.owner_barrier,
    },
    {
      theme: 'Failure Under Volume',
      owner: roles.owner.owner_break,
    },
    {
      theme: 'Ideal State Vision',
      owner: roles.owner.owner_ideal,
    },
    {
      theme: 'Customer Insights & Data',
      sales: roles.sales.sales_insights,
      delivery: roles.delivery.del_feedback,
    },
    {
      theme: 'Quality Metrics & KPIs',
      delivery: roles.delivery.del_kpi,
    },
  ];
}

/**
 * Analyze context for contradictions, missing data, and choke points
 */
function analyzeContext(params: {
  owner: Record<string, string | null>;
  ops: Record<string, string | null>;
  sales: Record<string, string | null>;
  delivery: Record<string, string | null>;
  matrixView: any[];
}): {
  contradictions: string[];
  missingData: string[];
  chokePoints: string[];
} {
  const { owner, ops, sales, delivery } = params;

  const missingData: string[] = [];
  const contradictions: string[] = [];
  const chokePoints: string[] = [];

  // Detect missing data
  Object.entries({ owner, ops, sales, delivery }).forEach(([role, answers]) => {
    Object.entries(answers).forEach(([key, value]) => {
      if (!value || value.trim().length === 0) {
        missingData.push(`Missing ${role} answer: ${key}`);
      }
    });
  });

  // Detect contradictions (basic heuristics)
  if (owner.owner_ideal && owner.owner_frustrations) {
    const idealLength = owner.owner_ideal.length;
    const frustrationLength = owner.owner_frustrations.length;

    if (idealLength < 50 && frustrationLength > 300) {
      contradictions.push('Owner has detailed frustrations but vague ideal state vision');
    }
  }

  if (owner.owner_systems?.toLowerCase().includes('no') && ops.ops_stack && ops.ops_stack.length > 100) {
    contradictions.push('Owner reports system struggles, but ops lists extensive tech stack');
  }

  // Detect choke points (pattern matching)
  const overloadText = owner.owner_overload?.toLowerCase() || '';
  if (overloadText.includes('all') || overloadText.includes('every') || overloadText.includes('multiple')) {
    chokePoints.push('Multiple team members reported as overloaded/bottlenecked');
  }

  const delBottlenecks = delivery.del_bottlenecks?.toLowerCase() || '';
  const opsPain = ops.ops_pain?.toLowerCase() || '';

  if (delBottlenecks && opsPain) {
    // Check for common bottleneck keywords
    const commonKeywords = ['handoff', 'waiting', 'approval', 'communication', 'data'];
    commonKeywords.forEach(keyword => {
      if (delBottlenecks.includes(keyword) && opsPain.includes(keyword)) {
        chokePoints.push(`Cross-functional bottleneck detected: ${keyword}`);
      }
    });
  }

  const breakPoint = owner.owner_break?.toLowerCase() || '';
  if (breakPoint.includes('30%') || breakPoint.includes('many') || breakPoint.includes('lots') || breakPoint.includes('most')) {
    chokePoints.push('High percentage of leads at risk under volume stress');
  }

  return { contradictions, missingData, chokePoints };
}

/**
 * Main entry point: build complete normalized intake context
 */
export async function buildNormalizedIntakeContext(tenantId: string): Promise<NormalizedIntakeContext> {
  const raw = await getTenantIntakes(tenantId);

  const owner = normalizeOwner(raw.owner);
  const ops = normalizeOps(raw.ops);
  const sales = normalizeSales(raw.sales);
  const delivery = normalizeDelivery(raw.delivery);

  const matrixView = buildMatrixView({ owner, ops, sales, delivery });
  const { contradictions, missingData, chokePoints } = analyzeContext({ owner, ops, sales, delivery, matrixView });

  // Fetch Clarifications
  const clarifications = await db
    .select({
      questionId: intakeClarifications.questionId,
      originalResponse: intakeClarifications.originalResponse,
      clarificationPrompt: intakeClarifications.clarificationPrompt,
      clarificationResponse: intakeClarifications.clarificationResponse,
      status: intakeClarifications.status
    })
    .from(intakeClarifications)
    .where(eq(intakeClarifications.tenantId, tenantId));

  return {
    tenantId,
    roles: { owner, ops, sales, delivery },
    matrixView,
    contradictions,
    missingData,
    chokePoints,
    clarifications
  };
}
