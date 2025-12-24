import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function applyDocumentMigration() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    console.log('🚀 Applying migration 022_add_document_content.sql...\n');

    const migrationSQL = `
ALTER TABLE tenant_documents
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS storage_provider varchar(50);
    `;

    await sql.unsafe(migrationSQL);

    console.log('✅ Migration 022 applied successfully!');
    console.log('\nColumns added:');
    console.log('  - tenant_documents.content (text)');
    console.log('  - tenant_documents.storage_provider (varchar(50))\n');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

applyDocumentMigration();
