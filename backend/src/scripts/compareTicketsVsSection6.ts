/**
 * Q2.2 — Compare sop_tickets JSON vs Section 6 Tables
 * 
 * Validates consistency between DB tickets and Section 6 markdown tables.
 */

import { db } from '../db/index.ts';
import { sopTickets, roadmapSections, tenants, roadmaps } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

interface DBTicket {
  ticketId: string;
  title: string;
  owner: string;
  sprint: number;
  timeEstimateHours: number;
  costEstimate: number;
  projectedHoursSavedWeekly: number;
  projectedLeadsRecoveredMonthly: number;
}

interface ParsedTicket {
  ticketId: string;
  title: string;
  owner: string;
  hours: number;
  cost: number;
  dependencies: string;
  sprint: number;
}

async function compareTicketsVsSection6() {
  console.log('🔍 Q2.2 — COMPARE sop_tickets vs SECTION 6 TABLES\n');
  
  // Step 1: Pull Ticket Data from DB
  console.log('📊 Step 1: Fetching tickets from database...\n');
  
  const dbTickets = await db
    .select({
      ticketId: sopTickets.ticketId,
      title: sopTickets.title,
      owner: sopTickets.owner,
      sprint: sopTickets.sprint,
      timeEstimateHours: sopTickets.timeEstimateHours,
      costEstimate: sopTickets.costEstimate,
      projectedHoursSavedWeekly: sopTickets.projectedHoursSavedWeekly,
      projectedLeadsRecoveredMonthly: sopTickets.projectedLeadsRecoveredMonthly
    })
    .from(sopTickets)
    .where(eq(sopTickets.tenantId, HAYES_TENANT_ID))
    .orderBy(sopTickets.ticketId);
  
  console.log(`✅ Found ${dbTickets.length} tickets in database\n`);
  
  dbTickets.forEach(t => {
    console.log(`  ${t.ticketId}: Sprint ${t.sprint}, ${t.timeEstimateHours}h, $${t.costEstimate.toLocaleString()}`);
  });
  console.log();
  
  // Step 2: Fetch Section 6 Content
  console.log('📄 Step 2: Fetching Section 6 content...\n');
  
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, HAYES_TENANT_ID)
  });
  
  if (!tenant) {
    console.error('❌ Tenant not found');
    process.exit(1);
  }
  
  const roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.tenantId, tenant.id)
  });
  
  if (!roadmap) {
    console.error('❌ Roadmap not found');
    process.exit(1);
  }
  
  const section6 = await db.query.roadmapSections.findFirst({
    where: (rs, { and, eq }) => and(
      eq(rs.roadmapId, roadmap.id),
      eq(rs.sectionNumber, 6)
    )
  });
  
  if (!section6) {
    console.error('❌ Section 6 not found');
    process.exit(1);
  }
  
  const content = section6.contentMarkdown;
  console.log(`✅ Section 6 loaded (${content.length} chars)\n`);
  
  // Step 3: Parse Section 6 Tables
  console.log('🔍 Step 3: Parsing sprint tables from Section 6...\n');
  
  const parsedTickets: ParsedTicket[] = [];
  
  // Find sprint sections
  const sprintSections = [
    { sprint: 30, pattern: /## Sprint 1.*?\(30 Days?\)/i },
    { sprint: 60, pattern: /## Sprint 2.*?\(60 Days?\)/i },
    { sprint: 90, pattern: /## Sprint 3.*?\(90 Days?\)/i }
  ];
  
  sprintSections.forEach(({ sprint, pattern }) => {
    const match = content.match(pattern);
    if (!match) return;
    
    const startIndex = match.index!;
    const nextSprintPattern = /## Sprint \d/g;
    nextSprintPattern.lastIndex = startIndex + 10;
    const nextMatch = nextSprintPattern.exec(content);
    const endIndex = nextMatch ? nextMatch.index : content.length;
    
    const sprintContent = content.slice(startIndex, endIndex);
    
    // Find table in this sprint section
    const tablePattern = /\|\s*ID\s*\|.*?\n\|[-:\s|]+\n((?:\|.*?\n)+)/i;
    const tableMatch = sprintContent.match(tablePattern);
    
    if (tableMatch) {
      const tableRows = tableMatch[1].trim().split('\n');
      
      tableRows.forEach(row => {
        const cells = row.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 5) {
          const [id, title, owner, hours, cost, dependencies = ''] = cells;
          
          // Parse hours and cost
          const hoursNum = parseInt(hours.replace(/[^0-9]/g, '')) || 0;
          const costNum = parseInt(cost.replace(/[^0-9]/g, '')) || 0;
          
          parsedTickets.push({
            ticketId: id,
            title: title,
            owner: owner,
            hours: hoursNum,
            cost: costNum,
            dependencies: dependencies,
            sprint: sprint
          });
        }
      });
    }
  });
  
  console.log(`✅ Parsed ${parsedTickets.length} tickets from Section 6 tables\n`);
  
  parsedTickets.forEach(t => {
    console.log(`  ${t.ticketId}: Sprint ${t.sprint}, ${t.hours}h, $${t.cost.toLocaleString()}`);
  });
  console.log();
  
  // Step 4: Compare
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📊 CONSISTENCY ANALYSIS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // 1. Summary
  console.log('📋 1. SUMMARY\n');
  console.log(`   Tickets in DB: ${dbTickets.length}`);
  console.log(`   Tickets in Section 6 tables: ${parsedTickets.length}\n`);
  
  const dbIds = new Set(dbTickets.map(t => t.ticketId));
  const section6Ids = new Set(parsedTickets.map(t => t.ticketId));
  
  const idsInBoth = Array.from(dbIds).filter(id => section6Ids.has(id));
  const missingInSection6 = Array.from(dbIds).filter(id => !section6Ids.has(id));
  const extraInSection6 = Array.from(section6Ids).filter(id => !dbIds.has(id));
  
  console.log(`   IDs in both: [${idsInBoth.join(', ')}]`);
  console.log(`   IDs missing in Section 6: [${missingInSection6.join(', ') || 'none'}]`);
  console.log(`   Extra IDs in Section 6: [${extraInSection6.join(', ') || 'none'}]\n`);
  
  // 2. Mismatches
  console.log('🔍 2. FIELD-BY-FIELD COMPARISON\n');
  
  const mismatches: {
    ticketId: string;
    field: string;
    dbValue: any;
    section6Value: any;
  }[] = [];
  
  idsInBoth.forEach(ticketId => {
    const dbTicket = dbTickets.find(t => t.ticketId === ticketId)!;
    const section6Ticket = parsedTickets.find(t => t.ticketId === ticketId)!;
    
    // Compare sprint
    if (dbTicket.sprint !== section6Ticket.sprint) {
      mismatches.push({
        ticketId,
        field: 'sprint',
        dbValue: dbTicket.sprint,
        section6Value: section6Ticket.sprint
      });
    }
    
    // Compare hours
    if (dbTicket.timeEstimateHours !== section6Ticket.hours) {
      mismatches.push({
        ticketId,
        field: 'hours',
        dbValue: dbTicket.timeEstimateHours,
        section6Value: section6Ticket.hours
      });
    }
    
    // Compare cost
    if (dbTicket.costEstimate !== section6Ticket.cost) {
      mismatches.push({
        ticketId,
        field: 'cost',
        dbValue: `$${dbTicket.costEstimate.toLocaleString()}`,
        section6Value: `$${section6Ticket.cost.toLocaleString()}`
      });
    }
    
    // Compare owner (case-insensitive, allow abbreviations)
    const dbOwnerNorm = dbTicket.owner.toLowerCase().replace(/\s+/g, '');
    const s6OwnerNorm = section6Ticket.owner.toLowerCase().replace(/\s+/g, '');
    
    if (dbOwnerNorm !== s6OwnerNorm && !dbOwnerNorm.includes(s6OwnerNorm) && !s6OwnerNorm.includes(dbOwnerNorm)) {
      mismatches.push({
        ticketId,
        field: 'owner',
        dbValue: dbTicket.owner,
        section6Value: section6Ticket.owner
      });
    }
  });
  
  if (mismatches.length === 0) {
    console.log('   ✅ No mismatches found! DB and Section 6 are perfectly aligned.\n');
  } else {
    console.log(`   ⚠️  Found ${mismatches.length} mismatches:\n`);
    
    // Group by type
    const byType = mismatches.reduce((acc, m) => {
      if (!acc[m.field]) acc[m.field] = [];
      acc[m.field].push(m);
      return acc;
    }, {} as Record<string, typeof mismatches>);
    
    Object.entries(byType).forEach(([field, items]) => {
      console.log(`   ${field.toUpperCase()} MISMATCHES:`);
      items.forEach(m => {
        console.log(`     ${m.ticketId}: DB=${m.dbValue} vs Section6=${m.section6Value}`);
      });
      console.log();
    });
  }
  
  // 3. ROI Fields Presence Check
  console.log('💰 3. ROI FIELDS CHECK\n');
  
  const ticketsWithROI = idsInBoth.filter(ticketId => {
    const dbTicket = dbTickets.find(t => t.ticketId === ticketId)!;
    return dbTicket.projectedHoursSavedWeekly > 0 || dbTicket.projectedLeadsRecoveredMonthly > 0;
  });
  
  console.log(`   Tickets with ROI data in DB: ${ticketsWithROI.length}/${idsInBoth.length}`);
  console.log(`   Tickets: [${ticketsWithROI.join(', ')}]\n`);
  
  ticketsWithROI.forEach(ticketId => {
    const dbTicket = dbTickets.find(t => t.ticketId === ticketId)!;
    console.log(`   ${ticketId}:`);
    console.log(`     Hours Saved/Week: ${dbTicket.projectedHoursSavedWeekly}`);
    console.log(`     Leads Recovered/Month: ${dbTicket.projectedLeadsRecoveredMonthly}`);
  });
  
  if (ticketsWithROI.length > 0) {
    console.log();
    console.log('   ℹ️  Section 6 detail blocks should reference these ROI numbers');
  }
  
  console.log();
  
  // 4. Conclusion
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🎯 CONCLUSION & RECOMMENDATION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const hasCriticalMismatches = mismatches.some(m => 
    m.field === 'sprint' || m.field === 'hours' || m.field === 'cost'
  );
  
  const hasCoverageIssues = missingInSection6.length > 0 || extraInSection6.length > 0;
  
  if (!hasCriticalMismatches && !hasCoverageIssues) {
    console.log('✅ VERDICT: Section 6 tables are **consistent** with sop_tickets DB.\n');
    console.log('   Small formatting differences (owner names) are acceptable.\n');
    console.log('   Current approach is working well.\n');
    console.log('📌 RECOMMENDATION: Keep current prompt-based table generation.\n');
    console.log('   Optional: Add validation step to catch future drift.\n');
  } else {
    console.log('⚠️  VERDICT: **Inconsistencies detected** between DB and Section 6.\n');
    
    if (hasCoverageIssues) {
      console.log('   ❌ Coverage issue: Not all DB tickets appear in Section 6 tables\n');
    }
    
    if (hasCriticalMismatches) {
      console.log('   ❌ Data mismatch: Hours, costs, or sprint assignments differ\n');
    }
    
    console.log('📌 RECOMMENDATION: **Trust DB as source of truth.**\n');
    console.log('   Next Steps:\n');
    console.log('   1. Modify Prompt 2 to render sprint tables DIRECTLY from SopTicket[] data\n');
    console.log('   2. Remove GPT discretion over hours/cost/sprint assignment in tables\n');
    console.log('   3. GPT should only write narrative around the structured data\n');
    console.log('   4. Add automated consistency check in CI/CD\n');
  }
  
  console.log();
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📌 Next: Q3 (Design DB → Section 6 renderer)\n');
  
  process.exit(0);
}

compareTicketsVsSection6().catch(err => {
  console.error('❌ Comparison failed:', err);
  process.exit(1);
});
