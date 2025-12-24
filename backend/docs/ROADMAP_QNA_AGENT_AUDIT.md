# Portal Roadmap Q&A Agent – Complete System Audit (Read-Only)

**Date:** December 9, 2025  
**Purpose:** Document exact architecture before applying Voice Kernel

---

## 1. System Prompt

### Location
**File:** `backend/src/trustagent/services/roadmapQnAAgent.service.ts`  
**Function:** `callRoadmapQnAAgent()`  
**Lines:** 20-62

### Exact String (No Composition)
The system prompt is a **single inline string literal** (not composed from multiple files):

```typescript
const systemPrompt = `
You are the Strategic AI Roadmap Q&A Agent.

You answer questions for a single firm based on:
- Their Strategic AI Roadmap
- APPROVED implementation tickets only
- Enriched owner profile (name, issues, goals, KPIs, capacity, guardrails)

You will always receive the user's full roadmap context, approved tickets, KPIs, and intake capacities.
Sometimes, you may ALSO receive a small payload describing the user's *current roadmap section*, including:
- currentSectionSlug
- currentSectionTitle  
- currentSectionContent

This is NOT a separate agent mode. It simply tells you what the user is looking at right now.

Behavior Rules:
1. Always ground your answers in the APPROVED TICKETS and the FINAL ROADMAP.
   They override anything ambiguous or incomplete in a single section.

2. If a current section is provided:
   • Use it as local context.
   • Tailor your language so it feels like you're talking about what they're viewing.
   • BUT do not invent systems or tickets implied by that section.
   • And never contradict the approved ticket list.

3. If the section is NOT relevant to the user's question, ignore it and answer using the full roadmap context.

4. No matter what, you are ONE agent with one brain, answering every question with full-firm intelligence.

STRICT RULES:
- NEVER talk about tickets that are not in roadmapQnAContext.tickets (approved only).
- When referring to the owner, use their displayName and roleLabel from ownerProfile.
- Respect changeReadiness and weeklyCapacityHours when suggesting scope/sprints.
- When asked about KPIs, use the actual kpiBaselines from ownerProfile.
- If the user asks about something not in the context, say so clearly instead of inventing.
- DO NOT invent ticket IDs, dependencies, or dollar amounts.
- Sprint assignments come ONLY from the actual sprint field in tickets.
- ROI numbers come ONLY from ticketRollup.

You will receive JSON called "roadmapQnAContext". Use it as your source of truth.
Be conversational, helpful, and specific. Reference actual ticket IDs and titles when relevant.
`;
```

### Composition Notes
- **No layer system** (unlike Homepage TrustAgent which has 10 layers)
- **No imported text blocks** (single file, single function)
- **No helper functions** modifying the prompt
- **No template variables** or string interpolation in the prompt itself

---

## 2. Runtime Context Injection

### Context Construction
**File:** `backend/src/trustagent/services/roadmapQnAContext.service.ts`  
**Function:** `buildRoadmapQnAContext(tenantId: string)`  
**Returns:** `RoadmapQnAContext | null`

### Context Fields (Complete List)

#### Firm Metadata
```typescript
{
  tenantId: string;
  firmName: string;
  firmSizeTier: 'micro' | 'small' | 'mid' | 'large' | string;
  businessType: string;
  region?: string | null;
  teamHeadcount: number | null;
  baselineMonthlyLeads: number | null;
  diagnosticDate: string; // ISO
}
```

#### Current Section (Optional - Situational Awareness)
```typescript
currentSection?: {
  slug: string;
  title: string;
  content: string;
}
```

#### Enriched Owner Profile (From Intake)
```typescript
ownerProfile?: {
  roleLabel: string;              // "Owner", "CEO", etc
  departmentKey: string;          // "owner"
  displayName?: string;           // "Roberta"
  preferredReference?: string;    // "Roberta (Owner)"
  
  top3Issues?: string[];          // Pain points
  top3GoalsNext90Days?: string[]; // Goals
  oneThingOutcome?: string;       // "If nothing else but X..."
  
  primaryKpis?: string[];         // KPI labels
  kpiBaselines?: Record<string, string>; // KPI -> baseline value
  
  nonGoals?: string[];            // What we're NOT doing
  doNotAutomate?: string[];       // Keep human-only
  
  changeReadiness?: 'low' | 'medium' | 'high';
  weeklyCapacityHours?: number;
  biggestRiskIfTooFast?: string;
}
```

#### Team Profiles (Future - Currently Empty Array)
```typescript
teamProfiles?: EnrichedProfile[]; // Sales, Ops, Delivery
```

#### Longform Narrative Docs (Future - Currently Undefined)
```typescript
executiveSummaryMarkdown?: string;
diagnosticMarkdown?: string;
aiLeverageMarkdown?: string;
roadmapSkeletonMarkdown?: string;
discoveryNotesMarkdown?: string;
```

#### Tickets (APPROVED ONLY)
```typescript
tickets: Array<{
  ticketId: string;
  inventoryId: string | null;
  isSidecar: boolean;
  
  title: string;
  category: string;
  valueCategory: string;
  tier: 'core' | 'recommended' | 'advanced' | string;
  
  sprint: number | null;
  roadmapSection: string;
  
  painSource: string;
  description: string;
  currentState: string;
  targetState: string;
  
  aiDesign: string;
  ghlImplementation: string;
  implementationSteps: string;
  
  owner: string;
  dependencies: string[];
  
  timeEstimateHours: number;
  costEstimate: number;
  
  projectedHoursSavedWeekly: number;
  projectedLeadsRecoveredMonthly: number;
  
  successMetric: string;
  roiNotes: string;
  
  priority: 'high' | 'medium' | 'low' | string;
}>
```

#### Ticket Rollup (Computed Aggregates)
```typescript
ticketRollup: {
  totalHours: number;
  totalCost: number;
  totalHoursSavedWeekly: number;
  totalLeadsRecoveredMonthly: number;
  annualizedTimeValue: number;
  annualizedLeadValue: number;
  annualizedROI: number;
  paybackWeeks: number;
}
```

#### Sprint Summaries (Computed by Sprint)
```typescript
sprintSummaries?: Array<{
  sprint: number;
  ticketIds: string[];
  totalCost: number;
  totalHours: number;
  totalHoursSavedWeekly: number;
  totalLeadsRecoveredMonthly: number;
}>
```

#### Top Tickets by Impact (Top 5)
```typescript
topTicketsByImpact?: Array<{
  ticketId: string;
  impactScore: number;
}>
```

#### Roadmap Sections (From Database)
```typescript
roadmapSections: Array<{
  id: string;
  sectionKey: string; // 'executive', 'systems', etc
  title: string;
  order: number;
  contentMarkdown: string;
}>
```

### Context Injection Method
**File:** `backend/src/trustagent/services/roadmapQnAAgent.service.ts`  
**Lines:** 64-78

The context is passed as a **second system message** containing pure JSON:

```typescript
const response = await client.chat.completions.create({
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  temperature: 0.2,
  messages: [
    { role: 'system', content: systemPrompt },
    {
      role: 'system',
      content: JSON.stringify({
        sectionKey: sectionKey ?? null,
        roadmapQnAContext,
      }),
    },
    { role: 'user', content: question },
  ],
});
```

**Notes:**
- Context is NOT in metadata
- Context is NOT in tools
- Context is a **second system message with JSON payload**
- `sectionKey` is passed separately from `roadmapQnAContext`

---

## 3. Middleware & Preprocessing

### Route Layer
**File:** `backend/src/routes/roadmap.routes.ts`  
**Endpoint:** `POST /api/roadmap/qna`  
**Middleware Stack:**
1. `authenticate` - Validates JWT token
2. `requireTenantAccess()` - Ensures user belongs to tenant
3. `roadmapQnAController.askAboutRoadmap` - Controller handler

### Controller Layer
**File:** `backend/src/controllers/roadmapQnA.controller.ts`  
**Function:** `askAboutRoadmap(req, res)`

**Preprocessing Steps:**
1. Extract `tenantId` from authenticated request
2. Validate `question` is present and non-empty
3. Extract optional `sectionKey` and `currentSection` from body
4. Call `buildRoadmapQnAContext(tenantId)` to construct full context
5. Add `currentSection` to context if provided
6. Pass to agent with `.trim()` applied to question

**User Message Modifications:**
- `.trim()` only (removes leading/trailing whitespace)
- **No other transformations**
- **No wrapper instructions**
- **No prompt injection**

**Context Modifications:**
- `currentSection` is optionally added to context object if provided in request body
- Otherwise context is passed as-is from `buildRoadmapQnAContext()`

---

## 4. Post-Processing & Guardrails

### Agent Response Handling
**File:** `backend/src/trustagent/services/roadmapQnAAgent.service.ts`  
**Line:** 80

```typescript
return response.choices[0]?.message?.content ?? 'I was unable to generate a response. Please try again.';
```

**Post-Processing:**
- **None** (raw OpenAI response content returned)
- **No citation stripping**
- **No formatting**
- **No output transformation**

### Controller Response
**File:** `backend/src/controllers/roadmapQnA.controller.ts`  
**Lines:** 49-51

```typescript
console.log(`[RoadmapQnA] Answer generated (${answer.length} chars)`);

return res.json({ answer });
```

**Post-Processing:**
- **None** (answer passed directly to JSON response)
- **No guardrails**
- **No override behavior**

### Frontend Handling
**File:** `frontend/src/lib/api.ts`  
**Lines:** 127-139

```typescript
askRoadmapQuestion: (payload: { 
  question: string; 
  sectionKey?: string;
  currentSection?: {
    slug: string;
    title: string;
    content: string;
  };
}) =>
  fetchAPI<{ answer: string }>('/api/roadmap/qna', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
```

**Frontend Post-Processing:**
- **None** (answer used as-is from API response)
- Frontend component displays `answer` directly in markdown

---

## 5. Configuration Differences: Portal vs Homepage

### Portal Roadmap Agent
**File:** `backend/src/trustagent/services/roadmapQnAAgent.service.ts`

| Parameter | Value | Source |
|-----------|-------|--------|
| **Model** | `gpt-4o-mini` | `process.env.OPENAI_MODEL` or fallback |
| **Temperature** | `0.2` | Hardcoded (line 66) |
| **Max Tokens** | Not specified | OpenAI default |
| **Response Format** | `auto` | OpenAI default (not specified) |
| **Tools** | None | No function calling |
| **Top P** | Not specified | OpenAI default |
| **Frequency Penalty** | Not specified | OpenAI default |
| **Presence Penalty** | Not specified | OpenAI default |

### Homepage TrustAgent
**File:** `backend/src/services/publicAgentSession.service.ts` (inferred from snapshot)

| Parameter | Value | Source |
|-----------|-------|--------|
| **Model** | `gpt-4o-mini` | `process.env.OPENAI_TRUSTAGENT_MODEL` |
| **Temperature** | `1.0` | OpenAI Assistant config |
| **Max Tokens** | Not specified | OpenAI default |
| **Response Format** | `auto` | OpenAI Assistant config |
| **Tools** | `file_search` | OpenAI Assistant config |
| **Top P** | `1` | OpenAI Assistant config |
| **Frequency Penalty** | Not specified | OpenAI default |
| **Presence Penalty** | Not specified | OpenAI default |

### Key Differences

| Aspect | Portal Agent | Homepage Agent |
|--------|-------------|----------------|
| **API Type** | Direct chat completions | OpenAI Assistant |
| **Temperature** | 0.2 (precise) | 1.0 (creative) |
| **Context** | JSON in system message | Thread memory + vector store |
| **Prompt Structure** | Single inline string | 10 composed layers |
| **Voice** | Conversational, grounded | Strategic operator, structural tags |
| **Tools** | None | file_search |
| **Session Management** | Stateless | Persistent threads |

---

## 6. Critical Preservation Requirements

### DO NOT Change
1. **Temperature:** Must remain 0.2 for precision on ticket/ROI data
2. **Context injection:** Must remain as second system message with JSON
3. **APPROVED tickets filter:** Context service must only return `approved: true` tickets
4. **Strict rules enforcement:** All "STRICT RULES" must be preserved verbatim
5. **Section-awareness architecture:** `currentSection` optional field must remain
6. **No function calling:** Agent must remain stateless, no tools
7. **ROI computation logic:** `computeTicketRollup()` calculations must not change

### Safe to Modify (Voice Kernel Application)
1. **Tone/voice:** Can add Voice Kernel phrasing (grounded, relieving, sharp)
2. **Response structure:** Can add default rhythm (acknowledge → clarify → question)
3. **Question style:** Can make sharper, more operational
4. **Drift recovery:** Can add self-correction protocol
5. **Technical depth:** Can add version/simple toggle language
6. **Precision mode:** Can add one-sentence mode for executive signals

### Must Add Carefully
- Voice Kernel instructions must be **additive**, not replacing existing strict rules
- "Be conversational, helpful, and specific" can be expanded with Voice Kernel tone
- Any new language must not contradict existing data grounding requirements

---

## 7. Architecture Summary

```
Request Flow:
┌─────────────────────────────────────────────────────────────┐
│ Frontend: useRoadmapTrustAgent.send(question)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ API: POST /api/roadmap/qna                                  │
│ Body: { question, sectionKey?, currentSection? }            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Middleware:                                                 │
│ - authenticate (JWT)                                        │
│ - requireTenantAccess (tenant membership)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Controller: roadmapQnA.controller.askAboutRoadmap()         │
│ - Extract tenantId                                          │
│ - Validate question                                         │
│ - Build context: buildRoadmapQnAContext(tenantId)           │
│ - Add currentSection if provided                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Context Service: roadmapQnAContext.service                  │
│ - Fetch tenant, roadmap, sections                           │
│ - Fetch APPROVED tickets only (approved: true)              │
│ - Fetch owner intake (enriched profile)                     │
│ - Compute ticketRollup, sprintSummaries, topTickets         │
│ - Return RoadmapQnAContext object                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Agent Service: roadmapQnAAgent.service                      │
│ - Build system prompt (inline string)                       │
│ - Call OpenAI chat.completions.create()                     │
│   Messages:                                                 │
│   1. { role: 'system', content: systemPrompt }              │
│   2. { role: 'system', content: JSON(context) }             │
│   3. { role: 'user', content: question }                    │
│ - Model: gpt-4o-mini                                        │
│ - Temperature: 0.2                                          │
│ - Return raw content                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Response: { answer: string }                                │
│ - No post-processing                                        │
│ - No guardrails                                             │
│ - No formatting                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Voice Kernel Application Strategy

### Recommended Approach
1. **Prepend Voice Kernel** to existing system prompt (before behavior rules)
2. **Keep all STRICT RULES** intact at end of prompt
3. **Expand "Be conversational, helpful, and specific"** with Voice Kernel tone guidance
4. **Add drift recovery** as final instruction
5. **Test with existing approved tickets** to ensure no data hallucination

### Example Insertion Point
```typescript
const systemPrompt = `
You are the Strategic AI Roadmap Q&A Agent.

[INSERT VOICE KERNEL HERE]

You answer questions for a single firm based on:
...

[EXISTING BEHAVIOR RULES + STRICT RULES UNCHANGED]
`;
```

### Testing Checklist
- [ ] Agent still grounds in APPROVED tickets only
- [ ] Agent still respects changeReadiness and capacity
- [ ] Agent still uses actual kpiBaselines
- [ ] Agent still references actual ticket IDs
- [ ] Voice is sharper, more relieving, less corporate
- [ ] No data fabrication
- [ ] Temperature remains 0.2

---

**End of Audit**

This document represents the **exact state** of the Portal Roadmap Q&A Agent as of December 9, 2025, before any Voice Kernel modifications.

---

## VOICE & CONTEXT STATE — DEC 9, 2025 (CURRENT IMPLEMENTATION)

**Date:** December 9, 2025  
**Purpose:** Document current production state after voice kernel application

This section captures the **current live implementation** of the Portal Roadmap Q&A Agent after applying TrustAgent voice alignment.

---

### 1. System Prompt Structure (Current)

**File:** `backend/src/trustagent/services/roadmapQnAAgent.service.ts`  
**Lines:** 20-237

#### Prompt Architecture
The system prompt remains a **single inline string** (not multi-layered like the homepage agent), but now includes:

1. **Core Identity & Data Rules** (lines 20-60)
   - Role definition: "Strategic AI Roadmap Q&A Agent"
   - Data sources: roadmap, approved tickets, owner profile
   - Section-awareness capability
   - Behavior rules (1-4)
   - STRICT RULES (approved tickets only, no invention)

2. **TONE OVERRIDE — TRUSTAGENT VOICE** (lines 62-87)
   - Tone principles: calm, confident, clear, slightly sharp
   - Language constraints: no jargon, no therapist language, no AI boilerplate
   - Default rhythm: acknowledge → answer → (optional) follow-up question
   - Technical depth adaptation
   - Drift recovery instruction

3. **TONE & IDENTITY OVERRIDE — MANDATORY** (lines 89-237)
   - **Identity Rule** (lines 91-109)
     - Strict trigger: only when user explicitly asks who/what the agent is
     - Trigger examples: "who are you", "what are you", "what is your role", "are you an AI", "explain yourself", "why are you here", "what do I call you"
     - Exclusions (do NOT trigger identity): compliments ("you're clever"), tone feedback ("that was rude"), personality questions ("why are you like this"), meta comments ("your style is weird")
     - Identity statement: "I am TrustAgent, acting as the strategist layer over your Strategic AI Roadmap — not a generic assistant."
     - Does NOT repeat identity on every response
   
   - **User Identity Rule** (lines 106-111)
     - Handles "who am I?" questions using currentUserProfile
     - Does NOT respond with agent identity to user identity questions
   
   - **Voice Rules** (lines 113-121)
     - Tone reinforcement: operator-minded, not formal
     - Anti-patterns: no robotic phrases, no corporate jargon, no therapist language
   
   - **Personalization Rule** (lines 123-130)
     - Use currentUserProfile.displayName for addressing the user
     - Use ownerProfile only for owner-level goals/KPIs/capacity
     - Never assume current user is owner
   
   - **Diagnostic Style** (lines 132-144)
     - First-name usage from currentUserProfile
     - Owner references from ownerProfile (explicit "for the owner")
     - Plain English issue statement
     - ROI quantification from context only
     - Short, confident insight
   
   - **Opening-Line Rule** (lines 146-153)
     - For identity questions only
     - Strategist-style openers ("What's on your mind?", etc.)
     - No assistant-style phrases
   
   - **First-Name Usage Rule** (lines 155-164)
     - Natural, human usage (greeting + emphasis beats)
     - NOT every response
     - NOT more than one sentence per message
     - Some messages have no name at all
   
   - **Conversation Flow Rule** (lines 166-183)
     - Pattern for confusion/general needs: neutral acknowledgment (no name) → explanation
     - Pattern for pain points: avoid "<FirstName>, your firm faces..."
     - Prefer natural patterns ("Well, your firm faces...")
     - Name can come later for emphasis
   
   - **First-Name Source Rule** (lines 185-189)
     - currentUserProfile.displayName for the person chatting
     - ownerProfile.displayName ONLY for owner-specific references
     - Never assume current user is owner
   
   - **Meta-Feedback Rule** (lines 191-196)
     - Handles tone feedback ("that's not very polite")
     - Does NOT repeat identity
     - Brief acknowledgment + reset
   
   - **Anomalous / Off-Topic Input Rule** (lines 198-242)
     - Triggers for absurd/playful/impossible/non-business inputs
     - Three-step pattern:
       1. Humor beat (warm, lightly mischievous, human)
       2. Smartass edge (short, sharp, confident but friendly)
       3. Pivot to roadmap (immediate, same response)
     - Tone constraints: warm and human, playful mischief not mean, 2-4 sentences max
     - Domain independence: triggers even for non-business absurdity
   
   - **Meta-Compliment Rule** (lines 244-260)
     - Handles comments on personality/tone/cleverness/humor/style (NOT identity questions)
     - Short, playful, self-aware responses:
       - "Comes with the job, Roberta. Strategy keeps me sharp."
       - "Flattery accepted. Now let's get back to fixing your pipeline."
       - "I try. But your roadmap gives me plenty of material."
       - "Smart-ish is my specialization. Strategic is my job."
     - Pivots back to roadmap context in same response
     - Does NOT use identity line
     - Does NOT fire anomalous-input response unless truly absurd
     - 2-4 sentences total

---

### 2. Context Payload (Current)

**File:** `backend/src/trustagent/services/roadmapQnAContext.service.ts`

#### Added Field: currentUserProfile

**Type Definition** (added Dec 9, 2025):
```typescript
export interface CurrentUserProfile {
  userId: string;
  displayName: string;   // First name extracted from user.name
  roleLabel: string;     // "Owner", "Ops Lead", "Sales Lead", etc.
  email?: string;
}
```

**Population** (`backend/src/controllers/roadmapQnA.controller.ts`, lines 43-71):
1. Fetch full user record from database using `user.userId`
2. Extract first name from `user.name` (e.g., "Sarah Johnson" → "Sarah")
3. Map role to human-readable label:
   - `owner` → `"Owner"`
   - `ops` → `"Ops Lead"`
   - `sales` → `"Sales Lead"`
   - `delivery` → `"Delivery Lead"`
   - `staff` → `"Team Member"`
   - `superadmin` → `"Admin"`
4. Inject into `roadmapQnAContext.currentUserProfile` before passing to agent

#### Complete Context Structure (Current)

`roadmapQnAContext` now includes:
- Firm metadata (tenantId, firmName, firmSizeTier, businessType, region, teamHeadcount, baselineMonthlyLeads, diagnosticDate)
- **currentUserProfile** (NEW: who is chatting)
- ownerProfile (enriched intake profile: goals, KPIs, capacity, change readiness)
- teamProfiles (empty array, future expansion)
- currentSection (optional: slug, title, content)
- tickets (approved only)
- ticketRollup (aggregated ROI/time-savings)
- sprintSummaries (computed by sprint)
- topTicketsByImpact (top 5)
- roadmapSections (from database)
- Longform narrative docs (future: executiveSummaryMarkdown, diagnosticMarkdown, etc.)

#### Multi-User Personalization

**Distinction:**
- **currentUserProfile:** The person logged in and asking questions
  - Agent addresses them by `currentUserProfile.displayName`
  - Uses their `roleLabel` for context
- **ownerProfile:** The firm owner (may be different person)
  - Agent references them only when discussing owner-level strategy, KPIs, capacity
  - Never assumes currentUser is owner unless `currentUserProfile.roleLabel === "Owner"`

**Use Cases:**
- Owner asks questions: currentUserProfile = ownerProfile (same person)
- Ops Lead asks questions: currentUserProfile = Ops Lead, ownerProfile = Owner (different people)
- Agent responds: "Sarah (Ops Lead), for Marcus (the owner), this hits his capacity KPIs..."

---

### 3. Current Guarantees

#### Model Configuration (Unchanged)
- **Model:** `gpt-4o-mini` (or `process.env.OPENAI_MODEL`)
- **Temperature:** `0.2` (precision for ticket/ROI data)
- **Context injection:** Second system message with JSON payload
- **No function calling:** Stateless, no tools
- **No post-processing:** Raw OpenAI response returned

#### Data Grounding (Unchanged)
- **Approved tickets only:** Context service filters `approved: true`
- **No invention:** Agent cannot invent ticket IDs, dependencies, or ROI numbers
- **ROI from context:** All numbers come from `ticketRollup` or ticket fields
- **Sprint assignments:** Only from actual `ticket.sprint` field
- **KPI baselines:** Only from `ownerProfile.kpiBaselines`

#### Strict Rules (Unchanged)
All STRICT RULES from the original audit remain in place:
- NEVER talk about tickets not in `roadmapQnAContext.tickets`
- When referring to owner, use `ownerProfile.displayName` and `roleLabel`
- Respect `changeReadiness` and `weeklyCapacityHours`
- Use actual `kpiBaselines` from ownerProfile
- Say clearly when something is not in context (don't invent)
- Sprint assignments come ONLY from ticket.sprint field
- ROI numbers come ONLY from ticketRollup

#### Frontend (Minor Fix)
- **Input focus retention:** Fixed using `requestAnimationFrame` to refocus after send
- **Rendering:** Still uses ReactMarkdown (unchanged)
- **No structural changes:** API calls, response handling unchanged

---

### 4. Voice Kernel Application Summary

#### What Was Added
1. ✅ **TONE OVERRIDE block** (lines 62-87)
   - TrustAgent voice principles
   - Anti-jargon/anti-boilerplate rules
   - Default rhythm pattern

2. ✅ **TONE & IDENTITY OVERRIDE block** (lines 89-260)
   - Identity trigger rule (strict: only when explicitly asked who/what)
   - Identity exclusions (compliments, tone feedback, personality questions)
   - User identity rule ("who am I?")
   - First-name usage rules (natural, not every response)
   - Conversation flow patterns
   - Anomalous input handling (humor + pivot)
   - Meta-feedback handling (tone correction)
   - Meta-compliment handling (playful acknowledgment + pivot)

3. ✅ **currentUserProfile support**
   - Multi-user personalization
   - currentUserProfile vs ownerProfile distinction
   - Controller-level user record fetching
   - First-name extraction from full name
   - Role-to-label mapping

#### What Stayed the Same
- ✅ Temperature (0.2)
- ✅ Model (gpt-4o-mini)
- ✅ Context injection method (second system message with JSON)
- ✅ All STRICT RULES (approved tickets, no invention, ROI grounding)
- ✅ Section-awareness architecture
- ✅ Ticket filtering (approved: true only)
- ✅ ROI computation logic
- ✅ Stateless operation (no tools, no function calling)

---

### 5. Testing Checklist (Current State Verification)

**Voice & Tone:**
- [ ] Agent uses TrustAgent voice (calm, confident, sharp but not rude)
- [ ] No corporate jargon or therapist language
- [ ] Short sentences, minimal filler
- [ ] Identity statement only appears when explicitly asked "who are you?" (not for compliments/tone feedback)
- [ ] No identity repetition on follow-up questions
- [ ] Meta-compliments trigger playful acknowledgment, not identity statement

**Personalization:**
- [ ] Agent addresses logged-in user by first name from currentUserProfile
- [ ] Agent references owner by name only when discussing owner-level goals/KPIs
- [ ] Multi-user scenarios work (Ops Lead gets addressed as "Sarah", owner referenced as "Marcus")
- [ ] "who am I?" returns currentUserProfile info, not agent identity

**Conversation Flow:**
- [ ] Acknowledgment → explanation → (optional) follow-up question pattern
- [ ] First name used naturally (greeting + emphasis, not every response)
- [ ] Some responses have no name (natural variation)
- [ ] Technical depth adaptation works ("simple version" vs "technical version")

**Anomalous Input:**
- [ ] Absurd inputs trigger humor beat + smartass edge + pivot pattern
- [ ] Humor is warm and mischievous, not cold or robotic
- [ ] Pivot back to roadmap happens in same response
- [ ] Domain independent (triggers even for non-business absurdity)

**Data Grounding:**
- [ ] Agent grounds in approved tickets only
- [ ] Agent respects changeReadiness and capacity
- [ ] Agent uses actual kpiBaselines
- [ ] Agent references actual ticket IDs
- [ ] No data fabrication
- [ ] Temperature remains 0.2

---

### 6. Diff Reference

**To diff against original (v1):**
- Compare against lines 1-521 of this document (original audit)

**To diff against current (v2):**
- Compare against `backend/src/trustagent/services/roadmapQnAAgent.service.ts` as of Dec 9, 2025
- Compare against `backend/src/controllers/roadmapQnA.controller.ts` (currentUserProfile injection)

**Key files modified:**
1. `backend/src/trustagent/services/roadmapQnAAgent.service.ts` — system prompt expanded
2. `backend/src/controllers/roadmapQnA.controller.ts` — currentUserProfile injection added
3. `backend/src/trustagent/types/roadmapQnA.ts` — CurrentUserProfile interface added (already existed)
4. `frontend/src/components/TrustAgent/TrustAgentShell.tsx` — input focus fix (requestAnimationFrame)

---

**End of Current State Documentation**

This section documents the Portal Roadmap Q&A Agent as implemented on December 9, 2025, after applying TrustAgent voice kernel and multi-user personalization. All changes are additive to the original audit; no strict rules or data grounding was removed or weakened.
