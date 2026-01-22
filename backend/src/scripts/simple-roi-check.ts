import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function simpleROICheck() {
    const sql = postgres(process.env.DATABASE_URL!);
    const HAYES_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

    console.log('Checking implementation_snapshots...');
    const snapshots = await sql`SELECT COUNT(*) FROM implementation_snapshots WHERE tenant_id = ${HAYES_ID}`;
    console.log(`Count: ${snapshots[0].count}`);

    console.log('\nChecking roadmap_outcomes...');
    const outcomes = await sql`SELECT COUNT(*) FROM roadmap_outcomes WHERE tenant_id = ${HAYES_ID}`;
    console.log(`Count: ${outcomes[0].count}`);

    if (snapshots[0].count > 0) {
        console.log('\nSnapshot details:');
        const details = await sql`SELECT id, label, snapshot_date, source FROM implementation_snapshots WHERE tenant_id = ${HAYES_ID}`;
        console.log(JSON.stringify(details, null, 2));
    }

    await sql.end();
}

simpleROICheck().catch(console.error);
