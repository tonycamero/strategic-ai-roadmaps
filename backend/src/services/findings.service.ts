
import { db } from '../db/index.ts';
import { tenantDocuments } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { createHash, randomUUID } from 'crypto';
import { CanonicalDiscoveryNotes, CanonicalFindingsObject, CanonicalFinding } from '@roadmap/shared/src/canon';

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
}
