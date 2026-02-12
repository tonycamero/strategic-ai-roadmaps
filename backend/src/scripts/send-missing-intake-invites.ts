import 'dotenv/config';
import { db } from '../db/index.ts';
import { intakeVectors, invites, tenants, users } from '../db/schema.ts';
import { eq, and, isNull, ne } from 'drizzle-orm';
import { generateInviteToken } from '../utils/auth';
import * as emailService from '../services/email.service';

/**
 * One-time backfill script to dispatch missing invites for a specific tenant.
 * Targeted at unblocking Team Intakes phase.
 * 
 * Target Tenant: ec32ea41-d056-462d-8321-c2876c9af263
 */

const TARGET_TENANT_ID = 'ec32ea41-d056-462d-8321-c2876c9af263';

function mapRoleTypeToUserRole(roleType: string): any {
    switch (roleType) {
        case 'SALES_LEAD': return 'sales';
        case 'DELIVERY_LEAD': return 'delivery';
        case 'EXECUTIVE': return 'ops';
        case 'FACILITATOR': return 'ops';
        case 'OPERATIONAL_LEAD': return 'ops';
        default: return 'ops';
    }
}

async function run() {
    console.log(`[Backfill] 🚀 Starting invite dispatch for tenant: ${TARGET_TENANT_ID}`);

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, TARGET_TENANT_ID))
        .limit(1);

    if (!tenant) {
        console.error('[Backfill] ❌ Tenant not found. Aborting.');
        process.exit(1);
    }

    const [ownerUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, tenant.ownerUserId || ''))
        .limit(1);

    const inviterName = ownerUser?.name || 'Your Team Lead';

    // Find all vectors for this tenant with a recipient email and NO linked intake
    const vectors = await db
        .select()
        .from(intakeVectors)
        .where(and(
            eq(intakeVectors.tenantId, TARGET_TENANT_ID),
            ne(intakeVectors.recipientEmail, ''),
            isNull(intakeVectors.intakeId)
        ));

    console.log(`[Backfill] 🔍 Found ${vectors.length} candidate(s) for dispatch.`);

    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    for (const vector of vectors) {
        if (!vector.recipientEmail) continue;

        console.log(`[Backfill] Internal role: ${vector.roleLabel} (to: ${vector.recipientEmail})`);

        try {
            const role = mapRoleTypeToUserRole(vector.roleType);

            // Check for existing invite
            let [existingInvite] = await db
                .select()
                .from(invites)
                .where(and(
                    eq(invites.email, vector.recipientEmail),
                    eq(invites.tenantId, tenant.id)
                ))
                .limit(1);

            if (existingInvite?.accepted) {
                console.log(` - ⏭️  Skipping: stakeholder has already accepted an invite record.`);
                skipCount++;
                continue;
            }

            let inviteToken = existingInvite?.token;
            if (!inviteToken) {
                console.log(` - 🎫 Creating fresh invite token...`);
                inviteToken = generateInviteToken();
                const [newInvite] = await db
                    .insert(invites)
                    .values({
                        email: vector.recipientEmail,
                        role,
                        token: inviteToken,
                        tenantId: tenant.id,
                        accepted: false,
                    })
                    .returning();
                inviteToken = newInvite.token;
            }

            console.log(` - 📧 Dispatching email via Resend...`);
            const result = await emailService.sendInviteEmail(
                vector.recipientEmail,
                inviteToken,
                inviterName,
                tenant.name,
                vector.roleLabel
            );

            // Update vector status
            await db
                .update(intakeVectors)
                .set({
                    inviteStatus: 'SENT',
                    updatedAt: new Date()
                })
                .where(eq(intakeVectors.id, vector.id));

            console.log(` - ✅ SUCCESS: msgId=${result?.id}`);
            successCount++;
        } catch (err: any) {
            console.error(` - ❌ FAILED: ${err.message}`);
            failCount++;
        }
    }

    console.log(`\n[Backfill] 🏁 Finished.`);
    console.log(` - Success: ${successCount}`);
    console.log(` - Skipped: ${skipCount}`);
    console.log(` - Failed:  ${failCount}`);

    process.exit(0);
}

run().catch(err => {
    console.error('[Backfill] 🔥 Fatal error:', err);
    process.exit(1);
});
