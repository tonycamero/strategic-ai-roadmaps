
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index';
import { tenants, discoveryCallNotes, tenantDocuments } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { FindingsService } from '../services/findings.service';

async function verify() {
    console.log("=== START VERIFICATION: STAGE 4 RAW INGEST PIPELINE ===");

    // 1. Setup Tenant
    const tenant = await db.query.tenants.findFirst();
    if (!tenant) throw new Error("No tenant found for verification");
    const tenantId = tenant.id;
    console.log(`[PASS] Tenant Selected: ${tenant.name} (${tenantId})`);

    // 2. Simulate RAW Ingestion Payload (The preferred Option 1 shape)
    console.log("\n--- Step 2: Simulating RAW Ingestion Payload ---");
    const rawPayload = {
        sessionDate: '2026-01-22',
        durationMinutes: 45,
        attendees: 'Tony, AG',
        rawNotes: 'This is a raw transcript of the discovery call. It contains unstructured truth.'
    };

    console.log("Payload:", JSON.stringify(rawPayload));

    // We can't call the actual route here without a server, but we can simulate the controller logic
    // Logic: Map RAW shape to Canonical shape
    const canonicalNotes = {
        sessionMetadata: {
            date: rawPayload.sessionDate,
            duration: rawPayload.durationMinutes.toString(),
            attendees: rawPayload.attendees,
            firmName: tenant.name
        },
        currentBusinessReality: rawPayload.rawNotes,
        primaryFrictionPoints: '',
        desiredFutureState: '',
        technicalOperationalEnvironment: '',
        explicitClientConstraints: ''
    };

    // 3. Test Findings Extraction (F1-F4) with RAW data
    console.log("\n--- Step 3: Validating Findings Extraction with RAW data ---");
    try {
        const findings = FindingsService.extractFindings(tenantId, 'test-id', canonicalNotes);
        console.log(`[PASS] Extraction succeeded. Generated ${findings.findings.length} findings.`);

        const realityFinding = findings.findings.find(f => f.type === 'CurrentFact');
        if (realityFinding && realityFinding.description === rawPayload.rawNotes) {
            console.log(`[PASS] Raw notes correctly mapped to CurrentFact.`);
        } else {
            console.error(`[FAIL] Raw notes mapping failed.`);
        }
    } catch (err: any) {
        console.error(`[FAIL] Extraction failed: ${err.message}`);
    }

    // 4. Verify DB Storage (Simulate Ingest)
    console.log("\n--- Step 4: Simulating Ingestion Round Trip ---");
    const notesJson = JSON.stringify(canonicalNotes);

    // Insert mock record
    const [inserted] = await db.insert(discoveryCallNotes).values({
        tenantId,
        notes: notesJson,
        status: 'ingested',
        createdAt: new Date(),
        updatedAt: new Date()
    }).returning({ id: discoveryCallNotes.id });

    if (inserted) {
        console.log(`[PASS] Discovery Record created (ID: ${inserted.id}).`);
    } else {
        console.error(`[FAIL] Discovery Record creation failed.`);
    }

    // 5. Verify Retrieval (GET /discovery-notes)
    console.log("\n--- Step 5: Simulating Retrieval (Stage 5 context) ---");
    const [retrieved] = await db
        .select({ notes: discoveryCallNotes.notes })
        .from(discoveryCallNotes)
        .where(eq(discoveryCallNotes.tenantId, tenantId))
        .orderBy(desc(discoveryCallNotes.createdAt))
        .limit(1);

    if (retrieved && retrieved.notes === notesJson) {
        console.log(`[PASS] Discovery notes retrieved correctly.`);
    } else {
        console.error(`[FAIL] Retrieval failed or mismatch.`);
    }

    // Cleanup (optional)
    await db.delete(discoveryCallNotes).where(eq(discoveryCallNotes.id, inserted.id));
    console.log("\n[CLEANUP] Deleted test record.");

    console.log("\n=== VERIFICATION COMPLETE ===");
    process.exit(0);
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});
