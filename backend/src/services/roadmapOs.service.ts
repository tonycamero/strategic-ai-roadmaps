import { db } from '../db/index';
import { tenants, roadmaps, roadmapSections } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { Roadmap, RoadmapSection } from '../db/schema';

/**
 * Get or create a roadmap for a tenant.
 * This is the entry point to the Roadmap OS - every tenant gets exactly one roadmap.
 * 
 * @param tenantId - The tenant ID
 * @returns The roadmap instance
 */
export async function getOrCreateRoadmapForTenant(tenantId: string): Promise<Roadmap> {
  // Get tenant + ownerId
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  // Look for existing roadmap by tenantId
  let roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.tenantId, tenantId),
  });

  // Create if missing
  if (!roadmap) {
    const [newRoadmap] = await db
      .insert(roadmaps)
      .values({
        tenantId: tenantId,
        createdByUserId: tenant.ownerUserId,
        status: 'draft',
        modelJson: {},      // REQUIRED
        sourceRefs: [],     // REQUIRED
        pilotStage: null,
      })
      .returning();
    
    roadmap = newRoadmap;
  }

  return roadmap;
}

/**
 * Canonical mapping from section keys (used in generation) to section numbers.
 */
const SECTION_MAP: Record<string, { number: number; name: string }> = {
  summary: { number: 0, name: 'Summary' },
  '01-executive-summary': { number: 1, name: 'Executive Summary' },
  '02-diagnostic-analysis': { number: 2, name: 'Diagnostic Analysis' },
  '03-system-architecture': { number: 3, name: 'System Architecture' },
  '04-high-leverage-systems': { number: 4, name: 'High-Leverage Systems' },
  '05-implementation-plan': { number: 5, name: 'Implementation Plan' },
  '06-sop-pack': { number: 6, name: 'SOP Pack' },
  '07-metrics-dashboard': { number: 7, name: 'KPIs/Metrics' },
  '08-appendix': { number: 8, name: 'Appendix' },
};

export interface UpsertRoadmapSectionPayload {
  roadmapId: string;
  sectionNumber: number;
  sectionName: string;
  contentMarkdown: string;
  status?: 'planned' | 'in_progress' | 'done' | 'blocked';
  wordCount?: number;
  agentCheatsheet?: any;
  diagrams?: string[];
}

/**
 * Upsert a roadmap section.
 * If section exists (by roadmapId + sectionNumber), update content but preserve status.
 * If new, insert with status='planned'.
 */
export async function upsertRoadmapSection(
  payload: UpsertRoadmapSectionPayload
): Promise<RoadmapSection> {
  const { roadmapId, sectionNumber, sectionName, contentMarkdown, wordCount, agentCheatsheet, diagrams } = payload;

  // Validate section number
  if (sectionNumber < 0 || sectionNumber > 8) {
    throw new Error(`Invalid section number: ${sectionNumber}. Must be 0-8.`);
  }

  // Check if section exists
  const existing = await db.query.roadmapSections.findFirst({
    where: and(
      eq(roadmapSections.roadmapId, roadmapId),
      eq(roadmapSections.sectionNumber, sectionNumber)
    ),
  });

  const now = new Date();

  if (existing) {
    // Update existing - preserve status
    const [updated] = await db
      .update(roadmapSections)
      .set({
        sectionName,
        contentMarkdown,
        wordCount: wordCount ?? null,
        agentCheatsheet: agentCheatsheet ?? existing.agentCheatsheet,
        diagrams: diagrams ?? existing.diagrams,
        lastUpdatedAt: now,
        updatedAt: now,
      })
      .where(eq(roadmapSections.id, existing.id))
      .returning();

    return updated;
  } else {
    // Insert new with default status
    const [inserted] = await db
      .insert(roadmapSections)
      .values({
        roadmapId,
        sectionNumber,
        sectionName,
        contentMarkdown,
        status: payload.status ?? 'planned',
        wordCount: wordCount ?? null,
        agentCheatsheet: agentCheatsheet ?? {},
        diagrams: diagrams ?? [],
        lastUpdatedAt: now,
      })
      .returning();

    return inserted;
  }
}

/**
 * Get section metadata from section key.
 */
export function getSectionMetadata(sectionKey: string): { number: number; name: string } | null {
  return SECTION_MAP[sectionKey] ?? null;
}
