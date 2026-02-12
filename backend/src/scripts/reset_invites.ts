import dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index.ts';
import { invites } from '../db/schema.ts';
import { inArray } from 'drizzle-orm';

async function resetInvites() {
  console.log('[Reset Invites] Resetting invitations to pending status...\n');
  
  const emails = ['owner@scend.cash', 'staff@scend.cash'];
  
  try {
    // Update invites to mark as not accepted
    const result = await db
      .update(invites)
      .set({ accepted: false })
      .where(inArray(invites.email, emails))
      .returning();

    if (result.length === 0) {
      console.log('❌ No invites found for these emails');
      return;
    }

    console.log(`✅ Reset ${result.length} invitation(s) to pending status:\n`);
    result.forEach(invite => {
      console.log(`  - ${invite.email} (${invite.role})`);
    });
    
    console.log('\nThese invitations can now be resent or revoked from the dashboard.');
  } catch (error: any) {
    console.error('❌ Failed to reset invites:', error.message);
  }
}

resetInvites();
