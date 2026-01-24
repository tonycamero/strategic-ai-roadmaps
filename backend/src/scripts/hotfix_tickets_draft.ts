
import dotenv from 'dotenv';
import path from 'path';
import { sql } from 'drizzle-orm';

// LOAD ENV FIRST
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

console.log(`[HOTFIX] Loaded .env from: ${envPath}`);

async function applyFix() {
    console.log('🔧 hotfixing tickets_draft table...');

    try {
        const { db } = await import('../db');

        // 1. Add category column if missing
        await db.execute(sql`
            ALTER TABLE tickets_draft 
            ADD COLUMN IF NOT EXISTS category VARCHAR(100);
        `);
        console.log('✅ Added "category" column.');

        // 2. Backfill from finding_category
        await db.execute(sql`
            UPDATE tickets_draft
            SET category = finding_category
            WHERE category IS NULL;
        `);
        console.log('✅ Backfilled "category" from "finding_category".');

        // 3. Add other potentially missing columns from TicketDTO
        // tier, time_estimate_hours, ghl_implementation seem to exist based on schema.ts
        // But verifying schema.ts vs DB is good.
        // Schema says: tier, timeEstimateHours (camelCase in TS, snake_case in DB?)
        // let's check snake_case columns

        await db.execute(sql`
            ALTER TABLE tickets_draft 
            ADD COLUMN IF NOT EXISTS tier VARCHAR(50),
            ADD COLUMN IF NOT EXISTS time_estimate_hours INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS ghl_implementation TEXT;
        `);
        console.log('✅ Ensured other optional columns exist.');

        console.log('🎉 HOTFIX COMPLETE. Restart backend now.');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

applyFix();
