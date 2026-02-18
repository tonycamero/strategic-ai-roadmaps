import { Router } from 'express';
import multer from 'multer';
import { db } from '../db/index';
import { evidenceArtifacts, evidenceBindings } from '../db/schema';
import { putEvidenceArtifact } from '../services/storage/evidenceStorage';
import { eq, and } from 'drizzle-orm';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware for Internal Token
const internalAuth = (req: any, res: any, next: any) => {
    const token = req.headers['x-internal-token'];
    // Simple check - ensure env var is set in prod
    if (!token || !process.env.INTERNAL_EVIDENCE_TOKEN || token !== process.env.INTERNAL_EVIDENCE_TOKEN) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

// Upload Artifact
router.post('/artifacts', internalAuth, upload.single('file'), async (req: any, res: any) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const result = await putEvidenceArtifact(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        const [artifact] = await db.insert(evidenceArtifacts).values({
            kind: 'image', // default
            storageProvider: result.provider,
            storageKey: result.storageKey,
            publicUrl: result.publicUrl,
            mimeType: req.file.mimetype,
            bytes: req.file.size,
            caption: req.body.caption, // optional
            source: req.body.source || 'manual_upload',
            createdBy: 'system' // Placeholder until we have admin users context
        }).returning();

        res.json(artifact);
    } catch (err: any) {
        console.error("Upload error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Bind Artifact to Session/Role/Slot (Upsert)
router.put('/bind', internalAuth, async (req: any, res: any) => {
    try {
        const { teamSessionId, role, slotKey, artifactId, strength } = req.body;

        if (!teamSessionId || !role || !slotKey || !artifactId) {
            return res.status(400).json({ error: "Missing required fields: teamSessionId, role, slotKey, artifactId" });
        }

        // Remove any existing binding for this exact slot to ensure singleness (Upsert simulation)
        await db.delete(evidenceBindings)
            .where(and(
                eq(evidenceBindings.teamSessionId, teamSessionId),
                eq(evidenceBindings.role, role),
                eq(evidenceBindings.slotKey, slotKey)
            ));

        const [binding] = await db.insert(evidenceBindings).values({
            teamSessionId,
            role,
            slotKey,
            artifactId,
            strength: strength ? parseInt(strength) : 1
        }).returning();

        res.json(binding);
    } catch (err: any) {
        console.error("Binding error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
