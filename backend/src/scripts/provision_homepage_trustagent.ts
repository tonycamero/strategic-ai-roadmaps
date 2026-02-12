/**
 * Provision Homepage TrustAgent Assistant
 *
 * One-time script to create OpenAI Assistant and Vector Store for the public
 * marketing homepage. This is completely separate from tenant-scoped agents.
 *
 * Usage: pnpm provision:homepage-trustagent
 */

import OpenAI from 'openai';
import { HOMEPAGE_TRUSTAGENT_PROMPT } from '../trustagent/homepagePrompt.ts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  console.log('[Provisioning] Starting homepage TrustAgent assistant provisioning...\n');

  // 1. Create vector store for marketing knowledge
  console.log('[Provisioning] Creating vector store for homepage knowledge...');
  const vectorStoresAPI = (openai as any).vectorStores || (openai as any).beta?.vectorStores;

  if (!vectorStoresAPI) {
    throw new Error('Vector stores API not available in OpenAI SDK');
  }

  const vectorStore = await vectorStoresAPI.create({
    name: 'TrustAgent Homepage Knowledge',
  });

  console.log(`[Provisioning] ✓ Vector store created: ${vectorStore.id}\n`);

  // 2. Use standalone v3 Constitution (no layer composition)
  console.log('[Provisioning] Using standalone v3 Constitution...');
  const fullSystemPrompt = HOMEPAGE_TRUSTAGENT_PROMPT;
  console.log(`[Provisioning] ✓ Constitution loaded: ${fullSystemPrompt.length} characters\n`);

  // 3. Create assistant with file_search tool
  console.log('[Provisioning] Creating homepage assistant...');

  const assistant = await openai.beta.assistants.create({
    name: 'TrustAgent (Homepage)',
    instructions: fullSystemPrompt,
    model: process.env.OPENAI_TRUSTAGENT_MODEL || 'gpt-4o-mini',
    tools: [
      {
        type: 'file_search',
      },
    ],
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id],
      },
    },
  });

  console.log(`[Provisioning] ✓ Assistant created: ${assistant.id}\n`);

  // 4. Output IDs for .env configuration
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ PROVISIONING COMPLETE\n');
  console.log('Add these to your .env file:\n');
  console.log(`OPENAI_TRUSTAGENT_ASSISTANT_ID=${assistant.id}`);
  console.log(`OPENAI_TRUSTAGENT_VECTOR_STORE_ID=${vectorStore.id}`);
  console.log(`OPENAI_TRUSTAGENT_MODEL=${assistant.model}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nNext steps:');
  console.log('1. Copy the above env vars to your .env file');
  console.log('2. Create marketing knowledge files in backend/storage/homepage-knowledge/');
  console.log('3. Run: pnpm homepage:upload-knowledge');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((error) => {
  console.error('[Provisioning] ❌ Error:', error.message);
  process.exit(1);
});
