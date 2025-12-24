// src/trustagent/services/roadmapQnAContext.service.ts

import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { tenants, sopTickets, roadmaps, roadmapSections, intakes } from '../../db/schema';
import {
  RoadmapQnAContext,
  RoadmapTicket,
  RoadmapSection,
  TicketRollup,
  SprintSummary,
  TopTicketByImpact,
  EnrichedProfile
} from '../types/roadmapQnA';

const TIME_VALUE_PER_HOUR = 35;
const LEAD_VALUE = 35;

// Map DB status/priority to a simple priority string if needed
function normalizePriority(priority: string | null): 'high' | 'medium' | 'low' | string {
  if (!priority) return 'medium';
  const p = priority.toLowerCase();
  if (p.includes('high')) return 'high';
  if (p.includes('low')) return 'low';
  return 'medium';
}

// Rough slug from section name (e.g. "Executive Summary" → "executive")
function sectionKeyFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('executive')) return 'executive';
  if (n.includes('diagnostic')) return 'diagnostic';
  if (n.includes('architecture')) return 'architecture';
  if (n.includes('system')) return 'systems';
  if (n.includes('implementation')) return 'implementation';
  if (n.includes('sop')) return 'sop_pack';
  if (n.includes('metric') || n.includes('kpi')) return 'metrics';
  if (n.includes('appendix')) return 'appendix';
  return n.replace(/\s+/g, '_');
}

function computeTicketRollup(
  tickets: RoadmapTicket[],
  teamHeadcount: number | null,
  baselineMonthlyLeads: number | null
): TicketRollup {
  const totalHours = tickets.reduce((sum, t) => sum + (t.timeEstimateHours || 0), 0);
  const totalCost = tickets.reduce((sum, t) => sum + (t.costEstimate || 0), 0);
  const totalHoursSavedWeekly = tickets.reduce(
    (sum, t) => sum + (t.projectedHoursSavedWeekly || 0),
    0
  );
  const totalLeadsRecoveredMonthly = tickets.reduce(
    (sum, t) => sum + (t.projectedLeadsRecoveredMonthly || 0),
    0
  );

  // Simple, non-clamped ROI; underlying generation already has guardrails
  const annualizedTimeValue = totalHoursSavedWeekly * 52 * TIME_VALUE_PER_HOUR;
  const annualizedLeadValue = totalLeadsRecoveredMonthly * 12 * LEAD_VALUE;
  const annualizedROI =
    totalCost > 0 ? ((annualizedTimeValue + annualizedLeadValue) / totalCost) * 100 : 0;

  const weeklyValue = (annualizedTimeValue + annualizedLeadValue) / 52;
  const paybackWeeks = weeklyValue > 0 ? totalCost / weeklyValue : 0;

  return {
    totalHours,
    totalCost,
    totalHoursSavedWeekly,
    totalLeadsRecoveredMonthly,
    annualizedTimeValue,
    annualizedLeadValue,
    annualizedROI,
    paybackWeeks
  };
}

function buildSprintSummaries(tickets: RoadmapTicket[]): SprintSummary[] {
  const bySprint = new Map<number, SprintSummary>();

  for (const t of tickets) {
    if (!t.sprint) continue;
    const sprint = t.sprint;
    let summary = bySprint.get(sprint);
    if (!summary) {
      summary = {
        sprint,
        ticketIds: [],
        totalCost: 0,
        totalHours: 0,
        totalHoursSavedWeekly: 0,
        totalLeadsRecoveredMonthly: 0
      };
      bySprint.set(sprint, summary);
    }

    summary.ticketIds.push(t.ticketId);
    summary.totalCost += t.costEstimate || 0;
    summary.totalHours += t.timeEstimateHours || 0;
    summary.totalHoursSavedWeekly += t.projectedHoursSavedWeekly || 0;
    summary.totalLeadsRecoveredMonthly += t.projectedLeadsRecoveredMonthly || 0;
  }

  return Array.from(bySprint.values()).sort((a, b) => a.sprint - b.sprint);
}

function buildTopTicketsByImpact(tickets: RoadmapTicket[], limit = 5): TopTicketByImpact[] {
  const scored = tickets.map<TopTicketByImpact>((t) => {
    const hours = t.projectedHoursSavedWeekly || 0;
    const leads = t.projectedLeadsRecoveredMonthly || 0;
    // Simple impact score – you can tune this however you like
    const impactScore = hours * TIME_VALUE_PER_HOUR * 52 + leads * LEAD_VALUE * 12;
    return { ticketId: t.ticketId, impactScore };
  });

  return scored
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, limit);
}

async function getOwnerProfile(tenantId: string): Promise<EnrichedProfile | null> {
  const intake = await db.query.intakes.findFirst({
    where: and(
      eq(intakes.tenantId, tenantId),
      eq(intakes.role, 'owner')
    ),
    orderBy: (intakes, { desc }) => [desc(intakes.createdAt)]
  });

  if (!intake || !intake.answers) {
    console.log(`[RoadmapQnAContext] No owner intake found for tenant ${tenantId}`);
    return null;
  }

  const answers = intake.answers as any;

  // Only return if we have enriched fields (check if at least one key field exists)
  const hasEnrichedData = answers.display_name || answers.role_label || 
    (answers.top_3_issues && answers.top_3_issues.some(Boolean));
  
  if (!hasEnrichedData) {
    console.log(`[RoadmapQnAContext] Owner intake exists but no enriched profile data`);
    return null;
  }

  return {
    roleLabel: answers.role_label || 'Owner',
    departmentKey: answers.department_key || 'owner',
    displayName: answers.display_name || undefined,
    preferredReference: answers.preferred_reference || answers.display_name || undefined,
    
    top3Issues: answers.top_3_issues?.filter(Boolean) || undefined,
    top3GoalsNext90Days: answers.top_3_goals_next_90_days?.filter(Boolean) || undefined,
    oneThingOutcome: answers.if_nothing_else_changes_but_X_this_was_worth_it || undefined,
    
    primaryKpis: answers.primary_kpis?.filter(Boolean) || undefined,
    kpiBaselines: answers.kpi_baselines || undefined,
    
    nonGoals: answers.non_goals?.filter(Boolean) || undefined,
    doNotAutomate: answers.do_not_automate?.filter(Boolean) || undefined,
    
    changeReadiness: answers.change_readiness || undefined,
    weeklyCapacityHours: answers.weekly_capacity_for_implementation_hours ?? undefined,
    biggestRiskIfTooFast: answers.biggest_risk_if_we_push_too_fast || undefined
  };
}

export async function buildRoadmapQnAContext(
  tenantId: string
): Promise<RoadmapQnAContext | null> {
  // 1) Tenant baseline
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId)
  });

  if (!tenant) {
    console.warn('[RoadmapQnAContext] Tenant not found for id', tenantId);
    return null;
  }

  // 2) Roadmap (by tenantId - updated schema uses tenantId not ownerId)
  const roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.tenantId, tenantId)
  });

  // 3) Sections for that roadmap (if any)
  let sectionRecords: typeof roadmapSections.$inferSelect[] = [];
  if (roadmap) {
    sectionRecords = await db.query.roadmapSections.findMany({
      where: eq(roadmapSections.roadmapId, roadmap.id),
      orderBy: (rs, { asc }) => [asc(rs.sectionNumber)]
    });
  }

  const roadmapSectionsMapped: RoadmapSection[] = sectionRecords.map((s) => ({
    id: s.id,
    sectionKey: sectionKeyFromName(s.sectionName),
    title: s.sectionName,
    order: s.sectionNumber ?? 0,
    contentMarkdown: s.contentMarkdown ?? ''
  }));

  // 4) Tickets for this tenant — ONLY approved ones
  const ticketRecords = await db
    .select()
    .from(sopTickets)
    .where(
      and(
        eq(sopTickets.tenantId, tenantId),
        eq(sopTickets.approved, true)
      )
    );

  if (!ticketRecords.length) {
    console.warn(
      '[RoadmapQnAContext] No approved tickets found for tenant',
      tenantId,
      '- Q&A will have roadmap sections but no ticket-level detail.'
    );
  }

  console.log(`[RoadmapQnAContext] Using ${ticketRecords.length} approved tickets`);

  const tickets: RoadmapTicket[] = ticketRecords.map((t) => ({
    ticketId: t.ticketId,
    inventoryId: t.inventoryId ?? null,
    isSidecar: t.isSidecar ?? false,

    title: t.title,
    category: t.category,
    valueCategory: t.valueCategory ?? 'General',
    tier: (t.tier as RoadmapTicket['tier']) || 'recommended',

    sprint: t.sprint ?? null,
    roadmapSection: t.roadmapSection ?? 'systems',

    painSource: t.painSource ?? '',
    description: t.description ?? '',
    currentState: t.currentState ?? '',
    targetState: t.targetState ?? '',

    aiDesign: t.aiDesign ?? '',
    ghlImplementation: t.ghlImplementation ?? '',
    implementationSteps: JSON.stringify(t.implementationSteps) ?? '',

    owner: t.owner ?? 'Owner',
    dependencies: (t.dependencies as string[]) || [],

    timeEstimateHours: t.timeEstimateHours ?? 0,
    costEstimate: t.costEstimate ?? 0,

    projectedHoursSavedWeekly: t.projectedHoursSavedWeekly ?? 0,
    projectedLeadsRecoveredMonthly: t.projectedLeadsRecoveredMonthly ?? 0,

    successMetric: t.successMetric ?? '',
    roiNotes: t.roiNotes ?? '',

    priority: normalizePriority(t.priority as string | null)
  }));

  // 5) Enriched owner profile from intake
  const ownerProfile = await getOwnerProfile(tenantId);

  // 6) Rollup + helper views
  const teamHeadcount = (tenant.teamHeadcount as number | null) ?? null;
  const baselineMonthlyLeads = (tenant.baselineMonthlyLeads as number | null) ?? null;

  const ticketRollup = computeTicketRollup(tickets, teamHeadcount, baselineMonthlyLeads);
  const sprintSummaries = buildSprintSummaries(tickets);
  const topTicketsByImpact = buildTopTicketsByImpact(tickets);

  // 7) Diagnostic date – best effort (use tenant.updatedAt date if available)
  const diagnosticDate =
    (tenant.updatedAt as Date | null)?.toISOString() ?? new Date().toISOString();

  const context: RoadmapQnAContext = {
    tenantId,
    firmName: tenant.name,
    firmSizeTier: (tenant.firmSizeTier as string) || 'small',
    businessType: (tenant.businessType as string) || 'generic',
    region: (tenant.region as string) || null,

    teamHeadcount,
    baselineMonthlyLeads,
    diagnosticDate,

    // Enriched intake profiles
    ownerProfile,
    teamProfiles: [], // Future: sales, ops, delivery

    // Longform SOP-01 docs can be wired in later by querying tenant_documents
    executiveSummaryMarkdown: undefined,
    diagnosticMarkdown: undefined,
    aiLeverageMarkdown: undefined,
    roadmapSkeletonMarkdown: undefined,
    discoveryNotesMarkdown: undefined,

    ticketRollup,
    tickets,
    sprintSummaries,
    topTicketsByImpact,
    roadmapSections: roadmapSectionsMapped
  };

  return context;
}
