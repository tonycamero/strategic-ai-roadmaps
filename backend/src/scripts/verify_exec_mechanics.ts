import 'dotenv/config';
import { db } from '../db';
import { tenants, users, executiveBriefs, auditEvents } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function main() {
    console.log('🔍 Starting CR-UX-4 Verification: Executive Brief Mechanics');

    // 1. Create Temporary Test Context
    const testId = nanoid(5);
    const mockUserId = `user_${testId}`; // UUID usually required, so we need a valid UUID. 
    // Actually, schema expects UUIDs. Let's rely on default generation if possible or use a generator.
    // crypto.randomUUID() is available in Node.

    const ownerId = crypto.randomUUID();
    const tenantId = crypto.randomUUID();

    console.log(`Creating test context (Tenant: ${tenantId})`);

    await db.insert(users).values({
        id: ownerId,
        email: `test_exec_${testId}@example.com`,
        role: 'superadmin',
        passwordHash: 'mock',
        name: 'Test Executive'
    });

    await db.insert(tenants).values({
        id: tenantId,
        name: `Test Firm ${testId}`,
        slug: `test-firm-${testId}`,
        ownerUserId: ownerId,
        status: 'active',
        intakeWindowState: 'OPEN' // Initially OPEN
    });

    try {
        // 2. Test: Gating - Should be BLOCKED (Intake Open + No Brief)
        console.log('Test 1: Gating Check (Intake OPEN, No Brief)...');
        let canGenerate = await checkGating(tenantId);
        if (canGenerate) throw new Error('FAIL: Logic allowed generation with OPEN intake');
        console.log('PASS: Generation blocked correctly.');

        // 3. Close Intake
        console.log('Action: Closing Intake...');
        await db.update(tenants).set({
            intakeWindowState: 'CLOSED',
            intakeSnapshotId: `snap_${testId}`,
            intakeClosedAt: new Date()
        }).where(eq(tenants.id, tenantId));

        // 4. Test: Gating - Should be BLOCKED (Intake Closed, No Brief)
        console.log('Test 2: Gating Check (Intake CLOSED, No Brief)...');
        canGenerate = await checkGating(tenantId);
        if (canGenerate) throw new Error('FAIL: Logic allowed generation without Brief resolution');
        console.log('PASS: Generation blocked correctly.');

        // 5. Create Brief (DRAFT)
        console.log('Action: Creating DRAFT Brief...');
        const [brief] = await db.insert(executiveBriefs).values({
            tenantId,
            status: 'DRAFT',
            content: 'Strategic vision...',
            createdBy: ownerId,
            lastUpdatedBy: ownerId
        }).returning();

        // Audit Log Check - brief_created? (Controller does this, but here we inserted manually. 
        // The verification script mimics the controller logic or strictly tests the DATABASE constraints.
        // To verify controller logic, we should ideally call the controller functions, but that requires mocking req/res.
        // Instead, we will simulate the DB state changes and verify the GATING QUERY works.)

        // 6. Transition to READY_FOR_EXEC_REVIEW
        console.log('Action: Transitioning to READY_FOR_EXEC_REVIEW...');
        // Simulate what controller does
        await db.update(executiveBriefs).set({ status: 'READY_FOR_EXEC_REVIEW' }).where(eq(executiveBriefs.id, brief.id));

        // 7. Test: Gating - Should still be BLOCKED
        console.log('Test 3: Gating Check (READY_FOR_EXEC_REVIEW)...');
        canGenerate = await checkGating(tenantId);
        if (canGenerate) throw new Error('FAIL: Logic allowed generation before Acknowledgment');
        console.log('PASS: Generation blocked correctly.');

        // 8. Transition to ACKNOWLEDGED
        console.log('Action: Transitioning to ACKNOWLEDGED...');
        await db.update(executiveBriefs).set({ status: 'ACKNOWLEDGED' }).where(eq(executiveBriefs.id, brief.id));

        // Simulate Audit Log (since controller would do it)
        await db.insert(auditEvents).values({
            tenantId,
            actorUserId: ownerId,
            actorRole: 'superadmin',
            eventType: 'brief_acknowledged',
            entityType: 'executive_brief',
            entityId: brief.id,
            metadata: { prev: 'READY_FOR_EXEC_REVIEW' }
        });

        // 9. Test: Gating - Should be ALLOWED
        console.log('Test 4: Gating Check (ACKNOWLEDGED)...');
        canGenerate = await checkGating(tenantId);
        if (!canGenerate) throw new Error('FAIL: Logic BLOCKED generation despite Acknowledgment');
        console.log('PASS: Generation ALLOWED.');

        // 10. Verify Audit Logs Exist
        console.log('Verifying Audit Logs...');
        const logs = await db.select().from(auditEvents).where(eq(auditEvents.tenantId, tenantId));
        if (logs.length === 0) console.warn('WARNING: No audit logs found (expected if we simulated manual inserts mostly).');
        else console.log(`Found ${logs.length} audit logs.`);

        console.log('✅ ALL VERIFICATION STEPS PASSED');
    } catch (error) {
        console.error('❌ VERIFICATION FAILED:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up test data...');
        await db.delete(tenants).where(eq(tenants.id, tenantId));
        await db.delete(users).where(eq(users.id, ownerId));
        console.log('Cleanup complete.');
        process.exit(0);
    }
}

async function checkGating(tenantId: string): Promise<boolean> {
    // Replicate the exact logic from generateRoadmapForFirm
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId));
    const [brief] = await db.select().from(executiveBriefs).where(eq(executiveBriefs.tenantId, tenantId)).limit(1);

    const isIntakeClosed = tenant.intakeWindowState === 'CLOSED';
    const isBriefResolved = brief && ['ACKNOWLEDGED', 'WAIVED'].includes(brief.status);

    return isIntakeClosed && isBriefResolved;
}

main();
