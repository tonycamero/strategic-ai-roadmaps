/**
 * Inspect OpenAI Assistant
 * Shows the actual instructions that were provisioned
 */

import * as dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const assistantId = 'asst_EKx6CarxRFrgaJFoX2KQBsM2';
  
  console.log(`Fetching Assistant: ${assistantId}\n`);
  
  const assistant = await openai.beta.assistants.retrieve(assistantId);
  
  console.log('=== ASSISTANT DETAILS ===');
  console.log('ID:', assistant.id);
  console.log('Name:', assistant.name);
  console.log('Model:', assistant.model);
  console.log('\n=== INSTRUCTIONS ===');
  console.log(assistant.instructions);
  console.log('\n=== TOOLS ===');
  console.log(JSON.stringify(assistant.tools, null, 2));
  console.log('\n=== TOOL RESOURCES ===');
  console.log(JSON.stringify(assistant.tool_resources, null, 2));
}

main().catch(console.error);
