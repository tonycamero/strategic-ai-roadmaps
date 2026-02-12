import '../config/env';
import { db } from '../db/index.ts';
import { sql } from 'drizzle-orm';

async function verifySchema() {
    console.log('🔍 Verifying Stage 6 Schema...');

    try {
        // Check ticket_moderation_sessions
        const sessionCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ticket_moderation_sessions'
      );
    `);

        // Check tickets_draft
        const draftCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets_draft'
      );
    `);

        const sessionsExist = sessionCheck[0].exists;
        const draftsExist = draftCheck[0].exists;

        console.log(`- ticket_moderation_sessions: ${sessionsExist ? '✅ FOUND' : '❌ MISSING'}`);
        console.log(`- tickets_draft:            ${draftsExist ? '✅ FOUND' : '❌ MISSING'}`);

        if (sessionsExist && draftsExist) {
            // Double check columns
            const sessionCols = await db.execute(sql`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'ticket_moderation_sessions'
        `);
            const draftCols = await db.execute(sql`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'tickets_draft'
        `);

            const hasSourceDoc = sessionCols.some((r: any) => r.column_name === 'source_doc_id');
            const hasSprint = draftCols.some((r: any) => r.column_name === 'sprint');

            console.log(`- column source_doc_id:     ${hasSourceDoc ? '✅ FOUND' : '❌ MISSING'}`);
            console.log(`- column sprint:            ${hasSprint ? '✅ FOUND' : '❌ MISSING'}`);

            if (!hasSourceDoc || !hasSprint) {
                console.error('⚠️ Partital Schema Drift Detected! Columns missing.');
                process.exit(1);
            }

            console.log('\n✅ SCHEMA VERIFIED. Stage 6 tables are ready.');
            process.exit(0);
        } else {
            console.error('\n❌ SCHEMA MISSING. db:push did not work.');
            process.exit(1);
        }

    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

verifySchema();
