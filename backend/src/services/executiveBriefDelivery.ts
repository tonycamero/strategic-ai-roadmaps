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
