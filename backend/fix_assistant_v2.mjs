import * as dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';
import { db } from './src/db/index';
import { agentConfigs } from './src/db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get both tenants' assistants
const configs = await db.query.agentConfigs.findMany({
  where: eq(agentConfigs.agentType, 'roadmap_coach')
});

console.log(`Found ${configs.length} roadmap_coach assistants\n`);

for (const config of configs) {
  if (!config.openaiAssistantId) {
    console.log(`⚠ Skipping ${config.tenantId} - no assistant ID`);
    continue;
  }

  console.log(`\n=== Processing ${config.tenantId} ===`);
  console.log(`Assistant ID: ${config.openaiAssistantId}`);

  const assistant = await openai.beta.assistants.retrieve(config.openaiAssistantId);
  
  console.log('Current tools:', assistant.tools.map(t => t.type));
  console.log('Current tool_resources:', assistant.tool_resources);

  // Update assistant: Keep file_search tool but REMOVE baked-in vector stores
  console.log('\n✏️  Updating assistant to v2 (vector stores removed from assistant level)...');
  
  const updated = await openai.beta.assistants.update(config.openaiAssistantId, {
    tools: [{ type: 'file_search' }],
    tool_resources: {}, // Empty - vector stores will be attached per-run
  });

  console.log('✅ Updated!');
  console.log('New tools:', updated.tools.map(t => t.type));
  console.log('New tool_resources:', updated.tool_resources);
}

console.log('\n✅ All assistants updated to v2 architecture!');
console.log('\nNow vector stores will be attached per-run by the query service.');

process.exit(0);
