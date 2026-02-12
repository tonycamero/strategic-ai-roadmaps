import { db } from '../db/index.ts';
import { eq, and } from 'drizzle-orm';
import { roadmapSections, type RoadmapSection, type NewRoadmapSection } from '../db/schema.ts';

export class RoadmapSectionService {
  static async getSectionsForRoadmap(roadmapId: string): Promise<RoadmapSection[]> {
    return db
      .select()
      .from(roadmapSections)
      .where(eq(roadmapSections.roadmapId, roadmapId))
      .orderBy(roadmapSections.sectionNumber);
  }

  static async createSection(input: NewRoadmapSection): Promise<RoadmapSection> {
    const [row] = await db.insert(roadmapSections).values(input).returning();
    return row;
  }

  static async upsertSection(params: {
    roadmapId: string;
    sectionNumber: number;
    sectionName: RoadmapSection['sectionName'];
    contentMarkdown: string;
    status?: RoadmapSection['status'];
    agentCheatsheet?: RoadmapSection['agentCheatsheet'];
    diagrams?: string[];
  }): Promise<RoadmapSection> {
    const existing = await db
      .select()
      .from(roadmapSections)
      .where(
        and(
          eq(roadmapSections.roadmapId, params.roadmapId),
          eq(roadmapSections.sectionNumber, params.sectionNumber)
        )
      )
      .limit(1);

    const wordCount = params.contentMarkdown.split(/\s+/).filter(Boolean).length;

    if (existing[0]) {
      const [row] = await db
        .update(roadmapSections)
        .set({
          contentMarkdown: params.contentMarkdown,
          sectionName: params.sectionName,
          status: params.status ?? existing[0].status,
          agentCheatsheet: params.agentCheatsheet ?? existing[0].agentCheatsheet,
          diagrams: params.diagrams ?? existing[0].diagrams,
          wordCount,
          lastUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(roadmapSections.id, existing[0].id))
        .returning();
      return row;
    }

    const [row] = await db
      .insert(roadmapSections)
      .values({
        roadmapId: params.roadmapId,
        sectionNumber: params.sectionNumber,
        sectionName: params.sectionName,
        contentMarkdown: params.contentMarkdown,
        status: params.status ?? 'planned',
        agentCheatsheet: params.agentCheatsheet ?? {},
        diagrams: params.diagrams ?? [],
        wordCount,
        lastUpdatedAt: new Date(),
      })
      .returning();

    return row;
  }

  static async updateStatus(
    sectionId: string,
    status: RoadmapSection['status']
  ): Promise<RoadmapSection | null> {
    const [row] = await db
      .update(roadmapSections)
      .set({
        status,
        lastUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(roadmapSections.id, sectionId))
      .returning();

    return row ?? null;
  }

  /**
   * Update section statuses based on ticket completion percentages
   * Rules:
   * - 0% done → planned
   * - 0-100% (non-zero) → in_progress  
   * - 100% → implemented
   */
  static async updateStatusesFromTicketCompletion(params: {
    roadmapId: string;
    systemCompletion: Record<string, { done: number; total: number; pct: number }>;
  }): Promise<void> {
    const { roadmapId, systemCompletion } = params;

    // Get all sections for this roadmap
    const sections = await this.getSectionsForRoadmap(roadmapId);

    // Map systems to sections
    // Assumes section names or agentCheatsheet contain system identifiers
    // For now, use simple matching: "System 1" → Section 1, etc.
    for (const section of sections) {
      // Extract system number from section (e.g., Section 1 → System 1)
      const systemKey = `System ${section.sectionNumber}`;
      const completion = systemCompletion[systemKey];

      if (!completion) {
        // No tickets for this section, keep as planned or current status
        continue;
      }

      let newStatus: RoadmapSection['status'];
      if (completion.pct === 0) {
        newStatus = 'planned';
      } else if (completion.pct === 100) {
        newStatus = 'implemented';
      } else {
        newStatus = 'in_progress';
      }

      // Update if status changed
      if (section.status !== newStatus) {
        await this.updateStatus(section.id, newStatus);
      }
    }
  }
}
