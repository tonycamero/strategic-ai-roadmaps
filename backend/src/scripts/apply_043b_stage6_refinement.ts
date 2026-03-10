/**
 * Apply migration 043b: Refine tenant_stage6_config (JSONB → TEXT[])
 * EXEC-TICKET-STAGE6-CONSTRAINT-PLANE-001
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
        const migrationPath = path.join(__dirname, '../db/migrations/043b_stage6_constraint_plane_refinement.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('🚀 Applying migration 043b_stage6_constraint_plane_refinement.sql...');
        await sql.unsafe(migrationSQL);
        console.log('✅ Migration applied successfully!');
        console.log('   - tenant_stage6_config recreated with TEXT[] columns');
        console.log('   - created_at column added');
        console.log('   - tenant_stage6_config_vertical_idx created');

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await sql.end();
        process.exit(1);
    }
}

run();
