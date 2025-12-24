import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  
  try {
    const diagnostics = await sql`
      SELECT DISTINCT diagnostic_id, created_at
      FROM sop_tickets 
      WHERE tenant_id = 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('\n🔍 Diagnostic IDs for BrightFocus:\n');
    diagnostics.forEach((d: any) => {
      console.log(`   ${d.diagnostic_id} (created: ${d.created_at})`);
    });
    
    // Also check tenant's last_diagnostic_id
    const tenant = await sql`
      SELECT last_diagnostic_id 
      FROM tenants 
      WHERE id = 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06'
    `;
    
    console.log(`\n📋 Tenant's last_diagnostic_id: ${tenant[0]?.last_diagnostic_id || 'NULL'}\n`);
    
  } finally {
    await sql.end();
  }
})();
