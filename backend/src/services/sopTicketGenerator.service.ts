/**
 * SOP Ticket Generator Service (v2.0)
 * 
 * Generates 20-30 structured tickets with three-tier scoping.
 * Uses GPT-4o with strict validation for ticket volume, tiers, and time estimates.
 */

import OpenAI from 'openai';
import { DiagnosticMap, TicketGenerationResult } from '../types/diagnostic';
import { buildDiagnosticToTicketsPrompt } from '../trustagent/prompts/diagnosticToTickets';
import { buildSelectionContext, selectInventoryTickets } from '../trustagent/services/inventorySelection.service';
import { loadInventory } from '../trustagent/services/inventory.service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateSopTickets(
  diagnosticMap: Record<string, any>,
  sop01Content: {
    diagnosticMarkdown?: string;
    aiLeverageMarkdown?: string;
    roadmapSkeletonMarkdown?: string;
    discoveryNotesMarkdown?: string;
  },
  tenantId: string,
  tenantName: string,
  firmSizeTier: string,
  teamHeadcount: number,
  diagnosticDate: Date,
  tenantVertical?: string | null
): Promise<TicketGenerationResult> {
  console.log(`[SOP Ticket Generator] Generating tickets for ${tenantName} (${firmSizeTier}, ${teamHeadcount} people)`);

  const diagnosticId = `diag_${tenantName.toLowerCase().replace(/\s+/g, '_')}_${diagnosticDate.toISOString().split('T')[0].replace(/-/g, '')}`;

  // Build selection context from tenant + diagnostic signals
  const selectionContext = buildSelectionContext(
    { name: tenantName, vertical: tenantVertical, teamHeadcount },
    diagnosticMap
  );

  console.log(`[SOP Ticket Generator] Selection context:`, selectionContext);

  // Load inventory and select appropriate SOPs
  const allInventory = loadInventory();
  const selectedInventory = selectInventoryTickets(selectionContext, allInventory);

  console.log(`[SOP Ticket Generator] Selected ${selectedInventory.length} inventory items`);

  const prompt = buildDiagnosticToTicketsPrompt(
    diagnosticMap,
    sop01Content,
    tenantName,
    firmSizeTier,
    teamHeadcount,
    diagnosticDate,
    selectedInventory
  );

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3, // Slightly higher for strategic creativity
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const raw = response.choices[0].message.content;
  if (!raw) {
    throw new Error('[SOP Ticket Generator] Empty response from GPT-4o');
  }

  console.log(`[SOP Ticket Generator] Raw response length: ${raw.length} chars`);
  console.log(`[SOP Ticket Generator] Raw response preview: ${raw.substring(0, 500)}...`);

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error('[SOP Ticket Generator] Failed to parse JSON response:', err);
    console.error('[SOP Ticket Generator] Raw response:', raw.substring(0, 2000));
    throw new Error('[SOP Ticket Generator] Invalid JSON from GPT-4o');
  }

  console.log(`[SOP Ticket Generator] Parsed response keys:`, Object.keys(parsed));
  
  // Expect wrapped format: { "tickets": [...] }
  if (!parsed || !parsed.tickets) {
    throw new Error(
      `[SOP Ticket Generator] Expected { "tickets": [...] } but got keys: ${JSON.stringify(Object.keys(parsed || {}))}`
    );
  }
  
  if (!Array.isArray(parsed.tickets)) {
    throw new Error(
      `[SOP Ticket Generator] Expected "tickets" to be an array but got: ${typeof parsed.tickets}`
    );
  }
  
  const tickets = parsed.tickets;
  console.log(`[SOP Ticket Generator] Parsed ${tickets.length} tickets from model response`);

  // Validate ticket count (scaled to firm size - increased for moderation)
  const minTickets = firmSizeTier === 'micro' ? 12 : 15;
  const maxTickets = firmSizeTier === 'large' ? 30 : firmSizeTier === 'mid' ? 25 : 20;
  
  if (tickets.length < minTickets) {
    throw new Error(`[SOP Ticket Generator] Insufficient tickets: ${tickets.length} (minimum ${minTickets} required for ${firmSizeTier} firm)`);
  }

  if (tickets.length > maxTickets) {
    console.warn(`[SOP Ticket Generator] Excessive tickets: ${tickets.length} (maximum ${maxTickets} for ${firmSizeTier}), truncating...`);
    tickets.splice(maxTickets);
  }

  // Validate tier distribution
  const tierCounts = {
    core: tickets.filter((t: any) => t.tier === 'core').length,
    recommended: tickets.filter((t: any) => t.tier === 'recommended').length,
    advanced: tickets.filter((t: any) => t.tier === 'advanced').length
  };

  console.log(`[SOP Ticket Generator] Tier distribution - Core: ${tierCounts.core}, Recommended: ${tierCounts.recommended}, Advanced: ${tierCounts.advanced}`);

  if (tierCounts.core < 7 || tierCounts.core > 10) {
    console.warn(`[SOP Ticket Generator] Core tier out of range: ${tierCounts.core} (expected 7-10)`);
  }
  if (tierCounts.recommended < 8 || tierCounts.recommended > 12) {
    console.warn(`[SOP Ticket Generator] Recommended tier out of range: ${tierCounts.recommended} (expected 8-12)`);
  }
  if (tierCounts.advanced < 5 || tierCounts.advanced > 10) {
    console.warn(`[SOP Ticket Generator] Advanced tier out of range: ${tierCounts.advanced} (expected 5-10)`);
  }

  // Validate time estimates (5-15 hours)
  const invalidTimeEstimates = tickets.filter((t: any) => 
    t.time_estimate_hours < 5 || t.time_estimate_hours > 15
  );

  if (invalidTimeEstimates.length > 0) {
    console.warn(`[SOP Ticket Generator] ${invalidTimeEstimates.length} tickets have invalid time estimates (must be 5-15 hours)`);
  }

  // Validate required fields
  for (const ticket of tickets) {
    if (!ticket.tier || !ticket.value_category) {
      throw new Error(`[SOP Ticket Generator] Missing tier or value_category on ticket ${ticket.ticketId}`);
    }
  }

  const result: TicketGenerationResult = {
    tenantId,
    diagnosticId,
    tickets
  };

  console.log(`[SOP Ticket Generator] ✅ Generated ${tickets.length} tickets`);
  console.log(`[SOP Ticket Generator] Total cost: $${tickets.reduce((sum: number, t: any) => sum + t.cost_estimate, 0).toLocaleString()}`);
  console.log(`[SOP Ticket Generator] Total hours: ${tickets.reduce((sum: number, t: any) => sum + t.time_estimate_hours, 0)}`);

  return result;
}
