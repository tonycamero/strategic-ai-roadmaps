import { Response } from 'express';
import { db } from '../db/index.ts';
import { tenantDocuments, tenants, users } from '../db/schema.ts';
import { eq, and, ne, desc } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const getUploadsDir = () => {
  if (process.env.NETLIFY === "true") {
    return path.join('/tmp', 'uploads');
  }
  return path.join(__dirname, '../../uploads');
};

const UPLOADS_DIR = getUploadsDir();

/**
 * Lazy directory creation to avoid module-load crashes in serverless
 */
let _dirCreated = false;
async function ensureUploadsDir() {
  if (_dirCreated) return;
  try {
    const fsCallback = require('fs');
    if (!fsCallback.existsSync(UPLOADS_DIR)) {
      fsCallback.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    _dirCreated = true;
  } catch (err) {
    console.error(`[DocsController] Failed to ensure directory ${UPLOADS_DIR}:`, err);
  }
}

// ============================================================================
// GET /api/documents - List tenant documents
// ============================================================================

export async function listDocuments(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get documents for this tenant (exclude roadmap sections)
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }

    const isSuperAdmin = req.user.role === 'superadmin';
    const isPublicFilter = isSuperAdmin ? undefined : eq(tenantDocuments.isPublic, true);

    const documents = await db
      .select()
      .from(tenantDocuments)
      .where(
        and(
          eq(tenantDocuments.tenantId, tenantId),
          ne(tenantDocuments.category, 'roadmap'),
          isPublicFilter
        )
      )
      .orderBy(desc(tenantDocuments.createdAt));

    console.log(`[Docs Controller] listDocuments: tenantId=${tenantId}, role=${req.user.role}, found=${documents.length}, isSuperAdmin=${isSuperAdmin}`);

    return res.json({ documents });
  } catch (error) {
    console.error('List documents error:', error);
    return res.status(500).json({ error: 'Failed to list documents' });
  }
}

// ============================================================================
// GET /api/documents/:id - Get document metadata and content
// ============================================================================

export async function getDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Get document - superadmins can access any document, others need tenant check
    const tenantId = (req as any).tenantId;
    const [document] = await db
      .select()
      .from(tenantDocuments)
      .where(
        (req.user.role === 'superadmin' && req.user.isInternal)
          ? eq(tenantDocuments.id, id)
          : and(
            eq(tenantDocuments.id, id),
            eq(tenantDocuments.tenantId, tenantId || '')
          )
      )
      .limit(1);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // For text-based documents, prefer DB content
    let content = null as string | null;
    if (document.mimeType === 'text/markdown' || document.category === 'case_study' || document.category === 'sop_output' || document.category === 'roadmap') {
      if (document.content) {
        content = document.content as unknown as string;
      } else {
        const candidates: string[] = [];
        const filename = document.filename || path.basename(document.filePath || '');
        if (document.filePath) {
          candidates.push(path.isAbsolute(document.filePath) ? document.filePath : path.join(UPLOADS_DIR, document.filePath));
        }
        const subdir = document.sopNumber ? 'sop01' : (document.category === 'roadmap' ? 'roadmaps' : 'documents');
        if (document.tenantId) {
          candidates.push(path.join(os.tmpdir(), 'strategic-ai-roadmaps', subdir, document.tenantId, filename));
          candidates.push(path.join(process.cwd(), 'storage', subdir, document.tenantId, filename));
        }
        for (const fp of candidates) {
          try {
            const text = await fs.readFile(fp, 'utf-8');
            content = text;
            break;
          } catch { }
        }
      }
    }

    return res.json({
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        category: document.category,

        mimeType: document.mimeType,
        fileSize: document.fileSize,
        originalFilename: document.originalFilename,
        isPublic: document.isPublic,
        createdAt: document.createdAt,
        content,
      },
    });
  } catch (error) {
    console.error('Get document error:', error);
    return res.status(500).json({ error: 'Failed to get document' });
  }
}

// ============================================================================
// GET /api/documents/:id/download - Download a document
// ============================================================================

export async function downloadDocument(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Get document - superadmins can access any document, others need tenant check
    const tenantId = (req as any).tenantId;
    const [document] = await db
      .select()
      .from(tenantDocuments)
      .where(
        (req.user.role === 'superadmin' && req.user.isInternal)
          ? eq(tenantDocuments.id, id)
          : and(
            eq(tenantDocuments.id, id),
            eq(tenantDocuments.tenantId, tenantId || '')
          )
      )
      .limit(1);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // If DB content exists, return it as a file response without touching disk
    if (document.content && (document.mimeType?.startsWith('text/') || document.mimeType === 'text/markdown')) {
      res.setHeader('Content-Type', document.mimeType || 'text/plain');
      res.setHeader('Content-Disposition', `inline; filename="${document.originalFilename}"`);
      return res.send(document.content);
    }

    // If stored in S3 and no DB content, redirect to a short-lived signed URL
    if (document.storageProvider === 's3' && document.filePath) {
      try {
        const { s3GetSignedUrl } = await import('../services/storage');
        const url = await s3GetSignedUrl({ key: document.filePath });
        return res.redirect(302, url);
      } catch (e) {
        // fall through to disk-based
      }
    }

    // Otherwise, try file-based fallbacks
    const candidates: string[] = [];
    const filename = document.filename || path.basename(document.filePath || '');
    if (document.filePath) {
      candidates.push(path.isAbsolute(document.filePath) ? document.filePath : path.join(UPLOADS_DIR, document.filePath));
    }
    const subdir = document.sopNumber ? 'sop01' : (document.category === 'roadmap' ? 'roadmaps' : 'documents');
    if (document.tenantId) {
      candidates.push(path.join(os.tmpdir(), 'strategic-ai-roadmaps', subdir, document.tenantId, filename));
      candidates.push(path.join(process.cwd(), 'storage', subdir, document.tenantId, filename));
    }
    let resolvedPath: string | null = null;
    for (const fp of candidates) {
      try {
        await fs.access(fp);
        resolvedPath = fp;
        break;
      } catch { }
    }
    if (!resolvedPath) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${document.originalFilename}"`);
    res.sendFile(resolvedPath);
  } catch (error) {
    console.error('Download document error:', error);
    return res.status(500).json({ error: 'Failed to download document' });
  }
}

// ============================================================================
// POST /api/documents/upload - Upload a document (multipart/form-data)
// ============================================================================

export async function uploadDocument(req: AuthRequest, res: Response) {
  try {
    await ensureUploadsDir();
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if file was uploaded (handled by multer middleware)
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { category, title, description, sopNumber, outputNumber, isPublic } = req.body;

    if (!category || !title) {
      return res.status(400).json({ error: 'Category and title are required' });
    }

    // Get tenant ID from middleware
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = filename;
    const fullPath = path.join(UPLOADS_DIR, filePath);

    // Move file from temp location to uploads directory
    await fs.rename(req.file.path, fullPath);

    // Insert document record
    const [document] = await db
      .insert(tenantDocuments)
      .values({
        tenantId: tenant.id,
        ownerUserId: req.user.userId,
        filename,
        originalFilename: req.file.originalname,
        filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        category,
        title,
        description: description || null,
        uploadedBy: req.user.userId,
        isPublic: isPublic === 'true' || isPublic === true,
      })
      .returning();

    return res.json({ document });
  } catch (error) {
    console.error('Upload document error:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
}

// ============================================================================
// DELETE /api/documents/:id - Delete a document
// ============================================================================

export async function deleteDocument(req: AuthRequest, res: Response) {
  try {
    await ensureUploadsDir();
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Get document with tenant check
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant not resolved' });
    }
    const [document] = await db
      .select()
      .from(tenantDocuments)
      .where(
        and(
          eq(tenantDocuments.id, id),
          eq(tenantDocuments.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from disk
    const filePath = path.join(UPLOADS_DIR, document.filePath);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('Failed to delete file from disk:', err);
    }

    // Delete database record
    await db
      .delete(tenantDocuments)
      .where(eq(tenantDocuments.id, id));

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
}
