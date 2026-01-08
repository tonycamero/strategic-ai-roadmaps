/**
 * Final Roadmap Generation Service
 * 
 * Generates complete roadmap ONLY after tickets are moderated and approved.
 * This is the final step: tickets generated → moderated → final roadmap.
 */

import { db } from '../db';
import * as crypto from 'crypto';
import { roadmaps, roadmapSections, sopTickets, tenants, executiveBriefs } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { assembleRoadmap } from './roadmapAssembly.service';
import { RoadmapContext, DiagnosticMap } from '../types/diagnostic';

export async function generateFinalRoadmapForTenant(tenantId: string) {
  console.log(`[FinalRoadmap] Starting final roadmap generation for tenant: ${tenantId}`);
  // 1. Get tenant + latest diagnosticId + Intake State
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  console.log('[FinalRoadmap] Fetched Tenant:', tenant);

  if (!tenant) {
    throw new Error(`[FinalRoadmap] Tenant not found: ${tenantId}`);
  }

  // GATE 1: Intake Window
  if (tenant.intakeWindowState !== 'CLOSED') {
    throw new Error(`[FinalRoadmap] Gating Failed: Intake Window must be CLOSED before finalization.`);
  }

  // GATE 2: Executive Brief
  const [brief] = await db
    .select()
    .from(executiveBriefs) // Ensure this is imported
    .where(eq(executiveBriefs.tenantId, tenantId))
    .limit(1);

  if (!brief) {
    throw new Error(`[FinalRoadmap] Gating Failed: Executive Brief not found.`);
  }

  if (brief.status !== 'ACKNOWLEDGED' && brief.status !== 'WAIVED') {
    throw new Error(`[FinalRoadmap] Gating Failed: Executive Brief must be ACKNOWLEDGED or WAIVED (Current: ${brief.status}).`);
  }

  if (!tenant.lastDiagnosticId) {
    throw new Error(
      `[FinalRoadmap] No lastDiagnosticId for tenant: ${tenantId}. Run SOP-01 + ticket generation first.`
    );
  }

  const diagnosticId = tenant.lastDiagnosticId;
  console.log(`[FinalRoadmap] Using diagnostic: ${diagnosticId}`);

  // 2. Fetch all tickets for this diagnostic
  const allTickets = await db
    .select()
    .from(sopTickets)
    .where(
      and(
        eq(sopTickets.tenantId, tenantId),
        eq(sopTickets.diagnosticId, diagnosticId)
      )
    );

  if (!allTickets.length) {
    throw new Error(
      `[FinalRoadmap] No tickets found for diagnostic ${diagnosticId}. Generate tickets first.`
    );
  }

  // 3. Ensure moderation completed (all tickets must be moderated)
  // CR-UX-7: Ensure NO pending tickets
  const pendingTickets = allTickets.filter((t) => t.moderationStatus === 'pending');

  if (pendingTickets.length > 0) {
    throw new Error(
      `[FinalRoadmap] Gating Failed: Moderation Incomplete. ${pendingTickets.length} tickets are still PENDING.`
    );
  }

  const approvedTickets = allTickets.filter((t) => t.approved === true);

  if (!approvedTickets.length) {
    throw new Error(
      `[FinalRoadmap] No approved tickets for diagnostic ${diagnosticId}. At least one ticket must be approved to generate roadmap.`
    );
  }

  console.log(
    `[FinalRoadmap] ✅ Using ${approvedTickets.length}/${allTickets.length} approved tickets`
  );

  // 4. Load SOP-01 content for roadmap context
  // Note: You may need to adjust this based on how you store SOP-01 documents
  // For now, we'll create a minimal context - you can expand this
  const diagnosticMap: DiagnosticMap = {
    tenantId,
    firmName: tenant.name,
    diagnosticDate: new Date().toISOString(),
    painClusters: [],
    workflowBottlenecks: [],
    systemsFragmentation: {
      currentTools: [],
      redundancies: [],
      gapsIdentified: []
    },
    aiOpportunityZones: [],
    readinessScore: 70,
    implementationTier: 'growth'
  };

  // Build RoadmapContext
  const context: RoadmapContext = {
    diagnosticMap,
    tickets: approvedTickets.map(t => ({
      ticketId: t.ticketId,
      title: t.title,
      category: t.category,
      value_category: t.valueCategory,
      tier: t.tier,
      pain_source: t.painSource,
      description: t.description,
      current_state: t.currentState,
      target_state: t.targetState,
      ai_design: t.aiDesign,
      ghl_implementation: t.ghlImplementation,
      implementation_steps: t.implementationSteps as string[],
      owner: t.owner,
      dependencies: t.dependencies as string[],
      time_estimate_hours: t.timeEstimateHours,
      cost_estimate: t.costEstimate,
      success_metric: t.successMetric,
      roadmap_section: t.roadmapSection,
      priority: t.priority as any,
      sprint: t.sprint as 30 | 60 | 90,
      projected_hours_saved_weekly: t.projectedHoursSavedWeekly,
      projected_leads_recovered_monthly: t.projectedLeadsRecoveredMonthly,
      roi_notes: t.roiNotes || '',
      approved: t.approved
    })),
    ticketRollup: {
      totalHours: 0, // Will be recalculated in assembleRoadmap
      totalCost: 0,
      totalHoursSavedWeekly: 0,
      totalLeadsRecoveredMonthly: 0,
      annualizedTimeValue: 0,
      annualizedLeadValue: 0,
      annualizedROI: 0,
      paybackWeeks: 0
    },
    sop01DiagnosticMarkdown: '', // Load from tenant_documents if available
    sop01AiLeverageMarkdown: '',
    sop01RoadmapSkeleton: '',
    discoveryNotesMarkdown: undefined,
    tenantId,
    firmName: tenant.name,
    diagnosticDate: new Date().toISOString()
  };

  // 5. Assemble roadmap (will recalc rollups based on approved tickets)
  console.log('[FinalRoadmap] Calling assembleRoadmap with approved tickets...');
  const roadmapResult = await assembleRoadmap(context);

  // 6. Get or create roadmap record
  let roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.tenantId, tenantId)
  });

  if (!roadmap) {
    const [newRoadmap] = await db
      .insert(roadmaps)
      .values({
        tenantId: tenantId,
        createdByUserId: tenant.ownerUserId,
        status: 'draft',
        createdAt: new Date()
      })
      .returning();
    roadmap = newRoadmap;
    console.log(`[FinalRoadmap] Created new roadmap: ${roadmap.id}`);
  } else {
    console.log(`[FinalRoadmap] Using existing roadmap: ${roadmap.id}`);
  }

  // 7. Delete old sections and insert new ones (clean slate)
  await db
    .delete(roadmapSections)
    .where(eq(roadmapSections.roadmapId, roadmap.id));

  const sectionNameMap: Record<string, string> = {
    'executive': 'Executive Summary',
    'diagnostic': 'Diagnostic Analysis',
    'architecture': 'System Architecture',
    'systems': 'High-Leverage Systems',
    'implementation': 'Implementation Plan',
    'sop_pack': 'SOP Pack',
    'metrics': 'KPIs/Metrics',
    'appendix': 'Appendix'
  };

  const sectionInserts = roadmapResult.sections.map((section, idx) => ({
    id: crypto.randomUUID(),
    roadmapId: roadmap.id,
    sectionNumber: section.order || (idx + 1),
    sectionName: sectionNameMap[section.section] || section.title,
    contentMarkdown: section.content,
    status: 'planned',
    wordCount: section.content.split(/\s+/).length,
    lastUpdatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await db.insert(roadmapSections).values(sectionInserts);
  console.log(`[FinalRoadmap] ✅ Inserted ${sectionInserts.length} sections`);

  // 8. Update roadmap status
  await db
    .update(roadmaps)
    .set({
      status: 'finalized',   // CR-UX-7: Explicit finalized status
      deliveredAt: new Date(),
      finalizedAt: new Date() // Schema might need this or just use deliveredAt logic
    })
    .where(eq(roadmaps.id, roadmap.id));

  console.log(
    `[FinalRoadmap] 🎉 Final roadmap generated successfully for tenant ${tenantId}`
  );

  return {
    tenantId,
    diagnosticId,
    roadmapId: roadmap.id,
    sectionCount: sectionInserts.length,
    approvedTicketCount: approvedTickets.length,
    rejectedTicketCount: allTickets.length - approvedTickets.length
  };
}
