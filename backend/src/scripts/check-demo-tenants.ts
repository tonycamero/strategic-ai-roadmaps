import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function checkDemoTenants() {
    const sql = postgres(process.env.DATABASE_URL!);
    const output: string[] = [];

    try {
        output.push('\n🔍 PHASE 1: DATA EXISTENCE CHECK\n');
        output.push('='.repeat(60));

        // (1) Find tenant rows
        output.push('\n\n1️⃣  TENANT ROWS:\n');
        const tenants = await sql`
      SELECT id, name, created_at, updated_at, business_type, status
      FROM tenants
      WHERE name ILIKE '%Hayes%' OR name ILIKE '%Bright Focus%'
      ORDER BY created_at
    `;

        if (tenants.length === 0) {
            output.push('❌ No demo tenants found!');
        } else {
            tenants.forEach(t => {
                output.push(`  ✓ ${t.name}`);
                output.push(`    ID: ${t.id}`);
                output.push(`    Created: ${t.created_at}`);
                output.push(`    Updated: ${t.updated_at}`);
                output.push(`    Business Type: ${t.business_type}`);
                output.push(`    Status: ${t.status}\n`);
            });
        }

        // (2) Count diagnostics (diagnostic_snapshots) by tenantId
        output.push('\n2️⃣  DIAGNOSTIC SNAPSHOTS COUNT:\n');
        for (const tenant of tenants) {
            const count = await sql`
        SELECT COUNT(*) as count
        FROM diagnostic_snapshots
        WHERE team_session_id LIKE ${tenant.id + '%'}
      `;
            output.push(`  ${tenant.name}: ${count[0].count} diagnostic snapshots`);
        }

        // (3) Count SOP tickets by tenantId
        output.push('\n\n3️⃣  SOP TICKETS COUNT:\n');
        for (const tenant of tenants) {
            const count = await sql`
        SELECT COUNT(*) as count
        FROM sop_tickets
        WHERE tenant_id = ${tenant.id}
      `;
            output.push(`  ${tenant.name}: ${count[0].count} SOP tickets`);
        }

        // (4) Count roadmaps by tenantId
        output.push('\n\n4️⃣  ROADMAPS COUNT:\n');
        for (const tenant of tenants) {
            const count = await sql`
        SELECT COUNT(*) as count
        FROM roadmaps
        WHERE tenant_id = ${tenant.id}
      `;
            output.push(`  ${tenant.name}: ${count[0].count} roadmaps`);
        }

        // (5) Count roadmap sections by tenantId
        output.push('\n\n5️⃣  ROADMAP SECTIONS COUNT:\n');
        for (const tenant of tenants) {
            const sections = await sql`
        SELECT COUNT(*) as count
        FROM roadmap_sections rs
        JOIN roadmaps r ON rs.roadmap_id = r.id
        WHERE r.tenant_id = ${tenant.id}
      `;
            output.push(`  ${tenant.name}: ${sections[0].count} roadmap sections`);
        }

        // (6) Check for soft deletes or status filtering on roadmaps
        output.push('\n\n6️⃣  ROADMAP STATUS BREAKDOWN:\n');
        for (const tenant of tenants) {
            const statuses = await sql`
        SELECT status, COUNT(*) as count
        FROM roadmaps
        WHERE tenant_id = ${tenant.id}
        GROUP BY status
        ORDER BY count DESC
      `;
            output.push(`  ${tenant.name}:`);
            if (statuses.length === 0) {
                output.push(`    (no roadmaps)`);
            } else {
                statuses.forEach(s => {
                    output.push(`    ${s.status}: ${s.count}`);
                });
            }
        }

        output.push('\n' + '='.repeat(60));
        output.push('✅ PHASE 1 COMPLETE\n');

        const result = output.join('\n');
        console.log(result);

        // Write to file
        fs.writeFileSync('/tmp/demo-tenant-diagnostic.txt', result);
        console.log('\n📝 Full output written to /tmp/demo-tenant-diagnostic.txt');

        await sql.end();
    } catch (error) {
        console.error('\n❌ Error:', error);
        await sql.end();
        process.exit(1);
    }
}

checkDemoTenants();
