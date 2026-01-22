import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const sql = postgres(process.env.DATABASE_URL!);

    // Query 1: Find demo tenants
    console.log('=== DEMO TENANTS ===');
    const tenants = await sql`
    SELECT id, name, created_at, status
    FROM tenants
    WHERE name ILIKE '%Hayes%' OR name ILIKE '%Bright%'
  `;
    console.log(JSON.stringify(tenants, null, 2));

    // Query 2: Count roadmaps
    console.log('\n=== ROADMAPS COUNT ===');
    for (const t of tenants) {
        const count = await sql`SELECT COUNT(*) FROM roadmaps WHERE tenant_id = ${t.id}`;
        console.log(`${t.name}: ${count[0].count}`);
    }

    // Query 3: Count SOP tickets
    console.log('\n=== SOP TICKETS COUNT ===');
    for (const t of tenants) {
        const count = await sql`SELECT COUNT(*) FROM sop_tickets WHERE tenant_id = ${t.id}`;
        console.log(`${t.name}: ${count[0].count}`);
    }

    await sql.end();
}

main().catch(console.error);
