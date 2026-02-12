// FILE: backend/src/services/pdf/executiveBriefArtifactSelector.ts
import { db } from '../../db/index.ts';
import { executiveBriefArtifacts } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * EXEC-BRIEF-PDF-ARTIFACT-CONSISTENCY-022
 * 
 * Canonical PDF Artifact Selector
 * 
 * This is the SINGLE SOURCE OF TRUTH for selecting PDF artifacts.
 * ALL code paths (generate, download, email) MUST use this function.
 * 
 * Selection Logic:
 * 1. Filter by tenantId + briefId + artifactType
 * 2. Order by createdAt DESC, id DESC (deterministic tie-breaker)
 * 3. Return latest artifact
 * 
 * Future: Add synthesisHash matching for content-addressed selection
 */

export interface ArtifactSelectorParams {
    tenantId: string;
    briefId?: string;
    artifactType?: string;
    synthesisHash?: string; // Future: prefer artifact matching synthesis
}

export interface SelectedArtifact {
    id: string;
    executiveBriefId: string;
    tenantId: string;
    artifactType: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    checksum: string;
    isImmutable: boolean;
    metadata: any;
    generatedAt: Date;
    createdAt: Date;
    updatedAt: Date | null;
}

/**
 * Select the latest PDF artifact for a given tenant/brief.
 * 
 * @param params - Selection parameters
 * @param logContext - Context for logging (e.g., 'download', 'email', 'generate')
 * @returns Latest artifact or null if not found
 */
export async function selectLatestPdfArtifact(
    params: ArtifactSelectorParams,
    logContext: string = 'unknown'
): Promise<SelectedArtifact | null> {
    const {
        tenantId,
        briefId,
        artifactType = 'PRIVATE_LEADERSHIP_PDF',
        synthesisHash
    } = params;

    // Build where conditions
    const conditions = [
        eq(executiveBriefArtifacts.tenantId, tenantId),
        eq(executiveBriefArtifacts.artifactType, artifactType)
    ];

    if (briefId) {
        conditions.push(eq(executiveBriefArtifacts.executiveBriefId, briefId));
    }

    // Execute query with deterministic ordering
    const [artifact] = await db
        .select()
        .from(executiveBriefArtifacts)
        .where(and(...conditions))
        .orderBy(
            desc(executiveBriefArtifacts.createdAt),
            desc(executiveBriefArtifacts.id) // Tie-breaker for same-second creations
        )
        .limit(1);

    // Observability logging
    if (artifact) {
        const synthesisHashMatch = synthesisHash ?
            (artifact.metadata as any)?.synthesisHash === synthesisHash :
            null;

        console.log(
            `[PDF_SELECT] path=${logContext} ` +
            `tenantId=${tenantId} ` +
            `briefId=${briefId || 'N/A'} ` +
            `artifactId=${artifact.id} ` +
            `artifactCreatedAt=${artifact.createdAt.toISOString()} ` +
            `synthesisHashMatch=${synthesisHashMatch !== null ? synthesisHashMatch : 'N/A'}`
        );
    } else {
        console.log(
            `[PDF_SELECT] path=${logContext} ` +
            `tenantId=${tenantId} ` +
            `briefId=${briefId || 'N/A'} ` +
            `result=NOT_FOUND`
        );
    }

    return artifact as SelectedArtifact | null;
}

/**
 * Check if a PDF artifact exists for a given tenant/brief.
 * 
 * @param params - Selection parameters
 * @returns true if artifact exists, false otherwise
 */
export async function hasPdfArtifact(
    params: ArtifactSelectorParams
): Promise<boolean> {
    const artifact = await selectLatestPdfArtifact(params, 'exists_check');
    return artifact !== null;
}
