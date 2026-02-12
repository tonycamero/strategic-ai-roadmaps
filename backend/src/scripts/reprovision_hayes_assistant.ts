import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index.ts';
import { agentConfigs, tenants } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { provisionAssistantForConfig } from '../services/assistantProvisioning.service';

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

async function reprovisionHayes() {
  console.log('\n🔧 Re-provisioning Hayes Owner Assistant with roadmap-aware instructions...\n');

  // Find Hayes tenant to get ownerId
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, HAYES_TENANT_ID),
  });

  if (!tenant) {
    console.error(`❌ Hayes tenant not found`);
    process.exit(1);
  }

  const ownerId = tenant.ownerUserId;
  console.log(`   Tenant: ${tenant.name}`);
  console.log(`   Owner ID: ${ownerId}`);

  // Find owner agent config
  const config = await db.query.agentConfigs.findFirst({
    where: eq(agentConfigs.tenantId, HAYES_TENANT_ID),
  });

  if (!config) {
    console.error(`❌ No agent config found for Hayes`);
    process.exit(1);
  }

  console.log(`   Config ID: ${config.id}`);
  console.log(`   Role: ${config.agentType}`);
  console.log(`   Current Assistant ID: ${config.openaiAssistantId || 'None'}`);
  console.log(`   Current Vector Store ID: ${config.openaiVectorStoreId || 'None'}\n`);

  // Re-provision the assistant
  console.log('📡 Triggering provisioning...\n');
  
  const result = await provisionAssistantForConfig(config.id, ownerId);

  console.log(`\n✅ Re-provisioning complete!`);
  console.log(`   Assistant ID: ${result.assistantId}`);
  console.log(`   Vector Store ID: ${result.vectorStoreId || 'None'}`);
  console.log(`\nTest by asking the Hayes Owner Agent:`);
  console.log(`   - "What's in my Strategic AI Roadmap?"`);
  console.log(`   - "Tell me about the Implementation Plan"`);
  console.log(`   - "I'm viewing the System Architecture section"`);
}

reprovisionHayes()
  .then(() => {
    console.log('\n✅ Script complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
