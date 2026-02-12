import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import OpenAI from 'openai';
import { db } from '../db/index.ts';
import { agentConfigs, tenantDocuments, tenants } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function uploadRoadmapToVectorStore() {
  console.log('\n📤 Uploading Hayes roadmap files to vector store...\n');

  // Get Hayes tenant
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, HAYES_TENANT_ID),
  });

  if (!tenant) {
    console.error('❌ Hayes tenant not found');
    process.exit(1);
  }

  // Get Hayes agent config to find vector store ID
  const config = await db.query.agentConfigs.findFirst({
    where: eq(agentConfigs.tenantId, HAYES_TENANT_ID),
  });

  if (!config || !config.openaiVectorStoreId) {
    console.error('❌ Hayes agent config or vector store not found');
    process.exit(1);
  }

  const vectorStoreId = config.openaiVectorStoreId;
  console.log(`Vector Store ID: ${vectorStoreId}\n`);

  // Get all roadmap documents
  const roadmapDocs = await db.query.tenantDocuments.findMany({
    where: eq(tenantDocuments.tenantId, HAYES_TENANT_ID),
  });

  const roadmapFiles = roadmapDocs.filter(d => d.category === 'roadmap');

  console.log(`Found ${roadmapFiles.length} roadmap files:\n`);
  roadmapFiles.forEach(f => {
    console.log(`  - ${f.title} (${f.filePath})`);
  });

  // Filter to files that exist on disk
  const existingFiles = roadmapFiles.filter(d => fs.existsSync(d.filePath));

  if (existingFiles.length === 0) {
    console.error('\n❌ No roadmap files exist on disk');
    process.exit(1);
  }

  console.log(`\n✅ ${existingFiles.length} files exist on disk\n`);

  // Create file streams for upload
  const fileStreams = existingFiles.map(d => fs.createReadStream(d.filePath) as any);

  try {
    console.log('📡 Uploading files to OpenAI vector store...\n');
    
    // Get vector stores API
    const vectorStoresAPI = (openai as any).vectorStores || (openai as any).beta?.vectorStores;
    
    // Upload and poll
    const batch = await vectorStoresAPI.fileBatches.uploadAndPoll(vectorStoreId, { 
      files: fileStreams 
    });

    console.log(`✅ Successfully uploaded ${existingFiles.length} files to vector store!`);
    console.log(`\nBatch Status: ${batch.status}`);
    console.log(`File Counts: ${JSON.stringify(batch.file_counts)}`);
    
  } catch (error: any) {
    console.error('\n❌ Upload failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }

  console.log('\n✅ Roadmap files uploaded successfully!');
  console.log('\nNow test the Assistant by asking:');
  console.log('  - "Can you see the roadmap?"');
  console.log('  - "What are my top 3 pain points?"');
  console.log('  - "What vendors are recommended?"');
}

uploadRoadmapToVectorStore()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
