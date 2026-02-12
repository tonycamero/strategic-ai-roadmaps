#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index.ts';
import { agentConfigs, agentLogs, tenants } from '../db/schema.ts';
import { eq, and, inArray } from 'drizzle-orm';
import { provisionAssistantForConfig } from '../services/assistantProvisioning.service';

type RoleType = 'owner' | 'ops' | 'tc' | 'agent_support';

async function main() {
  console.log('🤖 Unified Agent Provisioning\n');

  // Parse arguments
  const args = process.argv.slice(2);
  let tenantId: string | undefined;
  let roles: RoleType[] = ['owner', 'ops', 'tc', 'agent_support']; // Default all

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tenant' && args[i + 1]) {
      tenantId = args[i + 1];
      i++;
    } else if (args[i] === '--roles' && args[i + 1]) {
      roles = args[i + 1].split(',') as RoleType[];
      i++;
    }
  }

  if (!tenantId) {
    console.error('❌ Error: --tenant <id> is required\n');
    console.log('Usage: npm run agents:provision -- --tenant <id> [--roles owner,ops,tc,agent_support]');
    process.exit(1);
  }

  // Verify tenant exists
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });

  if (!tenant) {
    console.error(`❌ Tenant not found: ${tenantId}`);
    process.exit(1);
  }

  console.log(`✓ Tenant: ${tenant.name}`);
  console.log(`✓ Roles to provision: ${roles.join(', ')}\n`);

  // Get agent configs for tenant (agentType, not roleType)
  const configs = await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.tenantId, tenantId));

  if (configs.length === 0) {
    console.error(`❌ No agent configs found for tenant ${tenantId}`);
    console.log('\nTip: Agent configs must be created before provisioning. Check if agent_configs rows exist.');
    process.exit(1);
  }

  console.log(`Found ${configs.length} agent config(s) to provision:\n`);

  // Provision each agent
  const results = {
    success: [] as string[],
    failed: [] as { role: string; error: string }[],
  };

  for (const config of configs) {
    console.log(`🔄 Provisioning ${config.agentType} agent...`);

    try {
      const result = await provisionAssistantForConfig(config.id, config.createdBy || '');

      // Log success
      await db.insert(agentLogs).values({
        agentConfigId: config.id,
        eventType: 'provision',
        metadata: {
          tenantId,
          agentType: config.agentType,
          assistantId: result.assistantId,
          vectorStoreId: result.vectorStoreId,
          triggeredBy: 'cli',
        },
      });

      results.success.push(config.agentType);
      console.log(`  ✅ ${config.agentType}: ${result.assistantId}`);
      if (result.vectorStoreId) {
        console.log(`     Vector store: ${result.vectorStoreId}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.failed.push({ role: config.agentType, error: errorMsg });

      // Log error
      await db.insert(agentLogs).values({
        agentConfigId: config.id,
        eventType: 'error',
        metadata: {
          tenantId,
          agentType: config.agentType,
          error: errorMsg,
          operation: 'provision',
          triggeredBy: 'cli',
        },
      });

      console.error(`  ❌ ${config.agentType}: ${errorMsg}`);
    }

    console.log('');
  }

  // Summary
  console.log('─'.repeat(50));
  console.log('📊 Provisioning Summary:\n');
  console.log(`  ✅ Success: ${results.success.length}/${configs.length}`);
  if (results.success.length > 0) {
    results.success.forEach((role) => console.log(`     - ${role}`));
  }

  if (results.failed.length > 0) {
    console.log(`\n  ❌ Failed: ${results.failed.length}/${configs.length}`);
    results.failed.forEach(({ role, error }) => {
      console.log(`     - ${role}: ${error}`);
    });
  }

  console.log('');

  // Exit code
  if (results.failed.length > 0) {
    console.log('⚠️  Some agents failed to provision. Check errors above.');
    process.exit(1);
  } else {
    console.log('✅ All agents provisioned successfully!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
