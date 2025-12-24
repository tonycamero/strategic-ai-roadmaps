import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
  const sql = postgres(process.env.DATABASE_URL!);
  
  try {
    const tickets = await sql`
      SELECT ticket_id, inventory_id, is_sidecar, category, tier, title, sprint
      FROM sop_tickets 
      WHERE tenant_id = 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06'
      ORDER BY sprint, tier, ticket_id
      LIMIT 20
    `;
    
    console.log('\n📋 Generated Tickets:\n');
    tickets.forEach((t: any) => {
      const sidecar = t.is_sidecar ? '🔧' : '  ';
      console.log(`${sidecar} ${t.ticket_id.padEnd(8)} | ${(t.inventory_id || 'N/A').padEnd(12)} | ${t.tier.padEnd(12)} | Sprint ${t.sprint} | ${t.title}`);
    });
    
    console.log(`\n📊 Total: ${tickets.length} tickets`);
    
    // Count by tier
    const tierCounts = await sql`
      SELECT tier, COUNT(*) as count
      FROM sop_tickets 
      WHERE tenant_id = 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06'
      GROUP BY tier
    `;
    
    console.log('\n📈 By Tier:');
    tierCounts.forEach((tc: any) => {
      console.log(`   ${tc.tier}: ${tc.count}`);
    });
    
    // Count sidecars
    const sidecarCount = await sql`
      SELECT COUNT(*) as count
      FROM sop_tickets 
      WHERE tenant_id = 'bf472c81-f9d7-4fab-84b5-58cf9e1ebf06'
      AND is_sidecar = true
    `;
    
    console.log(`\n🔧 Sidecars: ${sidecarCount[0].count}`);
    
  } finally {
    await sql.end();
  }
})();
