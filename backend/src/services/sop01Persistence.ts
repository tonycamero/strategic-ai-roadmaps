<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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
<<<<<<< HEAD
        'companyDiagnosticMap',
        'aiLeverageMap',
        'discoveryCallQuestions',
        'roadmapSkeleton'
    ];

    for (const key of requiredKeys) {
        const val = outputs[key];
        if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && val.trim() === '')) {
=======
        'sop01DiagnosticMarkdown',
        'sop01AiLeverageMarkdown',
        'sop01DiscoveryQuestionsMarkdown',
        'sop01RoadmapSkeletonMarkdown'
    ];

    for (const key of requiredKeys) {
        if (!outputs[key] || typeof outputs[key] !== 'string' || outputs[key].trim() === '') {
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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
<<<<<<< HEAD
            title: 'Company Diagnostic Map',
            content: outputs.companyDiagnosticMap,
=======
            title: 'SOP-01: Company Diagnostic Map',
            content: outputs.sop01DiagnosticMarkdown,
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
            filename: 'sop01_diagnostic_map.md'
        },
        {
            type: 'AI_LEVERAGE_MAP',
<<<<<<< HEAD
            title: 'AI Leverage & Opportunity Map',
            content: outputs.aiLeverageMap,
=======
            title: 'SOP-01: AI Leverage Map',
            content: outputs.sop01AiLeverageMarkdown,
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
            filename: 'sop01_ai_leverage_map.md'
        },
        {
            type: 'ROADMAP_SKELETON',
<<<<<<< HEAD
            title: 'Strategic Roadmap Skeleton',
            content: outputs.roadmapSkeleton,
=======
            title: 'SOP-01: Roadmap Skeleton',
            content: outputs.sop01RoadmapSkeletonMarkdown,
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
            filename: 'sop01_roadmap_skeleton.md'
        },
        {
            type: 'DISCOVERY_QUESTIONS',
<<<<<<< HEAD
            title: 'Discovery Call Preparation Questions',
            content: Array.isArray(outputs.discoveryCallQuestions)
                ? outputs.discoveryCallQuestions.join('\n\n')
                : outputs.discoveryCallQuestions,
=======
            title: 'SOP-01: Discovery Call Questions',
            content: outputs.sop01DiscoveryQuestionsMarkdown,
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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
<<<<<<< HEAD
                    isPublic: true,
=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
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
<<<<<<< HEAD
=======
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
        'sop01DiagnosticMarkdown',
        'sop01AiLeverageMarkdown',
        'sop01DiscoveryQuestionsMarkdown',
        'sop01RoadmapSkeletonMarkdown'
    ];

    for (const key of requiredKeys) {
        if (!outputs[key] || typeof outputs[key] !== 'string' || outputs[key].trim() === '') {
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
            title: 'SOP-01: Company Diagnostic Map',
            content: outputs.sop01DiagnosticMarkdown,
            filename: 'sop01_diagnostic_map.md'
        },
        {
            type: 'AI_LEVERAGE_MAP',
            title: 'SOP-01: AI Leverage Map',
            content: outputs.sop01AiLeverageMarkdown,
            filename: 'sop01_ai_leverage_map.md'
        },
        {
            type: 'ROADMAP_SKELETON',
            title: 'SOP-01: Roadmap Skeleton',
            content: outputs.sop01RoadmapSkeletonMarkdown,
            filename: 'sop01_roadmap_skeleton.md'
        },
        {
            type: 'DISCOVERY_QUESTIONS',
            title: 'SOP-01: Discovery Call Questions',
            content: outputs.sop01DiscoveryQuestionsMarkdown,
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
>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
=======
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
