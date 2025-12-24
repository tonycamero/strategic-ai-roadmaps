/**
 * Diagnostic Ingestion Service
 * 
 * Orchestrates the full pipeline:
 * 1. DiagnosticMap → SopTickets (via sopTicketGenerator)
 * 2. Save tickets to DB (sop_tickets table)
 * 3. Tickets + Diagnostic → Roadmap (via roadmapAssembly)
 * 4. Save roadmap sections to DB
 * 5. Update tenant metadata
 * 6. Reprovision assistant with new instructions
 */

import { db } from '../db';
import { sopTickets, roadmapSections, tenants, roadmaps, agentConfigs } from '../db/schema';
import { DiagnosticMap, RoadmapContext, TicketRollup } from '../types/diagnostic';
import { generateSopTickets } from './sopTicketGenerator.service';
import { assembleRoadmap } from './roadmapAssembly.service';
import { provisionAssistantForConfig } from './assistantProvisioning.service';
import { onboardingProgressService } from './onboardingProgress.service';
import { eq } from 'drizzle-orm';

interface IngestionResult {
  diagnosticId: string;
  tenantId: string;
  ticketCount: number;
  roadmapSectionCount: number;
  assistantProvisioned: boolean;
}

interface Sop01Content {
  sop01DiagnosticMarkdown: string;
  sop01AiLeverageMarkdown: string;
  sop01RoadmapSkeleton: string;
  discoveryNotesMarkdown?: string;
}

export async function ingestDiagnostic(
  diagnosticMap: DiagnosticMap,
  sop01Content?: Sop01Content
): Promise<IngestionResult> {
  console.log('[Diagnostic Ingestion] Starting ingestion for tenant:', diagnosticMap.tenantId);
  console.log('[Diagnostic Ingestion] Firm:', diagnosticMap.firmName);

  // STEP 1: Generate tickets via Prompt 1
  // Convert DiagnosticMap to a simple Record for the prompt (use the structured data as-is)
  const diagnosticMapRecord: Record<string, any> = {
    painClusters: diagnosticMap.painClusters,
    workflowBottlenecks: diagnosticMap.workflowBottlenecks,
    systemsFragmentation: diagnosticMap.systemsFragmentation,
    aiOpportunityZones: diagnosticMap.aiOpportunityZones,
    readinessScore: diagnosticMap.readinessScore,
    implementationTier: diagnosticMap.implementationTier
  };

  // Get tenant sizing data for parameterized ticket generation
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, diagnosticMap.tenantId))
    .limit(1);
  
  if (!tenant) {
    throw new Error(`[Diagnostic Ingestion] Tenant ${diagnosticMap.tenantId} not found`);
  }

  const firmSizeTier = tenant.firmSizeTier || 'small';
  const teamHeadcount = tenant.teamHeadcount || 5;
  const baselineMonthlyLeads = tenant.baselineMonthlyLeads || 40;

  const ticketResult = await generateSopTickets(
    diagnosticMapRecord,
    {
      diagnosticMarkdown: sop01Content?.sop01DiagnosticMarkdown,
      aiLeverageMarkdown: sop01Content?.sop01AiLeverageMarkdown,
      roadmapSkeletonMarkdown: sop01Content?.sop01RoadmapSkeleton,
      discoveryNotesMarkdown: sop01Content?.discoveryNotesMarkdown
    },
    diagnosticMap.tenantId,
    diagnosticMap.firmName,
    firmSizeTier,
    teamHeadcount,
    new Date(diagnosticMap.diagnosticDate),
    tenant.businessType // Pass tenant vertical for inventory selection
  );
  const { tickets, diagnosticId } = ticketResult;

  console.log(`[Diagnostic Ingestion] ✅ Generated ${tickets.length} tickets`);

  // STEP 2: Save tickets to database (delete old ones first for clean regeneration)
  // Delete existing tickets for this tenant and diagnostic
  await db.delete(sopTickets).where(eq(sopTickets.tenantId, diagnosticMap.tenantId));
  
  const ticketInserts = tickets.map((ticket) => ({
    id: crypto.randomUUID(),
    tenantId: diagnosticMap.tenantId,
    diagnosticId: diagnosticId,
    ticketId: ticket.ticketId,
    inventoryId: ticket.inventoryId || null, // NEW: Link to canonical inventory
    isSidecar: ticket.isSidecar || false,     // NEW: Mark sidecar tickets
    title: ticket.title,
    category: ticket.category,
    valueCategory: ticket.value_category || 'General',
    tier: ticket.tier || 'recommended',
    painSource: ticket.pain_source,
    description: ticket.description,
    currentState: ticket.current_state,
    targetState: ticket.target_state,
    aiDesign: ticket.ai_design,
    ghlImplementation: ticket.ghl_implementation,
    implementationSteps: ticket.implementation_steps,
    owner: ticket.owner,
    dependencies: ticket.dependencies,
    timeEstimateHours: Math.round(ticket.time_estimate_hours),
    costEstimate: Math.round(ticket.cost_estimate),
    successMetric: ticket.success_metric,
    roadmapSection: ticket.roadmap_section,
    priority: ticket.priority,
    sprint: ticket.sprint,
    projectedHoursSavedWeekly: Math.round(ticket.projected_hours_saved_weekly),
    projectedLeadsRecoveredMonthly: Math.round(ticket.projected_leads_recovered_monthly),
    roiNotes: ticket.roi_notes,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await db.insert(sopTickets).values(ticketInserts);
  console.log(`[Diagnostic Ingestion] ✅ Saved ${ticketInserts.length} tickets to DB (replaced old tickets)`);

  // STEP 2.5: Calculate ticket rollup metrics with ROI guardrails
  const TIME_VALUE_PER_HOUR = 35; // $ value of time saved per hour
  const LEAD_VALUE = 35; // $ value per lead recovered
  
  const totalHours = tickets.reduce((sum, t) => sum + t.time_estimate_hours, 0);
  const totalCost = tickets.reduce((sum, t) => sum + t.cost_estimate, 0);
  
  // Calculate raw ROI from tickets
  const rawHoursSavedWeekly = tickets.reduce((sum, t) => sum + (t.projected_hours_saved_weekly || 0), 0);
  const rawLeadsRecoveredMonthly = tickets.reduce((sum, t) => sum + (t.projected_leads_recovered_monthly || 0), 0);
  
  // Apply guardrails to prevent unrealistic ROI claims
  const MAX_HOURS_SAVED_FRACTION = 0.35; // Max 35% of total team capacity
  const MAX_LEADS_RECOVERED_FRACTION = 0.60; // Max 60% of baseline leads
  
  const teamWeeklyHours = teamHeadcount * 40;
  const maxHoursSaved = teamWeeklyHours * MAX_HOURS_SAVED_FRACTION;
  const maxLeadsRecovered = baselineMonthlyLeads * MAX_LEADS_RECOVERED_FRACTION;
  
  const totalHoursSavedWeekly = Math.min(rawHoursSavedWeekly, maxHoursSaved);
  const totalLeadsRecoveredMonthly = Math.min(rawLeadsRecoveredMonthly, maxLeadsRecovered);
  
  if (totalHoursSavedWeekly < rawHoursSavedWeekly) {
    console.warn(`[ROI Guard] Clamped time savings from ${rawHoursSavedWeekly}h/wk to ${totalHoursSavedWeekly}h/wk (max ${Math.round(maxHoursSaved)}h for ${teamHeadcount} people)`);
  }
  
  if (totalLeadsRecoveredMonthly < rawLeadsRecoveredMonthly) {
    console.warn(`[ROI Guard] Clamped lead recovery from ${rawLeadsRecoveredMonthly}/mo to ${totalLeadsRecoveredMonthly}/mo (max ${Math.round(maxLeadsRecovered)} from baseline ${baselineMonthlyLeads})`);
  }
  
  const annualizedTimeValue = totalHoursSavedWeekly * 52 * TIME_VALUE_PER_HOUR;
  const annualizedLeadValue = totalLeadsRecoveredMonthly * 12 * LEAD_VALUE;
  const annualizedROI = totalCost > 0 ? ((annualizedTimeValue + annualizedLeadValue) / totalCost) * 100 : 0;
  const weeklyValue = (annualizedTimeValue + annualizedLeadValue) / 52;
  const paybackWeeks = weeklyValue > 0 ? totalCost / weeklyValue : 0;
  
  const ticketRollup: TicketRollup = {
    totalHours,
    totalCost,
    totalHoursSavedWeekly,
    totalLeadsRecoveredMonthly,
    annualizedTimeValue,
    annualizedLeadValue,
    annualizedROI,
    paybackWeeks
  };
  
  console.log(`[Diagnostic Ingestion] ✅ Calculated ticket rollup:`);
  console.log(`  - Total investment: $${totalCost.toLocaleString()} (${totalHours} hours)`);
  console.log(`  - Weekly time savings: ${totalHoursSavedWeekly} hours ($${(totalHoursSavedWeekly * TIME_VALUE_PER_HOUR * 52).toLocaleString()}/year)`);
  console.log(`  - Monthly leads recovered: ${totalLeadsRecoveredMonthly} ($${(totalLeadsRecoveredMonthly * 12 * LEAD_VALUE).toLocaleString()}/year)`);
  console.log(`  - Annualized ROI: ${annualizedROI.toFixed(0)}%`);
  console.log(`  - Payback period: ${paybackWeeks.toFixed(1)} weeks`);

  // ⚠️  ROADMAP GENERATION MOVED TO POST-MODERATION FLOW
  // Roadmap should only be generated AFTER tickets are moderated and approved
  // The roadmap generation now happens via a separate endpoint/service call
  // triggered after the user completes ticket moderation.

  // STEP 3: Update tenant metadata with diagnostic_id
  await db
    .update(tenants)
    .set({
      lastDiagnosticId: diagnosticId,
      updatedAt: new Date()
    })
    .where(eq(tenants.id, diagnosticMap.tenantId));

  console.log('[Diagnostic Ingestion] ✅ Updated tenant metadata');

  // STEP 4: Reprovision assistant with new instructions (optional, can defer until roadmap generation)
  let assistantProvisioned = false;
  try {
    // Get agent config for this tenant
    const agentConfig = await db.query.agentConfigs.findFirst({
      where: eq(agentConfigs.tenantId, diagnosticMap.tenantId)
    });
    
    if (agentConfig) {
      await provisionAssistantForConfig(agentConfig.id, tenant.ownerUserId);
      assistantProvisioned = true;
      console.log('[Diagnostic Ingestion] ✅ Assistant reprovisioned');
    } else {
      console.log('[Diagnostic Ingestion] ℹ️  No agent config found for tenant');
    }
  } catch (err) {
    console.error('[Diagnostic Ingestion] Failed to reprovision assistant:', err);
    // Don't fail the entire ingestion if assistant update fails
  }

  console.log('[Diagnostic Ingestion] 🎉 TICKET GENERATION COMPLETE');
  console.log('[Diagnostic Ingestion] ➡️  Next step: Moderate tickets in SuperAdmin UI, then generate roadmap');

  // 🎯 Onboarding Hook: Mark DIAGNOSTIC_GENERATED complete
  try {
    await onboardingProgressService.markStep(
      diagnosticMap.tenantId,
      'DIAGNOSTIC_GENERATED',
      'COMPLETED'
    );
    console.log('[Diagnostic Ingestion] ✅ Updated onboarding progress');
  } catch (err) {
    console.error('[Diagnostic Ingestion] Failed to update onboarding progress:', err);
  }

  return {
    diagnosticId,
    tenantId: diagnosticMap.tenantId,
    ticketCount: tickets.length,
    roadmapSectionCount: 0, // No roadmap sections generated yet
    assistantProvisioned
  };
}
