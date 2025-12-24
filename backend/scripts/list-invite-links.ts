import 'dotenv/config';
import { db } from '../src/db/index.js';
import { invites } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function listInviteLinks() {
  try {
    const pendingInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.accepted, false));

    console.log('\n📧 Pending Invite Links:\n');

    if (pendingInvites.length === 0) {
      console.log('No pending invites found.');
      process.exit(0);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    pendingInvites.forEach((invite) => {
      console.log(`Email: ${invite.email}`);
      console.log(`Role: ${invite.role}`);
      console.log(`Link: ${frontendUrl}/accept-invite/${invite.token}`);
      console.log(`Created: ${invite.createdAt}`);
      console.log('---');
    });

    console.log(`\nTotal pending invites: ${pendingInvites.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing invites:', error);
    process.exit(1);
  }
}

listInviteLinks();
