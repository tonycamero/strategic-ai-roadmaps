import { db } from '../db/index';
import { sopTickets } from '../db/schema';
import { randomUUID, createHash } from 'crypto';
import { CanonicalFindingsObject, CanonicalTicket, TicketClass } from '@roadmap/shared/src/canon';

export class TicketGenerationError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = 'TicketGenerationError';
    }
}

export async function generateTicketsFromFindings(
    tenantId: string,
    sasRunId: string,
    findingsObject: CanonicalFindingsObject
): Promise<any[]> {
    // 1. Validate Provenance
    if (!findingsObject.findings || findingsObject.findings.length === 0) {
        throw new TicketGenerationError('NO_FINDINGS', 'Findings Object contains no findings.');
    }

    const proposals: any[] = [];

    // 2. Deterministic 1:1 Mapping (Finding -> Ticket)
    findingsObject.findings.forEach((finding, idx) => {
        let titlePrefix: string;

        switch (finding.type) {
            case 'FrictionPoint':
                titlePrefix = 'Investigate:';
                break;
            case 'Goal':
                titlePrefix = 'Build Capability:';
                break;
            case 'Constraint':
                titlePrefix = 'Verify Constraint:';
                break;
            case 'CurrentFact':
            default:
                return; // Facts do not spawn tickets directly
        }

        const findingIdDigest = createHash('sha256').update(finding.id).digest('hex').substring(0, 8);
        const fullTitle = `${titlePrefix} ${finding.description}`;

        proposals.push({
            tenantId,
            sasRunId,
            proposalType: 'ticket',
            content: fullTitle,
            title: fullTitle.substring(0, 255),
            description: `Generated from Finding ${finding.id}: "${finding.description}"`,
            status: 'draft',
            confidence: 1.0, // SSOT Default for canonical findings
            sourceAnchors: {
                findingId: finding.id,
                findingType: finding.type,
                idx,
                sourceHash: findingIdDigest
            },
            agentModel: 'gpt-4o',
            conceptHash: findingIdDigest,
            createdAt: new Date()
        });
    });

    console.log(`[TicketGen] Generated ${proposals.length} Proposed Tickets for run ${sasRunId}`);
    return proposals;
}
