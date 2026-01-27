// FILE: backend/src/services/executiveBriefDelivery.ts
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { executiveBriefArtifacts, users } from '../db/schema';
import { renderPrivateLeadershipBriefToPDF } from './pdf/executiveBriefRenderer';
import { sendEmail } from './email.service';

/**
 * Executive Brief Delivery Service
 * 
 * Manages the generation, persistence, and email delivery of the Executive Brief PDF.
 * This is the ONLY way a tenant receives the brief (no UI access).
 */

// ============================================================================
// TYPED ERRORS
// ============================================================================

export class ExecBriefArtifactNotFoundError extends Error {
  constructor(artifactId: string, filePath: string) {
    super(`Artifact ${artifactId} file not found at expected path: ${filePath}`);
    this.name = 'EXEC_BRIEF_ARTIFACT_NOT_FOUND';
  }
}

export class ExecBriefArtifactPathConflictError extends Error {
  constructor(filePath: string) {
    super(`File already exists at path: ${filePath}`);
    this.name = 'EXEC_BRIEF_ARTIFACT_PATH_CONFLICT';
  }
}

export class ExecBriefEmailSendFailedError extends Error {
  override cause?: Error;
  constructor(email: string, cause: Error) {
    super(`Failed to send email to ${email}: ${cause.message}`);
    this.name = 'EXEC_BRIEF_EMAIL_SEND_FAILED';
    this.cause = cause;
  }
}

export class ExecBriefPDFRenderFailedError extends Error {
  override cause?: Error;
  constructor(briefId: string, cause: Error) {
    super(`Failed to render PDF for brief ${briefId}: ${cause.message}`);
    this.name = 'EXEC_BRIEF_PDF_RENDER_FAILED';
    this.cause = cause;
  }
}

// ============================================================================
// CONFIG
// ============================================================================

const PDF_STORAGE_DIR =
  process.env.PDF_STORAGE_PATH || path.join(process.cwd(), 'uploads', 'executive-briefs');

// Default to true now that implementation is complete
const ENABLE_EXEC_BRIEF_PDF_DELIVERY = true;

// ============================================================================
// HELPERS
// ============================================================================

async function ensureStorageDir(tenantId: string, briefId: string): Promise<string> {
  const dir = path.join(PDF_STORAGE_DIR, tenantId, briefId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer as any).digest('hex');
}

function formatFileName(firmName: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const safeFirmName = (firmName || 'Firm').replace(/[^a-zA-Z0-9]/g, '_');
  return `${safeFirmName}_Executive_Brief_${date}.pdf`;
}

// Persist artifact record + write PDF to disk
async function persistPDFArtifact({
  executiveBriefId,
  tenantId,
  pdfBuffer,
  fileName,
}: {
  executiveBriefId: string;
  tenantId: string;
  pdfBuffer: Buffer;
  fileName: string;
}): Promise<any> {
  const storageDir = await ensureStorageDir(tenantId, executiveBriefId);
  const filePath = path.join(storageDir, fileName);

  // Fail closed on path conflict
  try {
    await fs.access(filePath);
    throw new ExecBriefArtifactPathConflictError(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  await fs.writeFile(filePath, pdfBuffer as any);
  const checksum = calculateChecksum(pdfBuffer);

  const [artifact] = await db
    .insert(executiveBriefArtifacts)
    .values({
      executiveBriefId,
      tenantId,
      artifactType: 'PRIVATE_LEADERSHIP_PDF',
      fileName,
      filePath,
      fileSize: pdfBuffer.length,
      checksum,
      isImmutable: true,
      metadata: {
        deliveryStatus: 'pending',
      },
    })
    .returning();

  console.log(`[PDF] Persisted artifact ${artifact.id} for brief ${executiveBriefId}`);
  return artifact;
}

async function emailPrivateBriefToLead(args: {
  tenant: any;
  artifact: any;
  pdfBuffer: Buffer;
}): Promise<void> {
  const { tenant, artifact, pdfBuffer } = args;
  const leadEmail = await findTenantLeadEmail(tenant.id);

  if (!leadEmail) {
    throw new Error(`No owner/lead email found for tenant ${tenant.id}`);
  }

  // Email Body per META-TICKET requirements
  // "Describe document as interpretive leadership lens. NOT claim verbatim inputs."
  const emailBody = `
        <div style="font-family: sans-serif; max-width: 600px;">
            <h2>Executive Brief: Operational Reality & Constraints</h2>
            <p>Attached is your confidential Executive Brief.</p>
            
            <p>This document synthesizes the operational perspectives collected during the intake phase. 
            It represents an interpretive lens on your current Constraint Landscape and potential Blind Spot Risks.</p>
            
            <p><strong>Note:</strong> This is a point-in-time leadership artifact used to anchor the upcoming 
            Strategic Roadmap generation. It serves as our shared reference for the diagnostic phase.</p>

            <p>Please review before our next strategy session.</p>
        </div>
    `;

  await sendEmail({
    to: leadEmail,
    subject: `Executive Brief – Leadership Perspective for ${tenant.name}`,
    html: emailBody,
    attachments: [{
      filename: artifact.fileName,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }]
  });
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * generateAndDeliverPrivateBriefPDF
 *
 * Orchestrates rendering, persistence, and delivery.
 * Idempotent: checks for existing immutable artifact first.
 */
/**
 * generateAndDeliverPrivateBriefPDF
 *
 * Orchestrates rendering, persistence, and delivery.
 * Idempotent: checks for existing immutable artifact first.
 * If shouldEmail is true (default), it will send/resend the email.
 */
export async function generateAndDeliverPrivateBriefPDF(brief: any, tenant: any, shouldEmail: boolean = true): Promise<{ deliveredTo?: string } | void> {
  console.log(`[PDF] Starting private brief delivery for brief=${brief?.id} tenant=${tenant?.id} email=${shouldEmail}`);

  // STEP 1: Check for existing immutable artifact
  const [existingArtifact] = await db
    .select()
    .from(executiveBriefArtifacts)
    .where(
      and(
        eq(executiveBriefArtifacts.executiveBriefId, brief.id),
        eq(executiveBriefArtifacts.tenantId, tenant.id)
      )
    )
    .limit(1);

  let artifact = existingArtifact;
  let pdfBuffer: Buffer;

  if (existingArtifact?.isImmutable) {
    console.log(`[PDF] Artifact exists (immutable=true). Checking file integrity...`);
    try {
      // Load the file into buffer for potential emailing
      pdfBuffer = await fs.readFile(existingArtifact.filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ExecBriefArtifactNotFoundError(existingArtifact.id, existingArtifact.filePath);
      }
      throw error;
    }
  } else {
    // STEP 2: Render PDF
    try {
      console.log('[PDF] Rendering PDF...');
      pdfBuffer = await renderPrivateLeadershipBriefToPDF(brief, tenant.name);
    } catch (error) {
      throw new ExecBriefPDFRenderFailedError(brief.id, error as Error);
    }

    // STEP 3: Persist artifact
    const fileName = formatFileName(tenant.name);
    artifact = await persistPDFArtifact({
      executiveBriefId: brief.id,
      tenantId: tenant.id,
      pdfBuffer,
      fileName,
    });
  }

  // STEP 4: Email to Tenant Lead (Optional)
  if (shouldEmail) {
    let deliveredTo = 'unknown';
    try {
      console.log('[PDF] Sending email...');
      const leadEmail = await findTenantLeadEmail(tenant.id);
      if (leadEmail) deliveredTo = leadEmail;

      await emailPrivateBriefToLead({ tenant, artifact, pdfBuffer });

      // Update metadata to reflect success
      const currentMetadata = (artifact.metadata as any) || {};
      await db
        .update(executiveBriefArtifacts)
        .set({
          metadata: {
            ...currentMetadata,
            emailedTo: deliveredTo,
            emailedAt: new Date().toISOString(),
            deliveryStatus: 'sent',
          },
        })
        .where(eq(executiveBriefArtifacts.id, artifact.id));

      console.log(`[PDF] Delivery complete for brief ${brief.id}`);
      return { deliveredTo };
    } catch (error) {
      // Email failed, artifact persisted
      const currentMetadata = (artifact.metadata as any) || {};
      await db
        .update(executiveBriefArtifacts)
        .set({
          metadata: {
            ...currentMetadata,
            deliveryStatus: 'failed',
            retryCount: (currentMetadata.retryCount || 0) + 1,
          },
        })
        .where(eq(executiveBriefArtifacts.id, artifact.id));

      console.error('[PDF] Email send failed, artifact persisted for retry:', error);
      throw new ExecBriefEmailSendFailedError(tenant?.ownerEmail || 'unknown', error as Error);
    }
  } else {
    console.log(`[PDF] Generated artifact ${artifact.id} (email skipped).`);
  }
}

// Helper
async function findTenantLeadEmail(tenantId: string): Promise<string | null> {
  const [tenantLead] = await db
    .select()
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .limit(1);

  return tenantLead?.email || null;
}
