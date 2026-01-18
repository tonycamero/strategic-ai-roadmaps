<<<<<<< HEAD
// FILE: backend/src/services/executiveBriefDelivery.ts
// DROP-IN REPLACEMENT (copy/paste entire file)
// NOTE: PDF + Email delivery pipeline is preserved but DISABLED because:
// - ./pdfGenerator does not exist in repo history
// - email.service does not export sendEmail (contract drift)
// This module now compiles and keeps artifact persistence logic isolated for future reactivation.

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { executiveBriefArtifacts, users } from '../db/schema';

/**
 * Executive Brief Delivery Service (Hardened Recovery)
 *
 * Current behavior (ACTIVE):
 * - Write-once guard: detect existing artifact
 * - Artifact persistence: store PDF buffer + immutable artifact record
 *
 * Disabled behavior (PRESERVED BUT INACTIVE):
 * - PDF rendering (pdfGenerator absent)
 * - Email delivery (email.service sendEmail export absent)
 *
 * Reactivation plan:
 * - Add a real PDF renderer module and wire it in
 * - Align email delivery to the actual email.service contract (or reintroduce sendEmail)
 * - Flip ENABLE_EXEC_BRIEF_PDF_DELIVERY=true and implement render+send
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

// Feature gate: keep delivery disabled until infra is restored.
const ENABLE_EXEC_BRIEF_PDF_DELIVERY = process.env.ENABLE_EXEC_BRIEF_PDF_DELIVERY === 'true';

// ============================================================================
// HELPERS
// ============================================================================

async function ensureStorageDir(tenantId: string, briefId: string): Promise<string> {
  const dir = path.join(PDF_STORAGE_DIR, tenantId, briefId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function formatFileName(firmName: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const safeFirmName = (firmName || 'Firm').replace(/[^a-zA-Z0-9]/g, '_');
  return `${safeFirmName}_Executive_Brief_${date}.pdf`;
}

// Persist artifact record + write PDF to disk (requires a pdfBuffer provided by caller)
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

  await fs.writeFile(filePath, pdfBuffer);
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

/* ============================================================================
   PDF + EMAIL DELIVERY (DISABLED / PRESERVED)

   The original pipeline depended on:
   - renderPrivateLeadershipBriefToPDF(brief, tenantName)  (missing module)
   - sendEmail(...) from email.service                      (export drift)

   We preserve the intent for later reactivation, but it is not compiled into
   the active execution path today (guarded by ENABLE_EXEC_BRIEF_PDF_DELIVERY).
   ============================================================================ */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function emailPrivateBriefToLead(_args: {
  tenant: any;
  artifact: any;
  pdfBuffer: Buffer;
}): Promise<void> {
  throw new Error(
    'Email delivery disabled: restore email transport contract before enabling.'
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function renderPrivateLeadershipBriefToPDF(_brief: any, _tenantName: string): Promise<Buffer> {
  throw new Error('PDF rendering disabled: no renderer available in repo.');
}

/* ============================================================================
   END DISABLED / PRESERVED
   ============================================================================ */

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * generateAndDeliverPrivateBriefPDF
 *
 * ACTIVE behavior today:
 * - Write-once guard: if immutable artifact exists, no-op (or validate file exists)
 * - If delivery is disabled, this function returns after guard checks
 *
 * If ENABLE_EXEC_BRIEF_PDF_DELIVERY=true:
 * - Attempts to render PDF, persist artifact, and email tenant lead
 * - This requires restoring renderer + email contracts first
 */
export async function generateAndDeliverPrivateBriefPDF(brief: any, tenant: any): Promise<void> {
  console.log(`[PDF] Starting private brief delivery for brief=${brief?.id} tenant=${tenant?.id}`);

  // STEP 1: Write-once guard for existing immutable artifact
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

  if (existingArtifact?.isImmutable) {
    const deliveryStatus = existingArtifact.metadata?.deliveryStatus;
    const emailedTo = existingArtifact.metadata?.emailedTo;

    console.log(
      `[PDF] Artifact exists (immutable=true). status=${deliveryStatus || 'unknown'} emailedTo=${
        emailedTo || 'n/a'
      }`
    );

    // If file missing, surface a typed error (helps forensics)
    try {
      await fs.access(existingArtifact.filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ExecBriefArtifactNotFoundError(existingArtifact.id, existingArtifact.filePath);
      }
      throw error;
    }

    // With delivery disabled, we stop here (no resend attempts)
    if (!ENABLE_EXEC_BRIEF_PDF_DELIVERY) return;

    // If delivery re-enabled later, resend path would live here.
    // For now, fail closed to prevent “half-enabled” behavior.
    throw new Error(
      'Delivery is enabled but resend logic is not implemented. Restore full pipeline before enabling.'
    );
  }

  // If delivery is disabled, we stop after guard check.
  if (!ENABLE_EXEC_BRIEF_PDF_DELIVERY) {
    console.log(
      `[PDF] Delivery disabled (ENABLE_EXEC_BRIEF_PDF_DELIVERY!=true). No artifact created.`
    );
    return;
  }

  // NOTE: Below code path is intentionally fail-closed until renderer + email are restored.
  // If you flip ENABLE_EXEC_BRIEF_PDF_DELIVERY=true without restoring those modules, this will throw.

  // STEP 2: Render PDF
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderPrivateLeadershipBriefToPDF(brief, tenant.name);
  } catch (error) {
    throw new ExecBriefPDFRenderFailedError(brief.id, error as Error);
  }

  // STEP 3: Persist artifact
  const fileName = formatFileName(tenant.name);
  const artifact = await persistPDFArtifact({
    executiveBriefId: brief.id,
    tenantId: tenant.id,
    pdfBuffer,
    fileName,
  });

  // STEP 4: Email to Tenant Lead
  try {
    await emailPrivateBriefToLead({ tenant, artifact, pdfBuffer });

    // Update metadata to reflect success
    await db
      .update(executiveBriefArtifacts)
      .set({
        metadata: {
          emailedTo: (await findTenantLeadEmail(tenant.id)) || 'unknown',
          emailedAt: new Date().toISOString(),
          deliveryStatus: 'sent',
        },
      })
      .where(eq(executiveBriefArtifacts.id, artifact.id));

    console.log(`[PDF] Delivery complete for brief ${brief.id}`);
  } catch (error) {
    // Email failed, artifact persisted
    await db
      .update(executiveBriefArtifacts)
      .set({
        metadata: {
          deliveryStatus: 'failed',
          retryCount: ((artifact?.metadata as any)?.retryCount || 0) + 1,
        },
      })
      .where(eq(executiveBriefArtifacts.id, artifact.id));

    console.error('[PDF] Email send failed, artifact persisted for retry:', error);
    throw new ExecBriefEmailSendFailedError(tenant?.ownerEmail || 'unknown', error as Error);
  }
}

// Helper used only in the “enabled” path to avoid importing unused logic elsewhere
async function findTenantLeadEmail(tenantId: string): Promise<string | null> {
  const [tenantLead] = await db
    .select()
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .limit(1);

  return tenantLead?.email || null;
}
=======
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { executiveBriefArtifacts, tenants, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { renderPrivateLeadershipBriefToPDF } from './pdfGenerator';
import { sendEmail } from './email.service';

/**
 * Executive Brief PDF Delivery Service
 * 
 * PIPELINE:
 * 1. Check for existing artifact (write-once guard)
 * 2. Generate PDF from approved brief (if needed)
 * 3. Persist PDF as immutable artifact
 * 4. Email PDF to Tenant Lead
 * 
 * IMMUTABILITY:
 * - One artifact per (brief, type) enforced by DB unique constraint
 * - No regeneration if artifact exists and isImmutable=true
 * - Resend logic for failed/pending deliveries
 * 
 * SECURITY:
 * - No public URLs
 * - Attachment only
 * - Single recipient (Tenant Lead)
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
    constructor(email: string, cause: Error) {
        super(`Failed to send email to ${email}: ${cause.message}`);
        this.name = 'EXEC_BRIEF_EMAIL_SEND_FAILED';
        this.cause = cause;
    }
}

export class ExecBriefPDFRenderFailedError extends Error {
    constructor(briefId: string, cause: Error) {
        super(`Failed to render PDF for brief ${briefId}: ${cause.message}`);
        this.name = 'EXEC_BRIEF_PDF_RENDER_FAILED';
        this.cause = cause;
    }
}


// Storage configuration
const PDF_STORAGE_DIR = process.env.PDF_STORAGE_PATH || path.join(process.cwd(), 'uploads', 'executive-briefs');

// Ensure storage directory exists
async function ensureStorageDir(tenantId: string, briefId: string): Promise<string> {
    const dir = path.join(PDF_STORAGE_DIR, tenantId, briefId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
}

// Calculate SHA-256 checksum
function calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Format filename
function formatFileName(firmName: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const safeFirmName = firmName.replace(/[^a-zA-Z0-9]/g, '_');
    return `${safeFirmName}_Executive_Brief_${date}.pdf`;
}

// Persist PDF artifact
async function persistPDFArtifact({
    executiveBriefId,
    tenantId,
    pdfBuffer,
    fileName
}: {
    executiveBriefId: string;
    tenantId: string;
    pdfBuffer: Buffer;
    fileName: string;
}): Promise<any> {
    // Ensure storage directory
    const storageDir = await ensureStorageDir(tenantId, executiveBriefId);
    const filePath = path.join(storageDir, fileName);

    // Write PDF to disk
    await fs.writeFile(filePath, pdfBuffer);

    // Calculate checksum
    const checksum = calculateChecksum(pdfBuffer);

    // Insert artifact record
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
                deliveryStatus: 'pending'
            }
        })
        .returning();

    console.log(`[PDF] Persisted artifact ${artifact.id} for brief ${executiveBriefId}`);
    return artifact;
}

// Email PDF to Tenant Lead
async function emailPrivateBriefToLead({
    tenant,
    artifact,
    pdfBuffer
}: {
    tenant: any;
    artifact: any;
    pdfBuffer: Buffer;
}): Promise<void> {
    // Find Tenant Lead (owner role)
    const [tenantLead] = await db
        .select()
        .from(users)
        .where(eq(users.tenantId, tenant.id))
        .limit(1);

    if (!tenantLead) {
        throw new Error(`No tenant lead found for tenant ${tenant.id}`);
    }

    const firstName = tenantLead.name?.split(' ')[0] || 'there';

    // Email subject
    const subject = `Executive Leadership Brief — Private Review`;

    // Email body (exact copy from user specs)
    const body = `Hi ${firstName},

Attached is your **Executive Leadership Brief** generated as part of the recent strategic intake.

This document is intended for **your private review only**. It is not an evaluation, recommendation set, or execution plan. It reflects synthesized leadership-level signals captured during intake to support personal sense-making.

No action is required. The brief is not shared with your team and does not affect the active roadmap process.

If you have questions or would like to discuss any themes surfaced, we can do so separately.

Best,
Tony Camero
Builder / Disruptor
Scend Technologies`;

    // Send email with PDF attachment
    await sendEmail({
        to: tenantLead.email,
        subject,
        text: body,
        attachments: [
            {
                filename: artifact.fileName,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    });

    // Update artifact metadata
    await db
        .update(executiveBriefArtifacts)
        .set({
            metadata: {
                emailedTo: tenantLead.email,
                emailedAt: new Date().toISOString(),
                deliveryStatus: 'sent'
            }
        })
        .where(eq(executiveBriefArtifacts.id, artifact.id));

    console.log(`[Email] Sent private brief to ${tenantLead.email}`);
}

// Main delivery function with write-once guard
export async function generateAndDeliverPrivateBriefPDF(
    brief: any,
    tenant: any
): Promise<void> {
    try {
        console.log(`[PDF] Starting delivery for brief ${brief.id}, tenant ${tenant.id}`);

        // ============================================================================
        // STEP 1: Check for existing artifact (WRITE-ONCE GUARD)
        // ============================================================================
        const [existingArtifact] = await db
            .select()
            .from(executiveBriefArtifacts)
            .where(eq(executiveBriefArtifacts.executiveBriefId, brief.id))
            .limit(1);

        if (existingArtifact && existingArtifact.isImmutable) {
            console.log(`[PDF] Artifact exists (immutable=true) for brief ${brief.id}`);

            // Check delivery status
            const deliveryStatus = existingArtifact.metadata?.deliveryStatus;
            const emailedTo = existingArtifact.metadata?.emailedTo;

            if (deliveryStatus === 'sent' && emailedTo) {
                // NO-OP: Already delivered successfully
                console.log(`[PDF] Artifact already sent to ${emailedTo}, no-op`);
                return;
            }

            // RESEND: Delivery failed or pending
            console.log(`[PDF] Attempting resend (status=${deliveryStatus})`);

            try {
                // Read existing PDF from disk
                const pdfBuffer = await fs.readFile(existingArtifact.filePath);
                console.log(`[PDF] Loaded existing PDF from ${existingArtifact.filePath}`);

                // Attempt email send
                await emailPrivateBriefToLead({
                    tenant,
                    artifact: existingArtifact,
                    pdfBuffer
                });

                console.log(`[PDF] Resend complete for brief ${brief.id}`);
                return;
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                    throw new ExecBriefArtifactNotFoundError(existingArtifact.id, existingArtifact.filePath);
                }
                throw error;
            }
        }

        // ============================================================================
        // STEP 2: Generate PDF (first time only)
        // ============================================================================
        console.log(`[PDF] No existing artifact, generating new PDF`);

        let pdfBuffer: Buffer;
        try {
            pdfBuffer = await renderPrivateLeadershipBriefToPDF(brief, tenant.name);
            console.log(`[PDF] Generated PDF (${pdfBuffer.length} bytes)`);
        } catch (error) {
            throw new ExecBriefPDFRenderFailedError(brief.id, error as Error);
        }

        // ============================================================================
        // STEP 3: Persist artifact (with path conflict check)
        // ============================================================================
        const fileName = formatFileName(tenant.name);
        const storageDir = await ensureStorageDir(tenant.id, brief.id);
        const filePath = path.join(storageDir, fileName);

        // Check for path conflict (should never happen, but fail-safe)
        try {
            await fs.access(filePath);
            throw new ExecBriefArtifactPathConflictError(filePath);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error; // Path exists, conflict!
            }
            // Path doesn't exist, safe to proceed
        }

        // Write PDF to disk
        await fs.writeFile(filePath, pdfBuffer);

        // Calculate checksum
        const checksum = calculateChecksum(pdfBuffer);

        // Insert artifact record
        const [artifact] = await db
            .insert(executiveBriefArtifacts)
            .values({
                executiveBriefId: brief.id,
                tenantId: tenant.id,
                artifactType: 'PRIVATE_LEADERSHIP_PDF',
                fileName,
                filePath,
                fileSize: pdfBuffer.length,
                checksum,
                isImmutable: true,
                metadata: {
                    deliveryStatus: 'pending'
                }
            })
            .returning();

        console.log(`[PDF] Persisted artifact ${artifact.id} for brief ${brief.id}`);

        // ============================================================================
        // STEP 4: Email to Tenant Lead
        // ============================================================================
        try {
            await emailPrivateBriefToLead({
                tenant,
                artifact,
                pdfBuffer
            });
            console.log(`[PDF] Delivery complete for brief ${brief.id}`);
        } catch (error) {
            // Email failed, but artifact is persisted
            // Update metadata to reflect failure
            await db
                .update(executiveBriefArtifacts)
                .set({
                    metadata: {
                        deliveryStatus: 'failed',
                        retryCount: (existingArtifact?.metadata?.retryCount || 0) + 1
                    }
                })
                .where(eq(executiveBriefArtifacts.id, artifact.id));

            console.error('[PDF] Email send failed, artifact persisted for retry:', error);
            throw new ExecBriefEmailSendFailedError(
                tenant.ownerEmail || 'unknown',
                error as Error
            );
        }
    } catch (error) {
        console.error('[PDF] Delivery failed:', error);
        // Re-throw typed errors, wrap unknown errors
        throw error;
    }
}

>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
