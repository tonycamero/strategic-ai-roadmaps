import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db';
import { agentThreads } from '../db/schema';
import { eq } from 'drizzle-orm';

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

async function clearHayesThreads() {
  console.log('\n🧪 Clearing Hayes Assistant threads for onboarding test...\n');

  // Delete all threads for Hayes tenant
  const result = await db
    .delete(agentThreads)
    .where(eq(agentThreads.tenantId, HAYES_TENANT_ID))
    .returning();

  console.log(`✅ Deleted ${result.length} thread(s)`);
  console.log('\nNext step: Send a message to Hayes Assistant via the frontend');
  console.log('Expected onboarding sequence:');
  console.log('1. Warm greeting with owner\'s first name');
  console.log('2. Brief role introduction');
  console.log('3. Roadmap framing (mentions Strategic AI Roadmap)');
  console.log('4. Collaboration model (3-4 bullets)');
  console.log('5. Invitation to pick a focus');
  console.log('\nExample first message: "Hey, who are you and how are you supposed to help me?"');
}

clearHayesThreads()
  .then(() => {
    console.log('\n✅ Test setup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test setup failed:', error);
    process.exit(1);
  });
