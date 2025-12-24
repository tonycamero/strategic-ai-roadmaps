import * as dotenv from 'dotenv';
dotenv.config();

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const vectorStoreId = 'vs_6937654bdc0081919b4ac07a66152bfe'; // BrightFocus

console.log('=== Inspecting Vector Store ===\n');
console.log('Vector Store ID:', vectorStoreId, '\n');

// Get vector store details
const vectorStoresAPI = openai.vectorStores || openai.beta.vectorStores;

const vs = await vectorStoresAPI.retrieve(vectorStoreId);

console.log('Name:', vs.name);
console.log('Status:', vs.status);
console.log('File counts:', vs.file_counts);
console.log('Created:', new Date(vs.created_at * 1000).toISOString());
console.log('Last active:', vs.last_active_at ? new Date(vs.last_active_at * 1000).toISOString() : 'Never');

// List files in vector store
console.log('\n=== Files in Vector Store ===\n');

const files = await vectorStoresAPI.files.list(vectorStoreId, { limit: 100 });

if (files.data.length === 0) {
  console.log('❌ NO FILES in vector store!');
  console.log('\nThis is why retrieval isn\'t working.');
  console.log('\nYou need to call:');
  console.log('  POST /api/superadmin/tenants/bf472c81-f9d7-4fab-84b5-58cf9e1ebf06/refresh-vector-store');
} else {
  console.log(`Found ${files.data.length} file(s):\n`);
  
  for (const file of files.data) {
    console.log(`File ID: ${file.id}`);
    console.log(`  Status: ${file.status}`);
    console.log(`  Created: ${new Date(file.created_at * 1000).toISOString()}`);
    
    // Try to get file details
    try {
      const fileDetails = await openai.files.retrieve(file.id);
      console.log(`  Filename: ${fileDetails.filename}`);
      console.log(`  Size: ${fileDetails.bytes} bytes`);
      console.log(`  Purpose: ${fileDetails.purpose}`);
    } catch (error) {
      console.log(`  (Could not retrieve file details)`);
    }
    
    console.log('');
  }
}

process.exit(0);
