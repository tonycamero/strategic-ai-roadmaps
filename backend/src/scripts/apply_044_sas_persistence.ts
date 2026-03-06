/**
 * Apply migration 044: SAS persistence plane
 * EXEC-TICKET-SAS-PERSISTENCE-PLANE-001
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
        const migrationPath = path.join(__dirname, '../db/migrations/044_sas_persistence.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('🚀 Applying migration 044_sas_persistence.sql...');
        await sql.unsafe(migrationSQL);
        console.log('✅ Migration applied successfully!');
        console.log('   - sas_runs table created');
        console.log('   - sas_proposals table created');
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
