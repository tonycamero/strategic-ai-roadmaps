#!/usr/bin/env node
// Simple migration runner that can be executed directly with node
require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const sql = postgres(process.env.DATABASE_URL);

async function runMigrations() {
    console.log('🚀 Running All Pending Migrations...\n');

    try {
        // Migration 1: Add tenant_id to invites
        console.log('📋 Migration: add-tenant-to-invites');
        try {
            await sql`ALTER TABLE invites ADD COLUMN IF NOT EXISTS tenant_id UUID`;
            console.log('  ✅ Added tenant_id column');

            await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invites_tenant_id_fkey') THEN
            ALTER TABLE invites
            ADD CONSTRAINT invites_tenant_id_fkey 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
          END IF;
        END $$;
      `;
            console.log('  ✅ Added foreign key');
        } catch (e) {
            console.log('  ℹ️  invites migration: ', e.message.substring(0, 80));
        }

        // Migration 2: 026 Agent Config Refactor
        console.log('\n📋 Migration: 026_agent_config_refactor');
        try {
            const migration026 = fs.readFileSync(
                path.join(__dirname, '../src/db/migrations/026_agent_config_refactor.sql'),
                'utf8'
            );
            await sql.unsafe(migration026);
            console.log('  ✅ Applied successfully');
        } catch (e) {
            console.log('  ℹ️  026 status:', e.message.substring(0, 80));
        }

        // Migration 3: 027 Agent Strategy Contexts
        console.log('\n📋 Migration: 027_add_agent_strategy_contexts');
        try {
            const migration027 = fs.readFileSync(
                path.join(__dirname, '../src/db/migrations/027_add_agent_strategy_contexts.sql'),
                'utf8'
            );
            await sql.unsafe(migration027);
            console.log('  ✅ Applied successfully');
        } catch (e) {
            console.log('  ℹ️  027 status:', e.message.substring(0, 80));
        }

        // Migration 4: 028 Tenant Vector Stores
        console.log('\n📋 Migration: 028_add_tenant_vector_stores');
        try {
            const migration028 = fs.readFileSync(
                path.join(__dirname, '../src/db/migrations/028_add_tenant_vector_stores.sql'),
                'utf8'
            );
            await sql.unsafe(migration028);
            console.log('  ✅ Applied successfully');
        } catch (e) {
            console.log('  ℹ️  028 status:', e.message.substring(0, 80));
        }

        // Migration 5: 029 Inventory Tracking
        console.log('\n📋 Migration: 029_add_inventory_tracking');
        try {
            const migration029 = fs.readFileSync(
                path.join(__dirname, '../src/db/migrations/029_add_inventory_tracking.sql'),
                'utf8'
            );
            await sql.unsafe(migration029);
            console.log('  ✅ Applied successfully');
        } catch (e) {
            console.log('  ℹ️  029 status:', e.message.substring(0, 80));
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ MIGRATION RUN COMPLETE');
        console.log('='.repeat(60));

        // Verify results
        console.log('\n🔍 Verification:');
        const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN 
      ('agent_strategy_contexts', 'tenant_vector_stores')
      ORDER BY table_name
    `;
        console.log('New tables:', tables.map(t => t.table_name).join(', ') || 'none');

        const invitesCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'invites' AND column_name = 'tenant_id'
    `;
        console.log('invites.tenant_id:', invitesCols.length > 0 ? '✅' : '❌');

        const agentCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'agent_configs' AND column_name IN ('agent_type', 'config_version')
    `;
        console.log('agent_configs updated:', agentCols.length >= 2 ? '✅' : '❌');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        await sql.end();
    }
}

runMigrations().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
