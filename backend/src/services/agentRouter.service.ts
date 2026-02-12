import { db } from '../db/index.ts';
import { agentRoutingRules, agentConfigs } from '../db/schema.ts';
import { and, eq } from 'drizzle-orm';

export type AgentRoleType = 'owner' | 'ops' | 'tc' | 'agent_support';
export type RoutingSource = 'rule' | 'semantic' | 'default';

export interface RoutingResult {
  roleType: AgentRoleType;
  source: RoutingSource;
  matchedRule?: string;
  confidence?: number;
}

/**
 * Intelligent agent routing service
 * Uses pattern-based rules first, then semantic keyword matching
 */
export class AgentRouterService {
  /**
   * Route a message to the appropriate agent
   */
  static async routeMessage(params: {
    tenantId: string;
    message: string;
  }): Promise<RoutingResult> {
    const { tenantId, message } = params;

    // 1. Try pattern-based rules first (highest priority)
    const ruleMatch = await this.matchRoutingRules(tenantId, message);
    if (ruleMatch) {
      return ruleMatch;
    }

    // 2. Fall back to semantic keyword matching
    const semanticMatch = this.semanticRouting(message);
    return semanticMatch;
  }

  /**
   * Check routing rules for pattern matches
   */
  private static async matchRoutingRules(
    tenantId: string,
    message: string
  ): Promise<RoutingResult | null> {
    // Get active rules for this tenant, sorted by priority
    const rules = await db
      .select()
      .from(agentRoutingRules)
      .where(
        and(
          eq(agentRoutingRules.tenantId, tenantId),
          eq(agentRoutingRules.isActive, true)
        )
      )
      .orderBy(agentRoutingRules.priority);

    const messageLower = message.toLowerCase();

    for (const rule of rules) {
      try {
        // Try regex match
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(message)) {
          return {
            roleType: rule.routeTo as AgentRoleType,
            source: 'rule',
            matchedRule: rule.pattern,
          };
        }
      } catch (error) {
        // If regex fails, try simple substring match
        if (messageLower.includes(rule.pattern.toLowerCase())) {
          return {
            roleType: rule.routeTo as AgentRoleType,
            source: 'rule',
            matchedRule: rule.pattern,
          };
        }
      }
    }

    return null;
  }

  /**
   * Semantic routing based on keyword scoring
   */
  private static semanticRouting(message: string): RoutingResult {
    const messageLower = message.toLowerCase();

    // Define keyword sets for each agent type
    const keywords = {
      ops: [
        'pipeline',
        'workflow',
        'process',
        'efficiency',
        'automation',
        'system',
        'integration',
        'setup',
        'configure',
        'optimize',
        'bottleneck',
        'handoff',
        'sop',
        'procedure',
      ],
      tc: [
        'transaction',
        'signing',
        'contract',
        'document',
        'compliance',
        'closing',
        'escrow',
        'title',
        'paperwork',
        'deadline',
        'coordination',
      ],
      agent_support: [
        'client',
        'communication',
        'follow up',
        'response',
        'inquiry',
        'question',
        'support',
        'help',
        'assist',
        'contact',
        'outreach',
        'engagement',
      ],
      owner: [
        'strategy',
        'roadmap',
        'goal',
        'vision',
        'revenue',
        'growth',
        'plan',
        'business',
        'decision',
        'metric',
        'roi',
        'performance',
      ],
    };

    // Score each agent type
    const scores: Record<AgentRoleType, number> = {
      owner: 0,
      ops: 0,
      tc: 0,
      agent_support: 0,
    };

    for (const [roleType, keywordList] of Object.entries(keywords)) {
      for (const keyword of keywordList) {
        if (messageLower.includes(keyword)) {
          scores[roleType as AgentRoleType]++;
        }
      }
    }

    // Find highest scoring agent
    let bestRole: AgentRoleType = 'owner'; // Default
    let bestScore = scores.owner;

    for (const [roleType, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestRole = roleType as AgentRoleType;
        bestScore = score;
      }
    }

    // If no keywords matched, default to owner
    const source: RoutingSource = bestScore > 0 ? 'semantic' : 'default';

    return {
      roleType: bestRole,
      source,
      confidence: bestScore,
    };
  }

  /**
   * Get agent config ID for a routed role
   */
  static async getAgentConfigForRole(
    tenantId: string,
    roleType: AgentRoleType
  ): Promise<string | null> {
    const config = await db.query.agentConfigs.findFirst({
      where: and(
        eq(agentConfigs.tenantId, tenantId),
        eq(agentConfigs.agentType, roleType)
      ),
    });

    return config?.id ?? null;
  }

  /**
   * Create a routing rule
   */
  static async createRoutingRule(params: {
    tenantId: string;
    pattern: string;
    routeTo: AgentRoleType;
    priority?: number;
  }) {
    const [rule] = await db
      .insert(agentRoutingRules)
      .values({
        tenantId: params.tenantId,
        pattern: params.pattern,
        routeTo: params.routeTo,
        priority: params.priority ?? 10,
      })
      .returning();

    return rule;
  }

  /**
   * List routing rules for a tenant
   */
  static async listRoutingRules(tenantId: string) {
    return db
      .select()
      .from(agentRoutingRules)
      .where(eq(agentRoutingRules.tenantId, tenantId))
      .orderBy(agentRoutingRules.priority);
  }
}
