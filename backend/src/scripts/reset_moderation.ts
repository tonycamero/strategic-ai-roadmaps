
import dotenv from 'dotenv';
import path from 'path';

// LOAD ENV FIRST
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

console.log(`[RESET] Loaded .env from: ${envPath}`);

async function resetSession() {
    console.log('🧨 RESETTING Active Moderation Session...');

    try {
        const { db } = await import('../db/index');
        const { ticketModerationSessions } = await import('../db/schema');
        const { eq, inArray } = await import('drizzle-orm');

        // 1. Find Active Sessions
        const activeSessions = await db.select().from(ticketModerationSessions).where(eq(ticketModerationSessions.status, 'active'));

        if (activeSessions.length === 0) {
            console.log('⚠️ No active sessions found.');
            process.exit(0);
        }

        const ids = activeSessions.map(s => s.id);
        console.log(`Found ${ids.length} active sessions: ${ids.join(', ')}`);

        // 2. Delete
        await db.delete(ticketModerationSessions).where(inArray(ticketModerationSessions.id, ids));

        console.log('✅ Active sessions deleted. Drafts cleared via CASCADE.');
        console.log('🔄 You can now clicked "Ticket Moderation" in UI to GEN NEW TICKETS.');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

resetSession();
