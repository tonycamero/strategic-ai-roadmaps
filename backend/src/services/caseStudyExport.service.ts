import { db } from '../db/index';
import { roadmaps, roadmapSections, ticketPacks, ticketInstances, tenantDocuments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { ImplementationMetricsService } from './implementationMetrics.service';
import { getOrCreateRoadmapForTenant } from './roadmapOs.service';

/**
 * Generate professional case study from roadmap execution data.
 * T3.10 implementation.
 */
export async function generateCaseStudy(
  tenantId: string,
  firmName: string
): Promise<string> {
  // Get roadmap
  const roadmap = await getOrCreateRoadmapForTenant(tenantId);

  // Get snapshots and outcome
  const snapshots = await ImplementationMetricsService.getSnapshotsForRoadmap({
    tenantId,
    roadmapId: roadmap.id,
  });

  const outcome = await ImplementationMetricsService.getOutcome({
    tenantId,
    roadmapId: roadmap.id,
  });

  // Get ticket execution summary
  const pack = await db.query.ticketPacks.findFirst({
    where: eq(ticketPacks.roadmapId, roadmap.id),
  });

  let ticketSummary = { total: 0, done: 0, inProgress: 0, blocked: 0 };
  if (pack) {
    const tickets = await db
      .select()
      .from(ticketInstances)
      .where(eq(ticketInstances.ticketPackId, pack.id));

    ticketSummary = {
      total: tickets.length,
      done: tickets.filter(t => t.status === 'done').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      blocked: tickets.filter(t => t.status === 'blocked').length,
    };
  }

  // Get sections
  const sections = await db
    .select()
    .from(roadmapSections)
    .where(eq(roadmapSections.roadmapId, roadmap.id))
    .orderBy(roadmapSections.sectionNumber);

  // Generate Markdown case study
  const baseline = snapshots.find(s => s.label === 'baseline');
  const latest = snapshots[snapshots.length - 1];

  const markdown = `# Case Study: ${firmName}
**Strategic AI Roadmap Implementation**

---

## Executive Summary

${firmName} partnered with Scend to transform their business operations through a strategic AI roadmap. Over a ${snapshots.length > 2 ? '90-day' : 'multi-phase'} implementation, they achieved measurable improvements across key performance indicators while building sustainable systems for long-term growth.

---

## The Challenge

### Baseline State (Before Implementation)

${baseline ? `
**Key Metrics at Start:**
- Lead Response Time: ${baseline.metrics.lead_response_minutes || 'N/A'} minutes
- Lead-to-Appointment Rate: ${baseline.metrics.lead_to_appt_rate || 'N/A'}%
- CRM Adoption: ${baseline.metrics.crm_adoption_rate || 'N/A'}%
- Weekly Operations Hours: ${baseline.metrics.weekly_ops_hours || 'N/A'} hours
- NPS Score: ${baseline.metrics.nps || 'N/A'}
` : '*(Baseline metrics not yet captured)*'}

### Core Pain Points
${sections.slice(0, 3).map(s => `- ${s.sectionName}: Key systems and processes identified for optimization`).join('\n')}

---

## The Solution

### Strategic Roadmap Architecture

The roadmap consisted of **${sections.length} strategic sections** addressing:

${sections.map(s => `**${s.sectionNumber}. ${s.sectionName}**\n- Status: ${s.status === 'implemented' ? '✅ Implemented' : s.status === 'in_progress' ? '🔄 In Progress' : '📋 Planned'}\n- Word Count: ${s.wordCount || 0} words`).join('\n\n')}

### Implementation Approach

**Ticket-Based Execution:**
- ${ticketSummary.total} total implementation tickets
- ${ticketSummary.done} completed (${ticketSummary.total > 0 ? Math.round((ticketSummary.done / ticketSummary.total) * 100) : 0}%)
- ${ticketSummary.inProgress} in progress
- ${ticketSummary.blocked} blocked

---

## The Results

${outcome && latest ? `
### Measured Outcomes (90-Day Results)

**Performance Improvements:**

| Metric | Baseline | Current | Change |
|--------|----------|---------|--------|
| Lead Response Time | ${baseline?.metrics.lead_response_minutes?.toFixed(1) || 'N/A'} min | ${latest.metrics.lead_response_minutes?.toFixed(1) || 'N/A'} min | ${(outcome.deltas.lead_response_minutes || 0) > 0 ? '↓' : '↑'} ${Math.abs(outcome.deltas.lead_response_minutes || 0).toFixed(1)} min |
| Lead-to-Appt Rate | ${baseline?.metrics.lead_to_appt_rate?.toFixed(1) || 'N/A'}% | ${latest.metrics.lead_to_appt_rate?.toFixed(1) || 'N/A'}% | ${(outcome.deltas.lead_to_appt_rate || 0) > 0 ? '↑' : '↓'} ${Math.abs(outcome.deltas.lead_to_appt_rate || 0).toFixed(1)}% |
| CRM Adoption | ${baseline?.metrics.crm_adoption_rate?.toFixed(1) || 'N/A'}% | ${latest.metrics.crm_adoption_rate?.toFixed(1) || 'N/A'}% | ${(outcome.deltas.crm_adoption_rate || 0) > 0 ? '↑' : '↓'} ${Math.abs(outcome.deltas.crm_adoption_rate || 0).toFixed(1)}% |
| Weekly Ops Hours | ${baseline?.metrics.weekly_ops_hours?.toFixed(1) || 'N/A'} hrs | ${latest.metrics.weekly_ops_hours?.toFixed(1) || 'N/A'} hrs | ${(outcome.deltas.weekly_ops_hours || 0) > 0 ? '↓' : '↑'} ${Math.abs(outcome.deltas.weekly_ops_hours || 0).toFixed(1)} hrs |
| NPS Score | ${baseline?.metrics.nps?.toFixed(0) || 'N/A'} | ${latest.metrics.nps?.toFixed(0) || 'N/A'} | ${(outcome.deltas.nps || 0) > 0 ? '↑' : '↓'} ${Math.abs(outcome.deltas.nps || 0).toFixed(0)} |

### Return on Investment

**Annual Impact:**
- **Time Savings:** ${outcome.realizedRoi?.time_savings_hours_annual?.toFixed(0) || 0} hours ($${outcome.realizedRoi?.time_savings_value_annual?.toFixed(0) || 0})
- **Revenue Impact:** $${outcome.realizedRoi?.revenue_impact_annual?.toFixed(0) || 0}
- **Cost Avoidance:** $${outcome.realizedRoi?.cost_avoidance_annual?.toFixed(0) || 0}

**Net ROI:** ${outcome.realizedRoi?.net_roi_percent?.toFixed(0) || 0}%

**Implementation Status:** ${outcome.status === 'on_track' ? '✅ On Track' : outcome.status === 'at_risk' ? '⚠️ At Risk' : '🔴 Off Track'}
` : '*(Results tracking in progress - metrics will be updated as snapshots are captured)*'}

---

## Key Wins

1. **Systematic Transformation:** Moved from ad-hoc operations to structured, scalable systems
2. **Measurable Impact:** Quantified improvements across all key business metrics
3. **Team Alignment:** Clear roadmap created shared understanding and accountability
4. **Sustainable Growth:** Built foundation for continued improvement beyond initial implementation

---

## About Scend

Scend builds Strategic AI Roadmaps that transform how businesses operate. Each roadmap is custom-designed, execution-focused, and outcome-measured.

**Learn more:** [scend.ai](https://scend.ai)

---

*Case study generated on ${new Date().toISOString().split('T')[0]}*
`;

  return markdown;
}

/**
 * Store case study as tenant document.
 */
export async function saveCaseStudy(
  tenantId: string,
  ownerId: string,
  firmName: string,
  uploadedBy: string
): Promise<{ documentId: string; markdown: string }> {
  // Generate case study
  const markdown = await generateCaseStudy(tenantId, firmName);

  // Save as tenant document
  const [doc] = await db
    .insert(tenantDocuments)
    .values({
      tenantId,
      ownerUserId: ownerId,
      filename: `${firmName.replace(/[^a-z0-9]/gi, '_')}_Case_Study_${Date.now()}.md`,
      originalFilename: `${firmName} - Case Study.md`,
      filePath: `/case-studies/${tenantId}/${Date.now()}.md`,
      fileSize: Buffer.byteLength(markdown, 'utf8'),
      mimeType: 'text/markdown',
      category: 'case_study',
      title: `${firmName} - Strategic AI Roadmap Case Study`,
      description: 'Auto-generated case study showcasing implementation outcomes and ROI',
      uploadedBy,
      isPublic: false,
    })
    .returning();

  return { documentId: doc.id, markdown };
}
