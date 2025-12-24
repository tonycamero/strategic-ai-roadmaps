require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function verify() {
    console.log('🔍 Verifying All Migrations...\n');

    try {
        // Check new tables
        console.log('━'.repeat(60));
        console.log('📊 New Tables');
        console.log('━'.repeat(60));

        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('agent_strategy_contexts', 'tenant_vector_stores')
      ORDER BY table_name
    `;

        const hasStrategyContexts = tables.some(t => t.table_name === 'agent_strategy_contexts');
        const hasVectorStores = tables.some(t => t.table_name === 'tenant_vector_stores');

        console.log(hasStrategyContexts ? '✅ agent_strategy_contexts (Migration 027)' : '❌ agent_strategy_contexts');
        console.log(hasVectorStores ? '✅ tenant_vector_stores (Migration 028)' : '❌ tenant_vector_stores');

        // Check new columns
        console.log('\n' + '━'.repeat(60));
        console.log('📊 New Columns');
        console.log('━'.repeat(60));

        // invites.tenant_id
        const invitesCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invites' AND column_name = 'tenant_id'
    `;
        console.log(invitesCols.length > 0 ? '✅ invites.tenant_id (Invites Migration)' : '❌ invites.tenant_id');

        // agent_configs columns
        const agentConfigsCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'agent_configs' 
        AND column_name IN ('agent_type', 'config_version', 'instructions_hash')
      ORDER BY column_name
    `;

        const hasAgentType = agentConfigsCols.some(c => c.column_name === 'agent_type');
        const hasConfigVersion = agentConfigsCols.some(c => c.column_name === 'config_version');
        const hasInstructionsHash = agentConfigsCols.some(c => c.column_name === 'instructions_hash');

        console.log(hasAgentType ? '✅ agent_configs.agent_type (Migration 026)' : '❌ agent_configs.agent_type');
        console.log(hasConfigVersion ? '✅ agent_configs.config_version (Migration 026)' : '❌ agent_configs.config_version');
        console.log(hasInstructionsHash ? '✅ agent_configs.instructions_hash (Migration 026)' : '❌ agent_configs.instructions_hash');

        // sop_tickets columns
        const sopTicketsCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sop_tickets' 
        AND column_name IN ('inventory_id', 'is_sidecar')
      ORDER BY column_name
    `;

        const hasInventoryId = sopTicketsCols.some(c => c.column_name === 'inventory_id');
        const hasIsSidecar = sopTicketsCols.some(c => c.column_name === 'is_sidecar');

        console.log(hasInventoryId ? '✅ sop_tickets.inventory_id (Migration 029)' : '❌ sop_tickets.inventory_id');
        console.log(hasIsSidecar ? '✅ sop_tickets.is_sidecar (Migration 029)' : '❌ sop_tickets.is_sidecar');

        // Summary
        const checks = [
            hasStrategyContexts,
            hasVectorStores,
            invitesCols.length > 0,
            hasAgentType,
            hasConfigVersion,
            hasInstructionsHash,
            hasInventoryId,
            hasIsSidecar
        ];

        const passed = checks.filter(Boolean).length;
        const total = checks.length;

        console.log('\n' + '━'.repeat(60));
        console.log('📊 Summary');
        console.log('━'.repeat(60));

        if (passed === total) {
            console.log(`\n✅ ALL MIGRATIONS VERIFIED SUCCESSFULLY (${passed}/${total})\n`);
            console.log('Next steps:');
            console.log('  1. ✅ Migrations complete');
            console.log('  2. Test your application');
            console.log('  3. Review MIGRATION_STATUS_COMPLETE.md for details');
        } else {
            console.log(`\n⚠️  PARTIAL SUCCESS (${passed}/${total} verified)\n`);
            console.log('Some migrations may need to be run manually.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

verify();
