/**
 * PROMPT 1: Diagnostic → SOP Tickets Engine (v2.1, Inventory-Aware)
 * 
 * Generates structured tickets by EXPANDING a pre-selected inventory pack.
 * - NO new inventoryIds are allowed
 * - Exactly one ticket per selected inventory record
 */

export interface SelectedInventoryTicket {
  inventoryId: string;
  titleTemplate: string;
  category: string;
  valueCategory: string;
  ghlComponents: string[];
  ghlTriggers?: string[];
  ghlActions?: string[];
  ghlLimitations?: string[];
  description: string;
  verticalTags?: string[];
  implementationStatus: 'production-ready' | 'pilot-available';
  isSidecar?: boolean;
  sidecarCategory?: string;
  tier: 'core' | 'recommended' | 'advanced';
  sprint: 30 | 60 | 90;
}

export function buildDiagnosticToTicketsPrompt(
  diagnosticMap: Record<string, any>,
  sop01Content: {
    diagnosticMarkdown?: string;
    aiLeverageMarkdown?: string;
    roadmapSkeletonMarkdown?: string;
    discoveryNotesMarkdown?: string;
  },
  tenantName: string,
  firmSizeTier: string, // 'micro' | 'small' | 'mid' | 'large'
  teamHeadcount: number,
  diagnosticDate: Date,
  selectedInventory: SelectedInventoryTicket[]
): string {
  const diagnosticJson = JSON.stringify(diagnosticMap, null, 2);
  const inventoryJson = JSON.stringify(selectedInventory, null, 2);
  const dateString = diagnosticDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Dynamic ticket count based on actual selection
  const targetCount = `${selectedInventory.length} tickets`;

  return `# SOP Ticket Generation: Lean, Reality-Based Implementation Pack (Inventory-Aware)

You are generating a **focused, honest, implementation-ready** ticket pack for **${tenantName}** (${teamHeadcount} people, ${firmSizeTier} firm, Diagnostic Date: ${dateString}).

This is NOT a consulting pitch deck. This is a **real work plan** a real team can execute in 90–180 days.

You are given a **canonical list of pre-selected SOP inventory items** that you MUST expand into full tickets.
You are NOT allowed to invent new inventory IDs or categories. You ONLY expand what you are given.

## Core Principles

### 1. Scale to Firm Size
Target: **${targetCount}** for ${tenantName} (${firmSizeTier} firm, ${teamHeadcount} people)

- **Micro (3-7 people)**: 8-12 tickets
- **Small (8-20 people)**: 10-15 tickets  
- **Mid (20-50 people)**: 15-20 tickets
- **Large (50+ people)**: 20-25 tickets

### 2. Merge, Don't Pad
If two tickets describe **phases of the same system**, merge them into one richer ticket.

**Bad (padded):**
- T001: "CRM Integration Phase 1"
- T002: "CRM Integration Phase 2"  

**Good (merged):**
- T001: "Integrate CRM with Lead Management System" (includes both phases in implementation steps)

### 3. No AI-Washing
Only call something "AI-driven" or "AI-powered" if it uses **model-based reasoning, prediction, or language generation**.

**AI = YES:**
- Chatbot that answers client questions using GPT
- Lead scoring that predicts conversion probability
- Email personalization using LLM

**AI = NO (call it "automated" or "systematic"):**
- Workflows and triggers
- Dashboards and reports
- Tag-based routing
- Revenue attribution from UTM tags
- Compliance exports

### 4. Realistic Per-Ticket ROI

**Time Savings Cap:**
- Typical ticket: 1-5 hours/week saved
- Strong ticket: 5-8 hours/week saved
- **Never exceed 8 hours/week per ticket**

**Leads Recovered Cap:**
- Typical ticket: 0-5 leads/month recovered
- Strong ticket: 5-10 leads/month recovered
- **Never exceed 10 leads/month per ticket**

**ROI Narrative:**
- Be conservative and specific
- "Saves 3-4 hours/week for ops manager" ✅
- "Saves 20 hours/week and generates 40 leads" ❌

## Input Sources

### 1. Diagnostic Data (Primary Source)
${diagnosticJson}

### 2. SOP-01 Strategic Context
${sop01Content.diagnosticMarkdown ? `#### Diagnostic Analysis\n${sop01Content.diagnosticMarkdown}\n\n` : ''}
${sop01Content.aiLeverageMarkdown ? `#### AI Leverage Map\n${sop01Content.aiLeverageMarkdown}\n\n` : ''}
${sop01Content.roadmapSkeletonMarkdown ? `#### Roadmap Skeleton\n${sop01Content.roadmapSkeletonMarkdown}\n\n` : ''}
${sop01Content.discoveryNotesMarkdown ? `#### Discovery Call Notes\n${sop01Content.discoveryNotesMarkdown}\n\n` : ''}

### 3. Canonical Inventory Selection (DO NOT INVENT NEW ITEMS)

You are given a list of **pre-selected inventory SOPs**. Each item represents one ticket you must generate.

- You MUST:
  - Use each \`inventoryId\` **exactly once**
  - Preserve \`category\`, \`valueCategory\`, \`isSidecar\`, \`sidecarCategory\`, and \`implementationStatus\`
  - Respect the provided \`tier\` and \`sprint\`

- You MUST NOT:
  - Invent new \`inventoryId\` values
  - Change categories or tiers
  - Add extra tickets beyond this list

\`\`\`json
${inventoryJson}
\`\`\`

---

## Output Requirements

You are expanding the selected inventory into a **full SOP ticket pack**.

You MUST:

1. Return **ONLY** a JSON array with **${targetCount}**, where **each element corresponds to exactly one item** from the inventory list above.
2. For each output ticket:
   - Preserve the \`inventoryId\` from the matching inventory item
   - Preserve \`category\`, \`valueCategory\`, \`isSidecar\`, \`sidecarCategory\` (if provided), and \`implementationStatus\`
   - Use the inventory \`titleTemplate\` as the base and refine it into a clear, specific title

## Tier Model

Each ticket belongs to exactly ONE tier:

### CORE (4-8 tickets)
- Must-do in next 90 days
- Foundation systems, critical pain relief
- Quick wins (5-8 hours each)
- Target payback: <4 weeks

### RECOMMENDED (3-8 tickets)
- High-leverage, 3-12 month horizon
- Strategic automation (8-12 hours each)
- Builds on CORE infrastructure
- Target payback: <8 weeks

### ADVANCED (0-4 tickets)
- Optional future-state ideas
- Only if CORE + RECOMMENDED solid
- Clearly experimental (12-15 hours each)
- **NOT included in core ROI calculations**

For ${firmSizeTier} firms: Keep ADVANCED minimal (0-3 tickets max)

### Category Coverage (Must Span 7+ Categories)
Each ticket must be assigned to ONE of these categories:
- **Pipeline**: Lead capture, routing, qualification, follow-up automation
- **CRM**: Contact management, data hygiene, tagging, segmentation
- **Ops**: Internal workflows, team coordination, handoffs, documentation
- **Workflow**: Multi-step automation, conditional logic, decision trees
- **Marketing**: Campaigns, nurture sequences, content delivery, attribution
- **Delivery**: Client onboarding, service fulfillment, project tracking
- **Finance**: Invoicing, payment processing, collections, revenue ops
- **Reporting**: Dashboards, metrics, KPIs, executive visibility
- **Team**: Training, adoption, change management, playbooks

### Value Category (Fine-Grained ROI Attribution)
Assign each ticket to ONE specific value area:
- Lead Intake, Lead Nurture, Lead Qualification
- Appointment Booking, Appointment Confirmation, No-Show Recovery
- Client Onboarding, Service Delivery, Client Retention
- Team Communication, Task Management, Knowledge Base
- Campaign Execution, Performance Tracking, Revenue Attribution
- Data Quality, Process Standardization, Compliance

### Time Estimates (Must Use 5-15 Hour Range)
- **CORE tickets**: 5-8 hours
- **RECOMMENDED tickets**: 8-12 hours
- **ADVANCED tickets**: 12-15 hours
- **NO tickets under 5 hours** (these are too trivial for this scope)
- **NO tickets over 15 hours** (these should be broken into multiple tickets)

### Sprint Assignments (30/60/90-Day Roadmap)
- **Sprint 30**: CORE tickets (foundation + quick wins)
- **Sprint 60**: RECOMMENDED tickets (high-leverage systems)
- **Sprint 90**: ADVANCED tickets (transformation + scale)

### ROI Projection Requirements
Each ticket MUST include realistic projections:
- **projected_hours_saved_weekly**: How many hours/week this saves the team (0-20 range)
- **projected_leads_recovered_monthly**: How many leads/month this recovers or captures (0-30 range)
- **roi_notes**: Specific explanation of how value is realized (100-200 words)

**ROI Calibration:**
- Time savings value: $35/hour (team labor cost)
- Lead recovery value: $35/lead (opportunity cost of missed follow-up)
- Payback calculation: ticket_cost / (weekly_time_value * 52 + monthly_lead_value * 12)
- Target payback: CORE <4 weeks, RECOMMENDED <8 weeks, ADVANCED <16 weeks

## Ticket Schema (JSON Array Output)

Return a JSON array with exactly **${targetCount}**. Each ticket must have:

\`\`\`typescript
{
  inventoryId: string;        // MUST match one of the inventory items exactly
  ticketId: string;           // Local ticket ID, e.g. "T001", "T002" (you assign)
  title: string;              // Specific, action-oriented (50-80 chars), based on titleTemplate
  category: string;           // From inventory
  value_category: string;     // From inventory
  tier: "core" | "recommended" | "advanced";  // From inventory
  sprint: 30 | 60 | 90;       // From inventory

  isSidecar: boolean;         // From inventory (default false)
  sidecarCategory?: string;   // If provided in inventory

  pain_source: string;        // Direct quote or synthesis from diagnostic/discovery (100-200 words)
  description: string;        // What this ticket accomplishes (200-300 words)
  current_state: string;      // How ${tenantName} operates today (150-250 words)
  target_state: string;       // How ${tenantName} will operate after implementation (150-250 words)
  ai_design: string;          // AI/automation strategy (200-300 words)
  ghl_implementation: string; // Specific GHL technical implementation (200-300 words)
  implementation_steps: string[]; // 6-10 discrete steps
  owner: string;              // "Owner" | "Ops Manager" | "TC" | "Admin"
  dependencies: string[];     // Array of ticketIds this depends on (empty array if none)
  time_estimate_hours: number; // 5-15 hours (must match tier expectations)
  cost_estimate: number;      // time_estimate_hours * $125
  success_metric: string;     // Measurable outcome definition (100-150 words)
  roadmap_section: string;    // "diagnostic" | "architecture" | "high_leverage" | "implementation"
  priority: string;           // "critical" | "high" | "medium"
  sprint: number;             // 30 | 60 | 90
  projected_hours_saved_weekly: number;    // 0-20 range
  projected_leads_recovered_monthly: number; // 0-30 range
  roi_notes: string;          // Specific ROI explanation (100-200 words)
}
\`\`\`

## Quality Standards

### Content Depth
- **NO generic recommendations** ("Set up automation", "Improve CRM")
- **USE specific diagnostic data** (quote pain points, reference discovery notes, cite SOP-01 analysis)
- **GROUND in ${tenantName}'s reality** (mention their systems, workflows, team roles, business model)
- **EXPLAIN technical implementation** (GHL workflow details, AI prompts, integration specs)

### Strategic Coherence
- Tickets should build on each other (use dependencies field)
- CORE tickets enable RECOMMENDED tickets (workflow foundations → automation layers)
- RECOMMENDED tickets enable ADVANCED tickets (basic AI → predictive systems)
- Each tier should feel like a natural progression, not arbitrary grouping

### Financial Rigor
- Time estimates must be realistic (not padded, not underestimated)
- ROI projections must be grounded (cite specific processes being automated)
- Payback periods should align with tier (CORE pays back fastest, ADVANCED takes longer but has higher ROI)

## Final Output Format

**CRITICAL**: You MUST return a JSON object with a "tickets" array.

\`\`\`json
{
  "tickets": [
    { /* ticket 1 */ },
    { /* ticket 2 */ },
    ...
    { /* ticket ${selectedInventory.length} */ }
  ]
}
\`\`\`

Return ONLY:

- A **JSON OBJECT** with a single key: **"tickets"**
- The **"tickets"** value is an **ARRAY** containing exactly **${selectedInventory.length} ticket objects**
- Each ticket object matches the schema above
- No commentary, no markdown, no prose outside the JSON
- Do NOT return a bare array at the top level
- Do NOT return a single ticket object without the "tickets" wrapper

Validate before returning:

- ✅ Root is an object: \`{ "tickets": [...] }\`
- ✅ Array length = ${selectedInventory.length} items
- ✅ Every \`inventoryId\` in the output exists in the input
- ✅ No duplicate or missing inventoryIds
- ✅ All required fields present (no nulls, no empty strings)
- ✅ ROI and time estimates within the specified bounds

Generate the ${selectedInventory.length} tickets now inside the "tickets" array.`;
}
