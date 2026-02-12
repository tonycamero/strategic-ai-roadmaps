/**
 * Migrate Vector Stores to V2
 * 
 * Copies openaiVectorStoreId from agent_configs to tenant_vector_stores table.
 * Run once after deploying v2 architecture.
 * 
 * Usage: pnpm tsx src/scripts/migrate_vector_stores_to_v2.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index.ts';
import { agentConfigs, tenantVectorStores } from '../db/schema.ts';
import { eq, isNotNull } from 'drizzle-orm';

async function migrateVectorStores() {
  console.log('=== Migrating Vector Stores to V2 ===\n');

  try {
    // Find all agent_configs with vector store IDs
    const configs = await db
      .select({
        tenantId: agentConfigs.tenantId,
        vectorStoreId: agentConfigs.openaiVectorStoreId,
      })
      .from(agentConfigs)
      .where(isNotNull(agentConfigs.openaiVectorStoreId));

    if (configs.length === 0) {
      console.log('✓ No existing vector stores found in agent_configs');
      console.log('  (This is expected if you\'re starting fresh with v2)\n');
      return;
    }

    console.log(`Found ${configs.length} vector store(s) in agent_configs\n`);

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    for (const config of configs) {
      const { tenantId, vectorStoreId } = config;

      if (!vectorStoreId) {
        skipped++;
        continue;
      }

      try {
        // Check if already exists in tenant_vector_stores
        const existing = await db.query.tenantVectorStores.findFirst({
          where: eq(tenantVectorStores.tenantId, tenantId),
        });

        if (existing) {
          console.log(`⚠ Tenant ${tenantId} already has vector store: ${existing.vectorStoreId}`);
          skipped++;
          continue;
        }

        // Insert into tenant_vector_stores
        await db.insert(tenantVectorStores).values({
          tenantId,
          vectorStoreId,
          lastRefreshedAt: new Date(), // Mark as "inherited from v1.5"
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✓ Migrated: ${tenantId} → ${vectorStoreId}`);
        migrated++;
      } catch (error: any) {
        console.error(`✗ Failed to migrate ${tenantId}:`, error.message);
        failed++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`✓ Migrated: ${migrated}`);
    console.log(`⚠ Skipped: ${skipped}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`Total: ${configs.length}\n`);

    if (failed > 0) {
      console.error('⚠ Some migrations failed. Check errors above.');
      process.exit(1);
    }

    console.log('✓ Migration complete!\n');
    console.log('Next steps:');
    console.log('  1. Run the backend server');
    console.log('  2. Test a query to verify vector store attachment works');
    console.log('  3. Check logs for "[Query] Using vector store for tenant:"');
    console.log('  4. Optionally: Call POST /api/superadmin/tenants/:id/refresh-vector-store');
    console.log('     to re-upload documents if needed\n');

  } catch (error: any) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateVectorStores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
