import { db } from '../db';
import { roadmaps, roadmapSections, agentLogs, agentConfigs, type RoadmapSection } from '../db/schema';
import { eq } from 'drizzle-orm';
import { RoadmapSectionService } from './roadmapSection.service';
import { TicketPackService } from './ticketPack.service';
import { ImplementationMetricsService } from './implementationMetrics.service';

export class RoadmapRefreshService {
  /**
   * Refresh a roadmap by:
   * 1. Computing current ticket completion stats
   * 2. Updating section statuses
   * 3. Generating Section 10 (Outcomes & Learning)
   * 4. Creating a new roadmap version
   */
  static async refreshRoadmap(params: {
    tenantId: string;
    roadmapId: string;
  }): Promise<{ newRoadmapId: string; version: string }> {
    const { tenantId, roadmapId } = params;
    
    const startTime = Date.now();

    // 1. Load current state
    const sections = await RoadmapSectionService.getSectionsForRoadmap(roadmapId);
    const ticketPack = await TicketPackService.getPackForRoadmap(tenantId, roadmapId);

    if (!ticketPack) {
      throw new Error('No ticket pack found for this roadmap');
    }

    const { tickets } = await TicketPackService.getPackWithTickets(ticketPack.id);
    const systemCompletion = TicketPackService.computeSystemCompletion(tickets);

    // 2. Get metrics and outcomes
    const snapshots = await ImplementationMetricsService.getSnapshotsForRoadmap({
      tenantId,
      roadmapId,
    });
    const outcome = await ImplementationMetricsService.getOutcome({
      tenantId,
      roadmapId,
    });

    // 3. Clone roadmap to new version
    const { newRoadmapId, version } = await this.cloneRoadmap(tenantId, roadmapId);

    // 4. Copy sections with updated statuses
    for (const section of sections) {
      const systemKey = `System ${section.sectionNumber}`;
      const completion = systemCompletion[systemKey];

      let newStatus = section.status;
      if (completion) {
        if (completion.pct === 0) {
          newStatus = 'planned';
        } else if (completion.pct === 100) {
          newStatus = 'implemented';
        } else {
          newStatus = 'in_progress';
        }
      }

      await RoadmapSectionService.upsertSection({
        roadmapId: newRoadmapId,
        sectionNumber: section.sectionNumber,
        sectionName: section.sectionName,
        contentMarkdown: this.updateSectionContent(section.contentMarkdown, newStatus, completion),
        status: newStatus,
        agentCheatsheet: section.agentCheatsheet,
        diagrams: section.diagrams ?? undefined,
      });
    }

    // 5. Generate Section 10: Outcomes & Learning
    if (outcome && snapshots.length >= 2) {
      const section10Content = this.generateSection10Content(outcome, snapshots);

      await RoadmapSectionService.upsertSection({
        roadmapId: newRoadmapId,
        sectionNumber: 10,
        sectionName: 'Outcomes & Learning',
        contentMarkdown: section10Content,
        status: 'implemented',
      });
    }

    // Log successful refresh
    const config = await db.query.agentConfigs.findFirst({
      where: eq(agentConfigs.tenantId, tenantId),
    });
    
    if (config) {
      await db.insert(agentLogs).values({
        agentConfigId: config.id,
        eventType: 'roadmap_refresh',
        metadata: {
          roadmapId,
          newRoadmapId,
          version,
          sectionsUpdated: sections.length,
          hasOutcomes: !!outcome,
          durationMs: Date.now() - startTime,
        },
      });
    }
    
    return { newRoadmapId, version };
  }

  /**
   * Clone roadmap and increment version
   */
  private static async cloneRoadmap(
    tenantId: string,
    roadmapId: string
  ): Promise<{ newRoadmapId: string; version: string }> {
    const [oldRoadmap] = await db
      .select()
      .from(roadmaps)
      .where(eq(roadmaps.id, roadmapId))
      .limit(1);

    if (!oldRoadmap) {
      throw new Error('Roadmap not found');
    }

    // Parse version or default to v1.0
    const currentVersion = oldRoadmap.status || 'v1.0';
    const match = currentVersion.match(/v?(\d+)\.(\d+)/);
    const major = match ? parseInt(match[1], 10) : 1;
    const minor = match ? parseInt(match[2], 10) : 0;

    const newVersion = `v${major}.${minor + 1}`;

    const [inserted] = await db
      .insert(roadmaps)
      .values({
        tenantId,
        createdByUserId: oldRoadmap.createdByUserId,
        status: 'in_progress',
        pilotStage: oldRoadmap.pilotStage,
      })
      .returning({ id: roadmaps.id });

    return { newRoadmapId: inserted.id, version: newVersion };
  }

  /**
   * Update section content to reflect implementation status
   */
  private static updateSectionContent(
    content: string,
    status: RoadmapSection['status'],
    completion?: { done: number; total: number; pct: number }
  ): string {
    let updated = content;

    // Add implementation status banner at top
    const statusBanner = `**Status:** ${status === 'implemented' ? '✅ Implemented' : status === 'in_progress' ? '🔄 In Progress' : '📋 Planned'}${completion ? ` (${completion.pct}% complete - ${completion.done}/${completion.total} tickets)` : ''}\n\n`;

    // Remove old status banner if exists
    updated = updated.replace(/^\*\*Status:\*\*.*?\n\n/s, '');

    // Add new banner
    updated = statusBanner + updated;

    return updated;
  }

  /**
   * Generate Section 10: Outcomes & Learning
   */
  private static generateSection10Content(
    outcome: any,
    snapshots: any[]
  ): string {
    const baseline = snapshots.find((s) => s.label === 'baseline');
    const latest = snapshots[snapshots.length - 1];

    return `# Section 10: Outcomes & Learning

## Implementation Results

This section summarizes the realized outcomes from implementing the strategic AI roadmap.

### Metrics Comparison

| Metric | Baseline | Current | Change |
|--------|----------|---------|--------|
| Lead Response Time | ${baseline?.metrics.lead_response_minutes?.toFixed(1) || 'N/A'} min | ${latest?.metrics.lead_response_minutes?.toFixed(1) || 'N/A'} min | ${outcome.deltas.lead_response_minutes > 0 ? '↓' : '↑'} ${Math.abs(outcome.deltas.lead_response_minutes || 0).toFixed(1)} min |
| Lead-to-Appt Rate | ${baseline?.metrics.lead_to_appt_rate?.toFixed(1) || 'N/A'}% | ${latest?.metrics.lead_to_appt_rate?.toFixed(1) || 'N/A'}% | ${outcome.deltas.lead_to_appt_rate > 0 ? '↑' : '↓'} ${Math.abs(outcome.deltas.lead_to_appt_rate || 0).toFixed(1)}% |
| CRM Adoption | ${baseline?.metrics.crm_adoption_rate?.toFixed(1) || 'N/A'}% | ${latest?.metrics.crm_adoption_rate?.toFixed(1) || 'N/A'}% | ${outcome.deltas.crm_adoption_rate > 0 ? '↑' : '↓'} ${Math.abs(outcome.deltas.crm_adoption_rate || 0).toFixed(1)}% |
| Weekly Ops Hours | ${baseline?.metrics.weekly_ops_hours?.toFixed(1) || 'N/A'} hrs | ${latest?.metrics.weekly_ops_hours?.toFixed(1) || 'N/A'} hrs | ${outcome.deltas.weekly_ops_hours > 0 ? '↓' : '↑'} ${Math.abs(outcome.deltas.weekly_ops_hours || 0).toFixed(1)} hrs |
| NPS Score | ${baseline?.metrics.nps?.toFixed(0) || 'N/A'} | ${latest?.metrics.nps?.toFixed(0) || 'N/A'} | ${outcome.deltas.nps > 0 ? '↑' : '↓'} ${Math.abs(outcome.deltas.nps || 0).toFixed(0)} |

### Realized ROI

**Annual Time Savings:** ${outcome.realizedRoi?.time_savings_hours_annual?.toFixed(0) || 0} hours ($${outcome.realizedRoi?.time_savings_value_annual?.toFixed(0) || 0})

**Revenue Impact:** $${outcome.realizedRoi?.revenue_impact_annual?.toFixed(0) || 0}/year

**Cost Avoidance:** $${outcome.realizedRoi?.cost_avoidance_annual?.toFixed(0) || 0}/year

**Net ROI:** ${outcome.realizedRoi?.net_roi_percent?.toFixed(1) || 0}%

**Status:** ${outcome.status === 'on_track' ? '✅ On Track' : outcome.status === 'at_risk' ? '⚠️ At Risk' : '🔴 Off Track'}

### Key Learnings

* Implementation progress tracked through ${snapshots.length} measurement points
* Baseline established: ${baseline?.snapshotDate ? new Date(baseline.snapshotDate).toISOString().split('T')[0] : 'N/A'}
* Latest measurement: ${latest?.snapshotDate ? new Date(latest.snapshotDate).toISOString().split('T')[0] : 'N/A'}

### Next Steps

Based on current outcomes, focus areas for continued improvement:

1. ${outcome.deltas.lead_response_minutes < 5 ? 'Maintain lead response time gains' : 'Continue reducing lead response time'}
2. ${outcome.deltas.crm_adoption_rate < 20 ? 'Drive CRM adoption through training and incentives' : 'Sustain high CRM adoption rates'}
3. ${outcome.realizedRoi?.net_roi_percent && outcome.realizedRoi.net_roi_percent > 100 ? 'Replicate successful systems across other business units' : 'Optimize implementations for greater ROI'}
`;
  }
}
