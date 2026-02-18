import { db } from '../db/index';
import { agentConfigs, roadmapSections, agentLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { provisionAssistantForConfig } from './assistantProvisioning.service';
import { buildRoadmapQnAContext } from '../trustagent/services/roadmapQnAContext.service';

/**
 * Sync agents after roadmap refresh
 * Updates agent configs with new roadmap context and reprovisions assistants
 */
export async function syncAgentsForRoadmap(
  tenantId: string,
  roadmapId: string,
  triggeredByUserId?: string
): Promise<void> {
  console.log('[AgentSync] Starting sync for tenant:', tenantId, 'roadmap:', roadmapId);

  try {
    // 1. Fetch roadmap sections
    const sections = await db
      .select()
      .from(roadmapSections)
      .where(eq(roadmapSections.roadmapId, roadmapId))
      .orderBy(roadmapSections.sectionNumber);

    if (sections.length === 0) {
      console.warn('[AgentSync] No sections found for roadmap:', roadmapId);
      return;
    }

    // 2. Extract roadmap metadata from sections
    const roadmapMetadata = extractRoadmapMetadata(sections);

    // 3. Build enriched context with real ticket data
    const qnaContext = await buildRoadmapQnAContext(tenantId);
    if (!qnaContext) {
      console.warn('[AgentSync] No Q&A context found for tenant:', tenantId);
      return;
    }
    const businessContext = buildBusinessContextWithTickets(sections, qnaContext);

  // 4. Get or create the single roadmap_coach config for this tenant
  let configs = await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.tenantId, tenantId));

  if (configs.length === 0) {
    console.log('[AgentSync] No agent config found for tenant:', tenantId, '— creating roadmap_coach...');

    const now = new Date();
    const defaultModel = process.env.DEFAULT_AGENT_MODEL || 'gpt-4o-mini';

    // Create single roadmap_coach config
    await db.insert(agentConfigs).values({
      tenantId,
      agentType: 'roadmap_coach',
      systemIdentity: 'You are the Strategic AI Roadmap Coach for this firm.',
      businessContext: null,
      customInstructions: null,
      rolePlaybook: 'You help the firm understand and implement their strategic AI roadmap. Provide clear, actionable guidance.',
      toolContext: { tools: [] },
      roadmapMetadata: {},
      openaiAssistantId: null,
      openaiVectorStoreId: null,
      openaiModel: defaultModel,
      lastProvisionedAt: null,
      configVersion: 1,
      instructionsHash: null,
      isActive: true,
      version: 1,
      createdBy: triggeredByUserId || null,
      updatedBy: triggeredByUserId || null,
      createdAt: now,
      updatedAt: now,
    });

    console.log('[AgentSync] Created roadmap_coach config');

    // Re-query to get the newly created config
    configs = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.tenantId, tenantId));
  }

    // 5. Update the roadmap_coach config
    const config = configs[0]; // Should only be one per tenant
    if (!config) {
      throw new Error('[AgentSync] No config found after creation attempt');
    }

    await db
      .update(agentConfigs)
      .set({
        businessContext,
        roadmapMetadata,
        version: config.version + 1,
        updatedAt: new Date(),
        updatedBy: triggeredByUserId && triggeredByUserId !== 'system' ? triggeredByUserId : null,
      })
      .where(eq(agentConfigs.id, config.id));

    console.log(`[AgentSync] Updated config for agent_type: ${config.agentType}`);

    // 6. Reprovision the assistant
    let provisionSuccess = false;
    let provisionError: any = null;

    try {
      await provisionAssistantForConfig(config.id, triggeredByUserId || config.createdBy || '');
      provisionSuccess = true;
      console.log(`[AgentSync] Reprovisioned ${config.agentType} assistant`);
    } catch (error) {
      provisionError = error;
      console.error(`[AgentSync] Failed to provision ${config.agentType}:`, error);

      // Log error
      await db.insert(agentLogs).values({
        agentConfigId: config.id,
        eventType: 'error',
        interactionMode: null,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'reprovision',
          tenantId,
          roadmapId,
        },
      });
    }

    // 7. Log sync event
    await db.insert(agentLogs).values({
      agentConfigId: null, // Tenant-level event
      eventType: 'sync',
      interactionMode: null,
      metadata: {
        tenantId,
        roadmapId,
        sectionsCount: sections.length,
        provisionSuccess,
        provisionError: provisionError ? (provisionError instanceof Error ? provisionError.message : String(provisionError)) : null,
      },
    });

    console.log(`[AgentSync] Complete. Assistant ${provisionSuccess ? 'successfully provisioned' : 'provisioning failed'}`);

    if (provisionError) {
      throw provisionError;
    }
  } catch (error) {
    console.error('[AgentSync] Fatal error:', error);
    throw error;
  }
}

/**
 * Extract structured metadata from roadmap sections
 */
function extractRoadmapMetadata(sections: any[]): any {
  const metadata: any = {
    top_pain_points: [],
    primary_goals: [],
    systems_recommended: [],
    timeline: {
      '30': [],
      '60': [],
      '90': [],
    },
  };

  for (const section of sections) {
    const content = section.contentMarkdown || '';
    const lines = content.split('\n');

    // Simple heuristics for extraction
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();

      // Extract pain points
      if (line.includes('pain point') || line.includes('challenge') || line.includes('bottleneck')) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.startsWith('-')) {
          metadata.top_pain_points.push(nextLine.replace(/^-\s*/, '').slice(0, 100));
        }
      }

      // Extract goals
      if (line.includes('goal') || line.includes('objective') || line.includes('target')) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.startsWith('-')) {
          metadata.primary_goals.push(nextLine.replace(/^-\s*/, '').slice(0, 100));
        }
      }

      // Extract systems
      if (line.includes('system') && (line.includes('recommend') || line.includes('implement'))) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.startsWith('-')) {
          metadata.systems_recommended.push(nextLine.replace(/^-\s*/, '').slice(0, 100));
        }
      }

      // Extract timeline items
      if (line.includes('30 day') || line.includes('30-day')) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.startsWith('-')) {
          metadata.timeline['30'].push(nextLine.replace(/^-\s*/, '').slice(0, 80));
        }
      }
      if (line.includes('60 day') || line.includes('60-day')) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.startsWith('-')) {
          metadata.timeline['60'].push(nextLine.replace(/^-\s*/, '').slice(0, 80));
        }
      }
      if (line.includes('90 day') || line.includes('90-day')) {
        const nextLine = lines[i + 1]?.trim();
        if (nextLine && nextLine.startsWith('-')) {
          metadata.timeline['90'].push(nextLine.replace(/^-\s*/, '').slice(0, 80));
        }
      }
    }
  }

  // Deduplicate and limit
  metadata.top_pain_points = [...new Set(metadata.top_pain_points)].slice(0, 5);
  metadata.primary_goals = [...new Set(metadata.primary_goals)].slice(0, 5);
  metadata.systems_recommended = [...new Set(metadata.systems_recommended)].slice(0, 8);

  return metadata;
}

/**
 * Build business context summary from sections + real ticket data
 */
function buildBusinessContextWithTickets(sections: any[], qnaContext: any): string {
  const parts: string[] = [];

  parts.push('='.repeat(70));
  parts.push('ROADMAP Q&A CONTEXT - CANONICAL DATA ONLY');
  parts.push('='.repeat(70));
  parts.push('');

  // Firm metadata
  parts.push(`Firm: ${qnaContext.firmName}`);
  parts.push(`Firm Size: ${qnaContext.firmSizeTier} (${qnaContext.teamHeadcount || 'N/A'} people)`);
  parts.push(`Business Type: ${qnaContext.businessType}`);
  parts.push(`Baseline Monthly Leads: ${qnaContext.baselineMonthlyLeads || 'N/A'}`);
  parts.push('');

  // Owner profile (if enriched intake available)
  if (qnaContext.ownerProfile) {
    const owner = qnaContext.ownerProfile;
    parts.push('OWNER PROFILE:');
    parts.push(`  Name: ${owner.displayName || 'Not provided'}`);
    parts.push(`  Role: ${owner.roleLabel}`);
    parts.push(`  Preferred Reference: ${owner.preferredReference || owner.displayName || 'Owner'}`);
    
    if (owner.top3Issues && owner.top3Issues.length > 0) {
      parts.push(`  Top 3 Issues:`);
      owner.top3Issues.forEach((issue: string, i: number) => {
        parts.push(`    ${i + 1}. ${issue}`);
      });
    }
    
    if (owner.oneThingOutcome) {
      parts.push(`  "One Thing" Outcome: ${owner.oneThingOutcome}`);
    }
    
    if (owner.primaryKpis && owner.primaryKpis.length > 0) {
      parts.push(`  Primary KPIs:`);
      owner.primaryKpis.forEach((kpi: string) => {
        const baseline = owner.kpiBaselines?.[kpi];
        parts.push(`    • ${kpi}${baseline ? ` (baseline: ${baseline})` : ''}`);
      });
    }
    
    if (owner.changeReadiness || owner.weeklyCapacityHours) {
      parts.push(`  Change Readiness: ${owner.changeReadiness || 'medium'}`);
      parts.push(`  Weekly Capacity: ${owner.weeklyCapacityHours || 0} hours`);
    }
    
    if (owner.biggestRiskIfTooFast) {
      parts.push(`  Risk if too fast: ${owner.biggestRiskIfTooFast}`);
    }
    
    parts.push('');
  }

  // ROI rollup
  parts.push('INVESTMENT & ROI:');
  parts.push(`  Total Cost: $${qnaContext.ticketRollup.totalCost.toLocaleString()}`);
  parts.push(`  Total Hours: ${qnaContext.ticketRollup.totalHours}`);
  parts.push(`  Weekly Time Saved: ${qnaContext.ticketRollup.totalHoursSavedWeekly}h`);
  parts.push(`  Monthly Leads Recovered: ${qnaContext.ticketRollup.totalLeadsRecoveredMonthly}`);
  parts.push(`  Annualized ROI: ${qnaContext.ticketRollup.annualizedROI.toFixed(0)}%`);
  parts.push(`  Payback Period: ${qnaContext.ticketRollup.paybackWeeks.toFixed(1)} weeks`);
  parts.push('');

  // Ticket pack summary
  parts.push('TICKET PACK:');
  parts.push(`  Total Tickets: ${qnaContext.tickets.length}`);
  const coreCount = qnaContext.tickets.filter((t: any) => t.tier === 'core').length;
  const recommendedCount = qnaContext.tickets.filter((t: any) => t.tier === 'recommended').length;
  const advancedCount = qnaContext.tickets.filter((t: any) => t.tier === 'advanced').length;
  parts.push(`  Core: ${coreCount} | Recommended: ${recommendedCount} | Advanced: ${advancedCount}`);
  parts.push('');

  // Sprint breakdown
  if (qnaContext.sprintSummaries.length > 0) {
    parts.push('SPRINT BREAKDOWN:');
    for (const sprint of qnaContext.sprintSummaries) {
      parts.push(`  Sprint ${sprint.sprint}: ${sprint.ticketIds.length} tickets, $${sprint.totalCost.toLocaleString()}, ${sprint.totalHours}h`);
    }
    parts.push('');
  }

  // Top 5 high-impact tickets
  parts.push('TOP 5 HIGH-IMPACT TICKETS (by calculated impact score):');
  for (let i = 0; i < Math.min(5, qnaContext.topTicketsByImpact.length); i++) {
    const topTicket = qnaContext.topTicketsByImpact[i];
    // Look up full ticket data
    const fullTicket = qnaContext.tickets.find((t: any) => t.ticketId === topTicket.ticketId);
    if (fullTicket) {
      parts.push(`  ${i + 1}. ${topTicket.ticketId} - ${fullTicket.title} (${fullTicket.tier})`);
    }
  }
  parts.push('');

  // Roadmap sections
  parts.push('ROADMAP SECTIONS:');
  const sectionList = sections
    .map((s) => {
      const status = s.status === 'implemented' ? '✅' : s.status === 'in_progress' ? '🔄' : '📋';
      return `  ${status} ${s.sectionNumber}. ${s.sectionName} (${s.status})`;
    })
    .join('\n');
  parts.push(sectionList);
  parts.push('');

  // Critical instructions
  parts.push('='.repeat(70));
  parts.push('INSTRUCTIONS:');
  parts.push('- You MUST only reference tickets that exist in the ticket pack above');
  parts.push('- DO NOT invent ticket IDs, dependencies, or dollar amounts');
  parts.push('- Sprint assignments come ONLY from the sprint breakdown above');
  parts.push('- ROI numbers come ONLY from the rollup above');
  parts.push('- When user asks about tickets, cite actual ticketId + title');
  parts.push('='.repeat(70));
  parts.push('');

  // Store full context as JSON for tool use
  parts.push('FULL CONTEXT (JSON):');
  parts.push(JSON.stringify({
    firmMetadata: {
      tenantId: qnaContext.tenantId,
      firmName: qnaContext.firmName,
      firmSizeTier: qnaContext.firmSizeTier,
      businessType: qnaContext.businessType,
      teamHeadcount: qnaContext.teamHeadcount,
      baselineMonthlyLeads: qnaContext.baselineMonthlyLeads,
    },
    ownerProfile: qnaContext.ownerProfile || null,
    ticketRollup: qnaContext.ticketRollup,
    tickets: qnaContext.tickets,
    sprintSummaries: qnaContext.sprintSummaries,
    topTicketsByImpact: qnaContext.topTicketsByImpact,
  }, null, 2));

  return parts.join('\n');
}

/**
 * @deprecated Use buildBusinessContextWithTickets instead
 */
function buildBusinessContextSummary(sections: any[]): string {
  const parts: string[] = [];

  parts.push('Roadmap Context:');

  // List sections with status
  const sectionList = sections
    .map((s) => {
      const status = s.status === 'implemented' ? '✅' : s.status === 'in_progress' ? '🔄' : '📋';
      return `  ${status} ${s.sectionNumber}. ${s.sectionName} (${s.status})`;
    })
    .join('\n');

  parts.push(sectionList);

  // Summary stats
  const implemented = sections.filter((s) => s.status === 'implemented').length;
  const inProgress = sections.filter((s) => s.status === 'in_progress').length;
  const planned = sections.filter((s) => s.status === 'planned').length;

  parts.push('');
  parts.push(`Progress: ${implemented} implemented, ${inProgress} in progress, ${planned} planned`);

  return parts.join('\n');
}
