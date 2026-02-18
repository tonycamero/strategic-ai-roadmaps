import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index';
import { intakes, tenants } from '../db/schema';
import { eq } from 'drizzle-orm';

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

async function checkHayesIntakes() {
  console.log('\n🔍 Checking Hayes intake status...\n');

  // Get Hayes tenant
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, HAYES_TENANT_ID),
  });

  if (!tenant) {
    console.error('❌ Hayes tenant not found');
    process.exit(1);
  }

  console.log(`Tenant: ${tenant.name}`);
  console.log(`Owner ID: ${tenant.ownerUserId}\n`);

  // Get all intakes for Hayes
  const allIntakes = await db.query.intakes.findMany({
    where: eq(intakes.tenantId, tenant.id),
  });

  console.log(`Total intakes found: ${allIntakes.length}\n`);

  allIntakes.forEach((intake, index) => {
    console.log(`${index + 1}. Role: ${intake.role}`);
    console.log(`   Status: ${intake.status}`);
    console.log(`   Completed At: ${intake.completedAt || 'NOT COMPLETED'}`);
    console.log(`   Created At: ${intake.createdAt}`);
    console.log('');
  });

  const completedCount = allIntakes.filter(i => i.completedAt).length;
  console.log(`✅ Completed intakes: ${completedCount}/4 (should be 4 total: owner + 3 team)`);
  
  if (completedCount < 4) {
    console.log('\n⚠️  NOT ALL INTAKES COMPLETE - Roadmap will be locked');
  } else {
    console.log('\n✅ All intakes complete - Roadmap should be unlocked');
  }
}

checkHayesIntakes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
