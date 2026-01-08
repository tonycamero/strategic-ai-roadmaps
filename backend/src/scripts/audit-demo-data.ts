import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkAllData() {
    const sql = postgres(process.env.DATABASE_URL!);

    const DEMO_TENANTS = [
        { id: '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64', name: 'Hayes Real Estate Group' },
        { id: 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06', name: 'BrightFocus Marketing' }
    ];

    console.log('\n🔍 COMPLETE DATA AUDIT\n');
    console.log('='.repeat(60));

    for (const tenant of DEMO_TENANTS) {
        console.log(`\n📊 ${tenant.name}\n`);

        // Roadmaps
        const roadmaps = await sql`SELECT COUNT(*) as count FROM roadmaps WHERE tenant_id = ${tenant.id}`;
        console.log(`  Roadmaps: ${roadmaps[0].count}`);

        // Roadmap sections
        const sections = await sql`
      SELECT COUNT(*) as count 
      FROM roadmap_sections rs
      JOIN roadmaps r ON rs.roadmap_id = r.id
      WHERE r.tenant_id = ${tenant.id}
    `;
        console.log(`  Roadmap Sections: ${sections[0].count}`);

        // SOP tickets
        const tickets = await sql`SELECT COUNT(*) as count FROM sop_tickets WHERE tenant_id = ${tenant.id}`;
        console.log(`  SOP Tickets: ${tickets[0].count}`);

        // Intakes
        const intakes = await sql`SELECT COUNT(*) as count FROM intakes WHERE tenant_id = ${tenant.id}`;
        console.log(`  Intakes: ${intakes[0].count}`);

        // Agent configs
        const configs = await sql`SELECT COUNT(*) as count FROM agent_configs WHERE tenant_id = ${tenant.id}`;
        console.log(`  Agent Configs: ${configs[0].count}`);

        // Onboarding state
        const onboarding = await sql`SELECT COUNT(*) as count FROM onboarding_states WHERE tenant_id = ${tenant.id}`;
        console.log(`  Onboarding States: ${onboarding[0].count}`);
    }

    console.log('\n' + '='.repeat(60));
    await sql.end();
}

checkAllData().catch(console.error);
