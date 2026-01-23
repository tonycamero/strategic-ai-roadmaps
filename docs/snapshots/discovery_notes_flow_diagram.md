# Discovery Call Notes — Flow Diagram (Current State)

**Snapshot Date:** 2026-01-19  
**Companion to:** `discovery_notes_existing.md`

---

## Current State Flow (As-Implemented)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TENANT ONBOARDING                                │
│  • Tenant created                                                        │
│  • discovery_complete = FALSE (default)                                  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTAKE COMPLETION                                │
│  • Owner completes intake form                                           │
│  • Answers stored in intakes.answers (JSONB)                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SOP-01 EXECUTION                                 │
│  • Diagnostic generated (diagnostics table)                              │
│  • Outputs: overview, aiOpportunities, roadmapSkeleton, discoveryQuestions│
│  • sop_tickets count = 0 (no tickets yet)                                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DISCOVERY CALL SCHEDULING (UI)                        │
│  • Frontend: DiscoveryCallScheduler.tsx                                  │
│  • Action: Opens mailto link to tony@scend.cash                          │
│  • Data Capture: ❌ NONE                                                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
      ┌─────────────────────┐   ┌─────────────────────┐
      │  OFFLINE CALL        │   │  NO CALL            │
      │  (Manual Notes)      │   │  (Skip Discovery)   │
      └──────────┬───────────┘   └──────────┬──────────┘
                 │                          │
                 ▼                          │
┌─────────────────────────────────────────┐│
│  CLI SCRIPT INGESTION (Optional)        ││
│  • npm run discovery:save --            ││
│  • Reads markdown file from disk        ││
│  • Calls saveDiscoveryCallNotes()       ││
│  • Sets discovery_complete = TRUE       ││
└────────────────────┬────────────────────┘│
                     │                     │
                     ▼                     │
┌─────────────────────────────────────────┐│
│  discovery_call_notes TABLE             ││
│  • tenant_id                             ││
│  • notes (TEXT)                          ││
│  • created_by_user_id                    ││
│  • created_at, updated_at                ││
└────────────────────┬────────────────────┘│
                     │                     │
                     ▼                     │
┌─────────────────────────────────────────┐│
│  tenants.discovery_complete = TRUE      ││
│  ⚠️ Flag set, but NOT enforced          ││
└────────────────────┬────────────────────┘│
                     │                     │
                     └─────────┬───────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    TICKET GENERATION (UNGATED)                           │
│  • Service: ticketGeneration.service.ts                                  │
│  • ❌ Does NOT check discovery_complete                                  │
│  • ❌ Does NOT require DISCOVERY_SYNTHESIS_V1                            │
│  • ❌ Does NOT validate selectedInventory.length >= 12                   │
│  • Tickets created directly from SOP-01 output                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROADMAP ASSEMBLY                                 │
│  • Tickets moderated and approved                                        │
│  • Roadmap PDF generated                                                 │
│  • ❌ Discovery notes NOT consumed                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Intended State Flow (Per `discovery.contract.md`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TENANT ONBOARDING                                │
│  • Tenant created                                                        │
│  • discovery_complete = FALSE (default)                                  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTAKE COMPLETION                                │
│  • Owner completes intake form                                           │
│  • Answers stored in intakes.answers (JSONB)                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SOP-01 EXECUTION                                 │
│  • Diagnostic generated (diagnostics table)                              │
│  • Outputs: overview, aiOpportunities, roadmapSkeleton, discoveryQuestions│
│  • sop_tickets count = 0 (no tickets yet)                                │
│  • UI shows "Findings Pending" state                                     │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    DISCOVERY CALL EXECUTION (SOP-02)                     │
│  • Operator reviews diagnostic with tenant                               │
│  • Selects inventory items from canonical library                        │
│  • Assigns tier (core/recommended/advanced) + sprint (30/60/90)          │
│  • Documents rationale for each selection                                │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              DISCOVERY SYNTHESIS ARTIFACT (REQUIRED)                     │
│  • Artifact Type: DISCOVERY_SYNTHESIS_V1                                 │
│  • Storage: tenant_documents (category = 'DISCOVERY_SYNTHESIS_V1')       │
│  • Structure:                                                            │
│    - tenantId, diagnosticId                                              │
│    - synthesizedSystems: string[]                                        │
│    - selectedInventory: { inventoryId, tier, sprint, notes }[]           │
│    - exclusions: string[]                                                │
│    - operatorNotes: string                                               │
│    - confidenceLevel: 'high' | 'medium' | 'low'                          │
│  • ✅ GATING INVARIANT: selectedInventory.length >= 12                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    TICKET GENERATION (GATED)                             │
│  • Service: ticketGeneration.service.ts                                  │
│  • ✅ VALIDATES: DISCOVERY_SYNTHESIS_V1 exists                           │
│  • ✅ VALIDATES: selectedInventory.length >= 12                          │
│  • ✅ VALIDATES: All inventoryIds map to canonical library               │
│  • Tickets hydrated from Inventory Library (Gold Master)                 │
│  • Operator notes appended to admin_notes/roi_notes                      │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROADMAP ASSEMBLY                                 │
│  • Tickets moderated and approved                                        │
│  • Roadmap PDF generated                                                 │
│  • ✅ Discovery synthesis metadata included in roadmap                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Gap Analysis: Current vs. Intended

| Component | Current State | Intended State | Gap |
|-----------|---------------|----------------|-----|
| **Discovery Call UI** | Scheduling only (mailto) | Structured synthesis builder | ❌ Missing UI |
| **Artifact Storage** | `discovery_call_notes` table (freeform) | `DISCOVERY_SYNTHESIS_V1` in `tenant_documents` | ⚠️ Schema mismatch |
| **Gating Logic** | None — tickets generated without discovery | Strict validation (12+ items, valid IDs) | ❌ Missing validation |
| **Inventory Selection** | Not captured | Structured `selectedInventory[]` with tier/sprint | ❌ Missing data model |
| **Diagnostic Linkage** | None — notes not tied to diagnostic | `diagnosticId` foreign key | ❌ Missing linkage |
| **Operator Rationale** | Freeform notes only | Per-item `notes` field + global `operatorNotes` | ⚠️ Partial |
| **Audit Trail** | Upsert overwrites history | Versioned artifacts | ❌ Missing versioning |
| **Downstream Consumption** | None — notes not used | Synthesis drives ticket generation | ❌ Missing integration |

---

## Critical Path to Enforcement

### Minimal Delta (Phase 1)

1. **Extend `discovery_call_notes` Schema**
   ```sql
   ALTER TABLE discovery_call_notes
     ADD COLUMN diagnostic_id VARCHAR(50) REFERENCES diagnostics(id),
     ADD COLUMN synthesis_json JSONB;
   ```

2. **Add Gating to Ticket Generation**
   ```typescript
   // In ticketGeneration.service.ts
   const notes = await getLatestDiscoveryCallNotes(tenantId);
   if (!notes || !notes.synthesis_json) {
     throw new Error('Discovery synthesis required before generating tickets');
   }
   
   const synthesis = notes.synthesis_json as DiscoverySynthesis;
   if (synthesis.selectedInventory.length < 12) {
     throw new Error('Discovery synthesis must include at least 12 selected inventory items');
   }
   ```

3. **Build SuperAdmin Discovery Modal**
   - Inventory selection UI (checkboxes + tier/sprint dropdowns)
   - Operator notes textarea
   - Save → updates `discovery_call_notes.synthesis_json`

---

**End of Flow Diagram**
