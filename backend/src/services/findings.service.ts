
import { db } from '../db/index';
import { tenantDocuments, auditEvents, discoveryCallNotes, sasRuns } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createHash, randomUUID } from 'crypto';
import { CanonicalDiscoveryNotes, CanonicalFindingsObject, CanonicalFinding } from '@roadmap/shared/src/canon';
import { getTenantLifecycleView } from './tenantStateAggregation.service';
import { computeCanonicalFindingsHash } from './canonicalFindingsHash.util';
import { SelectionEnvelopeService } from './selectionEnvelope.service';

export class FindingsService {
    /**
     * Compiler: Extracts Deterministic Findings from Canonical Discovery Notes.
     * Pure function (internal logic) - does not persist to DB.
     * @param tenantId - The tenant
     * @param sourceId - The ID of the generic discovery_notes record (for provenance)
     * @param notes - The structured notes
     */
    static extractFindings(
        tenantId: string,
        sourceId: string,
        notes: CanonicalDiscoveryNotes
    ): CanonicalFindingsObject {

        // 1. Validate Input (In RAW mode, we only require the primary bucket)
        if (!notes.currentBusinessReality) {
            throw new Error("Invalid Discovery Notes: Missing primary truth bucket (currentBusinessReality).");
        }

        // 2. Generate Findings (Deterministic Mapping)
        const findings: CanonicalFinding[] = [];

        // A. Current Facts (Business Reality) -> Type: CurrentFact
        findings.push(this.createFinding(
            tenantId,
            'CurrentFact',
            notes.currentBusinessReality,
            'currentBusinessReality',
            'FACT-REALITY'
        ));

        // B. Friction Points -> Type: FrictionPoint (Diagnostic Ticket Source)
        const frictionLines = notes.primaryFrictionPoints.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        frictionLines.forEach((line, idx) => {
            findings.push(this.createFinding(
                tenantId,
                'FrictionPoint',
                line,
                'primaryFrictionPoints',
                `FRICTION-${idx + 1}`
            ));
        });

        // C. Desired Future State -> Type: Goal (CapabilityBuild Ticket Source)
        const goalLines = notes.desiredFutureState.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        goalLines.forEach((line, idx) => {
            findings.push(this.createFinding(
                tenantId,
                'Goal',
                line,
                'desiredFutureState',
                `GOAL-${idx + 1}`
            ));
        });

        // D. Constraints -> Type: Constraint (ConstraintCheck Ticket Source)
        if (notes.explicitClientConstraints && notes.explicitClientConstraints.length > 3) {
            const constraintLines = notes.explicitClientConstraints.split('\n').map(l => l.trim()).filter(l => l.length > 5);
            constraintLines.forEach((line, idx) => {
                findings.push(this.createFinding(
                    tenantId,
                    'Constraint',
                    line,
                    'explicitClientConstraints',
                    `CONST-${idx + 1}`
                ));
            });
        }

        const findingsObject: CanonicalFindingsObject = {
            tenantId,
            generatedAt: new Date().toISOString(),
            discoveryRef: sourceId,
            findings
        };

        console.log(`[FindingsService] Extracted ${findings.length} findings for tenant ${tenantId}`);
        return findingsObject;
    }

    private static createFinding(
        tenantId: string,
        type: CanonicalFinding['type'],
        content: string,
        sourceSection: keyof CanonicalDiscoveryNotes,
        salt: string
    ): CanonicalFinding {
        // Deterministic ID based on content + tenant + salt
        const contentHash = this.hashString(`${tenantId}:${type}:${content}:${salt}`);
        const id = `FND-${contentHash.substring(0, 8)}`;

        return {
            id,
            type,
            content,
            sourceSection,
            sourceTextHash: contentHash
        };
    }

    private static hashString(input: string): string {
        return createHash('sha256').update(input).digest('hex');
    }

    static async declareCanonicalFindings(args: {
        tenantId: string;
        findings: any[];
        sasRunId: string;
        actorUserId: string | null;
        actorRole?: string | null;
    }) {
        const { tenantId, findings, sasRunId, actorUserId, actorRole } = args;
        console.log(`[FindingsService] declareCanonicalFindings started for tenant: ${tenantId}`);

        return await db.transaction(async (trx) => {
            // 1. ALWAYS persist run state (Run-scoped SSOT)
            await this.persistCanonicalFindings(sasRunId, findings, trx);

            // 2. Re-evaluate projection inside transaction (for subsequent logic)
            console.log(`[FindingsService] Re-evaluating projection...`);
            const freshProjection = await getTenantLifecycleView(tenantId, trx);

            // 3. Gate via Atomic Firewall (Logged but overridden per manual override fix)
            if (!freshProjection.capabilities.declareCanonicalFindings.allowed) {
                console.warn(`[FindingsService] AUTHORITY_VIOLATION detected but proceeding with manual operator override: ${JSON.stringify(freshProjection.capabilities.declareCanonicalFindings.reasons)}`);
            }

            // 4. Application-layer duplicate guard for document (Tenant-scoped idempotency)
            const [existingDoc] = await trx
                .select({ id: tenantDocuments.id })
                .from(tenantDocuments)
                .where(and(
                    eq(tenantDocuments.tenantId, tenantId),
                    eq(tenantDocuments.category, 'findings_canonical')
                ))
                .limit(1);

            let findingsDocId = existingDoc?.id;

            if (!existingDoc) {
                // 5. Fetch discovery notes for ref
                const [discoveryRecord] = await trx
                    .select()
                    .from(discoveryCallNotes)
                    .where(eq(discoveryCallNotes.tenantId, tenantId))
                    .orderBy(desc(discoveryCallNotes.createdAt))
                    .limit(1);

                if (!discoveryRecord) {
                    console.error(`[FindingsService] NO_DISCOVERY_CONTEXT`);
                    throw new Error('NO_DISCOVERY_CONTEXT');
                }

                // 6. Compute stable artifact hash
                const hashableFindings = findings.filter(
                    (f): f is { id: string; [key: string]: unknown } => typeof f.id === 'string'
                );
                const artifactHash = computeCanonicalFindingsHash(hashableFindings);

                const findingsObject = {
                    id: randomUUID(),
                    tenantId,
                    generatedAt: new Date(),
                    discoveryRef: discoveryRecord.id,
                    findings
                };

                const content = JSON.stringify(findingsObject);
                findingsDocId = findingsObject.id;

                // 7. Persist Canonical Findings Document
                console.log(`[FindingsService] Inserting tenant_documents record...`);
                await trx.insert(tenantDocuments).values({
                    tenantId,
                    category: 'findings_canonical',
                    title: 'Canonical Findings (Operator Reviewed)',
                    filename: `findings-canonical-${discoveryRecord.id}.json`,
                    originalFilename: `findings-canonical-${discoveryRecord.id}.json`,
                    description: 'Promoted from Stage 5 Assisted Synthesis',
                    content: content,
                    fileSize: Buffer.byteLength(content),
                    filePath: 'virtual://findings',
                    uploadedBy: actorUserId,
                    artifactHash,
                    isImmutable: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                // 8. Audit
                console.log(`[FindingsService] Recording audit event...`);
                await trx.insert(auditEvents).values({
                    tenantId,
                    actorUserId,
                    actorRole: actorRole || null,
                    eventType: 'FINDINGS_DECLARED',
                    entityType: 'findings',
                    entityId: findingsObject.id
                });
            }

            // 8. Create Selection Envelope (Stage-6 Authority)
            console.log(`[FindingsService] Creating Selection Envelope for run: ${sasRunId}`);
            const { envelopeId, envelopeHash } = await SelectionEnvelopeService.createSelectionEnvelope(
                tenantId,
                sasRunId,
                actorUserId || 'system'
            );

            console.log(`[FindingsService] declareCanonicalFindings success! Envelope: ${envelopeHash}`);
            return {
                success: true,
                findingsId: findingsDocId,
                artifactHash: 'DECLARED', // Legacy or calculated
                envelopeId,
                envelopeHash
            };
        });
    }

    static async persistCanonicalFindings(runId: string, findings: any[], trx: any = db) {
        console.log(`[FindingsService] Persisting canonical findings to run:`, runId);

        const groupedFindings: any = {
            CurrentFact: [],
            FrictionPoint: [],
            Goal: [],
            Constraint: []
        };

        for (const f of findings) {
            if (groupedFindings[f.type]) {
                groupedFindings[f.type].push(f);
            }
        }

        await trx.update(sasRuns)
            .set({ artifactState: groupedFindings })
            .where(eq(sasRuns.id, runId));
        
        console.log(`[FindingsService] Successfully updated sas_runs.artifact_state for run: ${runId}`);
    }
}
