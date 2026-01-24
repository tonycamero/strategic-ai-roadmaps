import { db } from '../db';
import { tenantDocuments, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { Sop01Outputs } from './sop01Engine';

/**
 * Persist SOP-01 artifacts to tenant_documents.
 * Category: 'sop_output'
 * SOP Number: 'SOP-01'
 * Stable Output Numbers for identification.
 */
export async function persistSop01OutputsForTenant(tenantId: string, outputs: Sop01Outputs): Promise<void> {
    console.log('[SOP-01 Persistence] Persisting outputs for tenant:', tenantId);

    // 1. Strict Validation: All 4 must exist
    const requiredKeys: (keyof Sop01Outputs)[] = [
        'companyDiagnosticMap',
        'aiLeverageMap',
        'discoveryCallQuestions',
        'roadmapSkeleton'
    ];

    for (const key of requiredKeys) {
        const val = outputs[key];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && val.trim() === '')) {
            throw new Error(`SOP01_PERSIST_FAILED: Missing mandatory artifact: ${key}`);
        }
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
    }

    const ownerUserId = tenant.ownerUserId;

    const artifacts = [
        {
            type: 'DIAGNOSTIC_MAP',
            title: 'Company Diagnostic Map',
            content: outputs.companyDiagnosticMap,
            filename: 'sop01_diagnostic_map.md'
        },
        {
            type: 'AI_LEVERAGE_MAP',
            title: 'AI Leverage & Opportunity Map',
            content: outputs.aiLeverageMap,
            filename: 'sop01_ai_leverage_map.md'
        },
        {
            type: 'ROADMAP_SKELETON',
            title: 'Strategic Roadmap Skeleton',
            content: outputs.roadmapSkeleton,
            filename: 'sop01_roadmap_skeleton.md'
        },
        {
            type: 'DISCOVERY_QUESTIONS',
            title: 'Discovery Call Preparation Questions',
            content: Array.isArray(outputs.discoveryCallQuestions)
                ? outputs.discoveryCallQuestions.join('\n\n')
                : outputs.discoveryCallQuestions,
            filename: 'sop01_discovery_questions.md'
        }
    ];

    try {
        await db.transaction(async (tx) => {
            for (const artifact of artifacts) {
                const docData = {
                    tenantId,
                    ownerUserId,
                    filename: artifact.filename,
                    originalFilename: artifact.filename,
                    title: artifact.title,
                    description: `AI-generated ${artifact.title} (SOP-01)`,
                    category: 'sop_output',
                    sopNumber: 'SOP-01',
                    outputNumber: artifact.type,
                    content: artifact.content,
                    filePath: `db://sop01/${artifact.type.toLowerCase()}.md`,
                    fileSize: Buffer.byteLength(artifact.content, 'utf-8'),
                    mimeType: 'text/markdown',
                    isPublic: true,
                    updatedAt: new Date()
                };

                // Use upsert logic via onConflictDoUpdate
                await tx.insert(tenantDocuments)
                    .values({
                        ...docData,
                        createdAt: new Date()
                    })
                    .onConflictDoUpdate({
                        target: [tenantDocuments.tenantId, tenantDocuments.category, tenantDocuments.sopNumber, tenantDocuments.outputNumber],
                        set: docData
                    });

                console.log(`  - Persisted artifact: ${artifact.type}`);
            }
        });
    } catch (err: any) {
        console.error('[SOP-01 Persistence] Transaction failed:', err);
        throw new Error(`SOP01_PERSIST_FAILED: ${err.message}`);
    }

    console.log('[SOP-01 Persistence] Completed successfully.');
}
