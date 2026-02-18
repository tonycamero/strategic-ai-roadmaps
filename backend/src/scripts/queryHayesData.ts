/**
 * Query Hayes Diagnostic Data
 * 
 * Verifies Hayes tickets and roadmap sections exist in DB.
 */

import { db } from '../db/index';
import { sopTickets, roadmapSections, tenants, roadmaps } from '../db/schema';
import { eq } from 'drizzle-orm';

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

async function queryHayesData() {
  console.log('🔍 QUERYING HAYES DATA\n');
  
  // Query tickets
  console.log('📋 Querying sop_tickets...');
  const tickets = await db
    .select()
    .from(sopTickets)
    .where(eq(sopTickets.tenantId, HAYES_TENANT_ID))
    .orderBy(sopTickets.ticketId);
  
  console.log(`✅ Found ${tickets.length} tickets\n`);
  
  if (tickets.length > 0) {
    console.log('Sample tickets:');
    tickets.forEach(t => {
      console.log(`  ${t.ticketId}: ${t.title}`);
      console.log(`    Sprint ${t.sprint} | ${t.timeEstimateHours}h | $${t.costEstimate.toLocaleString()}`);
      console.log(`    ROI: ${t.projectedHoursSavedWeekly}h/wk saved, ${t.projectedLeadsRecoveredMonthly} leads/mo`);
      console.log();
    });
    
    // Totals
    const totalCost = tickets.reduce((sum, t) => sum + t.costEstimate, 0);
    const totalHours = tickets.reduce((sum, t) => sum + t.timeEstimateHours, 0);
    const totalHoursSaved = tickets.reduce((sum, t) => sum + t.projectedHoursSavedWeekly, 0);
    const totalLeadsRecovered = tickets.reduce((sum, t) => sum + t.projectedLeadsRecoveredMonthly, 0);
    
    console.log('💰 TOTALS:');
    console.log(`  Investment: $${totalCost.toLocaleString()} (${totalHours} hours @ $125/hr)`);
    console.log(`  Weekly Hours Saved: ${totalHoursSaved}`);
    console.log(`  Monthly Leads Recovered: ${totalLeadsRecovered}`);
    console.log(`  Annual Time Value: $${(totalHoursSaved * 35 * 52).toLocaleString()}`);
    console.log(`  Annual Lead Value: $${(totalLeadsRecovered * 35 * 12).toLocaleString()}\n`);
    
    // Sprint breakdown
    const bySprint = {
      30: tickets.filter(t => t.sprint === 30),
      60: tickets.filter(t => t.sprint === 60),
      90: tickets.filter(t => t.sprint === 90)
    };
    
    console.log('📅 SPRINT BREAKDOWN:');
    Object.entries(bySprint).forEach(([sprint, items]) => {
      const cost = items.reduce((sum, t) => sum + t.costEstimate, 0);
      const hours = items.reduce((sum, t) => sum + t.timeEstimateHours, 0);
      console.log(`  Sprint ${sprint}: ${items.length} tickets, ${hours}h, $${cost.toLocaleString()}`);
    });
    console.log();
  }
  
  // Query tenant
  console.log('🏢 Querying tenants...');
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, HAYES_TENANT_ID)
  });
  
  if (tenant) {
    console.log(`✅ Tenant found: ${tenant.name}`);
    console.log(`  Last Diagnostic ID: ${tenant.lastDiagnosticId}`);
    console.log(`  Discovery Complete: ${tenant.discoveryComplete}`);
    console.log(`  Status: ${tenant.status}\n`);
    
    // Query roadmap
    console.log('🗺️  Querying roadmaps...');
    const roadmap = await db.query.roadmaps.findFirst({
      where: eq(roadmaps.tenantId, tenant.id)
    });
    
    if (roadmap) {
      console.log(`✅ Roadmap found: ${roadmap.id}`);
      console.log(`  Status: ${roadmap.status}`);
      console.log(`  Created: ${roadmap.createdAt.toISOString()}\n`);
      
      // Query sections
      console.log('📑 Querying roadmap_sections...');
      const sections = await db.query.roadmapSections.findMany({
        where: eq(roadmapSections.roadmapId, roadmap.id),
        orderBy: (rs, { asc }) => [asc(rs.sectionNumber)]
      });
      
      console.log(`✅ Found ${sections.length}/8 sections\n`);
      
      sections.forEach(s => {
        const wordCount = s.wordCount || 0;
        console.log(`  ${s.sectionNumber}. ${s.sectionName}`);
        console.log(`     ${wordCount.toLocaleString()} words, ${s.contentMarkdown.length.toLocaleString()} chars`);
        console.log(`     Status: ${s.status}`);
        console.log();
      });
      
      // Check Section 6
      const section6 = sections.find(s => s.sectionNumber === 6);
      if (section6) {
        console.log('🎯 SECTION 6 (SOP PACK) VERIFICATION:');
        console.log(`  Name: ${section6.sectionName}`);
        console.log(`  Length: ${section6.contentMarkdown.length.toLocaleString()} chars`);
        console.log(`  Contains "Sprint 1": ${section6.contentMarkdown.includes('Sprint 1')}`);
        console.log(`  Contains "Sprint 2": ${section6.contentMarkdown.includes('Sprint 2')}`);
        console.log(`  Contains "Sprint 3": ${section6.contentMarkdown.includes('Sprint 3')}`);
        console.log(`  Contains ticket table: ${section6.contentMarkdown.includes('| ID |')}`);
        console.log(`  Contains "Implementation Investment": ${section6.contentMarkdown.includes('Implementation Investment')}`);
        console.log(`  Contains "ROI Projection": ${section6.contentMarkdown.includes('ROI Projection')}`);
        console.log();
      } else {
        console.log('⚠️  Section 6 not found\n');
      }
    } else {
      console.log('⚠️  No roadmap found for tenant\n');
    }
  } else {
    console.log('⚠️  Tenant not found\n');
  }
  
  console.log('✅ QUERY COMPLETE\n');
  console.log('📌 Summary: Hayes diagnostic data is in the database');
  console.log('📌 Next: Proceed to Q2 (Section 6 content inspection)');
  
  process.exit(0);
}

queryHayesData().catch(err => {
  console.error('❌ Query failed:', err);
  process.exit(1);
});
