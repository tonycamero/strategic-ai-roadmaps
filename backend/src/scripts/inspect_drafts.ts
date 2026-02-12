
import dotenv from 'dotenv';
import path from 'path';
import { sql } from 'drizzle-orm';

// LOAD ENV FIRST
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

console.log(`[INSPECT] Loaded .env from: ${envPath}`);

async function inspect() {
    try {
        const { db } = await import('../db/index.ts');

        const drafts = await db.execute(sql`
            SELECT id, title, category, finding_id, ghl_implementation 
            FROM tickets_draft 
            LIMIT 5
        `);

        console.log(JSON.stringify(drafts, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspect();
