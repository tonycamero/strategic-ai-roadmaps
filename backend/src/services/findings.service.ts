
import { db } from '../db/index';
import { tenantDocuments, auditEvents, discoveryCallNotes } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createHash, randomUUID } from 'crypto';
import { CanonicalDiscoveryNotes, CanonicalFindingsObject, CanonicalFinding } from '@roadmap/shared/src/canon';
import { getTenantLifecycleView } from './tenantStateAggregation.service';

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
        description: string,
        sourceSection: keyof CanonicalDiscoveryNotes,
        salt: string
    ): CanonicalFinding {
        // Deterministic ID based on content + tenant + salt
        const contentHash = this.hashString(`${tenantId}:${type}:${description}:${salt}`);
        const id = `FND-${contentHash.substring(0, 8)}`;

        return {
            id,
            type,
            description,
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
        actorUserId: string | null;
        actorRole?: string | null;
    }) {
        const { tenantId, findings, actorUserId, actorRole } = args;

        return await db.transaction(async (trx) => {
            // 1. Re-evaluate projection inside transaction
            const freshProjection = await getTenantLifecycleView(tenantId, trx);

            // 2. Gate via Atomic Firewall
            if (!freshProjection.capabilities.declareCanonicalFindings.allowed) {
                throw new Error('AUTHORITY_VIOLATION');
            }

            // 3. Fetch discovery notes for ref
            const [discoveryRecord] = await trx
                .select()
                .from(discoveryCallNotes)
                .where(eq(discoveryCallNotes.tenantId, tenantId))
                .orderBy(desc(discoveryCallNotes.createdAt))
                .limit(1);

            if (!discoveryRecord) {
                throw new Error('NO_DISCOVERY_CONTEXT');
            }

            const findingsObject = {
                id: randomUUID(),
                tenantId,
                generatedAt: new Date(),
                discoveryRef: discoveryRecord.id,
                findings
            };

            // 4. Persist Canonical Findings
            await trx.insert(tenantDocuments).values({
                tenantId,
                category: 'findings_canonical',
                title: 'Canonical Findings (Operator Reviewed)',
                filename: `findings-canonical-${discoveryRecord.id}.json`,
                originalFilename: `findings-canonical-${discoveryRecord.id}.json`,
                description: 'Promoted from Stage 5 Assisted Synthesis',
                content: JSON.stringify(findingsObject),
                fileSize: Buffer.byteLength(JSON.stringify(findingsObject)),
                filePath: 'virtual://findings',
                uploadedBy: actorUserId,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // 5. Audit
            await trx.insert(auditEvents).values({
                tenantId,
                actorUserId,
                actorRole: actorRole || null,
                eventType: 'FINDINGS_DECLARED',
                entityType: 'findings',
                entityId: findingsObject.id
            });

            return { success: true, findingsId: findingsObject.id };
        });
    }
}
