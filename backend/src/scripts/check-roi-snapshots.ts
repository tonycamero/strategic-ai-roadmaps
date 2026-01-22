import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkROISnapshots() {
    const sql = postgres(process.env.DATABASE_URL!);

    const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

    console.log('\n🔍 ROI SNAPSHOT DATA CHECK\n');
    console.log('='.repeat(60));

    // Check implementation_snapshots table
    const snapshots = await sql`
    SELECT *
    FROM implementation_snapshots
    WHERE tenant_id = ${HAYES_TENANT_ID}
    ORDER BY snapshot_date DESC
  `;

    console.log(`\n📊 Implementation Snapshots: ${snapshots.length}\n`);

    if (snapshots.length === 0) {
        console.log('❌ No ROI snapshots found in database');
    } else {
        snapshots.forEach(snap => {
            console.log(`  Snapshot ID: ${snap.id}`);
            console.log(`  Label: ${snap.label}`);
            console.log(`  Date: ${snap.snapshot_date}`);
            console.log(`  Source: ${snap.source}`);
            console.log(`  Metrics:`, snap.metrics);
            console.log(`  Notes: ${snap.notes || '(none)'}`);
            console.log(`  Created: ${snap.created_at}\n`);
        });
    }

    // Check roadmap_outcomes table
    const outcomes = await sql`
    SELECT *
    FROM roadmap_outcomes
    WHERE tenant_id = ${HAYES_TENANT_ID}
  `;

    console.log(`📈 Roadmap Outcomes: ${outcomes.length}\n`);

    if (outcomes.length === 0) {
        console.log('❌ No roadmap outcomes found');
    } else {
        outcomes.forEach(outcome => {
            console.log(`  Outcome ID: ${outcome.id}`);
            console.log(`  Roadmap ID: ${outcome.roadmap_id}`);
            console.log(`  Baseline Snapshot: ${outcome.baseline_snapshot_id || 'None'}`);
            console.log(`  30d Snapshot: ${outcome.at_30d_snapshot_id || 'None'}`);
            console.log(`  60d Snapshot: ${outcome.at_60d_snapshot_id || 'None'}`);
            console.log(`  90d Snapshot: ${outcome.at_90d_snapshot_id || 'None'}`);
            console.log(`  Deltas:`, outcome.deltas);
            console.log(`  Realized ROI:`, outcome.realized_roi);
            console.log(`  Status: ${outcome.status}\n`);
        });
    }

    // Check if there's a roadmap for Hayes
    const roadmaps = await sql`
    SELECT id, status, created_at
    FROM roadmaps
    WHERE tenant_id = ${HAYES_TENANT_ID}
  `;

    console.log(`🗺️  Roadmaps: ${roadmaps.length}`);
    if (roadmaps.length > 0) {
        roadmaps.forEach(r => {
            console.log(`  Roadmap ID: ${r.id}`);
            console.log(`  Status: ${r.status}`);
            console.log(`  Created: ${r.created_at}\n`);
        });
    }

    console.log('='.repeat(60));
    await sql.end();
}

checkROISnapshots().catch(console.error);
