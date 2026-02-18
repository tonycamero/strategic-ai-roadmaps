import * as dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';
import { db } from './src/db/index';
import { agentConfigs } from './src/db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const config = await db.query.agentConfigs.findFirst({
  where: eq(agentConfigs.tenantId, 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06')
});

if (!config?.openaiAssistantId) {
  console.log('❌ No assistant found for BrightFocus');
  process.exit(1);
}

console.log('Checking assistant:', config.openaiAssistantId);

const assistant = await openai.beta.assistants.retrieve(config.openaiAssistantId);

console.log('\n=== Assistant Configuration ===');
console.log('ID:', assistant.id);
console.log('Model:', assistant.model);
console.log('Name:', assistant.name);
console.log('\nTools:', JSON.stringify(assistant.tools, null, 2));
console.log('\nTool Resources:', JSON.stringify(assistant.tool_resources, null, 2));
console.log('\nInstructions (first 500 chars):', assistant.instructions?.substring(0, 500));

process.exit(0);
