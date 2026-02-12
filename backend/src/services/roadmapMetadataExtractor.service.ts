import { db } from '../db/index.ts';
import { roadmapSections, agentConfigs } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

interface RoadmapMetadata {
  top_pain_points?: string[];
  primary_goals?: string[];
  systems_recommended?: string[];
  timeline?: {
    '30'?: string[];
    '60'?: string[];
    '90'?: string[];
  };
}

/**
 * Extract structured metadata from roadmap sections for agent context.
 * Simple heuristic-based extraction (can be enhanced with AI later).
 */
export async function extractRoadmapMetadata(
  roadmapId: string,
  tenantId: string
): Promise<RoadmapMetadata> {
  const sections = await db
    .select()
    .from(roadmapSections)
    .where(eq(roadmapSections.roadmapId, roadmapId))
    .orderBy(roadmapSections.sectionNumber);

  const metadata: RoadmapMetadata = {
    top_pain_points: [],
    primary_goals: [],
    systems_recommended: [],
    timeline: { '30': [], '60': [], '90': [] },
  };

  for (const section of sections) {
    const content = section.contentMarkdown;

    // Extract pain points (look for "pain", "problem", "challenge", "bottleneck")
    const painMatches = content.match(/(?:pain|problem|challenge|bottleneck)[^.!?\n]*[.!?]/gi);
    if (painMatches && metadata.top_pain_points) {
      metadata.top_pain_points.push(...painMatches.slice(0, 2).map(s => s.trim()));
    }

    // Extract goals (look for "goal", "objective", "outcome")
    const goalMatches = content.match(/(?:goal|objective|outcome)[^.!?\n]*[.!?]/gi);
    if (goalMatches && metadata.primary_goals) {
      metadata.primary_goals.push(...goalMatches.slice(0, 2).map(s => s.trim()));
    }

    // Extract systems (look for proper nouns, CRM names, tools)
    const systemMatches = content.match(/\b(?:CRM|HubSpot|Salesforce|Slack|Zapier|API|automation|workflow|system)\b[^.!?\n]*[.!?]/gi);
    if (systemMatches && metadata.systems_recommended) {
      metadata.systems_recommended.push(...systemMatches.slice(0, 2).map(s => s.trim()));
    }

    // Extract timeline items (look for "30 day", "60 day", "90 day")
    const timeline30 = content.match(/(?:30[- ]day|first month|month 1)[^.!?\n]*[.!?]/gi);
    const timeline60 = content.match(/(?:60[- ]day|second month|month 2)[^.!?\n]*[.!?]/gi);
    const timeline90 = content.match(/(?:90[- ]day|third month|month 3)[^.!?\n]*[.!?]/gi);

    if (timeline30 && metadata.timeline?.['30']) {
      metadata.timeline['30'].push(...timeline30.slice(0, 1).map(s => s.trim()));
    }
    if (timeline60 && metadata.timeline?.['60']) {
      metadata.timeline['60'].push(...timeline60.slice(0, 1).map(s => s.trim()));
    }
    if (timeline90 && metadata.timeline?.['90']) {
      metadata.timeline['90'].push(...timeline90.slice(0, 1).map(s => s.trim()));
    }
  }

  // Deduplicate and limit
  metadata.top_pain_points = [...new Set(metadata.top_pain_points)].slice(0, 5);
  metadata.primary_goals = [...new Set(metadata.primary_goals)].slice(0, 5);
  metadata.systems_recommended = [...new Set(metadata.systems_recommended)].slice(0, 5);

  // Save to agentConfigs for this tenant
  await updateAgentConfigsWithMetadata(tenantId, metadata);

  return metadata;
}

/**
 * Update all agent configs for tenant with roadmap metadata.
 */
async function updateAgentConfigsWithMetadata(
  tenantId: string,
  metadata: RoadmapMetadata
): Promise<void> {
  const configs = await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.tenantId, tenantId));

  for (const config of configs) {
    await db
      .update(agentConfigs)
      .set({
        roadmapMetadata: metadata,
        updatedAt: new Date(),
      })
      .where(eq(agentConfigs.id, config.id));
  }
}
