# Agent Configuration & Deployment Specification v1.1

**Version:** 1.1  
**Status:** Implementation Ready  
**Owner:** Tony Camero  
**Purpose:** Multi-field prompt composition system for deploying firm-specific role agents at scale

---

## Problem Statement

When deploying role-specific agents (Owner Agent, Ops Agent, TC Agent, Agent Support Bot) across 20+ firms, you need:

1. **Controllability** — Different people control different parts of the prompt
2. **Tunability** — Owners can customize tone/style without breaking logic
3. **Scalability** — Roll out playbook updates across all firms in one click
4. **Safety** — Owners can't accidentally break their agents
5. **IP Protection** — Your playbooks remain your differentiation

**Single-prompt blobs do NOT scale.** They cannot be versioned, controlled, or safely edited across multiple firms.

---

## Architecture: Multi-Field Prompt Composition

Each deployed agent's prompt is composed from **6 distinct fields**, each with different ownership and edit permissions:

### 1. System Identity (Locked — YOU only)

**Owner:** Tony Camero  
**Editable by:** SuperAdmin only  
**Purpose:** Define role identity, mission, boundaries, ethical guardrails

**Example (Owner Agent):**
```
You are the Owner Agent for {{FIRM_NAME}}.

Your mission:
- Strategic decision support for the firm owner
- Revenue optimization and growth planning
- High-level team and operational insights
- Challenge assumptions when necessary

Boundaries:
- Never make financial decisions autonomously
- Always cite specific data when making recommendations
- Escalate compliance or legal questions immediately
- Respect owner's final authority on all decisions

You are a strategic partner, not an order-taker.
```

**Why locked:** This is the "soul" of the agent. Owners should NEVER touch this.

---

### 2. Business Context (Auto-generated from Intake + Roadmap)

**Owner:** System-generated  
**Editable by:** System only (rebuild button available)  
**Purpose:** Firm-specific operational data

**Auto-populated from:**
- Owner intake responses
- Team intake responses
- Firm metadata (CRM, team size, locations)
- Roadmap diagnostics section
- Pain points and bottlenecks

**Example:**
```
Business Context for {{FIRM_NAME}}:

Team Structure:
- {{AGENT_COUNT}} licensed agents
- {{ADMIN_COUNT}} admin staff
- {{TC_COUNT}} transaction coordinators

Technology Stack:
- CRM: {{CRM_NAME}}
- Transaction Management: {{TMS_NAME}}
- Current CRM adoption: {{CRM_ADOPTION_RATE}}%

Key Pain Points:
- {{PAIN_POINT_1}}
- {{PAIN_POINT_2}}
- {{PAIN_POINT_3}}

Current Bottlenecks:
- {{BOTTLENECK_1}}
- {{BOTTLENECK_2}}

Annual Transaction Volume: {{TX_VOLUME}}
Average Transaction Value: {{AVG_TX_VALUE}}
```

**Why auto-generated:** Ensures every firm gets personalized context without manual rewriting. Rebuilding context pulls latest intake data.

---

### 3. Custom Instructions (Editable by Owner)

**Owner:** Firm Owner  
**Editable by:** Owner (via their dashboard)  
**Purpose:** Personal communication preferences and decision-making style

**Example:**
```
Communication Style:
- Be extremely direct with me. No corporate speak.
- Challenge my assumptions when I'm wrong.
- Push me when I'm hesitating on important decisions.
- Ask clarifying questions instead of guessing.

Decision Support:
- Show me data first, recommendations second.
- Always include 2-3 alternative approaches.
- Flag risks I might not be seeing.

Tone:
- Professional but conversational.
- Use humor when appropriate.
- No motivational fluff.
```

**Max length:** 2,000 characters  
**Why editable:** Every owner has unique preferences. This lets them customize the agent's "voice" without touching system logic.

---

### 4. Role Playbook (YOU define, your team can edit)

**Owner:** Tony Camero  
**Editable by:** SuperAdmin + approved team members  
**Purpose:** Role-specific workflows, priorities, escalation rules

**Structure:**

#### Priorities
```
Owner Agent Focus Areas:
1. Revenue growth and business expansion
2. Team performance and hiring decisions
3. Strategic partnerships and market positioning
4. High-level operational efficiency
5. Owner time optimization

De-prioritize:
- Day-to-day task management (delegate to Ops Agent)
- Individual transaction details (delegate to TC Agent)
- Routine admin questions (delegate to Agent Support Bot)
```

#### Workflow Logic
```
When owner asks about team performance:
1. Pull latest metrics from CRM and transaction data
2. Compare to prior period and industry benchmarks
3. Identify top performers and underperformers
4. Suggest 2-3 specific coaching or hiring actions

When owner asks "Should I hire someone?":
1. Analyze current team capacity vs. pipeline
2. Calculate ROI of new hire (deals/year × avg commission)
3. Present data-driven recommendation with timeframe
4. Flag any cash flow or training capacity constraints
```

#### Red Flags (Auto-escalate)
```
Immediately flag and escalate:
- Compliance or licensing issues
- Legal exposure or contract disputes
- Cash flow problems or unexpected expenses
- Team turnover above 20% annually
- CRM adoption drop below 40%
```

#### Guardrails
```
Never:
- Make financial commitments on owner's behalf
- Share confidential firm data with team members
- Override owner decisions (even if you disagree)
- Provide legal or accounting advice (refer to professionals)
```

**Why YOU define it:** This is your IP. This is what differentiates your agents from generic ChatGPT. Owners can request tweaks, but you control the playbook.

---

### 5. Tool Context (System-managed)

**Owner:** System  
**Editable by:** System only  
**Purpose:** Available functions, data sources, permissions

**Auto-generated based on role and firm:**
```
Available Tools:

Data Access:
- getFirmMetrics(firmId, dateRange) — Revenue, transaction volume, agent performance
- getActiveDeals(agentId?, status?) — Pipeline and deal stages
- getTeamPerformance(dateRange) — Agent rankings, conversion rates
- getIntakeData(firmId) — Original diagnostic responses

Actions:
- createTask(userId, title, description, dueDate) — Assign follow-ups
- sendSlackAlert(channel, message) — Notify team members
- scheduleReport(frequency, recipients) — Automate reporting

External Integrations:
- CRM: {{CRM_NAME}} (read-only access)
- TMS: {{TMS_NAME}} (read-only access)

Permissions:
- Can read all firm data
- Can create tasks for owner and team
- Cannot modify financial records
- Cannot send external communications
```

**Why system-managed:** Tools and permissions are tied to infrastructure and security. This isn't configurable by users.

---

### 6. Knowledge Store (Your team curates)

**Owner:** Tony Camero + approved team  
**Editable by:** SuperAdmin only  
**Purpose:** Firm-specific documents, SOPs, roadmap content

**Attached Documents:**
- Strategic AI Roadmap (all 8 sections)
- Uploaded SOPs and templates
- Compliance checklists
- Training materials
- Process documentation

**Example:**
```
Knowledge Base for {{FIRM_NAME}}:

Roadmap Sections Available:
- Executive Briefing (completed)
- Diagnostics (completed)
- Architecture (completed)
- AI Systems (in progress)
- Implementation Plan (not started)

Uploaded Documents:
- Lead Follow-Up SOP (uploaded 2024-01-15)
- Transaction Checklist v2 (uploaded 2024-01-20)
- CRM Setup Guide (uploaded 2024-01-10)

The agent can reference these documents when answering questions.
```

**Why curated by you:** You control what knowledge the agent has access to. Firms can't upload random documents that might confuse the agent.

---

## Prompt Composition Flow

When an agent receives a query, the system constructs the full prompt:

```typescript
const fullPrompt = `
${systemIdentity}

${businessContext}

${customInstructions ? `Owner Preferences:\n${customInstructions}\n` : ''}

${rolePlaybook}

${toolContext}

${knowledgeStore ? `Available Knowledge:\n${knowledgeStore}\n` : ''}
`;
```

**Result:** A fully composed, context-aware prompt that balances system control with owner personalization.

---

## Database Schema

```typescript
// backend/src/db/schema/agentConfigs.ts
import {
  pgTable, uuid, varchar, text, boolean, integer, json, timestamp,
} from 'drizzle-orm/pg-core';
import { tenants, users } from './schema';

export const agentConfigs = pgTable('agent_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  roleType: varchar('role_type', { length: 32 }).notNull(), // owner | ops | sales | tc | support

  systemIdentity: text('system_identity').notNull(),
  businessContext: text('business_context'),          // auto-generated
  customInstructions: text('custom_instructions'),    // owner-editable
  rolePlaybook: text('role_playbook').notNull(),      // your IP

  toolContext: json('tool_context').$type<{
    tools: { key: string; enabled: boolean }[];
  }>().default({ tools: [] }),

  isActive: boolean('is_active').notNull().default(true),
  version: integer('version').notNull().default(1),

  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

**SQL Migration:**

```sql
CREATE TABLE agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_type VARCHAR(32) NOT NULL,
  system_identity TEXT NOT NULL,
  business_context TEXT,
  custom_instructions TEXT,
  role_playbook TEXT NOT NULL,
  tool_context JSONB DEFAULT '{"tools": []}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, role_type)
);
```

**TypeScript Types:**

```typescript
// backend/src/types/agent.types.ts
export type AgentRoleType = 'owner' | 'ops' | 'tc' | 'agent_support' | 'sales';

export interface AgentConfig {
  id: string;
  tenantId: string;
  roleType: AgentRoleType;
  systemIdentity: string;
  businessContext: string | null;
  customInstructions: string | null;
  rolePlaybook: string;
  toolContext: {
    tools: { key: string; enabled: boolean }[];
  };
  isActive: boolean;
  version: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## API Endpoints

### Auth Rules

- **SuperAdmin**: Can view & edit all fields for any tenant
- **Owner**: Can view everything for their tenant, can edit only `customInstructions`
- **Other roles**: Read-only or no access (for now)

### Endpoints

#### List configs for a tenant
**GET** `/api/agents/configs/:tenantId`

**Response:**
```json
{
  "configs": [
    {
      "id": "uuid",
      "roleType": "owner",
      "isActive": true,
      "version": 1,
      "systemIdentity": "You are the Owner Agent...",
      "businessContext": "This firm uses...",
      "customInstructions": "Be direct...",
      "rolePlaybook": "Owner Agent focuses on...",
      "toolContext": { "tools": [{ "key": "getFirmMetrics", "enabled": true }] },
      "updatedAt": "2025-01-21T..."
    }
  ]
}
```

**Backend rules:**
- SuperAdmin: can fetch for any `tenantId`
- Owner: can only fetch for their own tenant (ignore path param, use `req.user.tenantId`)

---

#### Get single config
**GET** `/api/agents/configs/:tenantId/:roleType`

Returns that specific agent config.

---

#### Update config (role-aware edits)
**PUT** `/api/agents/configs/:id`

**Body (SuperAdmin full-edit):**
```json
{
  "systemIdentity": "You are the Owner Agent for...",
  "businessContext": "This firm uses...",
  "customInstructions": "Talk to me like...",
  "rolePlaybook": "Owner Agent does...",
  "toolContext": {
    "tools": [
      { "key": "getFirmMetrics", "enabled": true },
      { "key": "getIntakeSummaries", "enabled": true }
    ]
  },
  "isActive": true
}
```

**Backend behavior:**
- **SuperAdmin**: Can update any field
- **Owner**: Only `customInstructions` allowed (other fields silently stripped)

**Response:** Updated `AgentConfig`

---

#### Regenerate business context
**POST** `/api/agents/configs/:id/regenerate-business-context`

**Server logic:**
- Loads tenant intake(s) + roadmap summary
- Calls internal `buildBusinessContextPrompt(tenantId)`
- Updates `businessContext` + bumps `version`

**Response:**
```json
{
  "businessContext": "This firm uses...",
  "version": 2
}
```

---

#### Test the agent with current config
**POST** `/api/agents/:id/test`

**Body:**
```json
{
  "message": "What's the most important thing to fix first for Hayes?"
}
```

**Server logic:**
- Loads `agent_configs` row
- Assembles final prompt using `composeAgentPrompt()`
- Calls OpenAI with tools
- Returns response

**Response:**
```json
{
  "reply": "Based on Hayes' intake, the first priority is...",
  "trace": {
    "usedTools": ["getIntakeSummaries"],
    "model": "gpt-4o-mini",
    "promptTokens": 123,
    "completionTokens": 210
  }
}
```

---

## UX Wireframes

### SuperAdmin → Firm → Agents Tab

**Path:** `/superadmin/firms/:tenantId/agents`

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Hayes Real Estate Group > Agents                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Agent Deployments                                          │
│                                                             │
│  ┌──────────────┬────────────┬────────┬─────────────────┐  │
│  │ Role         │ Status     │ Version│ Last Updated    │  │
│  ├──────────────┼────────────┼────────┼─────────────────┤  │
│  │ Owner Agent  │ ● Active   │ v1.0   │ 2 days ago      │  │
│  │ Ops Agent    │ ○ Draft    │ v0.1   │ 1 day ago       │  │
│  │ TC Agent     │ ○ Inactive │ v0.0   │ —               │  │
│  │ Support Bot  │ ● Active   │ v1.0   │ 2 days ago      │  │
│  └──────────────┴────────────┴────────┴─────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Click **Configure** → opens drawer

---

### Agent Config Drawer (SuperAdmin View)

```
┌───────────────────────────────────────────────────────────────┐
│ ← Back          Owner Agent — Hayes Real Estate Group        │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ Status: [Active ▼]                                            │
│                                                               │
│ 1. System Identity (Locked)                           [🔒]   │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ You are the Owner Agent for Hayes Real Estate Group...   │ │
│ │ (Read-only, expandable)                                   │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ 2. Business Context (Auto-generated)             [Rebuild]   │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Team: 15 agents, 3 admin, 2 TCs                          │ │
│ │ CRM: Follow Up Boss (35% adoption)                        │ │
│ │ Pain: Weekend lead loss, manual follow-up                │ │
│ │                                                           │ │
│ │ Last rebuilt: 2025-01-15                                  │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ 3. Custom Instructions (Owner-editable)      [Owner can edit]│
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ "Be extremely direct. Challenge assumptions.             │ │
│ │  Push me on hesitations."                                 │ │
│ │                                                           │ │
│ │  — Set by Roberta Hayes on 2025-01-10                    │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ 4. Role Playbook (Your IP)                           [Edit]  │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ ▸ Priorities (4 items)                                    │ │
│ │ ▸ Workflow Logic (6 workflows)                            │ │
│ │ ▸ Red Flags (5 auto-escalate conditions)                 │ │
│ │ ▸ Guardrails (3 hard limits)                              │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ 5. Tool Access Matrix                                [Edit]  │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ ☑ getFirmMetrics          ☑ createTask                   │ │
│ │ ☑ getActiveDeals          ☑ sendSlackAlert               │ │
│ │ ☑ getTeamPerformance      ☐ modifyFinancials (disabled)  │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ 6. Test Agent                                                 │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Ask this agent anything...                                │ │
│ │                                                           │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                        [Test] [Save] [Cancel]│
└───────────────────────────────────────────────────────────────┘
```

---

### Owner Dashboard → Agent Settings

**Path:** `/owner/settings/agents`

**Simplified view (Custom Instructions only):**

```
┌─────────────────────────────────────────────────────────────┐
│ Agent Preferences                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Customize how your agents communicate with you              │
│                                                             │
│ Owner Agent                                   [Edit]        │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Be extremely direct. Challenge my assumptions.        │   │
│ │ No corporate speak. Push me on hesitations.           │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Ops Agent                                     [Edit]        │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ (Not yet customized)                                  │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ [Save Changes]                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Warp Ticket Pack (v1.1 Implementation)

This pack implements **full data model + minimal UI**, leaving advanced features (version history, impersonation testing) for v2.

---

### **AGENT-01 — Add `agent_configs` table + Drizzle model**

**Goal:** Persist agent configuration per firm + role.

**Scope:**
- Add `agent_configs` table (SQL migration)
- Create Drizzle model `agentConfigs` and TS types
- Enforce unique `(tenant_id, role_type)`

**Acceptance:**
- Migration runs clean on local + Neon
- `agent_configs` table visible and matches spec
- You can insert a row manually for Hayes Owner Agent

**Files to create:**
- `backend/src/db/schema/agentConfigs.ts`
- `backend/src/types/agent.types.ts`
- Migration file

---

### **AGENT-02 — Seed Hayes Owner Agent config**

**Goal:** Create first live example config for Hayes.

**Scope:**
- New seed function that:
  - Locates tenant for `Hayes Real Estate Group`
  - Inserts `agent_configs` row with:
    - `role_type = 'owner'`
    - `system_identity` = Owner Agent system prompt
    - `business_context` = stub from existing intake
    - `role_playbook` = Owner Agent playbook v1
    - `tool_context` = `{ tools: [{ key: 'getFirmMetrics', enabled: true }, ...] }`

**Acceptance:**
- After running seed, SuperAdmin API can fetch this config
- Agent chat service can consume it

**Files to create/modify:**
- `backend/src/seeds/agent-configs.seed.ts`

---

### **AGENT-03 — Backend: GET configs for tenant**

**Goal:** SuperAdmin can fetch agent configs for a firm.

**Scope:**
- Add route: `GET /api/agents/configs/:tenantId`
- Auth:
  - SuperAdmin: any tenant
  - Owner: ignore `:tenantId`, always resolve to their own tenant
- Response: `{ configs: AgentConfig[] }` with all fields

**Acceptance:**
- Authed as Tony (superadmin): request returns Hayes Owner Agent row
- Authed as owner: only their tenant's configs

**Files to create/modify:**
- `backend/src/controllers/agentConfig.controller.ts`
- `backend/src/routes/agentConfig.routes.ts`
- `backend/src/services/agentConfig.service.ts`

---

### **AGENT-04 — Backend: Update config (role-aware)**

**Goal:** Allow updating configs, with field restrictions per role.

**Scope:**
- Add route: `PUT /api/agents/configs/:id`
- SuperAdmin: can update all fields
- Owner: only `customInstructions` (server discards other fields)

**Acceptance:**
- SuperAdmin can edit all fields and see DB updated
- Owner role can only change `customInstructions`
- Try sending forbidden field as owner; DB should not change those columns

**Files to modify:**
- `backend/src/controllers/agentConfig.controller.ts`
- `backend/src/services/agentConfig.service.ts`

---

### **AGENT-05 — Frontend: SuperAdmin Agents tab (read + edit customInstructions)**

**Goal:** Minimal UI to prove multi-field config works.

**Scope:**
- New route: `/superadmin/firms/:tenantId/agents`
- Call `GET /api/agents/configs/:tenantId`
- Render simple list (one card per `roleType`):
  - Role name
  - Status
  - Last updated
  - Button: "Configure"
- Configure drawer:
  - Read-only: System Identity, Business Context, Role Playbook
  - Editable: Custom Instructions (textarea)
  - Save → calls `PUT /api/agents/configs/:id`

**Acceptance:**
- From SuperAdmin UI, you can:
  - See Hayes Owner Agent config
  - Edit `customInstructions`
  - Refresh page and see changes persist

**Files to create:**
- `frontend/src/superadmin/pages/FirmAgentsPage.tsx`
- `frontend/src/components/agents/AgentConfigDrawer.tsx`
- `frontend/src/lib/api.ts` (add agent config methods)

---

### **AGENT-06 — Wire Agent Service to use `agent_configs`**

**Goal:** Make existing SuperAdmin agent chat use config instead of hardcoded prompts.

**Scope:**
- Modify agent service to:
  - Find the right `agent_configs` record (for now, probably Tony's "superadmin meta-agent" or special tenant)
  - Build prompt from:
    - `systemIdentity`
    - `businessContext`
    - `customInstructions`
    - `rolePlaybook`
  - Include `toolContext` mapping into allowed tools

**Acceptance:**
- Update `customInstructions` in SuperAdmin UI
- Test agent chat → response behavior changes accordingly (e.g., more direct tone)

**Files to modify:**
- `backend/src/services/agent.service.ts`

---

## Key Benefits

1. **Separation of concerns**: System logic (you) vs. communication style (owner)
2. **Scalability**: Roll out playbook updates to all firms in one click
3. **Safety**: Owners can't break core agent logic; version history allows rollback
4. **IP Protection**: Your playbooks = your differentiation
5. **Owner Empowerment**: Owners customize tone/style without risk

---

## Failure Modes (If You DON'T Do This)

### Single-Prompt Blob Approach

**Problems:**
1. **Chaos at scale** — 20 firms × 4 agents = 80 unique prompts to manage
2. **No version control** — Can't roll back bad changes
3. **Owner breakage** — Firms accidentally break their own agents
4. **No consistency** — Agents feel different across firms
5. **IP exposure** — Owners see (and can copy) your prompt engineering
6. **Debugging nightmare** — Can't isolate which part of prompt is failing
7. **Migration hell** — Can't upgrade prompts without manual rewrites

**Result:** Product becomes unmaintainable. Agents go haywire. Firms churn.

---

## Implementation Timeline

### Phase 1: Build Config System (v1.1 — this spec)
**Timeline:** 1-2 weeks

**Deliverables:**
- DB schema + migrations
- API endpoints (list, get, update, test)
- SuperAdmin UI (minimal: list + edit custom instructions)
- Hayes Owner Agent wired to use config

---

### Phase 2: Deploy Hayes with Live Config
**Timeline:** Week 3-4

**Deliverables:**
- Hayes Owner Agent fully configured
- Roberta can edit custom instructions from her dashboard
- Test with real queries, gather feedback

---

### Phase 3: Scale to Multiple Firms
**Timeline:** Week 5-8

**Deliverables:**
- 3-5 firms with deployed agents
- Standardized role playbooks (Owner, Ops, TC, Support)
- Owner satisfaction metrics
- Documented prompt engineering best practices

---

## Next Steps

**Option A**: Build now (1-2 weeks)
- Execute AGENT-01 through AGENT-06 sequentially
- Deploy Hayes with config system from day 1

**Option B**: Ship Hayes first, build later
- Deploy Hayes with hardcoded prompts (faster)
- Learn what works in real usage
- Build config UI with validated requirements
- Migrate Hayes to config system after proving model

**Recommendation: Option A** — The config system is foundational. Build it once, reuse forever.

---

## References

- Agent System Architecture v1 (`SOPs/Agent_System_Architecture.md`)
- Custom Instructions Config (`backend/src/config/agent-custom-instructions.ts`)
- Current Agent Service (`backend/src/services/agent.service.ts`)

---

**Status:** Ready for implementation  
**Next Action:** Execute Warp Ticket Pack AGENT-01 through AGENT-06
