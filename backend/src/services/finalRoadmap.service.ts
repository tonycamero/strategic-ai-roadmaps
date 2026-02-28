/**
 * Final Roadmap Generation Service
 * 
 * Generates complete roadmap ONLY after tickets are moderated and approved.
 * This is the final step: tickets generated → moderated → final roadmap.
 */

import { db } from '../db/index';
import { roadmaps, roadmapSections, sopTickets, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { assembleRoadmap } from './roadmapAssembly.service';
import { RoadmapContext, DiagnosticMap } from '../types/diagnostic';
import { getTenantLifecycleView } from "./tenantStateAggregation.service";

export async function generateFinalRoadmapForTenant(tenantId: string) {
  console.log(`[FinalRoadmap] Starting final roadmap generation for tenant: ${tenantId}`);

  return await db.transaction(async (trx) => {
    // 1. Get projection view inside transaction and check capability
    const view = await getTenantLifecycleView(tenantId, trx);

    if (!view.capabilities.assembleRoadmap.allowed) {
      throw new Error("AUTHORITY_VIOLATION");
    }

    const diagnosticId = view.artifacts.diagnostic.exists ? (await trx
      .select({ lastDiagnosticId: tenants.lastDiagnosticId })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1))[0]?.lastDiagnosticId : null;

    if (!diagnosticId) {
      throw new Error(
        `[FinalRoadmap] No lastDiagnosticId for tenant: ${tenantId}. Run SOP-01 + ticket generation first.`
      );
    }

    console.log(`[FinalRoadmap] Using diagnostic: ${diagnosticId}`);

    // 2. Fetch all tickets for this diagnostic
    const allTickets = await trx
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

    console.log(`[FinalRoadmap] Found ${allTickets.length} total tickets`);

    // 3. Ensure moderation completed (all tickets must be moderated)
    const unmoderatedTickets = allTickets.filter((t) => t.moderatedAt === null);

    if (unmoderatedTickets.length > 0) {
      throw new Error(
        `[FinalRoadmap] Moderation incomplete. ${unmoderatedTickets.length} tickets still pending moderation. All tickets must be approved or rejected before final roadmap generation.`
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
    const diagnosticMap: DiagnosticMap = {
      tenantId,
      firmName: view.identity.tenantName,
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
        totalHours: 0,
        totalCost: 0,
        totalHoursSavedWeekly: 0,
        totalLeadsRecoveredMonthly: 0,
        annualizedTimeValue: 0,
        annualizedLeadValue: 0,
        annualizedROI: 0,
        paybackWeeks: 0
      },
      sop01DiagnosticMarkdown: '',
      sop01AiLeverageMarkdown: '',
      sop01RoadmapSkeleton: '',
      discoveryNotesMarkdown: undefined,
      tenantId,
      firmName: view.identity.tenantName,
      diagnosticDate: new Date().toISOString()
    };

    // 5. Assemble roadmap
    console.log('[FinalRoadmap] Calling assembleRoadmap with approved tickets...');
    // Pass trx to ensure all reads (like baseline economics) are atomic within this process
    const roadmapResult = await assembleRoadmap(context, trx);

    // 6. Get or create roadmap record
    let roadmap = await trx.query.roadmaps.findFirst({
      where: eq(roadmaps.tenantId, tenantId)
    });

    if (!roadmap) {
      const [newRoadmap] = await trx
        .insert(roadmaps)
        .values({
          tenantId: tenantId,
          createdByUserId: null,
          status: 'draft',
          modelJson: {},
          sourceRefs: [],
          createdAt: new Date()
        })
        .returning();
      roadmap = newRoadmap;
      console.log(`[FinalRoadmap] Created new roadmap: ${roadmap.id}`);
    } else {
      console.log(`[FinalRoadmap] Using existing roadmap: ${roadmap.id}`);
    }

    // 7. Delete old sections and insert new ones (clean slate)
    await trx
      .delete(roadmapSections)
      .where(eq(roadmapSections.roadmapId, roadmap!.id));

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
      roadmapId: roadmap!.id,
      sectionNumber: section.order || (idx + 1),
      sectionName: sectionNameMap[section.section] || section.title,
      contentMarkdown: section.content,
      status: 'planned',
      wordCount: section.content.split(/\s+/).length,
      lastUpdatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await trx.insert(roadmapSections).values(sectionInserts);
    console.log(`[FinalRoadmap] ✅ Inserted ${sectionInserts.length} sections`);

    // 8. Update roadmap status
    await trx
      .update(roadmaps)
      .set({ status: 'delivered', deliveredAt: new Date(), updatedAt: new Date() })
      .where(eq(roadmaps.id, roadmap!.id));

    console.log(
      `[FinalRoadmap] 🎉 Final roadmap generated successfully for tenant ${tenantId}`
    );

    return {
      tenantId,
      diagnosticId,
      roadmapId: roadmap!.id,
      sectionCount: sectionInserts.length,
      approvedTicketCount: approvedTickets.length,
      rejectedTicketCount: allTickets.length - approvedTickets.length
    };
  });
}
