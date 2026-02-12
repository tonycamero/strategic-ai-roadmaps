/**
 * Upload Homepage Knowledge to Vector Store
 * 
 * Uploads marketing collateral markdown files to the homepage TrustAgent's vector store.
 * Run this after provisioning the assistant to populate its knowledge base.
 * 
 * Usage: pnpm homepage:upload-knowledge
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { homepageAssistantConfig } from '../config/openai.config.ts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  console.log('[Upload] Starting homepage knowledge upload...\n');

  // Validate config
  if (!homepageAssistantConfig.vectorStoreId) {
    console.error('❌ OPENAI_TRUSTAGENT_VECTOR_STORE_ID not configured.');
    console.error('Run `pnpm provision:homepage-trustagent` first.');
    process.exit(1);
  }

  // Knowledge base directory
  const knowledgeDir = path.join(__dirname, '../../storage/homepage-knowledge');
  
  if (!fs.existsSync(knowledgeDir)) {
    console.error(`❌ Knowledge directory not found: ${knowledgeDir}`);
    process.exit(1);
  }

  // Find all markdown files
  const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md'));
  
  if (files.length === 0) {
    console.error('❌ No markdown files found in homepage-knowledge directory.');
    process.exit(1);
  }

  console.log(`[Upload] Found ${files.length} knowledge files:\n`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log('');

  // Upload files to OpenAI Files API
  console.log('[Upload] Uploading files to OpenAI...');
  const fileIds: string[] = [];
  
  for (const filename of files) {
    const filePath = path.join(knowledgeDir, filename);
    
    try {
      const file = await openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants',
      });
      
      fileIds.push(file.id);
      console.log(`  ✓ ${filename} → ${file.id}`);
    } catch (error: any) {
      console.error(`  ✗ ${filename} failed: ${error.message}`);
    }
  }

  if (fileIds.length === 0) {
    console.error('\n❌ No files were successfully uploaded.');
    process.exit(1);
  }

  console.log(`\n[Upload] Successfully uploaded ${fileIds.length} files.`);

  // Attach files to vector store
  console.log(`[Upload] Attaching files to vector store ${homepageAssistantConfig.vectorStoreId}...\n`);
  
  const vectorStoresAPI = (openai as any).vectorStores || (openai as any).beta?.vectorStores;
  
  if (!vectorStoresAPI) {
    console.error('❌ Vector stores API not available in OpenAI SDK');
    process.exit(1);
  }

  try {
    await vectorStoresAPI.fileBatches.createAndPoll(
      homepageAssistantConfig.vectorStoreId,
      { file_ids: fileIds }
    );
    
    console.log('✅ All files attached to vector store successfully!\n');
  } catch (error: any) {
    console.error(`❌ Failed to attach files to vector store: ${error.message}`);
    process.exit(1);
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ UPLOAD COMPLETE\n');
  console.log(`Vector Store: ${homepageAssistantConfig.vectorStoreId}`);
  console.log(`Files Uploaded: ${fileIds.length}`);
  console.log('\nHomepage TrustAgent is now ready to use its knowledge base!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((error) => {
  console.error('[Upload] ❌ Error:', error.message);
  process.exit(1);
});
