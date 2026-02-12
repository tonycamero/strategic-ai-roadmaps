#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { db } from '../db/index.ts';
import { tenants } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { saveDiscoveryCallNotes } from '../services/discoveryCallService';

async function main() {
  const [, , tenantIdOrOwnerEmail, notesPath] = process.argv;

  if (!tenantIdOrOwnerEmail || !notesPath) {
    console.error('❌ Usage: npm run discovery:save -- <tenantId or ownerEmail> <pathToMarkdownFile>');
    console.error('   Example: npm run discovery:save -- roberta@hayesrealestate.com ./notes/hayes_discovery.md');
    process.exit(1);
  }

  const absPath = path.resolve(notesPath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌ File not found: ${absPath}`);
    process.exit(1);
  }

  const notes = fs.readFileSync(absPath, 'utf-8');
  console.log(`📄 Read ${notes.length} characters from ${absPath}\n`);

  // Resolve tenant - try as email first, then as ID
  let tenant;
  if (tenantIdOrOwnerEmail.includes('@')) {
    // It's an email
    const ownerEmail = tenantIdOrOwnerEmail;
    const user = await db.query.users.findFirst({
      where: (users, { ilike }) => ilike(users.email, ownerEmail),
    });

    if (!user) {
      console.error(`❌ Owner not found for email: ${ownerEmail}`);
      process.exit(1);
    }

    tenant = await db.query.tenants.findFirst({
      where: eq(tenants.ownerUserId, user.id),
    });

    if (!tenant) {
      console.error(`❌ Tenant not found for owner: ${ownerEmail}`);
      process.exit(1);
    }
  } else {
    // It's a tenant ID
    tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantIdOrOwnerEmail),
    });

    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantIdOrOwnerEmail}`);
      process.exit(1);
    }
  }

  const ownerId = tenant.ownerUserId;
  if (!ownerId) {
    console.error(`❌ Tenant has no ownerId set: ${tenant.id}`);
    process.exit(1);
  }

  console.log(`✓ Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`✓ Owner ID: ${ownerId}\n`);

  await saveDiscoveryCallNotes({ tenantId: tenant.id, ownerUserId: ownerId, notes });

  console.log(`✅ Discovery call notes saved for ${tenant.name}`);
  console.log(`✅ Tenant marked as discovery_complete = true\n`);
  console.log(`   Roadmap generation is now allowed for this tenant.`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error saving discovery call notes:', err);
      process.exit(1);
    });
}
