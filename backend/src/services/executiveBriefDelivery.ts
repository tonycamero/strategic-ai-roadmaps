// FILE: backend/src/services/executiveBriefDelivery.ts
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { executiveBriefArtifacts, users, intakeVectors, executiveBriefs } from '../db/schema.ts';
import { renderPrivateLeadershipBriefToPDF } from './pdf/executiveBriefRenderer.ts';
import { sendEmail } from './email.service.ts';

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

const getPdfStorageDir = () => {
  if (process.env.NETLIFY === "true") {
    return path.join('/tmp', 'uploads', 'executive-briefs');
  }
  return process.env.PDF_STORAGE_PATH || path.join(process.cwd(), 'uploads', 'executive-briefs');
};

const PDF_STORAGE_DIR = getPdfStorageDir();

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

function formatFileName(firmName: string, timestamp?: Date): string {
  const date = (timestamp || new Date()).toISOString().split('T')[0]; // YYYY-MM-DD
  const safeFirmName = (firmName || 'Firm').replace(/[^a-zA-Z0-9]/g, '_');
  // EXEC-BRIEF-PDF-STALE-PERSIST-024E: Add random suffix to prevent path conflicts
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${safeFirmName}_Executive_Brief_${date}_${randomSuffix}.pdf`;
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
  const targetMode = 'EXECUTIVE_SYNTHESIS';
  const persistedMode = brief?.briefMode;

  if (!persistedMode) {
    throw new Error('[ExecutiveBriefDelivery] briefMode missing or invalid');
  }

  const isEnforced = persistedMode !== targetMode;
  console.log(`[ExecutiveBriefDelivery] tenantId=${tenant.id} targetMode=${targetMode} briefMode=${persistedMode} enforced=${isEnforced}`);

  // STEP 1: Check for existing immutable artifact (EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022)
  const { selectLatestPdfArtifact } = await import('./pdf/executiveBriefArtifactSelector.ts');
  const existingArtifact = await selectLatestPdfArtifact({
    tenantId: tenant.id,
    briefId: brief.id
  }, 'generate');

  let artifact = existingArtifact;
  let pdfBuffer: Buffer;
  let action: 'stream_existing' | 'regen_stream' | 'regen_attach' = 'stream_existing';

  // STALE ARTIFACT INVALIDATION (EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022)
  // If brief was regenerated AFTER artifact was created, artifact is stale
  const briefStamp = brief.updatedAt || brief.generatedAt || new Date(0);
  const artifactStamp = existingArtifact?.createdAt || new Date(0);

  const { isMirrorNarrativeEnabled } = await import('./executiveBriefSynthesis.service.ts');
  const needsMirror = isMirrorNarrativeEnabled();
  const hasMirror = brief.synthesis?.content?.isMirrorNarrative === true;
  const isMissingMirror = needsMirror && !hasMirror;

  // Check for physical file existence (ENOENT triggers regeneration)
  let isMissingFile = false;
  if (existingArtifact) {
    try {
      await fs.access(existingArtifact.filePath);
    } catch (e) {
      if ((e as any).code === 'ENOENT') {
        isMissingFile = true;
        console.log(`[PDF_MISSING] artifactId=${existingArtifact.id} filePath=${existingArtifact.filePath} => forcing regen`);
      }
    }
  }

  const isStale = (existingArtifact && (artifactStamp < briefStamp || isMissingFile)) || isMissingMirror;

  if (isStale) {
    console.log(
      `[PDF_STALE] briefUpdatedAt=${briefStamp.toISOString()} ` +
      `artifactCreatedAt=${artifactStamp.toISOString()} ` +
      `isMissingMirror=${isMissingMirror} ` +
      `isMissingFile=${isMissingFile} => regenerate=true`
    );
  }

  // If enforced OR no artifact OR stale artifact, we MUST regenerate
  if (isEnforced || !existingArtifact || isStale) {
    action = shouldEmail ? 'regen_attach' : 'regen_stream';
    try {
      console.log(`[PDF] Mode mismatch or missing artifact. Regenerating in ${targetMode}...`);


      // EXEC-BRIEF-PDF-CONTRACT-VIOLATION-023: Resolve canonical synthesis
      // If brief.synthesis is missing required fields (content/meta), regenerate it
      const { validateExecutiveBriefSynthesisOrThrow, logContractValidation } = await import('./executiveBriefValidation.service.ts');
      const { SynthesisError, executeSynthesisPipeline } = await import('./executiveBriefSynthesis.service.ts');

      let canonicalSynthesis: any = brief.synthesis;
      let synthesisSource = 'existing';

      // Check if synthesis has required fields (content + meta)
      const hasRequiredFields = canonicalSynthesis?.content && canonicalSynthesis?.meta;

      if (!hasRequiredFields) {
        console.log(`[PDF_CANON] briefId=${brief.id} synthesis missing required fields, regenerating...`);
        synthesisSource = 'regen_pipeline';

        // Fetch intake vectors for this tenant to regenerate synthesis
        const vectors = await db
          .select()
          .from(intakeVectors)
          .where(eq(intakeVectors.tenantId, tenant.id));

        if (vectors.length === 0) {
          throw new Error(`[PDF_CANON] No intake vectors found for tenant ${tenant.id}, cannot regenerate synthesis`);
        }

        // Regenerate synthesis using the same pipeline as normal generation
        canonicalSynthesis = await executeSynthesisPipeline(vectors as any, {
          tenantId: tenant.id,
          briefId: brief.id,
          action: 'pdf_regen'
        });

        // Persist regenerated synthesis back to brief
        await db
          .update(executiveBriefs)
          .set({
            synthesis: canonicalSynthesis as any,
            updatedAt: new Date()
          })
          .where(eq(executiveBriefs.id, brief.id));

        // Update brief object for renderer
        brief.synthesis = canonicalSynthesis;

        console.log(`[PDF_CANON] briefId=${brief.id} synthesis regenerated and persisted`);
      } else {
        console.log(`[PDF_CANON] briefId=${brief.id} using existing synthesis (has content+meta)`);
      }

      try {
        validateExecutiveBriefSynthesisOrThrow(canonicalSynthesis, {
          tenantId: tenant.id,
          briefId: brief.id,
          briefMode: brief.briefMode,
          targetMode
        });
        logContractValidation({
          tenantId: tenant.id,
          briefId: brief.id,
          action: shouldEmail ? 'deliver_regen' : 'deliver_existing',
          result: 'pass',
          violations: 0,
          mode: targetMode
        });
      } catch (validationError) {
        if (validationError instanceof SynthesisError && validationError.code === 'CONTRACT_VIOLATION') {
          const violations = validationError.details?.violations || [];
          logContractValidation({
            tenantId: tenant.id,
            briefId: brief.id,
            action: shouldEmail ? 'deliver_regen' : 'deliver_existing',
            result: 'fail',
            violations: violations.length,
            mode: targetMode
          });
          // Re-throw with contract violation details for controller to handle
          throw validationError;
        }
        throw validationError;
      }

      // EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022: Define timestamp for NEW artifact
      const artifactCreatedAt = new Date();

      // EXEC-BRIEF-PDF-MIRROR-RENDER-025: Diagnostic log to understand synthesis structure
      console.log("[PDF_MODE]", {
        targetMode,
        briefMode: brief.briefMode,
        hasSynthesis: !!brief.synthesis,
        isMirrorNarrative: !!(brief.synthesis as any)?.content?.isMirrorNarrative,
        hasEvidenceSections: !!(brief.synthesis as any)?.content?.evidenceSections,
        synthesisKeys: brief.synthesis ? Object.keys(brief.synthesis) : [],
        hasContentSections: !!(brief.synthesis as any)?.content?.sections,
        contentSectionsKeys: (brief.synthesis as any)?.content?.sections ? Object.keys((brief.synthesis as any).content.sections) : [],
      });

      // Render PDF with the timestamp it will be persisted with
      pdfBuffer = await renderPrivateLeadershipBriefToPDF(brief, tenant.name, targetMode, artifactCreatedAt);

      // EXEC-BRIEF-PDF-STALE-PERSIST-024B: Always persist when stale or missing
      // If we don't have an artifact OR it's stale, persist a new one
      if (!existingArtifact || isStale) {
        // EXEC-BRIEF-PDF-STALE-PERSIST-024C: Delete old artifact first to avoid unique constraint violation
        if (isStale && existingArtifact) {
          console.log(`[PDF] Deleting stale artifact ${existingArtifact.id} before persisting new one`);

          // Delete physical file first
          try {
            await fs.unlink(existingArtifact.filePath);
            console.log(`[PDF] Deleted stale file: ${existingArtifact.filePath}`);
          } catch (error) {
            // File might not exist, that's okay
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
              console.warn(`[PDF] Failed to delete stale file: ${error}`);
            }
          }

          // Then delete DB row
          await db
            .delete(executiveBriefArtifacts)
            .where(eq(executiveBriefArtifacts.id, existingArtifact.id));
        }

        const fileName = formatFileName(tenant.name, artifactCreatedAt);
        artifact = await persistPDFArtifact({
          executiveBriefId: brief.id,
          tenantId: tenant.id,
          pdfBuffer,
          fileName,
        });
        console.log(`[PDF] Persisted new artifact ${artifact.id} (${isStale ? 'stale_replaced' : 'first_time'})`);
      } else {
        // We have an artifact but it might be diagnostic. 
        // We use the transient buffer for delivery but don't overwrite the diagnostic record yet
        // as per Record Mutation Policy (unless we decided to upsert a separate one).
        console.log('[PDF] Transiently using regenerated executive PDF for delivery.');
      }
    } catch (error) {
      throw new ExecBriefPDFRenderFailedError(brief.id, error as Error);
    }
  } else {
    // Standard path: Use existing artifact
    console.log(`[PDF] Artifact exists and mode matches. Checking file integrity...`);
    try {
      pdfBuffer = await fs.readFile(existingArtifact.filePath);
      action = 'stream_existing';
      console.log(
        `[PDF_FRESH] briefUpdatedAt=${briefStamp.toISOString()} ` +
        `artifactCreatedAt=${artifactStamp.toISOString()} => regenerate=false (streaming existing)`
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ExecBriefArtifactNotFoundError(existingArtifact.id, existingArtifact.filePath);
      }
      throw error;
    }
  }

  console.log(`[ExecutiveBriefDelivery] tenantId=${tenant.id} targetMode=${targetMode} briefMode=${persistedMode} enforced=${isEnforced} action=${action}`);

  // STEP 4: Email to Tenant Lead (Optional)
  if (shouldEmail) {
    let deliveredTo = 'unknown';
    try {
      console.log('[PDF] Sending email...');
      const leadEmail = await findTenantLeadEmail(tenant.id);
      if (leadEmail) deliveredTo = leadEmail;

      await emailPrivateBriefToLead({ tenant, artifact, pdfBuffer });

      // Update metadata to reflect success (if we have an artifact record)
      if (artifact) {
        const currentMetadata = (artifact.metadata as any) || {};
        await db
          .update(executiveBriefArtifacts)
          .set({
            metadata: {
              ...currentMetadata,
              emailedTo: deliveredTo,
              emailedAt: new Date().toISOString(),
              deliveryStatus: 'sent',
              deliveredMode: targetMode,
              enforcedMode: isEnforced,
              originalBriefMode: persistedMode
            },
          })
          .where(eq(executiveBriefArtifacts.id, artifact.id));
      }

      console.log(`[PDF] Delivery complete for brief ${brief.id}`);
      return { deliveredTo };
    } catch (error) {
      // Email failed
      if (artifact) {
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
      }

      console.error('[PDF] Email send failed:', error);
      throw new ExecBriefEmailSendFailedError(tenant?.ownerEmail || 'unknown', error as Error);
    }
  } else {
    console.log(`[PDF] Generated/Resolved artifact ${artifact?.id} (email skipped).`);
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
