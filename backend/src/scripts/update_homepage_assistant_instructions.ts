/**
 * Update Homepage Assistant Instructions
 * 
 * Updates the existing assistant's instructions without recreating it.
 * 
 * Usage: pnpm tsx src/scripts/update_homepage_assistant_instructions.ts
 */

import dotenv from 'dotenv';
import OpenAI from 'openai';
import { HOMEPAGE_TRUSTAGENT_PROMPT } from '../trustagent/homepagePrompt';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const assistantId = process.env.OPENAI_TRUSTAGENT_ASSISTANT_ID;
  
  if (!assistantId) {
    console.error('❌ OPENAI_TRUSTAGENT_ASSISTANT_ID not set in .env');
    process.exit(1);
  }

  console.log(`[Update] Updating assistant ${assistantId} instructions...\n`);

  try {
    const updatedAssistant = await openai.beta.assistants.update(assistantId, {
      instructions: HOMEPAGE_TRUSTAGENT_PROMPT,
    });

    console.log('✅ Assistant instructions updated successfully!\n');
    console.log('Updated assistant details:');
    console.log(`  ID: ${updatedAssistant.id}`);
    console.log(`  Name: ${updatedAssistant.name}`);
    console.log(`  Model: ${updatedAssistant.model}`);
    console.log(`  Instructions length: ${updatedAssistant.instructions?.length || 0} characters\n`);
    
    console.log('Next steps:');
    console.log('1. Test the chat to see the updated greeting');
    console.log('2. Verify no duplication in quick_hit and value_pop\n');
  } catch (error: any) {
    console.error('❌ Failed to update assistant:', error.message);
    process.exit(1);
  }
}

main();
