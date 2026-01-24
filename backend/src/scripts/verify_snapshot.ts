
import { getTenantSnapshot } from '../controllers/snapshot.controller';
import { Request, Response } from 'express';

// Mock Express
const mockRequest = (userRole: string, tenantId: string) => ({
    params: { tenantId },
    user: { userId: 'user-123', role: userRole }
} as unknown as Request);

const mockResponse = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.data = data;
        return res;
    };
    return res as Response & { statusCode: number; data: any };
};

// Mock DB
jest.mock('../db', () => ({
    db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue([
            // Mock Ticket Data
            { id: 't1', category: 'sales', moderationStatus: 'approved', timeEstimateHours: 2, priority: 'high', title: 'Manual entry' },
            { id: 't2', category: 'ops', moderationStatus: 'rejected', timeEstimateHours: 0, priority: 'low', title: 'Auto sync' }
        ])
    }
}));
// We can't easily mock module imports in a script like this without a proper test runner.
// So instead, I will write a script that attempts to hit the locally running server if possible, 
// OR just unit test the controller logic by mocking the db dependency manually if I can inject it.
// Given strict TS environment, I'll rely on a script that imports the controller and mocks the DB call *if* I can.
// But better yet, I will use the *actual* backend verification pattern used previously:
// Run the server and hit it with fetch/axios?
// No, the previous `verify_roadmap_finalization.ts` imported controllers and mocked DB *inside* the script using jest hacks or manual mocks?
// Let's look at `verify_roadmap_finalization.ts` again.

// It used `import { db } from '../db';` and then it would try to run against the real DB if connected, or fail.
// Code interaction summary said: "Enhanced database setup... Added test cases".
// It seems it was running mostly as a unit test with mocks or against a local DB.

// I will create a simple script that mocks the Request/Response and calls the controller.
// But I need to mock the `db` import.
// Since I can't easily overwrite the `import { db }` in a running node script without a test runner (jest),
// I will just verify the *Availability* of the endpoint by checking the route registration. 
// AND I will rely on the type checker for now. 
// Actually, I can use the `frontend/api.ts` update to "verify" compilation.

// Let's create a *Client-side* verification script that simulates a fetch? No.
// I will create a backend script that uses `node-mocks-http` logic (manual mock) IF I can mock the DB.
// If I can't mock the DB, I have to assume the DB connection works.
// Let's try to just run the controller against the REAL DB if available?
// The user environment has a database.

// Let's write a script that *effectively* integration tests the controller.
// It will require a valid tenantId.
// I'll grab a tenantId from the database first.

import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';

async function verify() {
    console.log('Verifying Snapshot Controller...');

    // 1. Get a Tenant
    const [tenant] = await db.select().from(tenants).limit(1);
    if (!tenant) {
        console.error('No tenants found to test.');
        return;
    }
    console.log(`Testing with tenant: ${tenant.id} (${tenant.name})`);

    // 2. Test Exec Access
    const reqExec = mockRequest('superadmin', tenant.id);
    const resExec = mockResponse();
    await getTenantSnapshot(reqExec, resExec);

    console.log(`[EXEC] Status: ${resExec.statusCode}`);
    if (resExec.statusCode === 200) {
        console.log('  [PASS] Exec Access Granted');
        console.log('  Data Keys:', Object.keys(resExec.data.data));
    } else {
        console.error('  [FAIL] Exec Access Failed');
    }

    // 3. Test Delegate Access
    const reqDel = mockRequest('sales_lead', tenant.id);
    const resDel = mockResponse();
    await getTenantSnapshot(reqDel, resDel);

    console.log(`[DELEGATE] Status: ${resDel.statusCode}`);
    if (resDel.statusCode === 403) {
        console.log('  [PASS] Delegate Access Forbidden');
    } else {
        console.error(`  [FAIL] Delegate Access allowed or wrong error: ${resDel.statusCode}`);
    }
}

verify().catch(console.error);
