
import { db } from '../db';
import { tenants, users, sopTickets, executiveBriefs, roadmaps, roadmapSections } from '../db/schema';
import { eq } from 'drizzle-orm';
import { finalizeRoadmap, refreshRoadmap, upsertRoadmapSection, updateSectionStatus } from '../controllers/roadmap.controller';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const uuidv4 = randomUUID;

// MOCK Request/Response
interface MockResponse extends Response {
    statusCode: number;
    body: any;
    status: (code: number) => MockResponse;
    json: (body: any) => MockResponse;
}

const mockRes = (): MockResponse => {
    const res: Partial<MockResponse> = {
        statusCode: 200,
        body: null,
        status: function (code: number) {
            this.statusCode = code;
            return this as MockResponse;
        },
        json: function (body: any) {
            this.body = body;
            return this as MockResponse;
        }
    };
    return res as MockResponse;
};

// Types
interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        tenantId?: string;
    };
}

async function runVerification() {
    console.log('🔒 Verifying CR-UX-7: Roadmap Finalization Logic...');

    const runId = crypto.randomUUID().substring(0, 8);
    const tenantId = uuidv4();
    const execId = uuidv4();
    const delegateId = uuidv4();
    const diagnosticId = `diag_${runId}`;

    try {
        // 1. Setup Tenant & Users
        await db.insert(tenants).values({
            id: tenantId,
            name: `Finalize Test Tenant ${runId}`,
            status: 'active',
            intakeWindowState: 'OPEN', // Gate 1: OPEN initially
            lastDiagnosticId: diagnosticId,
            ownerUserId: execId, // Needed for ownership checks
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);

        await db.insert(users).values([
            {
                id: execId,
                email: `exec_${runId}@test.com`,
                name: 'Executive User',
                role: 'owner',
                tenantId,
                passwordHash: 'hash',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: delegateId,
                email: `ops_${runId}@test.com`,
                name: 'Delegate User',
                role: 'ops',
                tenantId,
                passwordHash: 'hash',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ] as any);

        console.log('✅ Setup complete. Tenant Intake is OPEN.');

        // 2. Test Gate 1: Intake Window OPEN -> Should Fail
        console.log('\n2. Testing Gate 1: Intake Window...');
        const reqGate1 = {
            params: { tenantId },
            user: { role: 'owner', tenantId, userId: execId }
        } as unknown as AuthRequest;

        const resGate1 = mockRes();

        await finalizeRoadmap(reqGate1, resGate1);

        if (resGate1.statusCode === 400 && resGate1.body.error.includes('Intake Window must be CLOSED')) {
            console.log('   ✅ Blocked by Open Intake Window.');
        } else {
            throw new Error(`❌ Failed Gate 1 check: ${resGate1.statusCode} ${JSON.stringify(resGate1.body)}`);
        }

        // Close Intake Window
        await db.update(tenants).set({ intakeWindowState: 'CLOSED' }).where(eq(tenants.id, tenantId));
        console.log('   -> Intake Window CLOSED.');

        // 3. Test Gate 2: Executive Brief Missing/Draft -> Should Fail
        console.log('\n3. Testing Gate 2: Executive Brief...');

        // Brief missing
        const resGate2a = mockRes();
        await finalizeRoadmap(reqGate1, resGate2a);
        if (resGate2a.statusCode === 400 && resGate2a.body.error.includes('Brief not found')) {
            console.log('   ✅ Blocked by Missing Brief.');
        } else {
            throw new Error(`❌ Failed Gate 2a check: ${resGate2a.statusCode} ${JSON.stringify(resGate2a.body)}`);
        }

        // Create Draft Brief
        await db.insert(executiveBriefs).values({
            tenantId,
            status: 'DRAFT',
            content: 'Brief content',
            createdBy: execId,
            lastUpdatedBy: execId,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);

        const resGate2b = mockRes();
        await finalizeRoadmap(reqGate1, resGate2b);
        if (resGate2b.statusCode === 400 && resGate2b.body.error.includes('Brief must be ACKNOWLEDGED')) {
            console.log('   ✅ Blocked by Draft Brief.');
        } else {
            throw new Error(`❌ Failed Gate 2b check: ${resGate2b.statusCode} ${JSON.stringify(resGate2b.body)}`);
        }

        // Acknowledge Brief
        await db.update(executiveBriefs).set({ status: 'ACKNOWLEDGED' }).where(eq(executiveBriefs.tenantId, tenantId));
        console.log('   -> Brief ACKNOWLEDGED.');

        // 4. Test Gate 3: Moderation (No Tickets) -> Should Fail
        console.log('\n4. Testing Gate 3: Moderation Status...');
        const resGate3a = mockRes();
        await finalizeRoadmap(reqGate1, resGate3a);
        if (resGate3a.statusCode === 400 && resGate3a.body.error.includes('No tickets found')) {
            console.log('   ✅ Blocked by No Tickets.');
        } else {
            throw new Error(`❌ Failed Gate 3a check: ${resGate3a.statusCode} ${JSON.stringify(resGate3a.body)}`);
        }

        // Insert Pending Tickets
        const ticketId = `T-${runId}`;
        await db.insert(sopTickets).values({
            tenantId,
            diagnosticId,
            ticketId: ticketId,
            title: 'Test Ticket',
            category: 'Sales',
            moderationStatus: 'pending',
            description: 'desc',
            currentState: 'curr',
            targetState: 'target',
            aiDesign: 'ai',
            ghlImplementation: 'ghl',
            owner: 'Sales',
            successMetric: 'metric',
            roadmapSection: 'Systems',
            priority: 'high',
            sprint: 1,
            timeEstimateHours: 5,
            costEstimate: 100,
            painSource: 'pain',
            approved: false,
            createdAt: new Date(),
            updatedAt: new Date()
        } as any);

        const resGate3b = mockRes();
        await finalizeRoadmap(reqGate1, resGate3b);
        if (resGate3b.statusCode === 400 && resGate3b.body.error.includes('Moderation Incomplete')) {
            console.log('   ✅ Blocked by Pending Tickets.');
        } else {
            throw new Error(`❌ Failed Gate 3b check: ${resGate3b.statusCode} ${JSON.stringify(resGate3b.body)}`);
        }

        // Approve Ticket
        await db.update(sopTickets).set({
            moderationStatus: 'approved',
            approved: true,
            moderatedAt: new Date()
        }).where(eq(sopTickets.ticketId, ticketId));
        console.log('   -> Ticket Approved.');

        // 5. Test Authority: Delegate Attempt -> Should Fail
        console.log('\n5. Testing Authority (Delegate)...');
        const reqDelegate = {
            params: { tenantId },
            user: { role: 'ops', tenantId, userId: delegateId }
        } as unknown as AuthRequest;

        const resDelegate = mockRes();
        await finalizeRoadmap(reqDelegate, resDelegate);

        if (resDelegate.statusCode === 403) {
            console.log('   ✅ Delegate correctly blocked (403).');
        } else {
            throw new Error(`❌ Delegate was NOT blocked: ${resDelegate.statusCode}`);
        }

        // 6. Test Success: Executive Finalize
        console.log('\n6. Testing Success (Executive)...');
        const resSuccess = mockRes();
        await finalizeRoadmap(reqGate1, resSuccess);

        if (resSuccess.statusCode === 200 && resSuccess.body.success) {
            console.log('   ✅ Roadmap Finalized successfully.');
        } else {
            throw new Error(`❌ Finalization failed: ${resSuccess.statusCode} ${JSON.stringify(resSuccess.body)}`);
        }

        // Verify DB State
        let roadmap = await db.query.roadmaps.findFirst({
            where: eq(roadmaps.tenantId, tenantId)
        });

        if (roadmap && roadmap.status === 'finalized') {
            console.log('   ✅ DB Status is "finalized".');
        } else {
            throw new Error(`❌ DB Status mismatch: ${roadmap?.status}`);
        }

        // 7. Test Idempotency: Call Finalize Again -> Should return existing, NO duplication
        console.log('\n7. Testing Idempotency...');
        const resIdempotency = mockRes();
        await finalizeRoadmap(reqGate1, resIdempotency);

        if (resIdempotency.statusCode === 200 && resIdempotency.body.data?.alreadyFinalized) {
            console.log('   ✅ Idempotency confirmed (alreadyFinalized: true).');
        } else {
            throw new Error(`❌ Idempotency failed: ${resIdempotency.statusCode} ${JSON.stringify(resIdempotency.body)}`);
        }

        // 8. Test Immutability: Attempt Refresh -> Should Fail (409)
        console.log('\n8. Testing Immutability (Refresh)...');
        const reqRefresh = {
            user: { role: 'owner', tenantId, userId: execId }
        } as unknown as AuthRequest;
        const resRefresh = mockRes();
        await refreshRoadmap(reqRefresh, resRefresh);

        if (resRefresh.statusCode === 409) {
            console.log('   ✅ Refresh blocked on FINALIZED roadmap.');
        } else {
            throw new Error(`❌ Refresh NOT blocked: ${resRefresh.statusCode}`);
        }

        // 9. Test Immutability: Attempt Upsert Section -> Should Fail (409)
        console.log('\n9. Testing Immutability (Upsert Section)...');
        const reqUpsert = {
            user: { role: 'owner', tenantId, userId: execId },
            body: { sectionNumber: 1, sectionName: 'Test', contentMarkdown: 'Update' }
        } as unknown as AuthRequest;
        const resUpsert = mockRes();
        await upsertRoadmapSection(reqUpsert, resUpsert);

        if (resUpsert.statusCode === 409) {
            console.log('   ✅ Upsert blocked on FINALIZED roadmap.');
        } else {
            throw new Error(`❌ Upsert NOT blocked: ${resUpsert.statusCode}`);
        }

        console.log('\n✅ Verification Complete: CR-UX-7 + CR-UX-7B logic holds.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Verification Failed:', error);
        process.exit(1);
    }
}

runVerification();
