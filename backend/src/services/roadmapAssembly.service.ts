/**
 * Roadmap Assembly Service
 * 
 * Wraps Prompt 2: Converts DiagnosticMap + SopTickets into 8-section roadmap.
 * Section 6 (SOP Pack) uses Warp Ticket Pack format with sprint grouping and cost rollups.
 */

import OpenAI from 'openai';
import { RoadmapContext, RoadmapGenerationResult } from '../types/diagnostic.ts';
import { TICKETS_TO_ROADMAP_SYSTEM_PROMPT } from '../trustagent/prompts/ticketsToRoadmap.ts';
import { buildSopPackSection } from './sopPackRenderer.service.ts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function assembleRoadmap(
  context: RoadmapContext
): Promise<RoadmapGenerationResult> {
  console.log('[Roadmap Assembly] Generating 8-section roadmap for tenant:', context.tenantId);
  console.log('[Roadmap Assembly] Input: DiagnosticMap + ', context.tickets.length, 'tickets');
  
  // Filter to approved tickets only
  const approvedTickets = context.tickets.filter(t => t.approved);
  
  if (approvedTickets.length === 0) {
    console.warn('[Roadmap Assembly] ⚠️  No approved tickets - using all tickets as fallback');
    // Fallback to all tickets if none approved (backwards compatibility)
  } else {
    console.log(`[Roadmap Assembly] ✅ Using ${approvedTickets.length} approved tickets (${context.tickets.length - approvedTickets.length} rejected)`);
  }
  
  const ticketsToUse = approvedTickets.length > 0 ? approvedTickets : context.tickets;
  
  // Recalculate rollup with approved tickets only
  const TIME_VALUE_PER_HOUR = 35;
  const LEAD_VALUE = 35;
  
  const totalHours = ticketsToUse.reduce((sum, t) => sum + (t.time_estimate_hours || 0), 0);
  const totalCost = ticketsToUse.reduce((sum, t) => sum + (t.cost_estimate || 0), 0);
  const hoursSavedWeekly = ticketsToUse.reduce((sum, t) => sum + (t.projected_hours_saved_weekly || 0), 0);
  const leadsRecoveredMonthly = ticketsToUse.reduce((sum, t) => sum + (t.projected_leads_recovered_monthly || 0), 0);
  
  const annualizedTimeValue = hoursSavedWeekly * 52 * TIME_VALUE_PER_HOUR;
  const annualizedLeadValue = leadsRecoveredMonthly * 12 * LEAD_VALUE;
  const annualizedROI = totalCost > 0 ? ((annualizedTimeValue + annualizedLeadValue) / totalCost) * 100 : 0;
  const weeklyValue = (annualizedTimeValue + annualizedLeadValue) / 52;
  const paybackWeeks = weeklyValue > 0 ? totalCost / weeklyValue : 0;
  
  const recalculatedRollup = {
    totalHours,
    totalCost,
    totalHoursSavedWeekly: hoursSavedWeekly,
    totalLeadsRecoveredMonthly: leadsRecoveredMonthly,
    annualizedTimeValue,
    annualizedLeadValue,
    annualizedROI,
    paybackWeeks
  };
  
  console.log('[Roadmap Assembly] Recalculated rollup with approved tickets:');
  console.log(`  - Investment: $${totalCost.toLocaleString()} (${totalHours} hours)`);
  console.log(`  - Time saved: ${hoursSavedWeekly}h/wk`);
  console.log(`  - Leads recovered: ${leadsRecoveredMonthly}/mo`);
  console.log(`  - ROI: ${annualizedROI.toFixed(0)}%`);
  
  console.log('[Roadmap Assembly] SOP-01 Diagnostic: ', context.sop01DiagnosticMarkdown.length, 'chars');
  console.log('[Roadmap Assembly] SOP-01 AI Leverage: ', context.sop01AiLeverageMarkdown.length, 'chars');
  console.log('[Roadmap Assembly] Discovery Notes: ', context.discoveryNotesMarkdown?.length || 0, 'chars');

  // Build rich input payload with approved tickets and recalculated metrics
  const userMessage = `
## DIAGNOSTIC MAP (Structured Data)
${JSON.stringify(context.diagnosticMap, null, 2)}

## SOP-01 COMPANY DIAGNOSTIC MAP (Full Narrative)
${context.sop01DiagnosticMarkdown}

## SOP-01 AI LEVERAGE & OPPORTUNITY MAP
${context.sop01AiLeverageMarkdown}

## SOP-01 ROADMAP SKELETON
${context.sop01RoadmapSkeleton}

${context.discoveryNotesMarkdown ? `## DISCOVERY CALL NOTES
${context.discoveryNotesMarkdown}

` : ''}## TICKET ROLLUP METRICS (APPROVED TICKETS ONLY)
\`\`\`json
${JSON.stringify(recalculatedRollup, null, 2)}
\`\`\`

## APPROVED TICKETS (${ticketsToUse.length} approved, ${context.tickets.length} generated)
${JSON.stringify(ticketsToUse, null, 2)}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: TICKETS_TO_ROADMAP_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: userMessage
      }
    ]
  });

  const raw = response.choices[0].message.content;
  if (!raw) {
    throw new Error('[Roadmap Assembly] Empty response from GPT-4o');
  }

  let parsed: RoadmapGenerationResult;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('[Roadmap Assembly] Failed to parse JSON response:', err, raw);
    throw new Error('[Roadmap Assembly] Invalid JSON from GPT-4o');
  }

  // Validate all 8 sections present
  if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length !== 8) {
    throw new Error('[Roadmap Assembly] Expected 8 sections, got ' + (parsed.sections?.length || 0));
  }

  const requiredSectionIds = [
    'executive',
    'diagnostic',
    'architecture',
    'systems',
    'implementation',
    'sop_pack',
    'metrics',
    'appendix'
  ];

  for (const sectionId of requiredSectionIds) {
    const section = parsed.sections.find(s => s.section === sectionId);
    if (!section || !section.content) {
      throw new Error(`[Roadmap Assembly] Missing required section: ${sectionId}`);
    }
  }

  console.log('[Roadmap Assembly] ✅ All 8 sections validated');
  
  // OVERRIDE: Replace GPT-generated Section 6 with DB-driven SOP Pack (approved tickets only)
  console.log('[Roadmap Assembly] Generating DB-driven Section 6 with approved tickets...');
  const dbSopPackSection = buildSopPackSection(ticketsToUse);
  
  // Replace GPT's Section 6 with our deterministic version
  const sectionIndex = parsed.sections.findIndex(s => s.section === 'sop_pack');
  if (sectionIndex >= 0) {
    parsed.sections[sectionIndex] = {
      section: dbSopPackSection.section,
      title: dbSopPackSection.title,
      content: dbSopPackSection.content,
      order: dbSopPackSection.order
    };
    console.log('[Roadmap Assembly] ✅ Section 6 replaced with DB-driven version');
  } else {
    // If GPT didn't return Section 6, inject it
    parsed.sections.push({
      section: dbSopPackSection.section,
      title: dbSopPackSection.title,
      content: dbSopPackSection.content,
      order: dbSopPackSection.order
    });
    console.log('[Roadmap Assembly] ✅ Section 6 injected (was missing from GPT response)');
  }
  
  console.log('[Roadmap Assembly] Section 6 (DB-driven) length:', dbSopPackSection.content.length, 'chars');

  return parsed;
}
