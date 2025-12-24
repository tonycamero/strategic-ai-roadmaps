/**
 * Test Hayes Owner Agent identity
 * Verifies the Assistant knows it's Hayes-specific
 */

import * as dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const assistantId = 'asst_EKx6CarxRFrgaJFoX2KQBsM2';
  
  console.log('Creating test thread...');
  const thread = await openai.beta.threads.create();
  
  console.log('Sending identity test message...');
  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: 'What firm do you work for? Who are you here to help?',
  });
  
  console.log('Running assistant...');
  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistantId,
  });
  
  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(thread.id);
    const reply = messages.data[0].content[0];
    
    console.log('\n=== ASSISTANT REPLY ===');
    if (reply.type === 'text') {
      console.log(reply.text.value);
    }
  } else {
    console.log('Run status:', run.status);
  }
  
  console.log('\nCleaning up thread...');
  await openai.beta.threads.del(thread.id);
  console.log('Done!');
}

main().catch(console.error);
