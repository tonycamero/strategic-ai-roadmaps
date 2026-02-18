
import * as dotenv from 'dotenv';
dotenv.config();

import { getTicketsForDiagnostic, getModerationStatus } from '../services/ticketModeration.service';

async function test() {
    const tenantId = '883a5307-6354-49ad-b8e3-765ff64dc1af'; // Northshore
    const diagnosticId = '2745d2de-7009-4983-9bfe-792560bc285c'; // Real ID from DB

    console.log(`[Test] Fetching tickets for ${tenantId} / ${diagnosticId}`);

    // NOTE: In the DB, tickets for this tenant current have diagnostic_id = NULL.
    // My fix should allow fetching them.

    const tickets = await getTicketsForDiagnostic(tenantId, diagnosticId);
    const status = await getModerationStatus(tenantId, diagnosticId);

    console.log(`[Test] Result: ${tickets.length} tickets found.`);
    console.log(`[Test] Moderation Status:`, JSON.stringify(status, null, 2));

    if (tickets.length > 0) {
        console.log(`[PASS] Tickets are now visible even with NULL diagnostic_id (mismatch handled).`);
        console.log(`[Test] First ticket sprint: ${tickets[0].sprint}`);
    } else {
        console.log(`[FAIL] No tickets found. Filter may still be too strict or all tickets are archived.`);
    }

    process.exit(0);
}

test().catch(console.error);
