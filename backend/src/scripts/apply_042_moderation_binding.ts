/**
 * Apply migration 042: selection_envelope_id FK to ticket_moderation_sessions
 * EXEC-TICKET-MODERATION-BINDING-001
 */
import '../config/env';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL not found');
        process.exit(1);
    }

    const sql = postgres(connectionString);

    try {
        const migrationPath = path.join(__dirname, '../db/migrations/042_moderation_envelope_binding.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('🚀 Applying migration 042_moderation_envelope_binding.sql...');
        await sql.unsafe(migrationSQL);
        console.log('✅ Migration applied successfully!');
        console.log('   - selection_envelope_id column added to ticket_moderation_sessions');
        console.log('   - FK to selection_envelopes (ON DELETE RESTRICT)');
        console.log('   - tms_selection_envelope_id_idx created');

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await sql.end();
        process.exit(1);
    }
}

run();
