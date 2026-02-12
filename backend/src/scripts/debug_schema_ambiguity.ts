import dotenv from 'dotenv';
import path from 'path';
import { sql } from 'drizzle-orm';

// LOAD ENV FIRST
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

console.log(`[DEBUG] Loaded .env from: ${envPath}`);
console.log(`[DEBUG] DATABASE_URL present: ${!!process.env.DATABASE_URL}`);

async function checkAmbiguity() {
    console.log('🔍 Checking for sop_tickets in ALL schemas...');

    try {
        // Dynamic import DB so it sees the env vars
        const { db } = await import('../db/index.ts');

        // 1. Get Search Path
        const searchPathRes = await db.execute(sql`SHOW search_path`);
        console.log(`📍 Current search_path: ${searchPathRes[0].search_path}`);

        // 2. Find ALL tables named tickets_draft
        const tablesRes = await db.execute(sql`
            SELECT table_schema, table_name
            FROM information_schema.tables 
            WHERE table_name = 'tickets_draft'
        `);

        console.log('\n📋 Found Tables:');
        tablesRes.forEach((row: any) => {
            console.log(` - ${row.table_schema}.${row.table_name}`);
        });

        // 3. For each table, check columns
        for (const row of tablesRes) {
            const schema = row.table_schema;
            const colsRes = await db.execute(sql`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'tickets_draft'
                AND table_schema = ${schema}
            `);
            const cols = colsRes.map((r: any) => r.column_name);
            const hasCategory = cols.includes('category');
            console.log(`\n📊 Schema: "${schema}"`);
            console.log(`   Has 'category': ${hasCategory ? '✅ YES' : '❌ NO'}`);
            console.log(`   Columns: ${cols.sort().join(', ')}`);
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAmbiguity();
