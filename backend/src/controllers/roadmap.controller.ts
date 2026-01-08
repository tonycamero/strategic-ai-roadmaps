import { Request, Response } from 'express';
import { db } from '../db';
import { tenants, roadmaps, roadmapSections } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { RoadmapSectionService } from '../services/roadmapSection.service';
import { TicketPackService } from '../services/ticketPack.service';
import { RoadmapRefreshService } from '../services/roadmapRefresh.service';
import { syncAgentsForRoadmap } from '../services/roadmapAgentSync.service';
import { onboardingProgressService } from '../services/onboardingProgress.service';
import { generateFinalRoadmapForTenant } from '../services/finalRoadmap.service';


interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    ownerId?: string; // legacy - prefer tenantId from middleware
    tenantId?: string | null;
  };
}

/**
 * Get all roadmap sections for a roadmap
 * Supports both owner (auto-resolve tenant→roadmap) and superadmin (explicit roadmapId)
 */
export async function getRoadmapSections(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let roadmapId: string;
    let resolvedTenantId: string;

    // SuperAdmin can specify tenantId or roadmapId via query param
    if (user.role === 'superadmin') {
      if (req.query.tenantId) {
        resolvedTenantId = req.query.tenantId as string;
        const roadmap = await db.query.roadmaps.findFirst({
          where: eq(roadmaps.tenantId, resolvedTenantId),
        });

        if (!roadmap) {
          return res.status(404).json({ error: 'Roadmap not found for this tenant' });
        }

        roadmapId = roadmap.id;
      } else if (req.query.roadmapId) {
        roadmapId = req.query.roadmapId as string;
        const roadmap = await db.query.roadmaps.findFirst({
          where: eq(roadmaps.id, roadmapId),
        });
        if (!roadmap) {
          return res.status(404).json({ error: 'Roadmap not found' });
        }
        resolvedTenantId = roadmap.tenantId;
      } else {
        return res.status(400).json({ error: 'SuperAdmin must specify tenantId or roadmapId' });
      }
    } else {
      // Owner - resolve roadmap from tenantId
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        return res.status(403).json({ error: 'Tenant not resolved' });
      }
      resolvedTenantId = tenantId;
      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, tenantId),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found for this tenant' });
      }

      roadmapId = roadmap.id;
    }

    // Query roadmap sections from database
    const sections = await RoadmapSectionService.getSectionsForRoadmap(roadmapId);

    // Get tenant for this roadmap
    const roadmap = await db.query.roadmaps.findFirst({
      where: eq(roadmaps.id, roadmapId),
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, roadmap.tenantId),
    });

    // Get ticket pack for progress metadata
    let progress = null;
    if (tenant) {
      const ticketPack = await TicketPackService.getPackForRoadmap(tenant.id, roadmapId);
      if (ticketPack) {
        const { tickets } = await TicketPackService.getPackWithTickets(ticketPack.id);
        const systemCompletion = TicketPackService.computeSystemCompletion(tickets);

        // Compute overall stats
        const totalTickets = tickets.length;
        const doneTickets = tickets.filter(t => t.status === 'done').length;
        const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;

        const systemsImplemented = Object.entries(systemCompletion)
          .filter(([_, stats]) => stats.pct === 100)
          .map(([system]) => system);

        const systemsInProgress = Object.entries(systemCompletion)
          .filter(([_, stats]) => stats.pct > 0 && stats.pct < 100)
          .map(([system]) => system);

        progress = {
          ticketsCompleted: doneTickets,
          ticketsTotal: totalTickets,
          ticketsInProgress: inProgressTickets,
          pctComplete: totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0,
          systemsImplemented,
          systemsInProgress,
          systemCompletion,
        };
      }
    }

    // Map to response format
    const response = sections.map(section => ({
      id: section.id,
      sectionNumber: section.sectionNumber,
      sectionName: section.sectionName,
      status: section.status,
      wordCount: section.wordCount,
      lastUpdatedAt: section.lastUpdatedAt,
    }));

    // 🎯 Onboarding Hook: Mark ROADMAP_REVIEWED complete (first view)
    if (tenant && user.role === 'owner') {
      try {
        await onboardingProgressService.markStep(
          tenant.id,
          'ROADMAP_REVIEWED',
          'COMPLETED'
        );
      } catch (err) {
        console.error('[Roadmap] Failed to update onboarding progress:', err);
      }
    }

    return res.json({ roadmapId, sections: response, progress });
  } catch (error) {
    console.error('[Roadmap] Error fetching sections:', error);
    return res.status(500).json({ error: 'Failed to fetch roadmap sections' });
  }
}

/**
 * Get specific roadmap section content by section number or ID
 */
export async function getRoadmapSection(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sectionNumber } = req.params;
    let roadmapId: string;

    // SuperAdmin can specify tenantId or roadmapId via query param
    if (user.role === 'superadmin') {
      if (req.query.tenantId) {
        // Look up roadmap by tenantId
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, req.query.tenantId as string),
        });

        if (!tenant) {
          return res.status(404).json({ error: 'Tenant not found' });
        }

        const roadmap = await db.query.roadmaps.findFirst({
          where: eq(roadmaps.tenantId, req.query.tenantId as string),
        });

        if (!roadmap) {
          return res.status(404).json({ error: 'Roadmap not found for this tenant' });
        }

        roadmapId = roadmap.id;
      } else if (req.query.roadmapId) {
        roadmapId = req.query.roadmapId as string;
      } else {
        return res.status(400).json({ error: 'SuperAdmin must specify tenantId or roadmapId' });
      }
    } else {
      // Owner - resolve roadmap from tenantId
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        return res.status(403).json({ error: 'Tenant not resolved' });
      }
      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, tenantId),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found for this tenant' });
      }

      roadmapId = roadmap.id;
    }

    // Get all sections for this roadmap
    const sections = await RoadmapSectionService.getSectionsForRoadmap(roadmapId);

    // Find section by number (parse as integer)
    const sectionNum = parseInt(sectionNumber, 10);
    const section = sections.find(s => s.sectionNumber === sectionNum);

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    return res.json({
      id: section.id,
      roadmapId: section.roadmapId,
      sectionNumber: section.sectionNumber,
      sectionName: section.sectionName,
      contentMarkdown: section.contentMarkdown,
      status: section.status,
      wordCount: section.wordCount,
      lastUpdatedAt: section.lastUpdatedAt,
      agentCheatsheet: section.agentCheatsheet,
      diagrams: section.diagrams,
      updatedAt: section.updatedAt,
    });
  } catch (error) {
    console.error('[Roadmap] Error fetching section:', error);
    return res.status(500).json({ error: 'Failed to fetch roadmap section' });
  }
}

/**
 * Create or update a roadmap section
 */
export async function upsertRoadmapSection(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let roadmapId: string;

    // SuperAdmin can specify roadmapId via body
    if (user.role === 'superadmin' && req.body.roadmapId) {
      roadmapId = req.body.roadmapId;
    } else {
      // Owner - resolve roadmap from tenantId
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        return res.status(403).json({ error: 'Tenant not resolved' });
      }
      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, tenantId),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found for this tenant' });
      }

      roadmapId = roadmap.id;
    }

    // CHECK IMMUTABILITY
    const targetRoadmap = await db.query.roadmaps.findFirst({
      where: eq(roadmaps.id, roadmapId)
    });

    if (targetRoadmap && targetRoadmap.status === 'finalized') {
      return res.status(409).json({ error: 'Roadmap is FINALIZED and cannot be modified.' });
    }

    const { sectionNumber, sectionName, contentMarkdown, status, agentCheatsheet, diagrams } = req.body;

    if (!sectionNumber || !sectionName || !contentMarkdown) {
      return res.status(400).json({ error: 'Missing required fields: sectionNumber, sectionName, contentMarkdown' });
    }

    const section = await RoadmapSectionService.upsertSection({
      roadmapId,
      sectionNumber,
      sectionName,
      contentMarkdown,
      status,
      agentCheatsheet,
      diagrams,
    });

    return res.json({ section });
  } catch (error) {
    console.error('[Roadmap] Error upserting section:', error);
    return res.status(500).json({ error: 'Failed to upsert section' });
  }
}

/**
 * Update section status
 */
export async function updateSectionStatus(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sectionId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Missing required field: status' });
    }

    // Verify ownership if not superadmin
    if (user.role !== 'superadmin') {
      const section = await db.query.roadmapSections.findFirst({
        where: eq(roadmapSections.id, sectionId),
      });

      if (!section) {
        return res.status(404).json({ error: 'Section not found' });
      }

      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.id, section.roadmapId),
      });

      const tenantId = (req as any).tenantId;
      if (!roadmap || roadmap.tenantId !== tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (roadmap.status === 'finalized') {
        return res.status(409).json({ error: 'Roadmap is FINALIZED and cannot be modified.' });
      }
    } else {
      // SuperAdmin case: still need to check finalized status
      const section = await db.query.roadmapSections.findFirst({
        where: eq(roadmapSections.id, sectionId),
      });
      if (section) {
        const roadmap = await db.query.roadmaps.findFirst({
          where: eq(roadmaps.id, section.roadmapId),
        });
        if (roadmap && roadmap.status === 'finalized') {
          return res.status(409).json({ error: 'Roadmap is FINALIZED and cannot be modified.' });
        }
      }
    }

    const updatedSection = await RoadmapSectionService.updateStatus(sectionId, status);

    if (!updatedSection) {
      return res.status(404).json({ error: 'Section not found' });
    }

    return res.json({ section: updatedSection });
  } catch (error) {
    console.error('[Roadmap] Error updating section status:', error);
    return res.status(500).json({ error: 'Failed to update section status' });
  }
}

/**
 * Sync roadmap section statuses based on ticket completion
 * POST /roadmaps/:id/sync-status
 */
export async function syncRoadmapStatus(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let roadmapId: string;

    // SuperAdmin can specify roadmapId via body
    if (user.role === 'superadmin' && req.body.roadmapId) {
      roadmapId = req.body.roadmapId;
    } else {
      // Owner - resolve roadmap from tenantId
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        return res.status(403).json({ error: 'Tenant not resolved' });
      }
      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, tenantId),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found for this tenant' });
      }

      roadmapId = roadmap.id;
    }

    // Get the roadmap to find its tenant
    const roadmap = await db.query.roadmaps.findFirst({
      where: eq(roadmaps.id, roadmapId),
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    if (roadmap.status === 'finalized') {
      return res.status(409).json({ error: 'Roadmap is FINALIZED and cannot be modified.' });
    }

    // Get tenant for this roadmap
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, roadmap.tenantId),
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get ticket pack for this roadmap
    const pack = await TicketPackService.getPackForRoadmap(tenant.id, roadmapId);

    if (!pack) {
      return res.status(404).json({ error: 'No ticket pack found for this roadmap' });
    }

    // Get all tickets
    const { tickets } = await TicketPackService.getPackWithTickets(pack.id);

    // Compute system completion
    const systemCompletion = TicketPackService.computeSystemCompletion(tickets);

    // Update section statuses
    await RoadmapSectionService.updateStatusesFromTicketCompletion({
      roadmapId,
      systemCompletion,
    });

    // Get updated sections
    const updatedSections = await RoadmapSectionService.getSectionsForRoadmap(roadmapId);

    return res.json({
      message: 'Roadmap statuses synced successfully',
      sections: updatedSections.map(s => ({
        id: s.id,
        sectionNumber: s.sectionNumber,
        sectionName: s.sectionName,
        status: s.status,
      })),
      systemCompletion,
    });
  } catch (error) {
    console.error('[Roadmap] Error syncing status:', error);
    return res.status(500).json({ error: 'Failed to sync roadmap status' });
  }
}

/**
 * Refresh roadmap - create new version with updated statuses and Section 10
 * POST /roadmaps/refresh
 */
export async function refreshRoadmap(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let roadmapId: string;
    let tenantId: string;

    // SuperAdmin can specify roadmapId via body
    if (user.role === 'superadmin' && req.body.roadmapId) {
      roadmapId = req.body.roadmapId;

      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.id, roadmapId),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found' });
      }

      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, roadmap.tenantId),
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      tenantId = tenant.id;
    } else {
      // Owner - resolve roadmap and tenant from tenantId
      const ownerTenantId = (req as any).tenantId;
      if (!ownerTenantId) {
        return res.status(403).json({ error: 'Tenant not resolved' });
      }

      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, ownerTenantId),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found for this tenant' });
      }

      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, ownerTenantId),
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      roadmapId = roadmap.id;
      tenantId = tenant.id;
    }

    // IMMUTABILITY CHECK
    const targetRoadmap = await db.query.roadmaps.findFirst({
      where: eq(roadmaps.id, roadmapId)
    });

    if (targetRoadmap && targetRoadmap.status === 'finalized') {
      return res.status(409).json({ error: 'Roadmap is FINALIZED and cannot be refreshed.' });
    }

    const result = await RoadmapRefreshService.refreshRoadmap({
      tenantId,
      roadmapId,
    });

    // Sync agents with new roadmap context
    let agentsSynced = false;
    try {
      await syncAgentsForRoadmap(tenantId, result.newRoadmapId, user.userId);
      agentsSynced = true;
      console.log('[Roadmap] Agent sync completed successfully');
    } catch (error) {
      console.error('[Roadmap] Agent sync failed (non-fatal):', error);
      // Don't fail the entire refresh if agent sync fails
    }

    return res.json({
      success: true,
      ...result,
      agentsSynced,
    });
  } catch (error) {
    console.error('[Roadmap] Error refreshing roadmap:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to refresh roadmap' });
  }
}

/**
 * Get ticket pack for a roadmap with sprint assignments
 * GET /roadmaps/tickets
 */
export async function getRoadmapTickets(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let roadmapId: string;
    let tenantId: string;

    // SuperAdmin can specify roadmapId via query param
    if (user.role === 'superadmin' && req.query.roadmapId) {
      roadmapId = req.query.roadmapId as string;

      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.id, roadmapId),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found' });
      }

      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, roadmap.tenantId),
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      tenantId = tenant.id;
    } else {
      // Owner - resolve roadmap and tenant from tenantId
      const ownerTenantId = (req as any).tenantId;
      if (!ownerTenantId) {
        return res.status(403).json({ error: 'Tenant not resolved' });
      }

      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, ownerTenantId),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found for this tenant' });
      }

      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, ownerTenantId),
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      roadmapId = roadmap.id;
      tenantId = tenant.id;
    }

    // Get ticket pack
    const ticketPack = await TicketPackService.getPackForRoadmap(tenantId, roadmapId);

    if (!ticketPack) {
      return res.status(404).json({ error: 'No ticket pack found for this roadmap' });
    }

    // Get all tickets
    const { tickets } = await TicketPackService.getPackWithTickets(ticketPack.id);
    const systemCompletion = TicketPackService.computeSystemCompletion(tickets);

    // Organize tickets by sprint
    const sprints = (ticketPack.sprintAssignments || []).map((sprint: any) => {
      const sprintTickets = tickets.filter(t =>
        sprint.ticket_instances?.includes(t.id)
      );

      return {
        sprintNumber: sprint.sprint_number,
        name: sprint.name || `Sprint ${sprint.sprint_number}`,
        plannedStart: sprint.planned_start,
        plannedEnd: sprint.planned_end,
        tickets: sprintTickets,
        stats: {
          total: sprintTickets.length,
          done: sprintTickets.filter(t => t.status === 'done').length,
          in_progress: sprintTickets.filter(t => t.status === 'in_progress').length,
          blocked: sprintTickets.filter(t => t.status === 'blocked').length,
          not_started: sprintTickets.filter(t => t.status === 'not_started').length,
        },
      };
    });

    return res.json({
      ticketPackId: ticketPack.id,
      roadmapId,
      version: ticketPack.version,
      status: ticketPack.status,
      totals: ticketPack.totals,
      totalTickets: ticketPack.totalTickets,
      totalSprints: ticketPack.totalSprints,
      systemCompletion,
      sprints,
    });
  } catch (error) {
    console.error('[Roadmap] Error fetching tickets:', error);
    return res.status(500).json({ error: 'Failed to fetch roadmap tickets' });
  }
}

/**
 * Export complete roadmap as single Markdown file
 * GET /roadmaps/export
 */
export async function exportRoadmap(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let roadmapId: string;

    // SuperAdmin can specify tenantId via query param
    if (user.role === 'superadmin' && req.query.tenantId) {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, req.query.tenantId as string),
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, tenant.id),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found for this tenant' });
      }

      roadmapId = roadmap.id;
    } else {
      // Owner - resolve roadmap from user's tenantId
      if (!user.tenantId) {
        return res.status(400).json({ error: 'User has no associated tenant' });
      }

      const roadmap = await db.query.roadmaps.findFirst({
        where: eq(roadmaps.tenantId, user.tenantId),
      });

      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found for this tenant' });
      }

      roadmapId = roadmap.id;
    }

    // Get all sections ordered by section number
    const sections = await RoadmapSectionService.getSectionsForRoadmap(roadmapId);
    const sortedSections = sections.sort((a, b) => a.sectionNumber - b.sectionNumber);

    // Get tenant name for title
    const roadmap = await db.query.roadmaps.findFirst({
      where: eq(roadmaps.id, roadmapId),
    });

    const tenant = roadmap ? await db.query.tenants.findFirst({
      where: eq(tenants.id, roadmap.tenantId),
    }) : null;

    const firmName = tenant?.name || 'Unknown Firm';

    // Build complete markdown document
    let markdown = `# Strategic AI Roadmap\n## ${firmName}\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    markdown += `---\n\n`;

    for (const section of sortedSections) {
      markdown += `# ${section.sectionName}\n\n`;
      markdown += section.contentMarkdown;
      markdown += `\n\n---\n\n`;
    }

    // Set headers for download
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${firmName.replace(/\s+/g, '_')}_Strategic_AI_Roadmap.md"`);
    return res.send(markdown);
  } catch (error) {
    console.error('[Roadmap] Error exporting roadmap:', error);
    return res.status(500).json({ error: 'Failed to export roadmap' });
  }
}

/**
 * Finalize Roadmap (CR-UX-7)
 * POST /roadmap/:tenantId/finalize
 * Strictly Executive Authority. Gated by Intake, Brief, Moderation.
 */
export async function finalizeRoadmap(req: AuthRequest, res: Response) {
  try {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId } = req.params;

    // AUTHORITY GUARD: Owner or SuperAdmin ONLY
    if (user.role !== 'owner' && user.role !== 'superadmin') {
      console.warn(`[Roadmap] Unauthorized finalization attempt by ${user.role} (${user.userId})`);
      return res.status(403).json({ error: 'Only Executives (Owners) can finalize the roadmap.' });
    }

    // Double check tenant ownership for Owners
    if (user.role === 'owner' && user.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied to this tenant.' });
    }

    // IDEMPOTENCY CHECK: Check if already finalized
    const existingRoadmap = await db.query.roadmaps.findFirst({
      where: eq(roadmaps.tenantId, tenantId),
      orderBy: [desc(roadmaps.createdAt)] // Get latest
    });

    if (existingRoadmap && existingRoadmap.status === 'finalized') {
      console.log(`[Roadmap] Roadmap already finalized for tenant ${tenantId}. Returning existing.`);
      return res.json({
        success: true,
        message: 'Roadmap is already finalized.',
        data: {
          roadmapId: existingRoadmap.id,
          alreadyFinalized: true
        }
      });
    }

    // Call service which enforces Gates (Intake, Brief, Moderation)
    const result = await generateFinalRoadmapForTenant(tenantId);

    return res.json({
      success: true,
      message: 'Roadmap finalized successfully.',
      data: result
    });

  } catch (error: any) {
    console.error('[Roadmap] Error finalizing roadmap:', error);

    // Map service errors to appropriate status codes
    if (error.message?.includes('Gating Failed')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message?.includes('Moderation incomplete')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message?.includes('Moderation incomplete')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message?.includes('No tickets found') || error.message?.includes('No approved tickets')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message?.includes('Tenant not found')) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Failed to finalize roadmap.' });
  }
}
