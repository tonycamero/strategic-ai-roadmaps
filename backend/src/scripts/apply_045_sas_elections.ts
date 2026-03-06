/**
 * Apply migration 045: SAS elections audit trail
 * EXEC-TICKET-SAS-ELECTIONS-AUDIT-001
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
        const migrationPath = path.join(__dirname, '../db/migrations/045_sas_elections.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('🚀 Applying migration 045_sas_elections.sql...');
        await sql.unsafe(migrationSQL);
        console.log('✅ Migration applied successfully!');
        console.log('   - sas_elections table created');
        console.log('   - Indexes created');

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await sql.end();
        process.exit(1);
    }
}

run();
