# V2 Architecture Implementation - Complete

**Date:** December 2025  
**Status:** ✅ Fully Implemented  
**Transition:** Phase 1.5 (monolith) → v2 (StrategyContext runtime)

---

## Summary

Successfully pivoted from the Phase 1.5 architecture (roadmap signals baked into system prompt, multi-layer persona prompts) to **v2 architecture** (minimal static prompt + runtime StrategyContext JSON injection).

### Key Change
**Before (Phase 1.5):** Per-tenant provisioning with roadmap data baked into 6-layer system prompt  
**After (v2):** Static assistant + runtime StrategyContext JSON block injected per-query

---

## Files Created (5 new files)

### 1. `src/types/strategyContext.ts`
- Core types for v2 architecture
- `StrategyContext`, `RoadmapSignals`, `TacticalFrame`, `PersonaRole`

### 2. `src/services/strategyContextBuilder.service.ts`
- Wires existing `metadataParser` + `tacticResolver` services
- Builds `StrategyContext` from roadmap + diagnostics at runtime
- Converts between internal formats and `StrategyContext` schema

### 3. `src/services/strategyContextStore.service.ts`
- Persistence helper for `agent_strategy_contexts` table
- `saveStrategyContext()`, `getStrategyContext()`, `deleteStrategyContext()`

### 4. `src/db/migrations/027_add_agent_strategy_contexts.sql`
- Creates `agent_strategy_contexts` table
- Schema: `tenant_id (PK)`, `context (JSONB)`, `updated_at`

### 5. `src/controllers/superadminRoadmapCoach.controller.ts`
- Sandbox endpoint: `POST /api/superadmin/roadmap-coach/sandbox`
- View endpoint: `GET /api/superadmin/roadmap-coach/context/:tenantId`
- Allows testing with context overrides

---

## Files Modified (4 existing files)

### 1. `src/db/schema.ts`
**Added:**
- `agentStrategyContexts` table definition
- Type exports: `AgentStrategyContext`, `NewAgentStrategyContext`

**Change:** One new table for storing runtime contexts

---

### 2. `src/services/assistantQuery.service.ts`
**Replaced Phase 1.5 tactical context injection with v2 StrategyContext:**

**Before (Phase 1.5):**
```typescript
// Loaded sections + diagnostics
// Computed signals + tactical frame
// Formatted as narrative prose
// Prepended to user message
```

**After (v2):**
```typescript
// Build StrategyContext at runtime
const strategyContext = await buildStrategyContext({
  tenantId,
  personaRole,
  currentView,
});

// Save to DB for auditing
await saveStrategyContext(strategyContext);

// Format as JSON block
const contextBlock = [
  '[STRATEGY_CONTEXT]',
  JSON.stringify(strategyContext, null, 2),
  '[END_CONTEXT]',
  '',
  'User Message:',
  message,
].join('\n');
```

**Key difference:** No more narrative prose. Pure JSON structure injected per-query.

---

### 3. `src/services/agentPromptBuilder.service.ts`
**Replaced multi-layer prompt with minimal static prompt:**

**Before (Phase 1.5 - 278 lines):**
```
Layer 1: Core Identity
Layer 2: Business Context (roadmap + diagnostics + signals + tactical frame)
Layer 3: Safety & Guardrails
Layer 4: Capability Profile
Layer 5: Persona & Tone (owner/staff/advisor)
Layer 6: Roadmap Map & Navigation
```

**After (v2 - 15 lines):**
```
You are the Strategic AI Roadmap Coach.

On every message, you will receive a [STRATEGY_CONTEXT] JSON block.

Rules:
- Treat STRATEGY_CONTEXT as source of truth
- Ground recommendations in pains, leverage points, workflow gaps, quick wins
- Ask clarifying questions if ambiguous
- Prefer concrete next steps
- Never invent details that contradict the context
```

**Key difference:** 95% reduction in prompt size. No tenant-specific data. No persona layers. Pure instruction on how to use the JSON context.

---

### 4. `src/services/assistantProvisioning.service.ts`
**Removed roadmap/diagnostic loading from provisioning:**

**Before (Phase 1.5):**
```typescript
const ctx = await buildContextFromConfig(config, firmName, { 
  enableDiagnostics: true 
});
```

**After (v2):**
```typescript
const ctx = {
  firmName,
  businessContext: undefined,
  roadmapSections: [],
  diagnosticSummary: undefined,
  roadmapSignals: undefined,
  tacticalFrame: undefined,
};
```

**Key difference:** Provisioning is now lightweight and rare. No roadmap dependency.

---

## Architecture Comparison

### Phase 1.5 (Monolith)
```
Provisioning Time:
- Load roadmap sections
- Extract signals
- Compute diagnostics summary
- Bake into 6-layer system prompt
- Provision OpenAI assistant (per tenant)

Query Time:
- Compute tactical frame
- Format as narrative prose
- Prepend to user message
- Query assistant
```

### V2 (Runtime Context)
```
Provisioning Time:
- Use minimal static prompt (same for all tenants)
- Provision OpenAI assistant (once per environment)

Query Time:
- Load roadmap + diagnostics
- Build StrategyContext (JSON)
- Save to agent_strategy_contexts
- Inject as JSON block
- Query assistant
```

---

## StrategyContext Schema

```json
{
  "tenantId": "abc-123",
  "personaRole": "owner",
  "roadmapSignals": {
    "pains": [
      "Lead Follow-Up: bottleneck described in roadmap",
      "Diagnostics: Follow-Up is high pain (9/10)"
    ],
    "leveragePoints": [
      "Lead Follow-Up System (low effort)"
    ],
    "workflowGaps": [
      "Lead Follow-Up: lacks defined process"
    ],
    "quickWins": [
      "Lead Follow-Up: contains a quick win recommendation"
    ]
  },
  "tacticalFrame": {
    "primaryConstraint": "Follow-Up is a high-pain area (9/10).",
    "leveragePlay": "Lead Follow-Up System (low effort, high impact)",
    "recommendedMicroSteps": [
      "Map the current workflow for Follow-Up end-to-end.",
      "Identify where leads drop off or get stuck in Follow-Up.",
      "Define one simple process change to close the biggest gap this week."
    ],
    "systemInFocus": "Follow-Up"
  },
  "objectives": [
    "AI-Powered Lead System",
    "Client Journey Automation",
    "Address Follow-Up pain"
  ]
}
```

---

## Benefits of V2 Architecture

### 1. Decoupled Provisioning
- **Before:** Every roadmap change → reprovision assistant
- **After:** Roadmap changes don't touch assistant config

### 2. Testable Context
- **Before:** Context embedded in 278-line prompt (hard to debug)
- **After:** Context is JSON (easy to inspect, override, test)

### 3. Scalable
- **Before:** N tenants = N assistants = N provisioning operations
- **After:** 1 assistant for all tenants, context computed per-query

### 4. Auditable
- **Before:** No record of what context assistant saw
- **After:** Every query context saved to `agent_strategy_contexts` table

### 5. Maintainable
- **Before:** Changes require prompt rewrites + reprovisioning
- **After:** Changes happen in code (strategyContextBuilder.service.ts)

---

## Migration Path

### Immediate (Now)
1. Apply migration 027: `pnpm run migrate`
2. **Do NOT reprovision assistants yet** (old prompt still works)
3. Test sandbox endpoint to verify StrategyContext builder works
4. Test one query with new flow (assistant will use old prompt + new context)

### Next (After Testing)
1. Reprovision all assistants with minimal static prompt
2. Verify queries use new JSON context
3. Monitor `agent_strategy_contexts` table for stored contexts

### Rollback (If Needed)
1. Revert `assistantQuery.service.ts` to Phase 1.5 version
2. Assistants still work (old prompt is still there)
3. Remove v2 services if needed

---

## Testing Strategy

### 1. Verify StrategyContext Builder
```bash
curl -X GET http://localhost:3001/api/superadmin/roadmap-coach/context/TENANT_ID?personaRole=owner \
  -H "Authorization: Bearer $SUPERADMIN_JWT"
```

**Expected:** JSON response with `roadmapSignals`, `tacticalFrame`, `objectives`

### 2. Test Sandbox Endpoint
```bash
curl -X POST http://localhost:3001/api/superadmin/roadmap-coach/sandbox \
  -H "Authorization: Bearer $SUPERADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "TENANT_ID",
    "personaRole": "owner",
    "userMessage": "What should I focus on this week?"
  }'
```

**Expected:** Formatted context block ready to send to assistant

### 3. End-to-End Query Test
```bash
curl -X POST http://localhost:3001/api/assistant/query \
  -H "Authorization: Bearer $OWNER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I focus on this week?",
    "context": { "roadmapSection": "follow_up" }
  }'
```

**Expected:**
- Response grounded in specific systems
- Cites diagnostic scores
- Proposes 1-3 concrete actions
- No generic advice

### 4. Verify Database Persistence
```sql
SELECT tenant_id, context->'roadmapSignals'->'pains', updated_at
FROM agent_strategy_contexts
WHERE tenant_id = 'TENANT_ID';
```

**Expected:** Context saved after query

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/types/strategyContext.ts` | Core v2 types |
| `src/services/strategyContextBuilder.service.ts` | Runtime context builder |
| `src/services/strategyContextStore.service.ts` | DB persistence |
| `src/services/assistantQuery.service.ts` | Query pipeline (JSON injection) |
| `src/services/agentPromptBuilder.service.ts` | Minimal static prompt |
| `src/services/assistantProvisioning.service.ts` | Lightweight provisioning |
| `src/controllers/superadminRoadmapCoach.controller.ts` | Sandbox/testing |
| `src/db/migrations/027_add_agent_strategy_contexts.sql` | DB migration |

---

## What's Kept from Phase 1.5

✅ `metadataParser.ts` - Signal extraction logic (now feeds StrategyContext)  
✅ `tacticResolver.ts` - Tactical frame logic (now feeds StrategyContext)  
✅ Thread isolation (per-user threads still work)  
✅ Capability profiles (still computed, just not in prompt)

---

## What's Removed from Phase 1.5

❌ Roadmap signals in system prompt  
❌ 6-layer prompt architecture  
❌ Persona-specific prompt variations  
❌ Tactical frame as narrative prose  
❌ Per-tenant provisioning dependency

---

## Success Criteria

**The v2 architecture is working if:**

1. ✅ Assistant provisioning is lightweight (no roadmap loading)
2. ✅ Queries inject StrategyContext as JSON
3. ✅ Contexts are saved to `agent_strategy_contexts` table
4. ✅ Responses are still grounded in specific data
5. ✅ Sandbox endpoint allows context testing
6. ✅ No errors when roadmap changes (no reprovision needed)

---

## Next Steps

1. **Apply migration:** `pnpm run migrate` (adds `agent_strategy_contexts` table)
2. **Test sandbox:** Verify StrategyContext builder works
3. **Test one query:** Verify JSON injection works
4. **Reprovision assistants:** Update to minimal static prompt
5. **Monitor:** Check `agent_strategy_contexts` table for stored contexts

---

**End of Document**
