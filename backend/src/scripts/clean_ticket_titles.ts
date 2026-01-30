
import dotenv from 'dotenv';
import path from 'path';
import { sql } from 'drizzle-orm';

// LOAD ENV FIRST
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

console.log(`[CLEANUP] Loaded .env from: ${envPath}`);

async function cleanTitles() {
    console.log('🧹 Cleaning tickets_draft titles...');

    try {
        const { db } = await import('../db');

        // Remove "Proposed: " prefix
        const result = await db.execute(sql`
            UPDATE tickets_draft
            SET title = TRIM(REPLACE(title, 'Proposed: ', ''))
            WHERE title LIKE 'Proposed: %';
        `);

        console.log('✅ Cleaned titles.');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cleanTitles();
