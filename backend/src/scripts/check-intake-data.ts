import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkIntakeData() {
    const sql = postgres(process.env.DATABASE_URL!);

    const DEMO_TENANTS = [
        { id: '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64', name: 'Hayes Real Estate Group' },
        { id: 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06', name: 'BrightFocus Marketing' }
    ];

    console.log('\n🔍 INTAKE DATA CHECK\n');
    console.log('='.repeat(60));

    for (const tenant of DEMO_TENANTS) {
        console.log(`\n📊 ${tenant.name}\n`);

        // Check intakes
        const intakes = await sql`
      SELECT id, role, status, completed_at, created_at
      FROM intakes
      WHERE tenant_id = ${tenant.id}
      ORDER BY created_at DESC
    `;

        console.log(`  Total Intakes: ${intakes.length}`);

        if (intakes.length > 0) {
            console.log(`\n  Intake Details:`);
            for (const intake of intakes) {
                console.log(`    - Role: ${intake.role}`);
                console.log(`      Status: ${intake.status}`);
                console.log(`      Completed: ${intake.completed_at || 'Not completed'}`);
                console.log(`      Created: ${intake.created_at}\n`);
            }
        }

        // Check discovery notes
        const discovery = await sql`
      SELECT id, created_at
      FROM discovery_call_notes
      WHERE tenant_id = ${tenant.id}
      ORDER BY created_at DESC
      LIMIT 1
    `;

        console.log(`  Discovery Call Notes: ${discovery.length > 0 ? 'Yes' : 'No'}`);
        if (discovery.length > 0) {
            console.log(`    Created: ${discovery[0].created_at}`);
        }

        // Check users
        const users = await sql`
      SELECT id, email, role, name
      FROM users
      WHERE tenant_id = ${tenant.id}
    `;

        console.log(`\n  Users: ${users.length}`);
        for (const user of users) {
            console.log(`    - ${user.email} (${user.role}) - ${user.name}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    await sql.end();
}

checkIntakeData().catch(console.error);
