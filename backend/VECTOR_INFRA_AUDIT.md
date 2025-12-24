# Vector Infrastructure Audit

**Date:** 2025-12-09  
**Purpose:** Assess existing vector/retrieval infrastructure for compatibility with v2 architecture (single static assistant + runtime StrategyContext injection)

---

## 1. Vector Infrastructure Discovery

### Files Implementing Vector Store Management

#### Primary Services:
- **`src/services/assistantProvisioning.service.ts`** (245 lines)
  - **Function:** `ensureVectorStore(config: AgentConfig)` (lines 63-122)
  - **What it does:**
    - Creates per-tenant vector stores (`tenant_{tenantId}_{roleType}`)
    - Reuses existing vector store if `config.openaiVectorStoreId` exists
    - Uploads documents from `tenant_documents` table (categories: `roadmap`, `sop_output`, `report`)
    - Uses OpenAI `vectorStores.fileBatches.uploadAndPoll()` API
    - Returns vector store ID (or null if disabled)
  - **Provisioning integration:**
    - Called during `provisionAssistantForConfig()` (line 178)
    - If vector store exists, enables `file_search` tool on assistant (line 187-189)
    - Attaches vector store to assistant via `tool_resources.file_search`

- **`src/services/roadmapAgentSync.service.ts`** (256 lines)
  - **Function:** `syncAgentsForRoadmap(tenantId, roadmapId, triggeredByUserId)`
  - **What it does:**
    - Triggered when roadmap is refreshed/updated
    - Extracts roadmap metadata (pain points, goals, systems, timeline) via heuristics
    - Updates `agent_configs` table with new `roadmapMetadata` and `businessContext`
    - Calls `provisionAssistantForConfig()` to reprovision assistant (line 105)
  - **Note:** Stores extracted metadata in `agent_configs.roadmapMetadata` JSON field (NOT in vector store)

#### Upload Scripts:
- **`src/scripts/upload_roadmap_to_vector_store.ts`**
  - Standalone script for Hayes tenant (hardcoded tenant ID)
  - Fetches roadmap documents from `tenant_documents`
  - Uploads to existing vector store via `vectorStores.fileBatches.uploadAndPoll()`
  - **Usage:** One-time or manual re-sync

- **`src/scripts/provision_all_assistants.ts`**
  - Provisions all active `agent_configs` records
  - Indirectly triggers vector store creation via `provisionAssistantForConfig()`

#### Config/Utilities:
- **`src/config/openai.config.ts`**
  - Manages homepage TrustAgent assistant (separate from tenant assistants)
  - Stores homepage vector store ID in env var: `OPENAI_TRUSTAGENT_VECTOR_STORE_ID`

### Document Types Currently Embedded

From `assistantProvisioning.service.ts` line 91-93:
```typescript
const filesToUpload = docs.filter((d) =>
  ['roadmap', 'sop_output', 'report'].includes(d.category ?? '')
);
```

**Document categories ingested:**
1. **`roadmap`** - Full roadmap PDF or markdown sections
2. **`sop_output`** - Generated SOP documents
3. **`report`** - Diagnostic reports or analysis outputs

**Source:** `tenant_documents` table (schema lines 234-267)

### Vector Store ID Association

**Database schema (`agent_configs` table, line 299):**
```sql
openai_vector_store_id VARCHAR(128)
```

**Association model:**
- **Per-tenant, per-agent-type** (currently only `roadmap_coach`)
- Each `agent_config` row stores:
  - `openaiAssistantId` - OpenAI assistant ID
  - `openaiVectorStoreId` - OpenAI vector store ID
  - `tenantId` - Owner tenant
- **1:1 mapping:** One vector store per assistant config

**Current architecture (v1.5):**
- Each tenant gets its own assistant (`asst_xxx`)
- Each assistant has its own vector store (`vs_xxx`)
- Vector store is populated during provisioning with tenant's documents

### Retrieval Usage in Query Path

**From `assistantQuery.service.ts` analysis:**

**Provisioning time (lines 187-189 in `assistantProvisioning.service.ts`):**
```typescript
if (vectorStoreId) {
  tools.push({ type: 'file_search' });
  toolResources.file_search = { vector_store_ids: [vectorStoreId] };
}
```
- `file_search` tool is enabled on the assistant if vector store exists
- Vector store IDs attached to assistant via `tool_resources`

**Query time (`assistantQuery.service.ts`):**
- **NO explicit retrieval calls** in the query pipeline
- Retrieval happens **implicitly** via OpenAI's `file_search` tool
- When assistant is invoked (line 259-261), OpenAI automatically searches attached vector stores if `file_search` tool is available
- **The application doesn't control or trigger retrieval** - it's entirely managed by OpenAI's assistant runtime

**Conclusion:** Retrieval is **provisioned but passive** - the assistant decides when to search based on the query.

---

## 2. Coupling Analysis

### Reusable Pieces (Decoupled)

✅ **Vector store creation logic** (`ensureVectorStore` function)
- Generic function that creates vector stores and uploads documents
- **Input:** `AgentConfig` object (tenant ID, existing vector store ID)
- **Output:** Vector store ID
- **Not coupled to:** Prompt content, per-tenant assistants, role types
- **Could be reused for v2:** ✅ Yes, with minor parameter adjustments

✅ **Document upload logic**
- Uses `tenant_documents` table as source of truth
- Filters by category (`roadmap`, `sop_output`, `report`)
- **Not coupled to:** Assistant architecture
- **Could be reused for v2:** ✅ Yes, directly

✅ **OpenAI vector store API wrappers**
- `vectorStores.fileBatches.uploadAndPoll()` usage
- SDK version handling (`(openai as any).vectorStores || openai.beta.vectorStores`)
- **Could be reused for v2:** ✅ Yes, directly

### Legacy-Tied Pieces (Tightly Coupled)

❌ **`ensureVectorStore` assumes 1:1 assistant-to-vector-store**
- Line 71-73: Reuses `config.openaiVectorStoreId` if exists
- **Problem:** In v2, we want **per-tenant vector stores** attached to a **single env-wide assistant**
- **Coupling:** Function signature expects `AgentConfig` which includes `openaiAssistantId`

❌ **Vector store naming convention** (line 80)
```typescript
name: `tenant_${config.tenantId}_${config.roleType}`
```
- Includes `roleType` in name (assumes multi-role assistants per tenant)
- **Problem:** v2 has no per-role assistants - just one assistant for all tenants
- **Impact:** Minor - naming only, doesn't affect functionality

❌ **`roadmapAgentSync.service.ts` reprovisions assistants**
- Line 105: `await provisionAssistantForConfig(...)`
- **Problem:** This re-provisions the **per-tenant assistant** with new instructions
- **Coupling:** Entire sync flow assumes roadmap changes → reprovision assistant → update prompt
- **v2 conflict:** v2 doesn't reprovision on roadmap changes (static prompt)

❌ **Roadmap metadata extraction stores in `agent_configs.roadmapMetadata`** (lines 154-226)
- Extracts pain points, goals, systems, timeline via text heuristics
- Stores in JSON field in database
- **Problem:** Designed to be **baked into system prompt** during provisioning
- **v2 conflict:** v2 uses runtime StrategyContext JSON injection, not baked-in metadata

❌ **`provisionAssistantForConfig` couples vector store to assistant provisioning**
- Line 178: `const vectorStoreId = await ensureVectorStore(config);`
- Line 186-189: Attaches vector store to assistant during creation/update
- **Problem:** In v2, we want to provision the assistant **once** (static), but manage **per-tenant vector stores separately**

### Summary Table

| Component | Reusable? | Coupling Issue |
|-----------|-----------|----------------|
| Vector store creation API | ✅ Yes | None |
| Document upload from `tenant_documents` | ✅ Yes | None |
| `ensureVectorStore()` function | ⚠️ Partially | Expects `AgentConfig`, 1:1 assistant mapping |
| Vector store naming | ⚠️ Partially | Includes `roleType` (minor) |
| `roadmapAgentSync` service | ❌ No | Assumes per-tenant assistants, reprovision flow |
| Roadmap metadata extraction | ⚠️ Partially | Output format tied to prompt baking |
| Provisioning integration | ❌ No | Couples vector store lifecycle to assistant provisioning |

---

## 3. V2 Integration Design Options

### Context: V2 Architecture Requirements

**V2 uses:**
- ✅ Single static assistant (env-wide, provisioned once)
- ✅ 15-line minimal prompt (no roadmap data baked in)
- ✅ Runtime StrategyContext JSON injection per query
- ✅ Per-tenant context isolation (StrategyContext includes tenant-specific signals)

**V2 needs retrieval for:**
- Reading actual roadmap section content (not just signals)
- Citing specific recommendations from SOPs
- Grounding responses in tenant's diagnostic data

**Problem:** Current assistant gives generic advice because StrategyContext only contains **signals** (pains, gaps, quick wins), not **actual content**.

---

### Option A: Adapt Existing Vector Infra to V2

**Approach:** Keep per-tenant vector stores, attach to single assistant at query time.

#### Changes Required:

1. **Decouple vector store management from assistant provisioning**
   - Create new service: `src/services/vectorStoreManager.service.ts`
   - Extract `ensureVectorStore()` logic, remove dependency on `AgentConfig`
   - New signature: `ensureVectorStoreForTenant(tenantId: string): Promise<string>`
   - Store vector store IDs in new table: `tenant_vector_stores` (tenantId, vectorStoreId, updatedAt)

2. **Modify assistant provisioning to create ONE static assistant**
   - Remove vector store attachment from `provisionAssistantForConfig()`
   - Provision assistant with `file_search` tool but NO `tool_resources` (attach at query time)
   - Store assistant ID in env var: `OPENAI_ROADMAP_COACH_ASSISTANT_ID`

3. **Attach tenant vector store at query time**
   - In `assistantQuery.service.ts`, before creating run:
     ```typescript
     const vectorStoreId = await getVectorStoreForTenant(tenantId);
     const run = await openai.beta.threads.runs.create(threadId, {
       assistant_id: assistantId,
       additional_instructions: strategyContextBlock, // Runtime injection
       tools: [{ type: 'file_search', file_search: { vector_store_ids: [vectorStoreId] } }]
     });
     ```
   - **Note:** Check if OpenAI API allows per-run vector store override (may need verification)

4. **Update `roadmapAgentSync` to refresh vector store only**
   - When roadmap changes, call `refreshVectorStoreForTenant(tenantId)`
   - Upload new roadmap sections to existing vector store (or recreate)
   - **Do not reprovision assistant** (it's static)

#### Pros:
- ✅ Reuses existing document upload logic
- ✅ Minimal changes to vector store creation
- ✅ Per-tenant isolation maintained (separate vector stores)
- ✅ Decouples vector lifecycle from assistant lifecycle

#### Cons:
- ❌ OpenAI API may not support per-run vector store attachment (needs verification)
- ❌ Requires new database table (`tenant_vector_stores`) or reuse `agent_configs` with modified schema
- ❌ `roadmapAgentSync` still tightly coupled to old flow (needs major refactor)

#### Estimated Effort:
- **3-4 hours** (new service, query-time attachment logic, testing)
- **Risk:** Medium (depends on OpenAI API support for run-time vector store override)

---

### Option B: Rebuild Thinner, V2-Native Vector Layer

**Approach:** Simplify to per-tenant vector stores with manual refresh triggers, no coupling to provisioning.

#### Changes Required:

1. **Create new lightweight vector service**
   - File: `src/services/tenantVectorStore.service.ts`
   - Functions:
     ```typescript
     async function getOrCreateVectorStore(tenantId: string): Promise<string>
     async function refreshVectorStoreContent(tenantId: string): Promise<void>
     async function deleteVectorStore(tenantId: string): Promise<void>
     ```
   - Store mappings in new table: `tenant_vector_stores` (tenantId, vectorStoreId, lastRefreshedAt)

2. **Provision single static assistant with file_search enabled**
   - One-time provisioning script: `src/scripts/provision_v2_roadmap_coach.ts`
   - Assistant created with `file_search` tool but NO attached vector stores
   - Store assistant ID in env: `OPENAI_V2_ROADMAP_COACH_ID`

3. **Attach vector store at query time via additional_messages**
   - OpenAI Assistants API supports per-thread file attachments
   - Alternative: Use `additional_instructions` to inject file context (if API supports)
   - Or: Upload files directly to thread before each run (less efficient)

4. **Trigger vector refresh on roadmap/SOP changes**
   - When roadmap finalized: call `refreshVectorStoreContent(tenantId)`
   - When SOP generated: call `refreshVectorStoreContent(tenantId)`
   - Independent of assistant provisioning

5. **Sunset old provisioning flow**
   - Mark `assistantProvisioning.service.ts` as deprecated
   - Mark `roadmapAgentSync.service.ts` as deprecated
   - Remove `openaiVectorStoreId` from `agent_configs` table (or ignore it)

#### Pros:
- ✅ Clean separation: assistants vs vector stores
- ✅ Aligns with v2 philosophy (static assistant, runtime data injection)
- ✅ No dependency on legacy provisioning flows
- ✅ Easier to reason about and maintain

#### Cons:
- ❌ Throws away existing provisioning code (sunk cost)
- ❌ Requires migration: existing vector stores → new table
- ❌ More upfront work to build new service

#### Estimated Effort:
- **4-6 hours** (new service, migration, query integration, testing)
- **Risk:** Low (clean slate, no OpenAI API unknowns)

---

## 4. Recommendation

### **Option B: Rebuild V2-Native Vector Layer**

#### Justification:

1. **Existing infra is tightly coupled to v1.5 architecture**
   - `roadmapAgentSync` assumes per-tenant assistants + reprovision flow
   - `assistantProvisioning` couples vector store lifecycle to assistant lifecycle
   - Adapting these would require **significant refactoring** (essentially a rebuild)

2. **V2 philosophy conflicts with existing design**
   - V2: Static assistant, runtime injection
   - V1.5: Dynamic assistants, baked-in context
   - Forcing v1.5 infra into v2 creates **architectural friction**

3. **Option B is only slightly more work than Option A**
   - Option A: 3-4 hours + risk of OpenAI API limitations
   - Option B: 4-6 hours + clean architecture
   - **Difference: ~2 hours for better long-term maintainability**

4. **Tech debt reduction**
   - V1.5 provisioning code is already marked for deprecation (based on conversation summary)
   - Building v2-native layer avoids maintaining two systems in parallel

5. **Per-tenant vector stores are still valuable**
   - OpenAI's `file_search` tool provides semantic retrieval
   - Grounding assistant responses in actual roadmap/SOP content is critical
   - V2 StrategyContext (signals) + retrieval (content) = complete solution

#### Implementation Plan (Option B):

**Phase 1: Build New Vector Service (2-3 hours)**
- Create `src/services/tenantVectorStore.service.ts`
- Add `tenant_vector_stores` table (migration 028)
- Implement `getOrCreateVectorStore()` and `refreshVectorStoreContent()`
- Reuse document upload logic from `assistantProvisioning.service.ts`

**Phase 2: Integrate with Query Path (1-2 hours)**
- Modify `assistantQuery.service.ts` to fetch vector store ID per tenant
- Attach vector store to thread or run (pending OpenAI API research)
- Test retrieval with real queries

**Phase 3: Wire Refresh Triggers (1 hour)**
- Call `refreshVectorStoreContent()` in roadmap finalization flow
- Call `refreshVectorStoreContent()` in SOP generation flow
- Add admin endpoint: `POST /api/superadmin/tenants/:id/refresh-vector-store`

**Phase 4: Migrate Existing Data (30 minutes)**
- Script to copy `agent_configs.openaiVectorStoreId` → `tenant_vector_stores` table
- Verify all active tenants have vector stores

**Phase 5: Deprecation (30 minutes)**
- Add deprecation notices to `assistantProvisioning.service.ts` and `roadmapAgentSync.service.ts`
- Document v2 vector architecture in `docs/v2-architecture.md`

---

## 5. Next Steps

1. **Get approval for Option B**
2. **Research OpenAI API:** Verify how to attach per-tenant vector stores at query time (threads vs runs vs additional_instructions)
3. **Create implementation plan ticket** (break into sub-tasks)
4. **Begin Phase 1:** Build `tenantVectorStore.service.ts`

---

**End of Audit**
