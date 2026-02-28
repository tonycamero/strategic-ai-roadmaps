import { db } from '../db/index';
import { tenants, diagnostics, auditEvents, tenantDocuments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getTenantLifecycleView } from './tenantStateAggregation.service';

import { buildNormalizedIntakeContext } from './intakeNormalizer';
import { generateSop01Outputs } from './sop01Engine';
import { persistSop01OutputsForTenant } from './sop01Persistence';

export async function generateSop01DiagnosticsForTenant(args: {
  tenantId: string;
  actorUserId: string | null;
}) {
  const { tenantId, actorUserId } = args;

  // 1) Build Context
  const normalized = await buildNormalizedIntakeContext(tenantId);

  // 2) Generate outputs
  const outputs = await generateSop01Outputs(normalized);

  // 3) Upsert diagnostic record (generated)
  const [existing] = await db
    .select()
    .from(diagnostics)
    .where(and(eq(diagnostics.tenantId, tenantId), eq(diagnostics.status, 'generated')))
    .limit(1);

  let diagnosticId = existing?.id;
  let isNewDiagnostic = false;

  const diagnosticValues = {
    id: randomUUID(),
    tenantId,
    sopVersion: 'SOP-01',
    status: 'generated' as const,
    overview: { markdown: outputs.sop01DiagnosticMarkdown },
    aiOpportunities: { markdown: outputs.sop01AiLeverageMarkdown },
    roadmapSkeleton: { markdown: outputs.sop01RoadmapSkeletonMarkdown },
    discoveryQuestions: {
      list: outputs.sop01DiscoveryQuestionsMarkdown
        .split('\n')
        .map((q: string) => q.trim())
        .filter(Boolean),
    },
    generatedByUserId: actorUserId,
    updatedAt: new Date(),
  };

  if (!diagnosticId) {
    const [newDiag] = await db.insert(diagnostics).values(diagnosticValues).returning();
    diagnosticId = newDiag.id;
    isNewDiagnostic = true;
    // TCK-MIH-002: Pointer (lastDiagnosticId) is set exclusively inside publishDiagnostic transaction.
    // Generate must NOT write the pointer — pointer authority belongs to publish only.
  } else {
    await db.update(diagnostics).set(diagnosticValues).where(eq(diagnostics.id, diagnosticId));
  }

  if (isNewDiagnostic) {
    await db.insert(auditEvents).values({
      tenantId,
      actorUserId,
      eventType: 'DIAGNOSTIC_GENERATED',
      entityType: 'diagnostic',
      entityId: diagnosticId,
      metadata: { version: 'v2' },
    });
  }

  return { diagnosticId };
}

export async function lockDiagnosticAndSyncSop01Outputs(args: {
  diagnosticId: string;
  actorUserId: string | null;
  actorRole?: string | null;
}) {
  const { diagnosticId, actorUserId, actorRole } = args;

  return await db.transaction(async (trx) => {
    // 1. Fetch diagnostic to get tenantId
    const [diag] = await trx.select().from(diagnostics).where(eq(diagnostics.id, diagnosticId)).limit(1);
    if (!diag) {
      throw new Error('DIAGNOSTIC_NOT_FOUND');
    }
    const tenantId = diag.tenantId;

    // 2. Re-evaluate projection inside transaction
    const freshProjection = await getTenantLifecycleView(tenantId, trx);

    // 3. Gate via Atomic Firewall
    if (!freshProjection.capabilities.lockDiagnostic.allowed) {
      throw new Error('AUTHORITY_VIOLATION');
    }

    // 4. Perform mutation
    await trx.update(diagnostics).set({ status: 'locked', updatedAt: new Date() }).where(eq(diagnostics.id, diagnosticId));

    const outputs = {
      sop01DiagnosticMarkdown: diag.overview,
      sop01AiLeverageMarkdown: diag.aiOpportunities,
      sop01RoadmapSkeletonMarkdown: diag.roadmapSkeleton,
      sop01DiscoveryQuestionsMarkdown: diag.discoveryQuestions,
    };

    // Nested transaction support in Drizzle will handle this
    // Pass trx to ensure atomicity
    await persistSop01OutputsForTenant(tenantId, outputs as any, trx);

    await trx.insert(auditEvents).values({
      tenantId,
      actorUserId,
      actorRole,
      eventType: 'DIAGNOSTIC_LOCKED',
      entityType: 'diagnostic',
      entityId: diagnosticId,
    });

    return { ok: true };
  });
}

export async function publishDiagnostic(args: {
  tenantId: string;
  diagnosticId: string;
  actorUserId: string | null;
  actorRole?: string | null;
}) {
  const { tenantId, diagnosticId, actorUserId, actorRole } = args;
  const now = new Date();

  return await db.transaction(async (trx) => {
    // 1. Re-evaluate projection inside transaction
    const freshProjection = await getTenantLifecycleView(tenantId, trx);

    // 2. Gate via Atomic Firewall
    if (!freshProjection.capabilities.publishDiagnostic.allowed) {
      throw new Error('AUTHORITY_VIOLATION');
    }

    // 3. Verify diagnostic belongs to tenant
    const [diag] = await trx.select().from(diagnostics).where(eq(diagnostics.id, diagnosticId)).limit(1);
    if (!diag) throw new Error('DIAGNOSTIC_NOT_FOUND');
    if (diag.tenantId !== tenantId) throw new Error('DIAGNOSTIC_TENANT_MISMATCH');

    // 4. Archive any previously published diagnostics for this tenant
    const currentlyPublished = await trx
      .select({ id: diagnostics.id })
      .from(diagnostics)
      .where(and(
        eq(diagnostics.tenantId, tenantId),
        eq(diagnostics.status, 'published')
      ));

    for (const d of currentlyPublished.filter(d => d.id !== diagnosticId)) {
      await trx.update(diagnostics)
        .set({ status: 'archived', updatedAt: now })
        .where(eq(diagnostics.id, d.id));
    }

    // 5. Publish target diagnostic
    await trx.update(diagnostics)
      .set({ status: 'published', updatedAt: now })
      .where(eq(diagnostics.id, diagnosticId));

    // 6. Rebind tenant pointer
    await trx.update(tenants)
      .set({ lastDiagnosticId: diagnosticId })
      .where(eq(tenants.id, tenantId));

    // 7. Release SOP-01 documents to tenant
    await trx.update(tenantDocuments)
      .set({ isPublic: true })
      .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.sopNumber, 'SOP-01'),
        eq(tenantDocuments.category, 'sop_output')
      ));

    // 8. Audit event
    await trx.insert(auditEvents).values({
      tenantId,
      actorUserId,
      actorRole: actorRole || null,
      eventType: 'DIAGNOSTIC_PUBLISHED',
      entityType: 'diagnostic',
      entityId: diagnosticId
    });

    return { success: true };
  });
}