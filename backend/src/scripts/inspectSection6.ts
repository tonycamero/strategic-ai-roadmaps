/**
 * Q2.1 — Inspect Section 6 (SOP Pack) Against Checklist
 * 
 * Evaluates Hayes Section 6 content against production-ready checklist.
 */

import { db } from '../db';
import { roadmapSections, tenants, roadmaps } from '../db/schema';
import { eq } from 'drizzle-orm';

const HAYES_TENANT_ID = '4e2c6eb1-0767-43d6-b6a4-3fca8efd3f64';

interface ChecklistResult {
  category: string;
  items: { check: string; status: '✅' | '⚠️' | '❌'; details?: string }[];
}

async function inspectSection6() {
  console.log('🔍 Q2.1 — SECTION 6 (SOP PACK) INSPECTION\n');
  
  // Step 1: Fetch Section 6
  console.log('📁 Step 1: Fetching Section 6 content...\n');
  
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, HAYES_TENANT_ID)
  });
  
  if (!tenant) {
    console.error('❌ Tenant not found');
    process.exit(1);
  }
  
  console.log(`✅ Tenant: ${tenant.name}`);
  console.log(`   Last Diagnostic ID: ${tenant.lastDiagnosticId}\n`);
  
  const roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.tenantId, tenant.id)
  });
  
  if (!roadmap) {
    console.error('❌ Roadmap not found');
    process.exit(1);
  }
  
  console.log(`✅ Roadmap ID: ${roadmap.id}\n`);
  
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
  
  console.log(`✅ Section 6: ${section6.sectionName}`);
  console.log(`   Length: ${section6.contentMarkdown.length} chars\n`);
  
  const content = section6.contentMarkdown;
  
  // Step 2: Evaluate Against Checklist
  console.log('📊 Step 2: Evaluating against checklist...\n');
  
  const results: ChecklistResult[] = [];
  
  // 1. Sprint Grouping
  const sprintGrouping: ChecklistResult = {
    category: '1. Sprint Grouping',
    items: []
  };
  
  const hasSprint1 = /Sprint 1.*\(30 Days?\)/i.test(content);
  const hasSprint2 = /Sprint 2.*\(60 Days?\)/i.test(content);
  const hasSprint3 = /Sprint 3.*\(90 Days?\)/i.test(content);
  
  sprintGrouping.items.push({
    check: 'Sprint 1 (30 Days) header present',
    status: hasSprint1 ? '✅' : '❌',
    details: hasSprint1 ? 'Found' : 'Missing'
  });
  
  sprintGrouping.items.push({
    check: 'Sprint 2 (60 Days) header present',
    status: hasSprint2 ? '✅' : '❌',
    details: hasSprint2 ? 'Found' : 'Missing'
  });
  
  sprintGrouping.items.push({
    check: 'Sprint 3 (90 Days) header present',
    status: hasSprint3 ? '✅' : '❌',
    details: hasSprint3 ? 'Found' : 'Missing'
  });
  
  results.push(sprintGrouping);
  
  // 2. Sprint Tables
  const sprintTables: ChecklistResult = {
    category: '2. Sprint Tables',
    items: []
  };
  
  const tableHeaderPattern = /\|\s*ID\s*\|\s*Title\s*\|\s*Owner\s*\|\s*Hours\s*\|\s*Cost\s*\|\s*Dependencies\s*\|/gi;
  const tableHeaders = content.match(tableHeaderPattern);
  const tableHeaderCount = tableHeaders ? tableHeaders.length : 0;
  
  sprintTables.items.push({
    check: 'Sprint tables with proper headers',
    status: tableHeaderCount >= 2 ? '✅' : tableHeaderCount === 1 ? '⚠️' : '❌',
    details: `Found ${tableHeaderCount} table(s) (expected 2-3 for active sprints)`
  });
  
  const hasTotalCost = /Total Cost:/i.test(content) || /Total Investment:/i.test(content);
  sprintTables.items.push({
    check: 'Sprint cost totals present',
    status: hasTotalCost ? '✅' : '❌',
    details: hasTotalCost ? 'Found cost summary' : 'Missing cost summary'
  });
  
  results.push(sprintTables);
  
  // 3. Ticket Detail Blocks
  const ticketDetails: ChecklistResult = {
    category: '3. Ticket Detail Blocks',
    items: []
  };
  
  // Extract ticket IDs from tables
  const ticketIdPattern = /\|\s*([A-Z]\d+)\s*\|/g;
  const ticketIds = new Set<string>();
  let match;
  while ((match = ticketIdPattern.exec(content)) !== null) {
    ticketIds.add(match[1]);
  }
  
  ticketDetails.items.push({
    check: 'Ticket IDs found in tables',
    status: ticketIds.size > 0 ? '✅' : '❌',
    details: `Found ${ticketIds.size} unique ticket IDs: ${Array.from(ticketIds).join(', ')}`
  });
  
  // Check for detail blocks with numbered steps
  const ticketsWithDetails: string[] = [];
  const ticketsWithNumberedSteps: string[] = [];
  
  Array.from(ticketIds).forEach(ticketId => {
    // Look for heading with ticket ID
    const ticketHeadingPattern = new RegExp(`###?\\s*${ticketId}[:\\s]`, 'i');
    if (ticketHeadingPattern.test(content)) {
      ticketsWithDetails.push(ticketId);
      
      // Check for numbered steps (1. 2. 3. etc.)
      const ticketSectionStart = content.search(ticketHeadingPattern);
      const nextTicketPattern = /###?\s*[A-Z]\d+[:\s]/g;
      nextTicketPattern.lastIndex = ticketSectionStart + 10;
      const nextMatch = nextTicketPattern.exec(content);
      const ticketSectionEnd = nextMatch ? nextMatch.index : content.length;
      const ticketSection = content.slice(ticketSectionStart, ticketSectionEnd);
      
      // Count numbered steps
      const numberedStepsPattern = /^\s*\d+\.\s+/gm;
      const steps = ticketSection.match(numberedStepsPattern);
      if (steps && steps.length >= 6) {
        ticketsWithNumberedSteps.push(ticketId);
      }
    }
  });
  
  ticketDetails.items.push({
    check: 'Tickets have detail blocks',
    status: ticketsWithDetails.length === ticketIds.size ? '✅' : ticketsWithDetails.length > 0 ? '⚠️' : '❌',
    details: `${ticketsWithDetails.length}/${ticketIds.size} tickets have detail blocks`
  });
  
  ticketDetails.items.push({
    check: 'Tickets have 6-8 numbered implementation steps',
    status: ticketsWithNumberedSteps.length === ticketIds.size ? '✅' : ticketsWithNumberedSteps.length > 0 ? '⚠️' : '❌',
    details: `${ticketsWithNumberedSteps.length}/${ticketIds.size} tickets have 6+ numbered steps`
  });
  
  const hasCurrentState = /Current State:/gi.test(content);
  const hasTargetState = /Target State:/gi.test(content);
  const hasSuccessMetric = /Success Metric:/gi.test(content);
  const hasROINotes = (/Projected.*Saved/gi.test(content) || /ROI:/gi.test(content));
  
  ticketDetails.items.push({
    check: 'Current State fields present',
    status: hasCurrentState ? '✅' : '❌'
  });
  
  ticketDetails.items.push({
    check: 'Target State fields present',
    status: hasTargetState ? '✅' : '❌'
  });
  
  ticketDetails.items.push({
    check: 'Success Metric fields present',
    status: hasSuccessMetric ? '✅' : '❌'
  });
  
  ticketDetails.items.push({
    check: 'ROI notes present',
    status: hasROINotes ? '✅' : '❌'
  });
  
  results.push(ticketDetails);
  
  // 4. Investment & ROI Summary
  const investmentSummary: ChecklistResult = {
    category: '4. Investment & ROI Summary',
    items: []
  };
  
  const hasImplementationInvestment = /Implementation Investment/i.test(content);
  const hasROIProjection = /ROI Projection/i.test(content);
  const hasTotalCostSummary = /Total.*\$[\d,]+/i.test(content);
  const hasSprintBreakdown = /Sprint \d.*\$[\d,]+/gi.test(content);
  const hasHoursSaved = /hours.*saved/i.test(content) || /time savings/i.test(content);
  const hasLeadsRecovered = /leads.*recovered/i.test(content) || /revenue.*recovery/i.test(content);
  
  investmentSummary.items.push({
    check: 'Implementation Investment section',
    status: hasImplementationInvestment ? '✅' : '❌'
  });
  
  investmentSummary.items.push({
    check: 'ROI Projection section',
    status: hasROIProjection ? '✅' : '❌'
  });
  
  investmentSummary.items.push({
    check: 'Total cost summary',
    status: hasTotalCostSummary ? '✅' : '❌'
  });
  
  investmentSummary.items.push({
    check: 'Sprint cost breakdown',
    status: hasSprintBreakdown ? '✅' : '❌'
  });
  
  investmentSummary.items.push({
    check: 'Hours saved calculation',
    status: hasHoursSaved ? '✅' : '❌'
  });
  
  investmentSummary.items.push({
    check: 'Leads recovered calculation',
    status: hasLeadsRecovered ? '✅' : '❌'
  });
  
  results.push(investmentSummary);
  
  // Step 3: Generate Report
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📋 CHECKLIST EVALUATION\n');
  
  results.forEach(result => {
    console.log(`${result.category}`);
    console.log('─'.repeat(60));
    result.items.forEach(item => {
      console.log(`${item.status} ${item.check}`);
      if (item.details) {
        console.log(`   ${item.details}`);
      }
    });
    console.log();
  });
  
  // Calculate overall rating
  const totalChecks = results.reduce((sum, r) => sum + r.items.length, 0);
  const passedChecks = results.reduce((sum, r) => 
    sum + r.items.filter(i => i.status === '✅').length, 0
  );
  const warningChecks = results.reduce((sum, r) => 
    sum + r.items.filter(i => i.status === '⚠️').length, 0
  );
  
  const rating = Math.round((passedChecks + (warningChecks * 0.5)) / totalChecks * 5);
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`⭐ OVERALL RATING: ${rating}/5\n`);
  console.log(`   Passed: ${passedChecks}/${totalChecks}`);
  console.log(`   Warnings: ${warningChecks}/${totalChecks}`);
  console.log(`   Failed: ${totalChecks - passedChecks - warningChecks}/${totalChecks}\n`);
  
  // Generate insights
  console.log('💡 WHAT\'S STRONG:\n');
  const strong: string[] = [];
  
  if (hasSprint1 && hasSprint2) strong.push('Sprint grouping is clear with proper headers');
  if (tableHeaderCount >= 2) strong.push('Sprint tables use consistent format');
  if (ticketsWithDetails.length === ticketIds.size) strong.push('All tickets have detail blocks');
  if (hasImplementationInvestment && hasROIProjection) strong.push('Investment and ROI sections present');
  if (hasCurrentState && hasTargetState) strong.push('Current/Target State fields consistently used');
  
  strong.forEach(s => console.log(`  ✅ ${s}`));
  console.log();
  
  console.log('⚠️  WHAT\'S MISSING / WEAK:\n');
  const weak: string[] = [];
  
  if (!hasSprint3) weak.push('Sprint 3 (90 Days) section missing - only 2 sprints present');
  if (ticketsWithNumberedSteps.length < ticketIds.size) {
    weak.push(`Only ${ticketsWithNumberedSteps.length}/${ticketIds.size} tickets have 6+ numbered implementation steps`);
  }
  if (!hasSuccessMetric) weak.push('Success Metric fields missing from ticket details');
  if (!hasHoursSaved || !hasLeadsRecovered) weak.push('ROI calculations incomplete (missing hours saved or leads recovered)');
  if (tableHeaderCount < 3) weak.push('Missing sprint table for one or more sprints');
  
  weak.forEach(w => console.log(`  ❌ ${w}`));
  console.log();
  
  console.log('🛠️  RECOMMENDED PROMPT ADJUSTMENTS:\n');
  console.log('  1. Enforce 6-8 numbered steps per ticket');
  console.log('     Add to prompt: "Each ticket MUST have implementation_steps as numbered list 1-8"');
  console.log();
  console.log('  2. Generate Sprint 3 even if empty');
  console.log('     Add: "Include Sprint 3 (90 Days) section even if no tickets assigned yet"');
  console.log();
  console.log('  3. Require Success Metric field in all detail blocks');
  console.log('     Add validation: "Each ticket detail block MUST include Success Metric line"');
  console.log();
  console.log('  4. Strengthen ROI summary requirements');
  console.log('     Add: "ROI Projection must show: weekly hours saved, monthly leads recovered, annual values"');
  console.log();
  console.log('  5. Add sprint table completeness check');
  console.log('     Add: "Generate one table per sprint (30/60/90) with sprint totals even if 0 tickets"');
  console.log();
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📌 Next: Q2.2 (Compare sop_tickets JSON vs Section 6 tables)\n');
  
  process.exit(0);
}

inspectSection6().catch(err => {
  console.error('❌ Inspection failed:', err);
  process.exit(1);
});
