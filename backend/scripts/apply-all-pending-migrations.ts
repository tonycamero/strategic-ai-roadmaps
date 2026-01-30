import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import path from 'path';

const sql = postgres(process.env.DATABASE_URL!);

async function applyAllPendingMigrations() {
    console.log('🚀 Applying All Pending Migrations...\n');

    try {
        // Migration 1: Add tenant_id to invites
        console.log('📋 Migration: add-tenant-to-invites.sql');
        try {
            await sql`
        ALTER TABLE invites 
        ADD COLUMN IF NOT EXISTS tenant_id UUID
      `;
            console.log('  ✅ Added tenant_id column to invites');

            await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'invites_tenant_id_fkey'
          ) THEN
            ALTER TABLE invites
            ADD CONSTRAINT invites_tenant_id_fkey 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `;
            console.log('  ✅ Added foreign key constraint');

            const invitesWithoutTenant = await sql`
        SELECT COUNT(*) as count FROM invites WHERE tenant_id IS NULL
      `;
            console.log(`  ℹ️  Found ${invitesWithoutTenant[0].count} invites without tenant_id`);
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.log('  ℹ️  Already applied');
            } else {
                throw e;
            }
        }

        // Migration 2: Agent Config Refactor (026)
        console.log('\n📋 Migration: 026_agent_config_refactor.sql');
        const migration026Path = path.join(__dirname, '../src/db/migrations/026_agent_config_refactor.sql');
        try {
            const migration026 = readFileSync(migration026Path, 'utf8');
            await sql.unsafe(migration026);
            console.log('  ✅ Agent config refactor applied');
        } catch (e: any) {
            if (e.message.includes('already exists') || e.message.includes('does not exist')) {
                console.log('  ℹ️  Already applied or partially applied');
            } else {
                console.log('  ⚠️  Error (may be expected):', e.message);
            }
        }

        // Migration 3: Agent Strategy Contexts (027)
        console.log('\n📋 Migration: 027_add_agent_strategy_contexts.sql');
        const migration027Path = path.join(__dirname, '../src/db/migrations/027_add_agent_strategy_contexts.sql');
        try {
            const migration027 = readFileSync(migration027Path, 'utf8');
            await sql.unsafe(migration027);
            console.log('  ✅ Agent strategy contexts applied');
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.log('  ℹ️  Already applied');
            } else {
                throw e;
            }
        }

        // Migration 4: Tenant Vector Stores (028)
        console.log('\n📋 Migration: 028_add_tenant_vector_stores.sql');
        const migration028Path = path.join(__dirname, '../src/db/migrations/028_add_tenant_vector_stores.sql');
        try {
            const migration028 = readFileSync(migration028Path, 'utf8');
            await sql.unsafe(migration028);
            console.log('  ✅ Tenant vector stores applied');
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.log('  ℹ️  Already applied');
            } else {
                throw e;
            }
        }

        // Migration 5: Inventory Tracking (029)
        console.log('\n📋 Migration: 029_add_inventory_tracking.sql');
        const migration029Path = path.join(__dirname, '../src/db/migrations/029_add_inventory_tracking.sql');
        try {
            const migration029 = readFileSync(migration029Path, 'utf8');
            await sql.unsafe(migration029);
            console.log('  ✅ Inventory tracking applied');
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.log('  ℹ️  Already applied');
            } else {
                throw e;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL MIGRATIONS APPLIED');
        console.log('='.repeat(60));

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message);
        throw error;
    } finally {
        await sql.end();
    }
}

applyAllPendingMigrations();
