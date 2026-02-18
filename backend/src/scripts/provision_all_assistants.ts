/**
 * Provision All Assistants Script
 * 
 * Provisions or updates OpenAI Assistants for all active agent_configs.
 * Run with: npm run provision:assistants
 */

import { db } from '../db/index';
import { agentConfigs, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { provisionAssistantForConfig } from '../services/assistantProvisioning.service';

async function main() {
  console.log('=== Provisioning All Active Assistants ===\n');

  // Get SuperAdmin user ID from environment or find first superadmin
  let superAdminUserId = process.env.SUPERADMIN_USER_ID;

  if (!superAdminUserId) {
    const superAdmin = await db.query.users.findFirst({
      where: eq(users.role, 'superadmin'),
    });

    if (!superAdmin) {
      console.error('✗ No superadmin user found. Set SUPERADMIN_USER_ID env var or create a superadmin user.');
      process.exit(1);
    }

    superAdminUserId = superAdmin.id;
    console.log('Using SuperAdmin:', superAdmin.name, `(${superAdmin.email})\n`);
  }

  // Load all active configs
  const configs = await db.query.agentConfigs.findMany({
    where: eq(agentConfigs.isActive, true),
  });

  if (configs.length === 0) {
    console.log('No active agent configs found. Nothing to provision.');
    process.exit(0);
  }

  console.log(`Found ${configs.length} active agent config(s) to provision\n`);

  // Provision each config
  let successCount = 0;
  let failureCount = 0;

  for (const cfg of configs) {
    try {
      console.log(`[${successCount + failureCount + 1}/${configs.length}] Provisioning:`);
      console.log(`  Tenant: ${cfg.tenantId}`);
      console.log(`  Agent Type: ${cfg.agentType}`);
      console.log(`  Config ID: ${cfg.id}`);

      const result = await provisionAssistantForConfig(cfg.id, superAdminUserId);

      console.log(`  ✓ Assistant ID: ${result.assistantId}`);
      if (result.vectorStoreId) {
        console.log(`  ✓ Vector Store ID: ${result.vectorStoreId}`);
      } else {
        console.log(`  ⚠ Vector Store: disabled or unavailable`);
      }
      console.log();

      successCount++;
    } catch (error: any) {
      console.error(`  ✗ Failed:`, error.message);
      console.log();
      failureCount++;
    }
  }

  console.log('=== Summary ===');
  console.log(`✓ Succeeded: ${successCount}`);
  console.log(`✗ Failed: ${failureCount}`);
  console.log(`Total: ${configs.length}`);

  if (failureCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n✗ Fatal error:', err);
  process.exit(1);
});
