/**
 * Dump Assistant Configuration
 * 
 * Fetches and displays the actual assistant configuration from OpenAI
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const assistantId = process.env.OPENAI_TRUSTAGENT_ASSISTANT_ID;
  
  if (!assistantId) {
    console.error('❌ OPENAI_TRUSTAGENT_ASSISTANT_ID not set');
    process.exit(1);
  }

  console.log('Fetching assistant configuration from OpenAI...\n');

  const assistant = await openai.beta.assistants.retrieve(assistantId);

  console.log(JSON.stringify({
    assistant_id: assistant.id,
    model: assistant.model,
    name: assistant.name,
    instructions_length: assistant.instructions?.length || 0,
    sample_instructions: assistant.instructions?.slice(0, 300) || '',
    has_structural_tags: assistant.instructions?.includes('<quick_hit>') || false,
    tools: assistant.tools,
    vector_store_ids: assistant.tool_resources?.file_search?.vector_store_ids || [],
  }, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
