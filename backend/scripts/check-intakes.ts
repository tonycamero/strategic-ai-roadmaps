import { db } from '../src/db';
import { tenants, users, intakes } from '../src/db/schema';
import { inArray, eq } from 'drizzle-orm';

const TARGET_NAMES = ['Hayes Real Estate Group', 'BrightFocus Marketing', 'Sample Chamber'];

async function main() {
  const allTenants = await db.select({ id: tenants.id, name: tenants.name, ownerId: tenants.ownerId }).from(tenants);

  console.log('All tenants and intake counts:');
  for (const t of allTenants) {
    const team = await db.select({ id: users.id }).from(users).where(eq(users.ownerId, t.ownerId));
    const userIds = team.map(u => u.id);
    const count = await db.select({ c: intakes.id }).from(intakes).where(inArray(intakes.userId, userIds));
    console.log(`- ${t.name}: ${count.length} intakes (users: ${userIds.length})`);
  }

  const targets = allTenants.filter(t => TARGET_NAMES.includes(t.name));
  console.log('\nFocus tenants:');
  for (const t of targets) {
    const team = await db.select({ id: users.id }).from(users).where(eq(users.ownerId, t.ownerId));
    const userIds = team.map(u => u.id);
    const items = await db.select({ id: intakes.id, role: intakes.role, userId: intakes.userId }).from(intakes).where(inArray(intakes.userId, userIds));
    console.log(`\n${t.name} (${items.length} intakes):`);
    for (const it of items) console.log(`  - ${it.role} (${it.userId})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
