# Discovery Call Notes Workflow — Existing State Snapshot

**Snapshot Date:** 2026-01-19  
**Ticket:** CR-DISCOVERY-NOTES-SNAPSHOT-EXISTING-1  
**Purpose:** Authoritative read-only snapshot of the current Discovery Call Notes workflow  
**Scope Lock:** ❌ NO behavior changes. This is reconnaissance only.

---

## Executive Summary

The **Discovery Call Notes** workflow is a **partially implemented** feature designed to gate roadmap generation behind operator-curated discovery synthesis. The infrastructure exists at the database, service, and script layers, but **lacks UI integration** and **enforcement in the ticket generation pipeline**.

### Current State Classification
- **Database Schema:** ✅ Fully implemented
- **Service Layer:** ✅ Fully implemented (upsert + retrieval)
- **CLI Tooling:** ✅ Fully implemented (manual ingestion script)
- **Frontend UI:** ⚠️ Partially implemented (scheduling only, no capture/edit)
- **Gating Logic:** ❌ Not enforced in ticket generation
- **Artifact Semantics:** ⚠️ Defined but not consumed downstream

---

## 1. UI — Where Discovery Notes Are Captured

### Current Implementation

**File:** `frontend/src/pages/DiscoveryCallScheduler.tsx`

**Functionality:**
- **Purpose:** Allows tenant owners to schedule a discovery call via mailto link
- **Access:** Available to authenticated tenant owners
- **Interaction:** Opens email client with pre-filled subject/body to `tony@scend.cash`
- **Data Capture:** ❌ None — this is a scheduling UI, not a notes capture UI

**Who Can Create/Edit:**
- Currently: ❌ No UI exists for creating/editing discovery notes
- Workaround: Notes must be manually ingested via CLI script (`saveDiscoveryNotes.ts`)

**Structured vs Freeform:**
- Database supports: **Freeform text** (`notes TEXT NOT NULL`)
- No structured fields (e.g., selected inventory, synthesis metadata)

**Required vs Optional:**
- Database constraint: `notes` is `NOT NULL`
- Tenant flag: `discovery_complete` defaults to `FALSE`
- Gating: ❌ Not enforced — roadmap generation does NOT check this flag

---

## 2. DATA — Where Discovery Notes Are Persisted

### Database Schema

**Table:** `discovery_call_notes`  
**Migration:** `backend/src/db/migrations/013_add_discovery_call_notes.sql`

```sql
CREATE TABLE IF NOT EXISTS discovery_call_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_call_notes_tenant_id
  ON discovery_call_notes (tenant_id);
```

**Tenant Flag:**
```sql
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS discovery_complete BOOLEAN NOT NULL DEFAULT FALSE;
```

### Schema Characteristics

| Field | Type | Nullable | Default | Purpose |
|-------|------|----------|---------|---------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `tenant_id` | UUID | No | — | Foreign key to `tenants` |
| `created_by_user_id` | UUID | Yes | `NULL` | Operator who created notes |
| `notes` | TEXT | No | — | Freeform markdown/text notes |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Last update timestamp |

### Versioning
- ❌ No versioning — upsert behavior overwrites existing record
- ❌ No audit trail — previous versions are lost on update

### Tenant Linkage
- ✅ Direct foreign key: `tenant_id → tenants.id`
- ❌ No diagnostic linkage — notes are not tied to a specific `diagnostic_id`

---

## 3. ARTIFACT SEMANTICS

### Current Artifact Type: `discovery_call_notes` (Table)

**Authoritative vs Advisory:**
- **Intended:** Authoritative gate for roadmap generation
- **Actual:** Advisory — not enforced in ticket generation logic

**Downstream Consumption:**
- ❌ Not consumed by ticket generation service
- ❌ Not consumed by roadmap assembly
- ❌ Not displayed in SuperAdmin UI

### Parallel Artifact: `DISCOVERY_SYNTHESIS_V1` (Defined, Not Implemented)

**File:** `backend/src/types/discoverySynthesis.ts`

**Structure:**
```typescript
export interface DiscoverySynthesis {
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
}

export const DISCOVERY_SYNTHESIS_ARTIFACT_TYPE = 'DISCOVERY_SYNTHESIS_V1';
```

**Storage Location:** Intended for `tenant_documents` table with `category = 'DISCOVERY_SYNTHESIS_V1'`

**Current Status:** ❌ Type defined, but no service layer implementation

---

## 4. FLOW POSITION — When Discovery Notes Happen

### Intended Workflow (Per `discovery.contract.md`)

```
SOP-01 Run → Diagnostic Generated → Discovery Call → Discovery Synthesis → Ticket Generation → Roadmap Assembly
```

### Actual Workflow (Current Implementation)

```
SOP-01 Run → Diagnostic Generated → [Discovery Notes Optional] → Ticket Generation (Ungated) → Roadmap Assembly
```

### State Transitions

| State | Trigger | Current Behavior | Intended Behavior |
|-------|---------|------------------|-------------------|
| **Diagnostic Generated** | SOP-01 Run | `sop_tickets` count = 0 | Same |
| **Discovery Complete** | Operator Save | `discovery_complete = TRUE` (unused) | `DISCOVERY_SYNTHESIS_V1` saved |
| **Tickets Generated** | Generate Action | Tickets created (ungated) | ❌ Should fail if no synthesis |
| **Roadmap Ready** | Moderation | All tickets approved/rejected | Same |

### Relative Position to Other Workflows

**Before Discovery:**
1. ✅ Tenant onboarding
2. ✅ Intake completion
3. ✅ SOP-01 diagnostic generation

**After Discovery:**
1. ❌ Ticket generation (should be gated, but isn't)
2. ❌ Roadmap assembly (should consume synthesis, but doesn't)

---

## 5. CURRENT INVARIANTS

### What Implicitly Assumes Discovery Notes Exist?

**Answer:** ❌ Nothing.

- Ticket generation does NOT check `discovery_complete`
- Roadmap assembly does NOT consume `discovery_call_notes`
- SuperAdmin UI does NOT display discovery status

### What Breaks If Notes Are Empty?

**Answer:** ❌ Nothing.

- System allows roadmap generation without discovery notes
- No validation enforces minimum note length or structure

### What Logic Silently Depends on Discovery Notes?

**Answer:** ❌ Nothing.

- No downstream services query `discovery_call_notes` table
- No frontend components render discovery notes

---

## 6. SERVICE LAYER IMPLEMENTATION

### File: `backend/src/services/discoveryCallService.ts`

**Functions:**

#### `saveDiscoveryCallNotes(params)`
```typescript
async function saveDiscoveryCallNotes(params: {
  tenantId: string;
  ownerUserId: string;
  notes: string;
}): Promise<void>
```

**Behavior:**
1. Query for existing notes by `tenant_id`
2. If exists: UPDATE `notes` and `updated_at`
3. If not exists: INSERT new record
4. Set `tenants.discovery_complete = TRUE`

**Upsert Logic:** Keeps only the latest record per tenant

#### `getLatestDiscoveryCallNotes(tenantId)`
```typescript
async function getLatestDiscoveryCallNotes(tenantId: string): Promise<DiscoveryCallNote | null>
```

**Behavior:**
- Query `discovery_call_notes` by `tenant_id`
- Order by `created_at DESC`
- Return first result or `null`

---

## 7. CLI SCRIPT IMPLEMENTATION

### File: `backend/src/scripts/saveDiscoveryNotes.ts`

**Usage:**
```bash
npm run discovery:save -- <tenantId or ownerEmail> <pathToMarkdownFile>
```

**Example:**
```bash
npm run discovery:save -- roberta@hayesrealestate.com ./notes/hayes_discovery.md
```

**Behavior:**
1. Resolve tenant by email or ID
2. Read markdown file from disk
3. Call `saveDiscoveryCallNotes()`
4. Set `discovery_complete = TRUE`

**Current Use Case:** Manual operator ingestion after offline discovery call

---

## 8. FRONTEND UI GAPS

### What Exists
- ✅ `DiscoveryCallScheduler.tsx` — mailto link to schedule call

### What's Missing
- ❌ Discovery notes capture UI (textarea + save)
- ❌ Discovery notes edit UI
- ❌ Discovery notes review UI (SuperAdmin)
- ❌ Discovery synthesis builder (structured inventory selection)
- ❌ Discovery status indicator (dashboard)

---

## 9. GATING LOGIC GAPS

### Current Ticket Generation Logic

**File:** `backend/src/services/ticketGeneration.service.ts`

**Current Behavior:**
- ❌ Does NOT check `discovery_complete` flag
- ❌ Does NOT require `DISCOVERY_SYNTHESIS_V1` artifact
- ❌ Does NOT validate `selectedInventory.length >= 12`

**Expected Behavior (Per `discovery.contract.md`):**
```typescript
// MISSING VALIDATION
if (!discoveryComplete) {
  throw new Error('Discovery call must be completed before generating tickets');
}

const synthesis = await getDiscoverySynthesis(tenantId);
if (!synthesis || synthesis.selectedInventory.length < 12) {
  throw new Error('Discovery synthesis must include at least 12 selected inventory items');
}
```

---

## 10. CANDIDATE REUSE POINTS (Do NOT Implement)

### High-Confidence Reuse
1. **Database Schema:** `discovery_call_notes` table is sound — reuse as-is
2. **Service Layer:** `saveDiscoveryCallNotes()` and `getLatestDiscoveryCallNotes()` are production-ready
3. **CLI Script:** `saveDiscoveryNotes.ts` is useful for manual operator workflows

### Likely Extension Points
1. **Add Structured Fields:** Extend `discovery_call_notes` with `synthesis_json JSONB` column
2. **Add Diagnostic Linkage:** Add `diagnostic_id` foreign key to `discovery_call_notes`
3. **Add UI:** Build SuperAdmin modal for discovery notes capture/edit
4. **Add Gating:** Inject validation into `ticketGeneration.service.ts`

### Likely Deprecation
- ❌ `discoverySynthesis.ts` type definition may be superseded by extended `discovery_call_notes` schema

---

## 11. CONTRADICTIONS & AMBIGUITIES

### Contradiction #1: Two Artifact Models
- **Model A:** `discovery_call_notes` table (implemented)
- **Model B:** `DISCOVERY_SYNTHESIS_V1` in `tenant_documents` (defined, not implemented)

**Resolution Needed:** Decide whether to:
- Extend `discovery_call_notes` with `synthesis_json` column, OR
- Migrate to `tenant_documents` with `category = 'DISCOVERY_SYNTHESIS_V1'`

### Contradiction #2: Gating Intent vs. Actual Behavior
- **Intent:** Discovery notes are a **required gate** for roadmap generation
- **Actual:** Discovery notes are **optional** and **not enforced**

**Resolution Needed:** Implement validation in ticket generation service

### Ambiguity #1: Operator vs. System Authorship
- **Current:** `created_by_user_id` is nullable
- **Question:** Should system-generated synthesis be allowed, or must it always be operator-curated?

### Ambiguity #2: Versioning Strategy
- **Current:** Upsert behavior overwrites previous notes
- **Question:** Should we preserve historical versions for audit trail?

---

## 12. OPERATOR REALITY CHECK

**Purpose:** Document how Discovery Notes are *actually used* in operator practice, independent of code implementation.

### What Operators Look For in Discovery Notes

**PLACEHOLDER — REQUIRES OPERATOR INPUT**

This section captures institutional knowledge that may not be obvious from code:

#### Decision Points Driven by Discovery Notes
- [ ] **Inventory Selection Rationale:** Why specific systems were chosen over alternatives
- [ ] **Tier Assignment Logic:** What makes something "core" vs "recommended" vs "advanced"
- [ ] **Sprint Sequencing:** How dependencies and tenant capacity inform 30/60/90 placement
- [ ] **Exclusion Reasoning:** Why certain SOP-01 recommendations were rejected
- [ ] **Risk Flags:** Tenant-specific constraints (budget, technical debt, team readiness)

#### What Would Feel "Wrong" If Removed
- [ ] **Loss of Context:** Forgetting why certain decisions were made during the call
- [ ] **Duplicate Work:** Re-deriving synthesis if notes are lost
- [ ] **Tenant Misalignment:** Generating tickets that don't match agreed-upon scope
- [ ] **Audit Trail Gaps:** Unable to explain roadmap composition to stakeholders

#### Non-Obvious Heuristics (Operator Intuition)
- [ ] **Tenant Readiness Signals:** Verbal cues during call that inform prioritization
- [ ] **Hidden Dependencies:** Systems that must be implemented together (not in formal schema)
- [ ] **Political Constraints:** Stakeholder buy-in requirements that affect sequencing
- [ ] **Resource Availability:** Team bandwidth that gates ambitious timelines

#### Current Workarounds (What Operators Do Today)
- [ ] **Offline Note-Taking:** Using Google Docs, Notion, or paper notes during calls
- [ ] **Manual Synthesis:** Translating freeform notes into structured ticket lists
- [ ] **Email Trails:** Confirming decisions via email after the call
- [ ] **Slack/DM Coordination:** Coordinating with SA team on edge cases

#### Must-Preserve Behaviors
- [ ] **Operator Veto Power:** Ability to override SOP-01 recommendations
- [ ] **Freeform Rationale:** Space for qualitative context, not just structured data
- [ ] **Iterative Refinement:** Ability to update synthesis after initial save
- [ ] **Tenant Co-Creation:** Discovery is collaborative, not dictated

#### Candidates for Hardening (Operator Pain Points)
- [ ] **Inventory Search:** Hard to find specific systems in canonical library
- [ ] **Tier Ambiguity:** No clear rubric for core vs recommended
- [ ] **Sprint Capacity:** No visibility into typical ticket load per sprint
- [ ] **Dependency Visualization:** Can't see which tickets block others

#### Things NOT to Automate Yet
- [ ] **Tier Assignment:** Requires operator judgment, not algorithmic
- [ ] **Exclusion Decisions:** Context-dependent, can't be rule-based
- [ ] **Sprint Sequencing:** Depends on tenant-specific constraints
- [ ] **Synthesis Approval:** Must remain human-in-the-loop

### Operator Truth: How Discovery Actually Happens Today

**PLACEHOLDER — REQUIRES OPERATOR INPUT**

#### Typical Discovery Call Flow (As-Practiced)
1. **Pre-Call Prep:** Review SOP-01 diagnostic outputs
2. **Call Structure:** 
   - Review pain points and goals (15 min)
   - Walk through AI opportunities (20 min)
   - Prioritize systems together (15 min)
   - Discuss timeline and resources (10 min)
3. **Post-Call Synthesis:**
   - Operator translates call notes into structured format
   - Validates inventory selections against canonical library
   - Documents rationale for each decision
   - Saves via CLI script or manual DB insert

#### What Makes a "Good" Discovery Synthesis
- **Specificity:** Clear rationale for each inventory item
- **Alignment:** Tenant's stated goals map to selected systems
- **Realism:** Timeline matches tenant capacity
- **Completeness:** 12+ items with balanced tier distribution

#### What Makes a "Bad" Discovery Synthesis
- **Generic:** Copy-paste from SOP-01 without customization
- **Overambitious:** Too many "advanced" items for tenant readiness
- **Underspecified:** Missing rationale or tier assignments
- **Misaligned:** Systems don't address stated pain points

---

## 13. RECOMMENDED NEXT STEPS (Post-Snapshot)

### Phase 1: Harden Existing Infrastructure
1. Add `diagnostic_id` foreign key to `discovery_call_notes`
2. Add `synthesis_json JSONB` column for structured data
3. Implement gating validation in `ticketGeneration.service.ts`

### Phase 2: Build UI
4. Create SuperAdmin modal for discovery notes capture
5. Add discovery status indicator to tenant dashboard

### Phase 3: Traceability
6. Add audit trail for discovery note edits
7. Link discovery synthesis to ticket generation metadata

---

## 14. DEFINITION OF DONE

✅ **Team can answer:**
- **Do we harden, extend, or reuse?** → **Extend** (add structured fields + gating)
- **Is the existing schema sound?** → **Yes** (minor extensions needed)
- **Is the service layer production-ready?** → **Yes** (reuse as-is)
- **What's the critical path to enforcement?** → **Add gating to ticket generation**

✅ **Zero production behavior changed:** This snapshot is read-only reconnaissance.

---

## Appendix A: File Inventory

### Backend Files
- `backend/src/db/migrations/013_add_discovery_call_notes.sql`
- `backend/src/db/schema.ts` (lines 836-843, 860-861)
- `backend/src/services/discoveryCallService.ts`
- `backend/src/scripts/saveDiscoveryNotes.ts`
- `backend/src/types/discoverySynthesis.ts`

### Frontend Files
- `frontend/src/pages/DiscoveryCallScheduler.tsx`

### Documentation Files
- `docs/contracts/discovery.contract.md`
- `SOPs/SOP-02_ Discovery Call Execution.docx`

### Example Files
- `backend/uploads/tmp/discovery-notes-bf472c81-f9d7-4fab-84b5-58cf9e1ebf06.md`
- `SOPs/Hayes Real Estate Examples/OUTPUT_3_DISCOVERY_CALL_ANSWERS.md`

---

## Appendix B: Database Query Examples

### Check Discovery Status for Tenant
```sql
SELECT 
  t.id AS tenant_id,
  t.name AS tenant_name,
  t.discovery_complete,
  dcn.notes,
  dcn.created_at AS notes_created_at,
  dcn.updated_at AS notes_updated_at
FROM tenants t
LEFT JOIN discovery_call_notes dcn ON dcn.tenant_id = t.id
WHERE t.id = '<tenant_id>';
```

### Find Tenants with Discovery Complete but No Notes
```sql
SELECT t.id, t.name
FROM tenants t
LEFT JOIN discovery_call_notes dcn ON dcn.tenant_id = t.id
WHERE t.discovery_complete = TRUE AND dcn.id IS NULL;
```

### Find Tenants with Notes but Discovery Incomplete
```sql
SELECT t.id, t.name
FROM tenants t
INNER JOIN discovery_call_notes dcn ON dcn.tenant_id = t.id
WHERE t.discovery_complete = FALSE;
```

---

**End of Snapshot**
