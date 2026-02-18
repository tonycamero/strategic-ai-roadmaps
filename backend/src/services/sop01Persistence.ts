import { db } from '../db/index';
import { tenantDocuments, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { Sop01Outputs } from './sop01Engine';

/**
 * Normalizes unknown content to a UTF-8 string.
 * This ensures Buffer.byteLength and database persistence (TEXT columns) succeed.
 */
function normalizeContent(content: any): string {
    if (content === null || content === undefined) {
        return '';
    }
    if (typeof content === 'string') {
        return content;
    }
    if (Buffer.isBuffer(content)) {
        return content.toString('utf-8');
    }
    if (Array.isArray(content)) {
        // If it's an array of objects/strings, prettify it
        try {
            return JSON.stringify(content, null, 2);
        } catch (e) {
            return String(content);
        }
    }
    if (typeof content === 'object') {
        // Handle nested structures like { markdown: "..." } or { text: "..." }
        if (content.markdown && typeof content.markdown === 'string') {
            return content.markdown;
        }
        if (content.list) {
            if (Array.isArray(content.list)) {
                return content.list.join('\n');
            }
            if (typeof content.list === 'string') {
                return content.list;
            }
        }

        try {
            return JSON.stringify(content, null, 2);
        } catch (e) {
            return String(content);
        }
    }
    return String(content);
}

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
        const val = outputs[key];
        // Validation should check for "truthy" enough content
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
            content: normalizeContent(outputs.sop01DiagnosticMarkdown),
            filename: 'sop01_diagnostic_map.md'
        },
        {
            type: 'AI_LEVERAGE_MAP',
            title: 'AI Leverage & Opportunity Map',
            content: normalizeContent(outputs.sop01AiLeverageMarkdown),
            filename: 'sop01_ai_leverage_map.md'
        },
        {
            type: 'ROADMAP_SKELETON',
            title: 'Strategic Roadmap Skeleton',
            content: normalizeContent(outputs.sop01RoadmapSkeletonMarkdown),
            filename: 'sop01_roadmap_skeleton.md'
        },
        {
            type: 'DISCOVERY_QUESTIONS',
            title: 'Discovery Call Preparation Questions',
            content: normalizeContent(outputs.sop01DiscoveryQuestionsMarkdown),
            filename: 'sop01_discovery_questions.md'
        }
    ];

    try {
        await db.transaction(async (tx) => {
            console.log(`[Persistence] Starting transaction for tenantId=${tenantId}`);
            for (const artifact of artifacts) {
                console.log(`[Persistence] Preparing artifact: ${artifact.type}, content length=${artifact.content.length}`);
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
                    isPublic: false,
                    updatedAt: new Date()
                };

                // Use upsert logic via onConflictDoUpdate
                const result = await tx.insert(tenantDocuments)
                    .values({
                        ...docData,
                        createdAt: new Date()
                    })
                    .onConflictDoUpdate({
                        target: [tenantDocuments.tenantId, tenantDocuments.category, tenantDocuments.sopNumber, tenantDocuments.outputNumber],
                        set: docData
                    });

                console.log(`[Persistence] Upserted artifact: ${artifact.type}, result=${JSON.stringify(result)}`);
            }
        });
        console.log(`[Persistence] persistSop01OutputsForTenant completed for tenantId=${tenantId}. Processed ${artifacts.length} artifacts.`);
    } catch (error) {
        console.error('[Persistence] CRITICAL_ERROR: persistence failed for tenantId:', tenantId, error);
        throw error;
    }
}
