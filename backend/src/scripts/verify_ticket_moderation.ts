import 'dotenv/config';
import { db } from '../db';
import { tenants, users, sopTickets } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDiagnosticTickets, approveDiagnosticTickets, rejectDiagnosticTickets } from '../controllers/ticketModeration.controller';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

// Mock Response object
interface MockResponse extends Response {
    statusCode: number;
    body: any;
}

const mockRes = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.body = data;
        return res;
    };
    return res as MockResponse;
};

async function verifyTicketModeration() {
    console.log('🔒 Verifying CR-UX-6: Diagnostic Review & Ticket Moderation...\n');

    try {
        // 1. Setup Tenant & Users
        const tenantId = randomUUID();
        const delegateId = randomUUID();
        const execId = randomUUID();
        const diagnosticId = randomUUID();

        console.log('1. Setting up test data...');

        // Create Tenant
        await db.insert(tenants).values({
            id: tenantId,
            name: 'Moderation Test Corp',
            domain: 'modtest.com',
            status: 'active',
            intakeWindowState: 'CLOSED', // Relevant for context, though moderation happens after
            lastDiagnosticId: diagnosticId
        } as any);

        // Create Users
        await db.insert(users).values([
            {
                id: delegateId,
                tenantId,
                email: `delegate_${tenantId}@modtest.com`,
                role: 'ops', // Client Team Member
                name: 'Chris Client',
                passwordHash: 'dummy_hash'
            },
            {
                id: execId,
                tenantId,
                email: `exec_${tenantId}@modtest.com`,
                role: 'owner', // Executive
                name: 'Erica Exec',
                passwordHash: 'dummy_hash'
            }
        ]);

        // Create 3 Tickets (All Pending initially)
        const ticket1Id = randomUUID(); // To be Approved
        const ticket2Id = randomUUID(); // To be Rejected
        const ticket3Id = randomUUID(); // To remain Pending

        await db.insert(sopTickets).values([
            {
                id: ticket1Id,
                tenantId,
                diagnosticId,
                ticketId: 'SOP-001',
                title: 'Ticket to Approve',
                category: 'Process',
                priority: 'high',
                sprint: 1,
                timeEstimateHours: 5,
                costEstimate: 100,
                projectedHoursSavedWeekly: 2,
                projectedLeadsRecoveredMonthly: 0,
                painSource: 'Test Source',
                description: 'Test Description',
                currentState: 'Test Current State',
                targetState: 'Test Target State',
                aiDesign: 'Test AI Design',
                ghlImplementation: 'Test GHL Implementation',
                owner: 'Test Owner',
                successMetric: 'Test Metric',
                roadmapSection: 'Test Section'
            },
            {
                id: ticket2Id,
                tenantId,
                diagnosticId,
                ticketId: 'SOP-002',
                title: 'Ticket to Reject',
                category: 'Automation',
                priority: 'low',
                sprint: 2,
                timeEstimateHours: 2,
                costEstimate: 0,
                projectedHoursSavedWeekly: 1,
                projectedLeadsRecoveredMonthly: 0,
                painSource: 'Test Source',
                description: 'Test Description',
                currentState: 'Test Current State',
                targetState: 'Test Target State',
                aiDesign: 'Test AI Design',
                ghlImplementation: 'Test GHL Implementation',
                owner: 'Test Owner',
                successMetric: 'Test Metric',
                roadmapSection: 'Test Section'
            },
            {
                id: ticket3Id,
                tenantId,
                diagnosticId,
                ticketId: 'SOP-XXX',
                title: 'Pending Ticket',
                category: 'People',
                priority: 'medium',
                sprint: 1,
                timeEstimateHours: 10,
                costEstimate: 500,
                projectedHoursSavedWeekly: 5,
                projectedLeadsRecoveredMonthly: 1,
                painSource: 'Test Source',
                description: 'Test Description',
                currentState: 'Test Current State',
                targetState: 'Test Target State',
                aiDesign: 'Test AI Design',
                ghlImplementation: 'Test GHL Implementation',
                owner: 'Test Owner',
                successMetric: 'Test Metric',
                roadmapSection: 'Test Section'
            }
        ] as any);

        console.log('✅ Test data created.\n');

        // 2. Test Client Team Member Visibility (Before Moderation)
        console.log('2. Testing Client Team Visibility (Pre-Moderation)...');
        const reqClientTeamMember = {
            params: { tenantId, diagnosticId },
            user: { role: 'ops', tenantId, userId: delegateId }
        } as unknown as AuthRequest;

        const resClientTeamMember1 = mockRes();
        await getDiagnosticTickets(reqClientTeamMember, resClientTeamMember1);

        if (resClientTeamMember1.body.tickets.length === 3) {
            console.log('✅ Client Team Member sees all 3 pending tickets.');
        } else {
            console.error('❌ Client Team Member failed to see tickets:', resClientTeamMember1.body);
        }

        // 3. Exec Moderating Tickets (Owner Auths)...

        // CR-UX-6A: Test that Ops CANNOT moderate
        console.log('   Testing Ops Access (Should Fail)...');
        const reqOpsFail = {
            body: { tenantId, diagnosticId, ticketIds: [ticket1Id], adminNotes: 'Ops trying to approve' },
            user: { role: 'ops', tenantId, userId: delegateId }
        } as unknown as AuthRequest;

        const resOps = mockRes();
        const opsResult = await approveDiagnosticTickets(reqOpsFail, resOps);

        if (resOps.statusCode === 403) {
            console.log('   ✅ Ops user correctly blocked (403).');
        } else {
            throw new Error(`❌ Ops user was NOT blocked: ${resOps.statusCode}`);
        }

        // Approve Ticket 1 (As Owner)
        const reqExecApprove = {
            body: { tenantId, diagnosticId, ticketIds: [ticket1Id], adminNotes: 'Good content' },
            user: { role: 'owner', tenantId, userId: execId } // Authenticated as Owner
        } as unknown as AuthRequest;

        await approveDiagnosticTickets(reqExecApprove, mockRes());

        // Reject Ticket 2 (As Owner)
        const reqExecReject = {
            body: { tenantId, diagnosticId, ticketIds: [ticket2Id], adminNotes: 'Bad idea' },
            user: { role: 'owner', tenantId, userId: execId }
        } as unknown as AuthRequest;
        await rejectDiagnosticTickets(reqExecReject, mockRes());

        console.log('✅ Tickets moderated by Owner (1 Approved, 1 Rejected).');

        // 4. Test Client Team Visibility (Post-Moderation & Payload Safety)
        console.log('\n4. Testing Client Team Visibility (Post-Moderation)...');

        const resClientTeamMember2 = mockRes();
        await getDiagnosticTickets(reqClientTeamMember, resClientTeamMember2);

        const visibleTickets = resClientTeamMember2.body.tickets;

        // CR-UX-6A: Payload Check
        const firstTicket = visibleTickets[0];
        if (firstTicket) {
            if ('adminNotes' in firstTicket) {
                throw new Error('❌ FAIL: adminNotes key leaked to delegate!');
            } else {
                console.log('✅ adminNotes key explicitly absent for Client Team Member.');
            }

            if ('costEstimate' in firstTicket) {
                throw new Error('❌ FAIL: costEstimate leaked to delegate!');
            } else {
                console.log('✅ costEstimate correctly hidden.');
            }

            if ('successMetric' in firstTicket) {
                throw new Error('❌ FAIL: successMetric leaked to delegate!');
            } else {
                console.log('✅ successMetric correctly hidden.');
            }
        }

        // Check counts
        // Should see: Ticket 1 (Approved), Ticket 3 (Pending). 
        // Should NOT see: Ticket 2 (Rejected).
        const hasRejected = visibleTickets.find((t: any) => t.id === ticket2Id);
        if (!hasRejected) {
            console.log('✅ Rejected ticket is HIDDEN from Client Team Member.');
        } else {
            throw new Error('❌ FAIL: Rejected ticket is visible to Client Team Member.');
        }

        const approvedTicket = visibleTickets.find((t: any) => t.id === ticket1Id);
        if (approvedTicket) {
            if (approvedTicket.approved === true) {
                console.log('✅ Approved ticket is visible.');
            }
        }

        // 5. Test Executive Visibility
        console.log('\n5. Testing Executive Visibility...');
        const reqExecRead = {
            params: { tenantId, diagnosticId },
            user: { role: 'owner', tenantId, userId: execId }
        } as unknown as AuthRequest;

        const resExec = mockRes();
        await getDiagnosticTickets(reqExecRead, resExec);

        if (resExec.body.tickets.length === 3) {
            console.log('✅ Executive sees ALL 3 tickets (including Rejected).');
        } else {
            console.error('❌ Executive missing tickets:', resExec.body.tickets.length);
        }

        const rejectedTicketExec = resExec.body.tickets.find((t: any) => t.id === ticket2Id);
        if (rejectedTicketExec && rejectedTicketExec.adminNotes === 'Bad idea') {
            console.log('✅ Executive sees Admin Notes.');
        } else {
            console.error('❌ Executive missing notes.');
        }

        // Cleanup
        await db.delete(sopTickets).where(eq(sopTickets.tenantId, tenantId));
        await db.delete(users).where(eq(users.tenantId, tenantId));
        await db.delete(tenants).where(eq(tenants.id, tenantId));

        console.log('\n✅ Verification Complete: CR-UX-6 logic holds.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}

verifyTicketModeration();
