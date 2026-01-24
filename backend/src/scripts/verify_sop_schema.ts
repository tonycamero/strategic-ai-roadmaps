
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function verifySopSchema() {
    console.log('🔍 Verifying sop_tickets Schema...');

    try {
        const cols = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sop_tickets'
    `);

        const colNames = cols.map((r: any) => r.column_name);
        console.log('Found columns:', colNames.join(', '));

        const expected = ['sprint', 'ghl_implementation', 'category', 'tier', 'roi_notes', 'success_metric'];
        const missing = expected.filter(c => !colNames.includes(c));

        if (missing.length > 0) {
            console.error('❌ MISSING COLUMNS in sop_tickets:', missing.join(', '));
            console.log('This explains the 500 error on fallback query.');
            process.exit(1);
        } else {
            console.log('✅ sop_tickets schema looks correct.');
            process.exit(0);
        }

    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

verifySopSchema();
