import { db } from '../src/db/index.js';
import { tenants, tenantDocuments } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function main() {
  console.log('🔍 Checking document paths for BrightFocus Marketing...\n');

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.name, 'BrightFocus Marketing'),
  });

  if (!tenant) {
    console.log('❌ Tenant not found');
    process.exit(1);
  }

  console.log('✅ Found tenant:', tenant.name, `(ID: ${tenant.id})`);

  const docs = await db.query.tenantDocuments.findMany({
    where: eq(tenantDocuments.tenantId, tenant.id),
  });

  console.log(`\n📄 Found ${docs.length} documents:\n`);

  for (const doc of docs) {
    const exists = fs.existsSync(doc.filePath);
    console.log(`${exists ? '✅' : '❌'} ${doc.title}`);
    console.log(`   Category: ${doc.category}`);
    console.log(`   File path: ${doc.filePath}`);
    console.log(`   Exists on disk: ${exists}`);
    console.log('');
  }

  process.exit(0);
}

main().catch(console.error);
