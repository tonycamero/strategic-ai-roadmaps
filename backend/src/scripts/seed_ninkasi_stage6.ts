/**
 * Seed Ninkasi tenant_stage6_config
 * Manual seed — not a migration.
 */
import '../config/env';
import postgres from 'postgres';

async function seed() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ DATABASE_URL not found');
        process.exit(1);
    }

    const sql = postgres(connectionString);

    try {
        await sql`
            INSERT INTO tenant_stage6_config (
                tenant_id,
                vertical,
                allowed_namespaces,
                allowed_adapters,
                max_complexity_tier,
                custom_dev_allowed
            )
            VALUES (
                'e4d42754-b394-4562-9df2-85b66ad8e354',
                'generic',
                ARRAY['Pipeline','Ops','Delivery'],
                ARRAY['ghl','sidecar'],
                'medium',
                false
            )
            ON CONFLICT (tenant_id) DO NOTHING
        `;
        console.log('✅ Ninkasi stage6 config seeded');
        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        await sql.end();
        process.exit(1);
    }
}

seed();
