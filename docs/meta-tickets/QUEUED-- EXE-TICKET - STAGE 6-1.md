EXECUTION TICKET — STAGE 6.1
Title: Stage 6.1 — Dependency Consumption + Computed Execution Horizon (30/60/90) + Dual-Axis Pill
Owner: SYSTEM / FOUNDER
Priority: CRITICAL
Status: READY
Scope: Backend authority logic + DB fields + UI display only (no prompt/model changes)

GOAL
Promote timeline and dependency ordering from “implicit” to “authoritative, deterministic, testable fields” for Stage 6 tickets.
Stage 6.1 must:
- Consume SOP inventory `dependencies[]` edges (inventoryId references)
- Compute dependency depth and blocked state
- Compute execution horizon (30/60/90) deterministically (NOT model-generated)
- Render the Dual-Axis Pill: [TIER · HORIZON]

NON-GOALS / OUT OF SCOPE
- No prompt tuning, no model change
- No new categories/tier semantics
- No “semantic diff” logic
- No new UX layouts (no 3-column 30/60/90 grid)
- No external integrations / sidecars

INPUTS
- Selected Inventory (Stage 5/6) includes SOP items with `inventoryId` and `dependencies[]` (strings)
- Draft tickets generated in Stage 6 already include: category, tier, pain_source, time_estimate_hours (if present), etc.

OUTPUTS (AUTHORITATIVE FIELDS ADDED/DERIVED)
Per ticket, compute and persist:
- execution_horizon_days: 30 | 60 | 90
- dependency_ids: string[]                 (resolved from inventoryId list; defaults [])
- dependency_depth: integer                (0..N; max depth among dependency chains)
- is_blocked: boolean                      (true if any dependency not present in selected inventory OR not represented in ticket set)
- blocked_by: string[]                     (missing dependency inventoryIds)
- sort_key: string                         (deterministic, used for stable ordering)

DATABASE CHANGES
1) tickets_draft:
- Add columns:
  - execution_horizon_days INT NOT NULL DEFAULT 30
  - dependency_ids JSONB NOT NULL DEFAULT '[]'
  - dependency_depth INT NOT NULL DEFAULT 0
  - is_blocked BOOLEAN NOT NULL DEFAULT false
  - blocked_by JSONB NOT NULL DEFAULT '[]'
  - sort_key TEXT NOT NULL DEFAULT ''
2) sop_tickets (if exists / mirrors draft):
- Same columns OR explicitly document “draft-only” if sop_tickets is created later (but must not break current flows)

BACKEND IMPLEMENTATION (DETERMINISTIC)
A) Build dependency graph from Selected Inventory
- Build map: inventoryId -> dependencies[]
- Validate: all dependency strings are non-empty; dedupe; case-insensitive compare but preserve canonical casing from inventoryId

B) Resolve dependencies per ticket
- Each ticket must link to one or more inventoryIds it represents.
  - If current ticket schema does not store inventoryIds:
    - Add ticket.inventory_refs: string[] (preferred) OR
    - Derive from ticket.pain_source/category is NOT allowed (too fuzzy)
  - Requirement: every ticket must have at least one inventoryId reference OR be marked “NON-INVENTORY” and excluded from dependency logic.

C) Compute dependency_depth
- For each ticket, compute max depth of its dependency chain within selected inventory.
- If cyclic dependency detected:
  - Set is_blocked=true
  - blocked_by includes “CYCLE_DETECTED”
  - dependency_depth set to max safe traversal depth
  - Emit telemetry + fail Stage 6.1 validation (see below)

D) Compute is_blocked / blocked_by
- blocked if:
  - any dependency inventoryId not in selected inventory OR
  - dependency exists but no ticket references that dependency inventoryId (missing prerequisite ticket)
- blocked_by lists missing inventoryIds

E) Compute execution_horizon_days (computed, not generated)
Use a deterministic function, inputs in this order:
1) If is_blocked=true ? horizon is unchanged but ticket is sorted after unblocked within same tier/horizon.
2) Base horizon by tier:
   - CORE ? 30
   - RECOMMENDED ? 60
   - ADVANCED ? 90
3) Adjustments (deterministic, minimal):
   - If dependency_depth >= 2 ? horizon bumps one step (30?60, 60?90, 90?90)
   - If time_estimate_hours exists and >= 25 ? bump one step
   - Never reduce below tier base
4) Persist execution_horizon_days

F) Compute sort_key
Deterministic ordering:
- tier_rank: CORE=1, RECOMMENDED=2, ADVANCED=3
- blocked_rank: unblocked=0, blocked=1
- horizon_rank: 30=1, 60=2, 90=3
- depth_rank: ascending
- stable_id: ticket_slug (existing) OR sha1(title+category+pain_source) if needed
sort_key = `${tier_rank}.${blocked_rank}.${horizon_rank}.${depth_rank}.${stable_id}`

VALIDATION / REFUSAL RULES (Stage 6.1)
Stage 6.1 must refuse to activate moderation session if:
- Any ticket lacks inventory reference(s) AND is not explicitly tagged NON-INVENTORY
- Any dependency references unknown inventoryId format (blank, non-string)
- Cycles detected
- Dependency graph resolution errors

TELEMETRY
Log and store:
- authority_version_stage6_1
- counts: total_tickets, blocked_tickets, max_dependency_depth
- list of blocked_by inventoryIds aggregated
- cycle detection details if any

UI CHANGES (DUAL-AXIS PILL)
- Display a single pill per ticket:
  - [ TIER · HORIZON ]  e.g., [ CORE · 30 ]
- Color encodes TIER only.
- HORIZON is plain numeric.
- If is_blocked=true:
  - Add subtle “Blocked” indicator (text, not icon) OR dim pill (no new badge) — choose the lightest-touch approach.

COMPATIBILITY
- Existing Stage 6 ticket generation remains unchanged.
- Stage 6.1 runs as a post-processor on draft tickets (recommended), then persists computed fields.

ACCEPTANCE CRITERIA
- Given the same selected inventory + same draft tickets:
  - execution_horizon_days is identical across replays
  - dependency_depth/is_blocked/blocked_by are identical across replays
  - sort order is identical across replays
- UI shows [TIER · HORIZON] for every ticket with no layout height increase
- Blocked tickets are deterministically pushed below unblocked tickets within same tier/horizon grouping
- No regressions in Stage 6 flow; moderation still shows 15 tickets and persists

DELIVERABLES
- Migration(s) for new columns
- Service-layer compute function: computeStage61Fields(draftTickets, selectedInventory)
- Tests:
  - stage6_1.dependencies.basic
  - stage6_1.dependencies.missing_prereq_blocks
  - stage6_1.dependencies.depth_bumps_horizon
  - stage6_1.dependencies.cycle_refuses
  - stage6_1.determinism.replay_same_outputs
- UI pill render update

ROLLBACK PLAN
- Feature flag: STAGE6_1_ENABLED (default false in production until validated)
- If disabled: UI falls back to Tier-only pill; backend skips post-processing

DEFINITION OF DONE
- Feature flag enabled in dev
- Canonical run replay passes determinism tests
- Refusal tests pass
- Northshore tenant shows correct horizon + dependency fields on all 15 tickets
- Stage 6 remains locked; Stage 6.1 is versioned and documented
