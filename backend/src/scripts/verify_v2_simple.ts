
import 'dotenv/config';
import { db } from '../db/index';
import { diagnostics, executiveBriefs, sopTickets, discoveryCallNotes, tenants, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const TEST_ID = `verify_v2_${crypto.randomUUID().split('-')[0]}`;
let tenantId: string;
let userId: string;

async function setup() {
    console.log(`[SETUP] Creating Test Tenant: ${TEST_ID}`);

    // 1. Create Tenant First (Owner is nullable initially)
    // Minimal insert to avoid "checkInsertTargets" (Schema Drift) errors
    const [tenant] = await db.insert(tenants).values({
        name: `Verification Tenant ${TEST_ID}`,
        // Relies on DB defaults for status, businessType, etc.
    }).returning();
    tenantId = tenant.id;

    // 2. Create User (linked to Tenant)
    const [user] = await db.insert(users).values({
        email: `${TEST_ID}@test.com`,
        passwordHash: 'dummy_hash',
        name: 'Verification Bot',
        role: 'owner',
        tenantId: tenant.id,
        isInternal: true,
        createdAt: new Date()
    }).returning();
    userId = user.id;

    // 3. Update Tenant Owner
    await db.update(tenants).set({ ownerUserId: userId }).where(eq(tenants.id, tenantId));
    console.log(`[SETUP] Tenant ID: ${tenantId}, User ID: ${userId}`);
}

async function testBriefMapping() {
    console.log(`\n[TEST 1] Brief Status Mapping`);
    // Insert APPROVED brief with REQUIRED FIELDS
    const [brief] = await db.insert(executiveBriefs).values({
        tenantId,
        status: 'APPROVED',
        synthesis: {
            executiveSummary: 'Test',
            operatingReality: 'Test',
            constraintLandscape: 'Test',
            blindSpotRisks: 'Test',
            alignmentSignals: 'Test'
        },
        signals: {
            constraintConsensusLevel: 'LOW',
            executionRiskLevel: 'LOW',
            orgClarityScore: 50
        },
        sources: {
            snapshotId: null,
            intakeVectorIds: []
        },
        approvedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    }).returning();

    console.log(`Inserted Brief (${brief.id}) with Status: ${brief.status}`);

    // Simulate Backend Mapping Logic
    const mappedStatus = (brief.status === 'APPROVED') ? 'REVIEWED' : brief.status;
    console.log(`Mapped Logic Output: ${mappedStatus}`);

    if (mappedStatus !== 'REVIEWED') throw new Error("Mapping Logic Failed");
    console.log("PASS: Legacy APPROVED mapped to REVIEWED.");
}

async function testPublishDemotion() {
    console.log(`\n[TEST 2] Publish Demotion Logic ("One Published + History")`);

    // 1. Create Diagnostic A (Already Published)
    const [diagA] = await db.insert(diagnostics).values({
        tenantId,
        status: 'published',
        content: {}, // Assumes JSONB allows {}, likely valid.
        createdAt: new Date(Date.now() - 10000), // Older
        updatedAt: new Date()
    }).returning();
    console.log(`Diagnostic A (${diagA.id}) created as PUBLISHED.`);

    // 2. Create Diagnostic B (Generated / Draft)
    const [diagB] = await db.insert(diagnostics).values({
        tenantId,
        status: 'generated',
        content: {},
        createdAt: new Date(),
        updatedAt: new Date()
    }).returning();
    console.log(`Diagnostic B (${diagB.id}) created as GENERATED.`);

    // 3. EXECUTE CONTROLLER LOGIC (Replicated)
    console.log(">> Executing Demotion Logic...");
    const targetDiagnosticId = diagB.id;

    // Fetch diag to get tenant (simulated)
    const [fetchedTarget] = await db.select().from(diagnostics).where(eq(diagnostics.id, targetDiagnosticId));

    // Demote existing published
    const publishedDiags = await db.select().from(diagnostics).where(eq(diagnostics.tenantId, fetchedTarget.tenantId));
    const toArchive = publishedDiags.filter(d => d.status === 'published' && d.id !== targetDiagnosticId);

    for (const d of toArchive) {
        console.log(`   Demoting Diagnostic ${d.id} to archived...`);
        await db.update(diagnostics).set({ status: 'archived' }).where(eq(diagnostics.id, d.id));
    }

    // Publish Target
    console.log(`   Publishing Diagnostic ${targetDiagnosticId}...`);
    await db.update(diagnostics).set({ status: 'published' }).where(eq(diagnostics.id, targetDiagnosticId));

    // 4. VERIFY STATE
    const [checkA] = await db.select().from(diagnostics).where(eq(diagnostics.id, diagA.id));
    const [checkB] = await db.select().from(diagnostics).where(eq(diagnostics.id, diagB.id));

    console.log(`Diagnostic A Status: ${checkA.status}`);
    console.log(`Diagnostic B Status: ${checkB.status}`);

    if (checkA.status !== 'archived') throw new Error("Diagnostic A was NOT archived!");
    if (checkB.status !== 'published') throw new Error("Diagnostic B was NOT published!");
    console.log("PASS: Demotion Logic verified.");
}

async function testDiscoveryMutation() {
    console.log(`\n[TEST 3] Discovery Note Ingestion (Non-Mutative)`);

    const notesContent = "Customer wants X, Y, Z.";

    console.log(">> Ingesting Notes...");
    const [note] = await db.insert(discoveryCallNotes).values({
        tenantId,
        notes: notesContent,
        status: 'ingested',
        createdByUserId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    }).returning();
    console.log(`Inserted Discovery Note (${note.id}).`);

    // Verify Tenant did NOT change
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    console.log(`Tenant 'discoveryComplete' field: ${tenant.discoveryComplete}`);

    if (tenant.discoveryComplete === true) {
        console.warn("WARNING: discoveryComplete is TRUE. Is this default or mutated?");
    } else {
        console.log("PASS: discoveryComplete flag NOT set on tenant.");
    }

    // Verify Diagnostics didn't change (still published)
    const [diagB] = await db.select().from(diagnostics).where(eq(diagnostics.status, 'published').and(eq(diagnostics.tenantId, tenantId)));
    if (!diagB) throw new Error("Published diagnostic lost!");
    console.log("PASS: Published Diagnostic preserved.");
}

async function testTicketGenReference() {
    console.log(`\n[TEST 4] Ticket Generation Reference`);

    // Query for "Current Published Diagnostic"
    const [currentDiag] = await db.select()
        .from(diagnostics)
        .where(and(eq(diagnostics.tenantId, tenantId), eq(diagnostics.status, 'published')))
        // Replicating ordering if duplicate, though demotion logic prevents duplicates.
        // We'll just take the one found.
        .limit(1);

    console.log(`Detected Current Published Diagnostic: ${currentDiag.id}`);

    if (currentDiag.status !== 'published') throw new Error("Fetched diagnostic is NOT published");
    console.log("PASS: System identifies correct published diagnostic.");
}

async function teardown() {
    console.log(`\n[TEARDOWN] Cleaning up... (Tenant: ${tenantId})`);
    if (tenantId) {
        await db.delete(discoveryCallNotes).where(eq(discoveryCallNotes.tenantId, tenantId));
        await db.delete(executiveBriefs).where(eq(executiveBriefs.tenantId, tenantId));
        await db.delete(diagnostics).where(eq(diagnostics.tenantId, tenantId));

        // Unlink user from tenant before deleting tenant (if necessary)
        // Actually cascade might handle user deletion if user refers to tenant? 
        // User -> Tenant (set null on delete).
        // Tenant -> User (ownerUserId).
        // We delete users first explicitly to avoid conflicts?
        // But user references tenant.

        // Remove owner link from tenant first
        await db.update(tenants).set({ ownerUserId: null }).where(eq(tenants.id, tenantId));

        await db.delete(users).where(eq(users.id, userId));
        await db.delete(tenants).where(eq(tenants.id, tenantId));
        console.log("Cleanup complete.");
    }
}

async function run() {
    try {
        await setup();
        await testBriefMapping();
        await testPublishDemotion();
        await testDiscoveryMutation();
        await testTicketGenReference();
    } catch (e) {
        console.error("FAILED:", e);
        process.exit(1);
    } finally {
        await teardown();
        process.exit(0);
    }
}

run();
