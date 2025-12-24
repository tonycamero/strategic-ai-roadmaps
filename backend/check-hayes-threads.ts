import { db } from './src/db/index.js';
import { agentThreads, tenants } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkHayesThreads() {
  // Find Hayes tenant
  const hayes = await db.query.tenants.findFirst({
    where: eq(tenants.name, 'Hayes Real Estate Group')
  });
  
  if (!hayes) {
    console.log('Hayes tenant not found');
    process.exit(0);
  }
  
  console.log('Hayes tenant ID:', hayes.id);
  
  // Find all threads for Hayes
  const threads = await db.query.agentThreads.findMany({
    where: eq(agentThreads.tenantId, hayes.id)
  });
  
  console.log('\nAll threads for Hayes:', threads.length);
  threads.forEach(t => {
    console.log({
      id: t.id,
      actorRole: t.actorRole,
      visibility: t.visibility,
      roleType: t.roleType,
      createdAt: t.createdAt
    });
  });
  
  // Filter for shared superadmin threads
  const sharedThreads = threads.filter(t => 
    t.actorRole === 'superadmin' && t.visibility === 'shared'
  );
  
  console.log('\nShared superadmin threads:', sharedThreads.length);
  
  process.exit(0);
}

checkHayesThreads();
