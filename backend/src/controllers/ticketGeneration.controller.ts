import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { tenantDocuments } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateTicketsFromFindings } from '../services/ticketGeneration.service';
import { CanonicalFindingsObject } from '@roadmap/shared/src/canon';
// import { canGenerateSopTickets } from '../services/gate.service'; // Optional: keep gating if relevant

export async function handleGenerateTicketsFromDiscovery(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const { tenantId, diagnosticId } = req.params;

        // 1. Fetch Latest Canonical Findings Artifact
        const [doc] = await db.select()
            .from(tenantDocuments)
            .where(and(
                eq(tenantDocuments.tenantId, tenantId),
                eq(tenantDocuments.category, 'findings_canonical')
            ))
            .orderBy(desc(tenantDocuments.createdAt)) // Latest = Current Truth
            .limit(1);

        if (!doc || !doc.content) {
            return res.status(404).json({
                error: 'FINDINGS_MISSING',
                message: 'No Canonical Findings found. Discovery Ingestion must be completed first (D1-D4).'
            });
        }

        let findingsObject: CanonicalFindingsObject;
        try {
            findingsObject = JSON.parse(doc.content);
        } catch (e) {
            return res.status(500).json({ error: 'INVALID_ARTIFACT', message: 'Canonical Findings artifact is corrupt.' });
        }

        // 2. Generate Tickets (Deterministic)
        const count = await generateTicketsFromFindings(tenantId, findingsObject);

        return res.status(200).json({
            success: true,
            message: `Generated ${count} Canonical Tickets from Findings`,
            ticketCount: count
        });

    } catch (error: any) {
        console.error('[TicketGen] Controller Error:', error);
        if (error.name === 'TicketGenerationError') {
            return res.status(409).json({
                error: error.code || 'TICKET_GENERATION_ERROR',
                message: error.message
            });
        }
        next(error);
    }
}
