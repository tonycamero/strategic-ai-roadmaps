import { db } from '../db/index';
import { tenants, diagnostics, auditEvents } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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
    id: nanoid(),
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

    await db.update(tenants).set({ lastDiagnosticId: diagnosticId }).where(eq(tenants.id, tenantId));
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

  await db.update(diagnostics).set({ status: 'locked' }).where(eq(diagnostics.id, diagnosticId));

  const [diag] = await db.select().from(diagnostics).where(eq(diagnostics.id, diagnosticId)).limit(1);
  if (diag) {
    const outputs = {
      sop01DiagnosticMarkdown: diag.overview,
      sop01AiLeverageMarkdown: diag.aiOpportunities,
      sop01RoadmapSkeletonMarkdown: diag.roadmapSkeleton,
      sop01DiscoveryQuestionsMarkdown: diag.discoveryQuestions,
    };
    await persistSop01OutputsForTenant(diag.tenantId, outputs as any);
  }

  await db.insert(auditEvents).values({
    tenantId: diag?.tenantId || null,
    actorUserId,
    actorRole,
    eventType: 'DIAGNOSTIC_LOCKED',
    entityType: 'diagnostic',
    entityId: diagnosticId,
  });

  return { ok: true };
}