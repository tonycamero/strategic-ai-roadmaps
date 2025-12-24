/**
 * OpenAI SDK Capability Detection
 * 
 * Checks which beta APIs are available in the current OpenAI SDK version.
 * Run with: npm run openai:capabilities
 */

import OpenAI from 'openai';

async function main() {
  console.log('=== OpenAI SDK Capability Check ===\n');

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-test' });

    console.log('✓ OpenAI client instantiated');
    console.log('typeof client.beta:', typeof (client as any).beta);

    // Check top-level vectorStores (moved out of beta in 4.86+)
    const hasTopLevelVectorStores = !!(client as any).vectorStores;
    if (hasTopLevelVectorStores) {
      console.log('\n✓ client.vectorStores available (top-level, not beta)');
    }

    if ((client as any).beta) {
      const betaKeys = Object.keys((client as any).beta);
      console.log('\n✓ client.beta namespace exists');
      console.log('Available beta APIs:', betaKeys);

      // Check specific APIs we need
      const requiredApis = ['assistants', 'threads', 'vectorStores'];
      console.log('\nRequired API availability:');
      
      for (const api of requiredApis) {
        const inBeta = betaKeys.includes(api);
        const atTopLevel = !!(client as any)[api];
        const exists = inBeta || atTopLevel;
        const location = inBeta ? 'beta' : atTopLevel ? 'top-level' : 'MISSING';
        console.log(`  ${exists ? '✓' : '✗'} ${api}:`, location);
      }
    } else {
      console.log('\n✗ No client.beta namespace present');
      console.log('This SDK version does not support Assistants API');
    }

    console.log('\n=== Environment ===');
    console.log('ENABLE_VECTOR_STORES:', process.env.ENABLE_VECTOR_STORES || '(not set)');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '(set)' : '(MISSING)');

  } catch (error) {
    console.error('\n✗ Error during capability check:');
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
