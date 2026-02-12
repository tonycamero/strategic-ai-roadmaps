import { config } from '../config/env.ts';
import { sql } from 'drizzle-orm';

async function forceFix() {
    console.log('🔧 Forcing Schema Fix via App Connection...');

    // Dynamic import ensures dotenv is loaded BEFORE db connection initializes
    const { db } = await import('../db.ts');

    try {
        // 1. Add category
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS category VARCHAR(100)`);
        console.log('✅ Checked/Added category');

        // 2. Add tier
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS tier VARCHAR(50)`);
        console.log('✅ Checked/Added tier');

        // 3. Add ghl_implementation
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS ghl_implementation TEXT`);
        console.log('✅ Checked/Added ghl_implementation');

        // 4. Add sprint
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS sprint INTEGER DEFAULT 30`);
        console.log('✅ Checked/Added sprint');

        // 5. Add other fields
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS roi_notes TEXT`);
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS success_metric TEXT`);
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS time_estimate_hours INTEGER DEFAULT 0`);
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS pain_source TEXT`);
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS implementation_steps JSON`);
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS value_category VARCHAR(100)`);
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS cost_estimate INTEGER DEFAULT 0`);
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS projected_hours_saved_weekly INTEGER DEFAULT 0`);
        await db.execute(sql`ALTER TABLE sop_tickets ADD COLUMN IF NOT EXISTS projected_leads_recovered_monthly INTEGER DEFAULT 0`);

        console.log('🎉 All columns verified/added.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fix failed:', err);
        process.exit(1);
    }
}

forceFix();
