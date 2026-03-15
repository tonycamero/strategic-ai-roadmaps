import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import path from 'path';

const sql = postgres(process.env.DATABASE_URL!);

async function applyMigration() {
    console.log('🚀 Applying Surface Assignment Migration...\n');

    try {
        const migrationPath = path.join(__dirname, '../src/db/migrations/053_user_surface_assignments.sql');
        const migrationSql = readFileSync(migrationPath, 'utf8');
        
        console.log('📋 Running SQL from 053_user_surface_assignments.sql');
        await sql.unsafe(migrationSql);
        
        console.log('✅ Migration applied successfully');

        // Verify
        const result = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'user_surface_assignments'
        `;
        if (result.length > 0) {
            console.log('🔍 Verification: table user_surface_assignments EXISTS');
        } else {
            console.error('❌ Verification FAILED: table user_surface_assignments NOT FOUND');
        }

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

applyMigration();
