/**
 * Apply migration 040: findings_canonical hardening
 * Adds artifact_hash, is_immutable, and partial unique index.
 * Pre-migration audit must pass before running this.
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
        const migrationPath = path.join(__dirname, '../db/migrations/040_findings_canonical_hardening.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('🚀 Applying migration 040_findings_canonical_hardening.sql...');
        await sql.unsafe(migrationSQL);
        console.log('✅ Migration applied successfully!');
        console.log('   - artifact_hash column added');
        console.log('   - is_immutable column added');
        console.log('   - tenant_documents_canonical_findings_unique partial index created');

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await sql.end();
        process.exit(1);
    }
}

run();
