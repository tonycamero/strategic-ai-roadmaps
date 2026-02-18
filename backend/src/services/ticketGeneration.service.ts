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
    findingsObject: CanonicalFindingsObject
): Promise<number> {

    // 1. Validate Provenance
    if (!findingsObject.findings || findingsObject.findings.length === 0) {
        throw new TicketGenerationError('NO_FINDINGS', 'Findings Object contains no findings.');
    }

    const tickets: any[] = []; // sopTickets insert type

    // 2. Deterministic 1:1 Mapping (Finding -> Ticket)
    findingsObject.findings.forEach((finding, idx) => {
        let ticketClass: TicketClass;
        let titlePrefix: string;

        switch (finding.type) {
            case 'FrictionPoint':
                ticketClass = 'Diagnostic';
                titlePrefix = 'Investigate:';
                break;
            case 'Goal':
                ticketClass = 'CapabilityBuild';
                titlePrefix = 'Build Capability:';
                break;
            case 'Constraint':
                ticketClass = 'ConstraintCheck';
                titlePrefix = 'Verify Constraint:';
                break;
            case 'CurrentFact':
            default:
                return; // Facts do not spawn tickets directly
        }

        const ticketId = `T-${finding.id.split('-')[1] || 'generic'}-${idx + 1}`; // T-<Hash>-<Idx>

        tickets.push({
            id: randomUUID(),
            tenantId,
            ticketId,
            title: `${titlePrefix} ${finding.description.substring(0, 50)}...`,
            description: `Generated from Finding ${finding.id}: "${finding.description}"`,
            category: 'Core', // Default
            ticketType: ticketClass, // Closed Set Enforced

            // Provenance (Locked)
            painSource: JSON.stringify([finding.id]), // Storing findingIds here as link
            inventoryId: 'GENERATED',

            // Defaults (No "Sprints" or "Tiers")
            sprint: 1, // Defaulting to 1 as placeholder strictly
            tier: 'core',
            status: 'generated',
            approved: false,

            createdAt: new Date(),
            updatedAt: new Date()
        });
    });

    if (tickets.length === 0) {
        return 0;
    }

    // 3. Persist
    await db.transaction(async (tx) => {
        // Wipe existing generated tickets for this tenant to ensure idempotency? 
        // Ticket says "Roadmaps are never edited in place; they are strictly re-generated."
        // Tickets are inputs to roadmaps.
        // We probably shouldn't wipe approved tickets, but here we are generating PROPOSED tickets.
        // I will append or simple insert. Canon says "Ticket Service rejects creation requests without valid provenance."

        await tx.insert(sopTickets).values(tickets);
    });

    console.log(`[TicketGen] Generated ${tickets.length} Canonical Tickets for tenant ${tenantId}`);
    return tickets.length;
}
