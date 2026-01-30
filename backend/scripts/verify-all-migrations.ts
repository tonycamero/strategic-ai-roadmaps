import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function verifyMigrations() {
  console.log('🔍 Verifying Migration Status...\n');

  try {
    // Check all tables
    console.log('📋 Existing Tables:');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    tables.forEach((t: any) => console.log(`  ✓ ${t.table_name}`));

    console.log('\n🔍 Checking Critical Migration Artifacts:\n');

    // Check invites.tenant_id (pending migration)
    const invitesColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invites'
    `;
    const hasTenantId = invitesColumns.some((c: any) => c.column_name === 'tenant_id');
    console.log(`  ${hasTenantId ? '✅' : '❌'} invites.tenant_id (add-tenant-to-invites migration)`);

    // Check agent_configs for migration 026
    const agentConfigsCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'agent_configs'
    `;
    const hasAgentType = agentConfigsCols.some((c: any) => c.column_name === 'agent_type');
    const hasRoleType = agentConfigsCols.some((c: any) => c.column_name === 'role_type');
    const hasConfigVersion = agentConfigsCols.some((c: any) => c.column_name === 'config_version');
    const hasInstructionsHash = agentConfigsCols.some((c: any) => c.column_name === 'instructions_hash');
    
    console.log(`  ${hasAgentType ? '✅' : '❌'} agent_configs.agent_type (migration 026)`);
    console.log(`  ${hasConfigVersion ? '✅' : '❌'} agent_configs.config_version (migration 026)`);
    console.log(`  ${hasInstructionsHash ? '✅' : '❌'} agent_configs.instructions_hash (migration 026)`);
    console.log(`  ${!hasRoleType ? '✅' : '⚠️ '} agent_configs.role_type removed (migration 026)`);

    // Check agent_strategy_contexts (migration 027)
    const hasStrategyContexts = tables.some((t: any) => t.table_name === 'agent_strategy_contexts');
    console.log(`  ${hasStrategyContexts ? '✅' : '❌'} agent_strategy_contexts table (migration 027)`);

    // Check tenant_vector_stores (migration 028)
    const hasVectorStores = tables.some((t: any) => t.table_name === 'tenant_vector_stores');
    console.log(`  ${hasVectorStores ? '✅' : '❌'} tenant_vector_stores table (migration 028)`);

    // Check sop_tickets.inventory_id (migration 029)
    if (tables.some((t: any) => t.table_name === 'sop_tickets')) {
      const sopTicketsCols = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sop_tickets'
      `;
      const hasInventoryId = sopTicketsCols.some((c: any) => c.column_name === 'inventory_id');
      const hasIsSidecar = sopTicketsCols.some((c: any) => c.column_name === 'is_sidecar');
      console.log(`  ${hasInventoryId ? '✅' : '❌'} sop_tickets.inventory_id (migration 029)`);
      console.log(`  ${hasIsSidecar ? '✅' : '❌'} sop_tickets.is_sidecar (migration 029)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));
    
    const pending = [];
    if (!hasTenantId) pending.push('add-tenant-to-invites');
    if (!hasAgentType || !hasConfigVersion || !hasInstructionsHash) pending.push('026_agent_config_refactor');
    if (!hasStrategyContexts) pending.push('027_add_agent_strategy_contexts');
    if (!hasVectorStores) pending.push('028_add_tenant_vector_stores');

    if (pending.length === 0) {
      console.log('✅ All migrations appear to be applied!');
    } else {
      console.log('⚠️  Pending migrations:');
      pending.forEach(m => console.log(`   - ${m}`));
    }

  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

verifyMigrations();
