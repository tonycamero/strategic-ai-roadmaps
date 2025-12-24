# Roadmap Agent Architecture

## Overview
The Roadmap Agent is a tenant-specific AI assistant that helps owners/staff understand and implement their Strategic AI Roadmap. Each tenant gets their own OpenAI Assistant instance provisioned with their roadmap content.

---

## Core Components

### 1. Database Schema (`src/db/schema.ts`)

#### `agent_configs` table
Stores per-tenant, per-role agent configuration:
- `tenant_id` - Which firm this agent belongs to
- `role_type` - 'owner', 'staff', or 'advisor'
- `system_identity` - Base identity prompt
- `business_context` - Auto-generated from roadmap sections
- `custom_instructions` - Owner-editable preferences
- `role_playbook` - Base behavioral guidelines
- `roadmap_metadata` - Extracted pain points, goals, timeline
- `openai_assistant_id` - OpenAI Assistant ID
- `openai_vector_store_id` - OpenAI Vector Store ID
- `openai_model` - Model version (default: gpt-4o-mini)
- `last_provisioned_at` - Last sync timestamp

#### `agent_threads` table
Conversation persistence:
- `tenant_id` - Firm
- `agent_config_id` - Which agent config
- `openai_thread_id` - OpenAI Thread ID
- `actor_user_id` - User having the conversation
- `visibility` - 'owner', 'shared', or 'superadmin_only'

#### `agent_messages` table
Message history for replay/audit

#### `agent_logs` table
Event logging for provisioning, errors, sync operations

---

## 2. Provisioning Pipeline

### Entry Points

**A. Automatic (Primary)**
`backend/src/controllers/finalRoadmap.controller.ts`
```typescript
// After roadmap generation succeeds
await syncAgentsForRoadmap(tenantId, roadmap.id, req.user?.userId);
```

**B. Manual Resync**
`backend/scripts/resync-all-agent-configs.ts`
```bash
npx tsx scripts/resync-all-agent-configs.ts
```

### Flow

1. **`syncAgentsForRoadmap()`** (`services/roadmapAgentSync.service.ts`)
   - Fetches roadmap sections
   - Extracts metadata (pain points, goals, timeline)
   - Builds business context summary
   - Creates agent_configs if missing (owner/staff/advisor)
   - Updates existing configs with new roadmap data
   - Calls `provisionAssistantForConfig()` for each role

2. **`provisionAssistantForConfig()`** (`services/assistantProvisioning.service.ts`)
   - Loads agent_config from DB
   - Composes full instructions using `composeInstructions()`
   - Creates/updates OpenAI Vector Store with tenant documents
   - Creates/updates OpenAI Assistant
   - Stores `openai_assistant_id` + `openai_vector_store_id` back to DB

3. **`composeInstructions()`** (`services/assistantProvisioning.service.ts`)
   - Builds final system prompt from:
     - `system_identity`
     - `PERSONALITY_LAYER` (from `config/agentPersonality.ts`)
     - `business_context` (roadmap summary)
     - `custom_instructions` (owner editable)
     - `role_playbook`
     - Roadmap section list
     - Hard tenant firewall rules

---

## 3. Runtime Query Flow

### Entry Point
`POST /api/assistant/query`
`backend/src/controllers/assistantAgent.controller.ts`

### Flow

1. **Route Handler** (`routes/assistantAgent.routes.ts`)
   ```typescript
   router.post('/query', authenticate, assistantAgent.handleAgentQuery);
   ```

2. **Controller** (`controllers/assistantAgent.controller.ts`)
   - Determines tenant + role
   - Routes to `handleOwnerAgentQuery()`, `handleStaffAgentQuery()`, etc.

3. **Query Service** (`services/assistantQuery.service.ts`)
   - Fetches `agent_config` for (tenantId, roleType)
   - **Error if missing**: "Assistant not provisioned"
   - Builds additional context (current section, interaction mode)
   - Calls `buildAgentSystemPrompt()` to inject mode-specific rules
   - Creates/retrieves OpenAI Thread
   - Sends message to OpenAI Assistant
   - Streams response back to client

4. **Prompt Builder** (`services/agentPromptBuilder.service.ts`)
   - Takes base config + interaction mode
   - Appends mode-specific guidelines:
     - `observer`: Read-only, analysis, recommendations
     - `editor`: Can propose/execute actions (when tools exist)
     - `superadmin`: Cross-tenant diagnostics
   - **CRITICAL**: Never mentions "modes" in UX (as of latest fix)

---

## 4. Interaction Modes

### Defined in `middleware/auth.ts`

```typescript
export type InteractionMode = 'editor' | 'observer' | 'superadmin';

export function getInteractionModeFromRole(role: string): InteractionMode {
  if (role === 'superadmin') return 'superadmin';
  return 'observer'; // DEFAULT for all owners/staff (roadmap viewer is read-only)
}
```

### Attached to JWT
```typescript
req.user = {
  ...payload,
  interactionMode: getInteractionModeFromRole(payload.role)
};
```

### Used in Prompt
`agentPromptBuilder.service.ts` injects mode-specific guidelines into system prompt.

---

## 5. Key Services

### `roadmapAgentSync.service.ts`
- **Purpose**: Sync agent configs when roadmap changes
- **Exports**: `syncAgentsForRoadmap(tenantId, roadmapId, userId)`
- **Called by**: Final roadmap controller, resync scripts

### `assistantProvisioning.service.ts`
- **Purpose**: Create/update OpenAI Assistants + Vector Stores
- **Exports**: `provisionAssistantForConfig(configId, userId)`
- **Key Functions**:
  - `composeInstructions()` - Builds system prompt
  - `ensureVectorStore()` - Uploads tenant docs to OpenAI

### `assistantQuery.service.ts`
- **Purpose**: Handle runtime queries to OpenAI Assistant
- **Exports**: `queryAssistant(params)`
- **Key Logic**:
  - Fetch agent_config
  - Build context (section, mode)
  - Create/get thread
  - Stream OpenAI response

### `agentPromptBuilder.service.ts`
- **Purpose**: Inject mode-specific behavior rules
- **Exports**: `buildAgentSystemPrompt(config, mode)`
- **Output**: Full system prompt with mode guidelines

### `agentResyncAll.service.ts`
- **Purpose**: Wrapper to resync a single tenant
- **Exports**: `resyncAgentsForTenant(tenantId, userId?)`
- **Used by**: Global resync script

---

## 6. Routes

### `/api/assistant/*` (`routes/assistantAgent.routes.ts`)
```typescript
POST /api/assistant/query          // Main query endpoint
GET  /api/assistant/threads         // List user's threads
POST /api/assistant/threads         // Create new thread
GET  /api/assistant/threads/:id/messages // Get thread history
```

### `/api/agent-config/*` (`routes/agentConfig.routes.ts`)
```typescript
GET  /api/agent-config              // Owner's agent config
PUT  /api/agent-config/custom       // Update custom instructions
```

---

## 7. Scripts

### `scripts/resync-all-agent-configs.ts`
- Resyncs all tenants with roadmaps
- Usage: `npx tsx scripts/resync-all-agent-configs.ts`

### `scripts/provision_all_assistants.ts`
- Legacy provisioning script (pre-refactor)

### `scripts/reprovision_hayes_assistant.ts`
- One-off script for Hayes Real Estate

---

## 8. Configuration

### `config/agentPersonality.ts`
```typescript
export const PERSONALITY_LAYER = `
You are a sharp, practical operator on the firm's team...
- You NEVER say "I'd recommend"...
- You speak in imperatives and direct recommendations...
`;
```

### `config/agent-custom-instructions.ts`
Default custom instructions template (unused in current flow)

---

## 9. Current Issues (Pre-Refactor)

### A. Mode Language Leakage
- **Fixed**: Removed "OBSERVER MODE" / "EDITOR MODE" from UX
- **Location**: `agentPromptBuilder.service.ts` lines 24-61

### B. Provisioning Gaps
- Some tenants never got agent_configs
- **Fix**: `syncAgentsForRoadmap()` now creates defaults if missing

### C. Token Handling
- `updatedBy` field expected UUID, got string "system"
- **Fixed**: Lines 130, 291 in respective services

### D. Interaction Mode Hardcoding
- All owners got `'editor'` mode by default
- **Fixed**: Changed default to `'observer'` (line 33, `auth.ts`)

---

## 10. Data Flow Diagram

```
[Final Roadmap Generation]
         ↓
[syncAgentsForRoadmap]
         ↓
[Create/Update agent_configs] ← (owner, staff, advisor)
         ↓
[provisionAssistantForConfig] × 3
         ↓
[composeInstructions] ← personality + roadmap + playbook
         ↓
[OpenAI: Create/Update Assistant]
         ↓
[Store openai_assistant_id in DB]
         ↓
[READY FOR QUERIES]
         ↓
[POST /api/assistant/query]
         ↓
[queryAssistant]
         ↓
[buildAgentSystemPrompt] ← inject mode rules
         ↓
[OpenAI: Send Message]
         ↓
[Stream Response to Client]
```

---

## 11. Refactor Recommendations

### Immediate
1. **Remove legacy scripts** (`provision_all_assistants.ts`, one-off reprovisioners)
2. **Consolidate config files** (merge `agent-custom-instructions.ts` into main flow or delete)
3. **Add health check endpoint** (`GET /api/assistant/health/:tenantId`)

### Medium-term
1. **Decouple modes from roles** - Make modes context-aware (viewing vs editing)
2. **Add retry logic** - Provisioning can fail silently; add retries + alerts
3. **Version control prompts** - Track prompt changes in DB (`agent_configs.version`)

### Long-term
1. **Multi-assistant architecture** - Separate assistants per use case (roadmap, compliance, implementation)
2. **Tools/function calling** - Enable assistants to actually execute actions (update tickets, create tasks)
3. **Feedback loop** - Track which responses users find helpful, refine prompts

---

## 12. Testing

### Manual Test Flow
1. Generate roadmap for tenant (SuperAdmin)
2. Log in as owner
3. Open Roadmap AI Assistant
4. Ask: "What should I focus on this week?"
5. Verify response:
   - ✅ References specific tenant (Hayes, BrightFocus, etc.)
   - ✅ References specific roadmap metrics (77h/week, 96 leads/mo)
   - ✅ NO mention of "modes" or "access levels"
   - ✅ Sounds like a practical teammate

### Automated Tests (TODO)
- Unit tests for `composeInstructions()`
- Integration tests for provisioning flow
- E2E tests for query flow

---

## 13. Key Files Reference

| Purpose | File |
|---------|------|
| Schema | `src/db/schema.ts` (lines 273-310, 316-327) |
| Provisioning | `src/services/assistantProvisioning.service.ts` |
| Sync Logic | `src/services/roadmapAgentSync.service.ts` |
| Query Runtime | `src/services/assistantQuery.service.ts` |
| Prompt Builder | `src/services/agentPromptBuilder.service.ts` |
| Auth/Modes | `src/middleware/auth.ts` (lines 8-34) |
| Controller | `src/controllers/assistantAgent.controller.ts` |
| Routes | `src/routes/assistantAgent.routes.ts` |
| Personality | `src/config/agentPersonality.ts` |
| Resync Script | `scripts/resync-all-agent-configs.ts` |

---

## 14. Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...

# Optional
DEFAULT_AGENT_MODEL=gpt-4o-mini
ENABLE_VECTOR_STORES=true
```

---

## Summary

The Roadmap Agent is a **tenant-scoped OpenAI Assistant** that:
1. Gets provisioned when a tenant's final roadmap is generated
2. Stores config in `agent_configs` table (per tenant, per role)
3. Builds system prompts from roadmap content + personality layer
4. Handles queries via `/api/assistant/query`
5. Never mentions internal "modes" or access levels in UX
6. Currently operates in `observer` mode for all owners (read-only roadmap viewer)

**Next refactor should focus on:**
- Health monitoring
- Retry logic
- Context-aware modes (not just role-based)
- Tools/function calling for real actions
