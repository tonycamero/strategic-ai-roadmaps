import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkDiagnosticOutputs() {
    const sql = postgres(process.env.DATABASE_URL!);

    const DEMO_TENANTS = [
        { id: '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64', name: 'Hayes Real Estate Group' },
        { id: 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06', name: 'BrightFocus Marketing' }
    ];

    console.log('\n🔍 DIAGNOSTIC OUTPUTS CHECK\n');
    console.log('='.repeat(60));

    for (const tenant of DEMO_TENANTS) {
        console.log(`\n📊 ${tenant.name}\n`);

        // Check tenant_documents for SOP-01 outputs
        const sop01Docs = await sql`
      SELECT id, title, sop_number, output_number, created_at
      FROM tenant_documents
      WHERE tenant_id = ${tenant.id} AND sop_number = 'SOP-01'
      ORDER BY created_at DESC
    `;

        console.log(`  SOP-01 Documents: ${sop01Docs.length}`);
        if (sop01Docs.length > 0) {
            sop01Docs.forEach(doc => {
                console.log(`    - ${doc.title} (${doc.output_number})`);
                console.log(`      Created: ${doc.created_at}`);
            });
        }

        // Check diagnostic_snapshots
        const snapshots = await sql`
      SELECT id, team_session_id, created_at
      FROM diagnostic_snapshots
      WHERE team_session_id LIKE ${tenant.id + '%'}
      ORDER BY created_at DESC
      LIMIT 5
    `;

        console.log(`\n  Diagnostic Snapshots: ${snapshots.length}`);
        if (snapshots.length > 0) {
            snapshots.forEach(snap => {
                console.log(`    - Session: ${snap.team_session_id}`);
                console.log(`      Created: ${snap.created_at}`);
            });
        }

        // Check lastDiagnosticId on tenant
        const tenantInfo = await sql`
      SELECT last_diagnostic_id, updated_at
      FROM tenants
      WHERE id = ${tenant.id}
    `;

        console.log(`\n  Last Diagnostic ID: ${tenantInfo[0].last_diagnostic_id || 'None'}`);
        console.log(`  Tenant Updated: ${tenantInfo[0].updated_at}`);

        // Check SOP tickets count again
        const tickets = await sql`
      SELECT COUNT(*) as count, diagnostic_id
      FROM sop_tickets
      WHERE tenant_id = ${tenant.id}
      GROUP BY diagnostic_id
    `;

        console.log(`\n  SOP Tickets by Diagnostic:`);
        if (tickets.length === 0) {
            console.log(`    (none)`);
        } else {
            tickets.forEach(t => {
                console.log(`    - Diagnostic ${t.diagnostic_id}: ${t.count} tickets`);
            });
        }
    }

    console.log('\n' + '='.repeat(60));
    await sql.end();
}

checkDiagnosticOutputs().catch(console.error);
