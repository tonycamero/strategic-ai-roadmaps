# CR-DISCOVERY-ARTIFACT-UNIFY-1 — Task Completion Summary

**Ticket ID:** CR-DISCOVERY-ARTIFACT-UNIFY-1  
**Title:** Unify Discovery Artifact Model (Notes + Synthesis)  
**Priority:** P0  
**Scope:** Data model + service layer  
**Status:** ✅ COMPLETE  
**Date:** 2026-01-19

---

## OBJECTIVE ✅

Resolve dual artifact contradiction by extending existing `discovery_call_notes` to become the single authoritative Discovery artifact.

---

## DECISION (LOCKED) ✅

| Decision | Status | Implementation |
|----------|--------|----------------|
| **KEEP:** `discovery_call_notes` table | ✅ | Table remains as single source of truth |
| **EXTEND:** `synthesis_json` JSONB | ✅ | Added in migration 030 |
| **DEPRECATE:** `tenant_documents` `DISCOVERY_SYNTHESIS_V1` | ✅ | No new writes to this location |

---

## TASKS COMPLETED ✅

### ☑ Task 1: Extend discovery_call_notes schema

**Status:** ✅ COMPLETE (from CR-DISCOVERY-GATE-ENFORCE-1)

**Implementation:**
- Migration `030_add_discovery_synthesis_fields.sql`
- Added `diagnostic_id VARCHAR(50)` foreign key
- Added `synthesis_json JSONB` column
- Schema typed with full `DiscoverySynthesis` interface

---

### ☑ Task 2: Update discoveryCallService to read/write synthesis_json

**Status:** ✅ COMPLETE

**Functions Added/Updated:**

#### Read Operations
```typescript
// Retrieve synthesis for gating
export async function getDiscoverySynthesis(params: {
  tenantId: string;
  diagnosticId: string;
}): Promise<DiscoverySynthesis | null>
```

#### Write Operations
```typescript
// Save freeform notes + optional synthesis
export async function saveDiscoveryCallNotes(params: {
  tenantId: string;
  ownerUserId: string;
  notes: string;
  diagnosticId?: string;
  synthesis?: DiscoverySynthesis;
}): Promise<void>

// Save structured synthesis (primary method)
export async function saveDiscoverySynthesis(params: {
  tenantId: string;
  operatorUserId: string;
  synthesis: DiscoverySynthesis;
  notes?: string;
}): Promise<void>
```

**Key Features:**
- ✅ Backward compatible with freeform notes
- ✅ Validates synthesis before persisting
- ✅ Upsert behavior (latest record wins)
- ✅ Preserves existing fields on update

---

### ☑ Task 3: Update types to map DiscoverySynthesis → synthesis_json

**Status:** ✅ COMPLETE

**Implementation:**
- `schema.ts` types `synthesisJson` field with full `DiscoverySynthesis` interface
- Type safety enforced at compile time
- No runtime type coercion needed

**Type Definition:**
```typescript
synthesisJson: jsonb('synthesis_json').$type<{
  tenantId: string;
  diagnosticId: string;
  synthesizedSystems: string[];
  selectedInventory: {
    inventoryId: string;
    tier: 'core' | 'recommended' | 'advanced';
    sprint: 30 | 60 | 90;
    notes?: string;
  }[];
  exclusions: string[];
  operatorNotes: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  metadata?: {
    synthesizedAt: string;
    synthesizedByUserId?: string;
  };
}>()
```

---

### ☑ Task 4: Mark discovery_complete TRUE only if synthesis_json valid

**Status:** ✅ COMPLETE

**Implementation:**
```typescript
// In saveDiscoveryCallNotes()
const isValidSynthesis = synthesis && 
  synthesis.selectedInventory && 
  synthesis.selectedInventory.length >= 12;

// Mark tenant as discovery_complete ONLY if synthesis is valid
if (isValidSynthesis) {
  await db
    .update(tenants)
    .set({ discoveryComplete: true })
    .where(eq(tenants.id, tenantId));
}
```

**Validation Rules:**
- ✅ Synthesis must exist
- ✅ `selectedInventory` must be defined
- ✅ Minimum 12 selected inventory items

---

## DEFINITION OF DONE ✅

| Criterion | Status | Verification |
|-----------|--------|--------------|
| ✓ One authoritative Discovery artifact | ✅ | `discovery_call_notes` is single source of truth |
| ✓ No duplicate models | ✅ | `tenant_documents` DISCOVERY_SYNTHESIS_V1 deprecated |
| ✓ Backward compatible with freeform notes | ✅ | `notes` field still required, synthesis optional |

---

## ARTIFACT MODEL UNIFICATION

### Before (Contradictory)
```
Model A: discovery_call_notes (table)
├── notes: TEXT (freeform)
└── discovery_complete: BOOLEAN (tenant flag)

Model B: DISCOVERY_SYNTHESIS_V1 (tenant_documents)
├── category: 'DISCOVERY_SYNTHESIS_V1'
└── content: JSON (structured)
```

### After (Unified)
```
discovery_call_notes (single source of truth)
├── notes: TEXT (freeform, required)
├── synthesis_json: JSONB (structured, optional)
├── diagnostic_id: VARCHAR(50) (linkage)
└── discovery_complete: BOOLEAN (set only if synthesis valid)
```

---

## API SURFACE

### Recommended Usage

**For Operators (Structured Synthesis):**
```typescript
import { saveDiscoverySynthesis } from './services/discoveryCallService';

await saveDiscoverySynthesis({
  tenantId: '...',
  operatorUserId: '...',
  synthesis: {
    tenantId: '...',
    diagnosticId: 'diag_...',
    selectedInventory: [
      { inventoryId: 'INV-001', tier: 'core', sprint: 30 },
      // ... 11 more items
    ],
    synthesizedSystems: ['Lead Response', 'CRM Cleanup'],
    exclusions: ['Full Platform Migration'],
    operatorNotes: 'Tenant has limited IT resources...',
    confidenceLevel: 'high'
  },
  notes: 'Discovery call with Roberta Hayes...'
});
```

**For Legacy Scripts (Freeform Notes):**
```typescript
import { saveDiscoveryCallNotes } from './services/discoveryCallService';

await saveDiscoveryCallNotes({
  tenantId: '...',
  ownerUserId: '...',
  notes: 'Discovery call notes...'
});
// Note: discovery_complete will NOT be set without valid synthesis
```

**For Ticket Generation (Gating):**
```typescript
import { getDiscoverySynthesis } from './services/discoveryCallService';

const synthesis = await getDiscoverySynthesis({
  tenantId: '...',
  diagnosticId: 'diag_...'
});

if (!synthesis) {
  throw new Error('Discovery synthesis required');
}
```

---

## MIGRATION IMPACT

**Existing Records:**
- ✅ Remain valid (NULL synthesis_json is allowed)
- ✅ Can be upgraded by adding synthesis later
- ✅ `discovery_complete` flag may be FALSE until synthesis added

**New Records:**
- ✅ Can be created with notes only (legacy behavior)
- ✅ Can be created with notes + synthesis (recommended)
- ✅ `discovery_complete` set automatically when synthesis valid

---

## DEPRECATION NOTICE

### tenant_documents DISCOVERY_SYNTHESIS_V1

**Status:** DEPRECATED (no new writes)

**Migration Path:**
1. Existing `DISCOVERY_SYNTHESIS_V1` documents remain readable
2. New synthesis should be written to `discovery_call_notes.synthesis_json`
3. Future cleanup: migrate old documents to new model (optional)

**No Breaking Changes:**
- Old documents still accessible via `tenant_documents` table
- No immediate action required

---

## FILES MODIFIED

| File | Type | Changes |
|------|------|---------|
| `backend/src/db/migrations/030_add_discovery_synthesis_fields.sql` | Migration | ✅ Schema extension |
| `backend/src/db/schema.ts` | Schema | ✅ Added `diagnosticId` + `synthesisJson` |
| `backend/src/services/discoveryCallService.ts` | Service | ✅ Extended save/read functions |

---

## TESTING CHECKLIST

### Unit Tests (Recommended)
- [ ] `saveDiscoveryCallNotes()` with notes only (legacy)
- [ ] `saveDiscoveryCallNotes()` with notes + synthesis
- [ ] `saveDiscoverySynthesis()` with valid synthesis (≥12 items)
- [ ] `saveDiscoverySynthesis()` with invalid synthesis (<12 items) throws error
- [ ] `getDiscoverySynthesis()` returns synthesis when valid
- [ ] `getDiscoverySynthesis()` returns null when missing
- [ ] `discovery_complete` flag set only when synthesis valid

### Integration Tests (Recommended)
- [ ] Save synthesis → retrieve synthesis → verify match
- [ ] Save notes only → `discovery_complete` remains FALSE
- [ ] Save synthesis → `discovery_complete` set to TRUE
- [ ] Update synthesis → `discovery_complete` remains TRUE

---

## NEXT STEPS

### Immediate
1. ✅ Migration already created (030)
2. ✅ Service layer complete
3. ⏭️ Wire `saveDiscoverySynthesis()` into API controllers

### Phase 2 (UI)
4. Build SuperAdmin Discovery Synthesis modal
5. Call `saveDiscoverySynthesis()` from UI
6. Display synthesis status in tenant dashboard

---

## TRACEABILITY

**Related Tickets:**
- **CR-DISCOVERY-NOTES-SNAPSHOT-EXEC-1** — Snapshot (Complete)
- **CR-DISCOVERY-GATE-ENFORCE-1** — Hard gate (Complete)
- **CR-DISCOVERY-ARTIFACT-UNIFY-1** (This ticket) — ✅ Complete
- **CR-DISCOVERY-UI-BUILD-1** — Next (Pending)

**Documentation:**
- `docs/snapshots/discovery_notes_existing.md` § 11 — Identified contradiction
- `docs/contracts/discovery.contract.md` — Discovery synthesis contract

---

**End of Task Summary**
