/**
 * Update Homepage Assistant Model to GPT-4o
 * 
 * This script updates the existing homepage assistant to use gpt-4o instead of gpt-4o-mini.
 * 
 * Usage: pnpm tsx src/scripts/update_homepage_assistant_model.ts
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const assistantId = process.env.OPENAI_TRUSTAGENT_ASSISTANT_ID;
  
  if (!assistantId) {
    console.error('❌ OPENAI_TRUSTAGENT_ASSISTANT_ID not set in .env');
    process.exit(1);
  }

  console.log(`[Update] Updating assistant ${assistantId} to gpt-4o...\n`);

  try {
    const updatedAssistant = await openai.beta.assistants.update(assistantId, {
      model: 'gpt-4o',
    });

    console.log('✅ Assistant updated successfully!\n');
    console.log('Updated assistant details:');
    console.log(`  ID: ${updatedAssistant.id}`);
    console.log(`  Name: ${updatedAssistant.name}`);
    console.log(`  Model: ${updatedAssistant.model}`);
    console.log(`  Instructions length: ${updatedAssistant.instructions?.length || 0} characters\n`);
    
    console.log('Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Hit the debug endpoint to verify: GET /api/public/pulseagent/homepage/debug');
    console.log('3. Test the chat to see improved responses\n');
  } catch (error: any) {
    console.error('❌ Failed to update assistant:', error.message);
    process.exit(1);
  }
}

main();
