import { Response } from 'express';
import { db } from '../db/index.ts';
import {
    tenants,
    roadmaps,
    roadmapSections,
    ticketInstances,
    ticketPacks,
    auditEvents,
    tenantDocuments
} from '../db/schema.ts';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth.ts';
import { getOrCreateRoadmapForTenant } from '../services/roadmapOs.service.ts';
import { generateTicketPackForRoadmap } from '../services/ticketPackGenerator.service.ts';

/**
 * GET /api/roadmap/sections
 */
export async function getRoadmapSections(req: AuthRequest, res: Response) {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });

        const roadmap = await getOrCreateRoadmapForTenant(tenantId);
        const sections = await db
            .select()
            .from(roadmapSections)
            .where(eq(roadmapSections.roadmapId, roadmap.id))
            .orderBy(asc(roadmapSections.sectionNumber));

        return res.json({ roadmap, sections });
    } catch (error: any) {
        console.error('getRoadmapSections error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * GET /api/roadmap/sections/:sectionNumber
 */
export async function getRoadmapSection(req: AuthRequest, res: Response) {
    try {
        const tenantId = req.user?.tenantId;
        const { sectionNumber } = req.params;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });

        const roadmap = await getOrCreateRoadmapForTenant(tenantId);
        const [section] = await db
            .select()
            .from(roadmapSections)
            .where(
                and(
                    eq(roadmapSections.roadmapId, roadmap.id),
                    eq(roadmapSections.sectionNumber, parseInt(sectionNumber, 10))
                )
            )
            .limit(1);

        if (!section) return res.status(404).json({ error: 'Section not found' });

        return res.json(section);
    } catch (error: any) {
        console.error('getRoadmapSection error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * POST /api/roadmap/sections
 */
export async function upsertRoadmapSection(req: AuthRequest, res: Response) {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });

        const { sectionNumber, sectionName, contentMarkdown, status } = req.body;
        const roadmap = await getOrCreateRoadmapForTenant(tenantId);

        const [existing] = await db
            .select()
            .from(roadmapSections)
            .where(
                and(
                    eq(roadmapSections.roadmapId, roadmap.id),
                    eq(roadmapSections.sectionNumber, sectionNumber)
                )
            )
            .limit(1);

        if (existing) {
            const [updated] = await db
                .update(roadmapSections)
                .set({
                    sectionName,
                    contentMarkdown,
                    status: status || existing.status,
                    lastUpdatedAt: new Date(),
                })
                .where(eq(roadmapSections.id, existing.id))
                .returning();
            return res.json(updated);
        } else {
            const [newSection] = await db
                .insert(roadmapSections)
                .values({
                    roadmapId: roadmap.id,
                    sectionNumber,
                    sectionName,
                    contentMarkdown,
                    status: status || 'not_started',
                })
                .returning();
            return res.json(newSection);
        }
    } catch (error: any) {
        console.error('upsertRoadmapSection error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * PATCH /api/roadmap/sections/:sectionId/status
 */
export async function updateSectionStatus(req: AuthRequest, res: Response) {
    try {
        const { sectionId } = req.params;
        const { status } = req.body;

        const [updated] = await db
            .update(roadmapSections)
            .set({ status, lastUpdatedAt: new Date() })
            .where(eq(roadmapSections.id, sectionId))
            .returning();

        if (!updated) return res.status(404).json({ error: 'Section not found' });

        return res.json(updated);
    } catch (error: any) {
        console.error('updateSectionStatus error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * POST /api/roadmap/sync-status
 */
export async function syncRoadmapStatus(req: AuthRequest, res: Response) {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });

        const roadmap = await getOrCreateRoadmapForTenant(tenantId);
        const sections = await db
            .select()
            .from(roadmapSections)
            .where(eq(roadmapSections.roadmapId, roadmap.id));

        const pack = await db.query.ticketPacks.findFirst({
            where: eq(ticketPacks.roadmapId, roadmap.id),
        });

        if (!pack) return res.json({ synced: 0 });

        const tickets = await db
            .select()
            .from(ticketInstances)
            .where(eq(ticketInstances.ticketPackId, pack.id));

        let updatedCount = 0;
        for (const section of sections) {
            const sectionTickets = tickets.filter(t => t.sectionNumber === section.sectionNumber);
            if (sectionTickets.length === 0) continue;

            const allDone = sectionTickets.every(t => t.status === 'done');
            const someStarted = sectionTickets.some(t => t.status === 'in_progress' || t.status === 'done');

            let newStatus = 'not_started';
            if (allDone) newStatus = 'completed';
            else if (someStarted) newStatus = 'in_progress';

            if (newStatus !== section.status) {
                await db
                    .update(roadmapSections)
                    .set({ status: newStatus, lastUpdatedAt: new Date() })
                    .where(eq(roadmapSections.id, section.id));
                updatedCount++;
            }
        }

        return res.json({ synced: updatedCount });
    } catch (error: any) {
        console.error('syncRoadmapStatus error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * POST /api/roadmap/refresh
 */
export async function refreshRoadmap(req: AuthRequest, res: Response) {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });

        const roadmap = await getOrCreateRoadmapForTenant(tenantId);
        await generateTicketPackForRoadmap(roadmap.id, tenantId);

        return res.json({ ok: true });
    } catch (error: any) {
        console.error('refreshRoadmap error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * GET /api/roadmap/tickets
 */
export async function getRoadmapTickets(req: AuthRequest, res: Response) {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });

        const roadmap = await getOrCreateRoadmapForTenant(tenantId);
        const pack = await db.query.ticketPacks.findFirst({
            where: eq(ticketPacks.roadmapId, roadmap.id),
        });

        if (!pack) return res.json({ ticketPack: null, tickets: [] });

        const tickets = await db
            .select()
            .from(ticketInstances)
            .where(eq(ticketInstances.ticketPackId, pack.id))
            .orderBy(
	      asc(ticketInstances.sectionNumber),
	      asc(ticketInstances.createdAt)
	    );


        return res.json({ ticketPack: pack, tickets });
    } catch (error: any) {
        console.error('getRoadmapTickets error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

/**
 * GET /api/roadmap/export
 */
export async function exportRoadmap(req: AuthRequest, res: Response) {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context missing' });

        const roadmap = await getOrCreateRoadmapForTenant(tenantId);
        const sections = await db
            .select()
            .from(roadmapSections)
            .where(eq(roadmapSections.roadmapId, roadmap.id))
            .orderBy(asc(roadmapSections.sectionNumber));

        // Simple JSON export for now
        return res.json({ roadmap, sections });
    } catch (error: any) {
        console.error('exportRoadmap error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
