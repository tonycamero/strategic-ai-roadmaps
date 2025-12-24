# SCEND ROADMAP ENGINE — LEARNING LOOP TICKET PACK (v1.0)

> **Scope**: Implement **ticket completion tracking**, **roadmap refresh**, and the **outcome/learning loop** as defined in `SCEND_ROADMAP_ENGINE_ARCHITECTURE_v1.1.md`.

**Reference Architecture**: `SOPs/SCEND_ROADMAP_ENGINE_ARCHITECTURE_v1.md` (Section 3.10-3.12, Section 4.4-4.5)

**Total Estimated Time**: 12-15 days for full implementation

---

## SYSTEM L0 — Data Model & Migrations

### **L0.1.1 — Add `status` and `last_updated_at` to RoadmapSection**

**Goal**: Extend `RoadmapSection` to support section status and outcomes section.

**Tasks**:
- Update TypeScript model for `RoadmapSection`:
  - `section_number: number` (1–10)
  - `section_name` enum includes: `outcomes_learning`
  - `status` enum: `planned | in_progress | implemented | deprecated`
  - `last_updated_at: timestamp`
- Create DB migration:
  - Add `status` column with default `'planned'`
  - Add `last_updated_at` column (nullable)
- Ensure existing rows migrate cleanly (backfill `status='planned'` where null)

**Files to Modify**:
- `backend/src/models/RoadmapSection.model.ts` (or equivalent)
- `backend/src/migrations/AddStatusToRoadmapSection_<timestamp>.ts`

**Validation**:
- Existing roadmaps still load without error
- New roadmaps can set section 10 `outcomes_learning` without DB issues
- Query roadmap sections and verify `status` field exists

---

### **L0.1.2 — Create `ticket_instances` table + model**

**Goal**: Represent per-firm ticket state, separate from the master ticket library.

**Tasks**:
- Add TypeScript interface:
  ```typescript
  export type TicketStatus =
    | "not_started"
    | "in_progress"
    | "blocked"
    | "done"
    | "skipped";

  export interface TicketInstance {
    id: string;
    ticketPackId: string;
    ticketId: string;
    status: TicketStatus;
    assignee?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    notes?: string | null;
  }
  ```
- Create DB table `ticket_instances`:
  - `id` (UUID, PK)
  - `ticket_pack_id` (FK → ticket_packs.id)
  - `ticket_id` (text, FK → tickets.ticket_id or at least constrained)
  - `status` (text enum)
  - `assignee` (text, nullable)
  - `started_at` (timestamptz, nullable)
  - `completed_at` (timestamptz, nullable)
  - `notes` (text, nullable)
  - indexes: `ticket_pack_id`, `ticket_id`

**Files to Create**:
- `backend/src/models/TicketInstance.model.ts`
- `backend/src/migrations/CreateTicketInstances_<timestamp>.ts`

**Validation**:
- Can create `TicketInstance` rows linked to a `TicketPack`
- Foreign keys work; deleting a TicketPack cascades ticket instances (or blocks, per chosen policy)
- Query ticket instances by pack ID

---

### **L0.1.3 — Extend `ticket_packs` to store rollups and structured sprints**

**Goal**: Align `TicketPack` with the v1.1 spec: structured sprint assignments and rollup stats.

**Tasks**:
- Update `TicketPack` TypeScript model:
  ```typescript
  export interface TicketPackTotals {
    tickets: number;
    done: number;
    in_progress: number;
    blocked: number;
    not_started: number;
  }

  export interface TicketPackSprint {
    sprintNumber: number;
    name?: string;
    ticketInstanceIds: string[];
    plannedStart?: string | null;
    plannedEnd?: string | null;
  }

  export interface TicketPack {
    id: string;
    firmId: string;
    version: string;
    status: "not_started" | "in_progress" | "completed";
    totalTickets: number;
    totalSprints: number;
    sprintAssignments: TicketPackSprint[];
    totals?: TicketPackTotals;
    createdAt: string;
  }
  ```
- DB migration for `ticket_packs`:
  - Add `status` column: `not_started | in_progress | completed`
  - Add `total_tickets`, `total_sprints` (int)
  - Add `sprint_assignments` JSONB
  - Add `totals` JSONB

**Files to Modify**:
- `backend/src/models/TicketPack.model.ts`
- `backend/src/migrations/ExtendTicketPacks_<timestamp>.ts`

**Validation**:
- Existing packs still parse (migrations supply defaults)
- New packs can store structured `sprint_assignments` and `totals`
- JSONB fields correctly serialize/deserialize

---

### **L0.1.4 — Create `implementation_snapshots` table + model**

**Goal**: Capture baseline/30d/60d/90d metrics per firm.

**Tasks**:
- Add model:
  ```typescript
  export type SnapshotLabel = "baseline" | "30d" | "60d" | "90d" | "custom";
  export type SnapshotSource = "manual" | "ghl_export" | "api";

  export interface ImplementationSnapshot {
    id: string;
    firmId: string;
    date: string;
    label: SnapshotLabel;
    source: SnapshotSource;
    metrics: {
      lead_response_minutes?: number | null;
      lead_to_appt_rate?: number | null; // 0-1
      close_rate?: number | null;        // 0-1
      crm_adoption_rate?: number | null; // 0-1
      weekly_ops_hours?: number | null;
      nps?: number | null;              // -100 to 100
    };
    notes?: string | null;
  }
  ```
- DB migration `implementation_snapshots`:
  - Columns per spec, `metrics` JSONB, `notes` text
  - Index `firm_id`, `label`, `date`

**Files to Create**:
- `backend/src/models/ImplementationSnapshot.model.ts`
- `backend/src/migrations/CreateImplementationSnapshots_<timestamp>.ts`

**Validation**:
- Can insert/read snapshots for a firm
- `metrics` JSONB stores the numeric fields correctly
- Can query by firm_id and label

---

### **L0.1.5 — Create `roadmap_outcomes` table + model**

**Goal**: Persist outcome deltas and ROI per roadmap.

**Tasks**:
- Add model:
  ```typescript
  export type OutcomeStatus = "on_track" | "at_risk" | "off_track";

  export interface RoadmapOutcome {
    id: string;
    firmId: string;
    roadmapId: string;
    baselineSnapshotId: string;
    at30dSnapshotId?: string | null;
    at60dSnapshotId?: string | null;
    at90dSnapshotId?: string | null;
    deltas: {
      lead_response_minutes?: number | null;
      lead_to_appt_rate?: number | null;
      crm_adoption_rate?: number | null;
      weekly_ops_hours?: number | null;
      nps?: number | null;
    };
    realizedRoi12MonthsEstimate?: {
      time_savings_hours_annual: number;
      time_savings_value_annual: number;
      revenue_impact_annual: number;
      cost_avoidance_annual: number;
      net_roi_percent: number;
    } | null;
    status: OutcomeStatus;
    notes?: string | null;
  }
  ```
- DB migration `roadmap_outcomes`:
  - FKs to `firms`, `roadmaps`, `implementation_snapshots`
  - JSONB columns for `deltas`, `realized_roi_12_months_estimate`

**Files to Create**:
- `backend/src/models/RoadmapOutcome.model.ts`
- `backend/src/migrations/CreateRoadmapOutcomes_<timestamp>.ts`

**Validation**:
- Can create a `RoadmapOutcome` linked to snapshots and roadmaps
- No FK violations on insert
- JSONB fields correctly store complex objects

---

## SYSTEM L1 — Ticket Completion & Checkboxes

### **L1.1.1 — Generate TicketInstances when creating a TicketPack**

**Goal**: Whenever a firm-specific TicketPack is created, spawn linked TicketInstances for each ticket.

**Tasks**:
- In `TicketMapper.createPack(firm, recommendations, ticketLibrary)`:
  - After determining which `ticket_ids` belong to which sprint, create:
    - `TicketPack` row
    - For each ticket, a `TicketInstance` with:
      - `status = "not_started"`
      - `assignee = null`
      - `started_at = null`
      - `completed_at = null`
  - Populate `sprintAssignments` with `ticketInstanceIds` instead of bare `ticket_ids`
  - Populate `totals` rollup fields

**Files to Modify**:
- `backend/src/services/roadmapEngine/TicketMapper.ts` (or equivalent)

**Validation**:
- New TicketPack has:
  - `total_tickets` = number of TicketInstances
  - `sprint_assignments.*.ticketInstanceIds` populated
- DB rows match counts in memory
- Can query all TicketInstances for a pack

---

### **L1.1.2 — Markdown export: render TicketPack with checkboxes**

**Goal**: Export a human-readable TicketPack MD file with `[ ]` / `[x]` checkboxes that map to TicketInstance status.

**Tasks**:
- Implement function `renderTicketPackMarkdown(ticketPack, ticketInstances, tickets)`:
  - Sprint header: `## Sprint {n} — {name}`
  - Each ticketInstance rendered:
    ```markdown
    - [ ] T1.3.1 – Build 60-second instant-response SMS
      - Status: not_started
      - Assignee: Michael
    ```
  - `[x]` if `status === "done"`
- Integrate into `OutputRenderer.render()` for `{firm}_TICKET_PACK_vX.md`

**Files to Modify**:
- `backend/src/services/roadmapEngine/OutputRenderer.ts`
- Add utility: `backend/src/services/roadmapEngine/utils/markdownRenderer.ts`

**Validation**:
- Generate a sample pack and visually confirm:
  - Checkboxes reflect TicketInstance status
  - All tickets appear exactly once
- No broken Markdown

---

### **L1.1.3 — Markdown import: update TicketInstance status from checkboxes**

**Goal**: Allow the team to edit the MD file and have changes synced back to DB.

**Tasks**:
- Implement `parseTicketPackMarkdown(fileContents)`:
  - Detect lines like `- [x] T1.3.1` and map back to:
    - `ticket_id = "T1.3.1"`
    - `status = "done"` if `[x]`, `not_started` if `[ ]`
  - Optional: preserve notes/assignee if present in bullet details
- Implement CLI:
  ```bash
  npm run ticketpack:sync-from-md -- \
    --firm hayes_real_estate \
    --ticketpack-version v1.0 \
    --file ./deliverables/hayes_real_estate_TICKET_PACK_v1.md
  ```
- Update DB TicketInstances' `status` (and `completed_at` when moving to `done`)

**Files to Create**:
- `backend/src/scripts/ticketpackSync.ts`
- Add utility: `backend/src/services/roadmapEngine/utils/markdownParser.ts`

**Validation**:
- Flip some checkboxes in MD, run sync, confirm:
  - TicketInstances reflect new statuses
  - `totals` rollup is recalculated correctly
  - `completed_at` timestamp set when status changes to `done`

---

## SYSTEM L2 — Snapshot Capture CLI

### **L2.1.1 — Implement `roadmap:snapshot` CLI**

**Goal**: Capture manual metric snapshots as `ImplementationSnapshot` rows.

**Tasks**:
- Implement CLI entry:
  ```bash
  npm run roadmap:snapshot -- \
    --firm hayes_real_estate \
    --label baseline \
    --source manual
  ```
- On run:
  - Resolve `firmId` by slug
  - Prompt (if not given via flags) for:
    - `lead_response_minutes`
    - `lead_to_appt_rate`
    - `close_rate`
    - `crm_adoption_rate`
    - `weekly_ops_hours`
    - `nps`
  - Create `ImplementationSnapshot` row with current timestamp

**Files to Create**:
- `backend/src/scripts/roadmapSnapshot.ts`
- Add to `package.json` scripts:
  ```json
  "roadmap:snapshot": "tsx backend/src/scripts/roadmapSnapshot.ts"
  ```

**Validation**:
- Run with `--label baseline` and test values:
  - Row created with `label='baseline'`, metrics saved
- Can fetch snapshots later via simple query
- Script handles missing firm gracefully

---

## SYSTEM L3 — Outcome Calculation

### **L3.1.1 — Implement `roadmap:outcomes` CLI**

**Goal**: Compute deltas + ROI from baseline and latest snapshot, store as `RoadmapOutcome`.

**Tasks**:
- CLI signature:
  ```bash
  npm run roadmap:outcomes -- \
    --firm hayes_real_estate \
    --roadmap-version v1.0 \
    --baseline-label baseline \
    --target-label 60d
  ```
- Logic:
  - Load `baseline` snapshot (label argument, default `baseline`)
  - Load latest snapshot matching `target-label` (e.g., `60d`)
  - Load relevant `Roadmap` by `firm` + `version`
  - Compute deltas per metric (v1.1 spec)
  - Estimate ROI:
    - Use `roadmap.metadata.roi_projection` as reference
    - Or a config for `blendedHourlyRate`, `annualLeadVolume`, `avgDealValue`
  - Classify `status` (`on_track | at_risk | off_track`)
  - Upsert `RoadmapOutcome` for this roadmap

**Files to Create**:
- `backend/src/scripts/roadmapOutcomes.ts`
- `backend/src/services/roadmapEngine/OutcomeCalculator.ts`
- Add to `package.json` scripts:
  ```json
  "roadmap:outcomes": "tsx backend/src/scripts/roadmapOutcomes.ts"
  ```

**Validation**:
- CLI prints a short summary of deltas + ROI
- Row appears in `roadmap_outcomes` with correct FK references
- ROI calculation matches expected formula
- Status classification works correctly

---

## SYSTEM L4 — Roadmap Refresh

### **L4.1.1 — Implement `roadmap:refresh` core function**

**Goal**: Take TicketPack + Roadmap + RoadmapOutcome and produce a new version of the roadmap reflecting what's implemented.

**Tasks**:
- Implement pure function:
  ```typescript
  async function refreshRoadmap({
    firmSlug,
    roadmapVersion
  }): Promise<{
    newVersion: string;
    paths: {
      roadmap: string;
      ticketPack: string;
      metadata: string;
      changelog: string;
    }
  }>
  ```
- Steps (per spec 4.4):
  - Load current `Roadmap`, `RoadmapSection[]`
  - Load `TicketPack` + `TicketInstance[]`
  - Optionally load latest `RoadmapOutcome`
  - Compute systemCompletion map
  - Update:
    - Section statuses (`status` field)
    - Section 4: move completed workflows to "Delivered"
    - Section 5: mark completed sprints, update timelines
    - Section 8: inject actual metrics if Outcome present
    - Section 10: generate or update Outcomes & Learning section
  - Bump version `v1.0 → v1.1` (minor)
  - Generate changelog content (MD string)

**Files to Create**:
- `backend/src/services/roadmapEngine/RoadmapRefresher.ts`

**Validation**:
- Given a fixture (Hayes example) with some tickets `done`:
  - New roadmap version shows updated statuses
  - Section 10 appears and includes at least a stub
  - Changelog summarizes the changes
  - Version bumped correctly

---

### **L4.1.2 — Wire `roadmap:refresh` CLI + file output**

**Goal**: Make it callable from command line and write files into `deliverables/`.

**Tasks**:
- CLI:
  ```bash
  npm run roadmap:refresh -- \
    --firm hayes_real_estate \
    --roadmap-version v1.0
  ```
- On success:
  - Writes:
    - `deliverables/{firm}_ROADMAP_v1.1.md`
    - `deliverables/{firm}_TICKET_PACK_v1.1.md` (optional: re-render from TicketPack state)
    - `deliverables/{firm}_metadata_v1.1.json`
    - `deliverables/{firm}_ROADMAP_CHANGELOG_v1.0_to_v1.1.md`
  - Logs paths + summary

**Files to Create**:
- `backend/src/scripts/roadmapRefresh.ts`
- Add to `package.json` scripts:
  ```json
  "roadmap:refresh": "tsx backend/src/scripts/roadmapRefresh.ts"
  ```

**Validation**:
- Run against sample firm:
  - Files appear with correct version suffixes
  - Metadata shows updated `implementation_progress`
  - Changelog is accurate

---

## SYSTEM L5 — Aggregate Learning

### **L5.1.1 — Implement `roadmap:aggregate-outcomes`**

**Goal**: Aggregate all RoadmapOutcome rows into a global analytics file for future projections.

**Tasks**:
- CLI:
  ```bash
  npm run roadmap:aggregate-outcomes
  ```
- Logic:
  - Load all `RoadmapOutcome[]`
  - Group by:
    - industry
    - firm_size_band (e.g., 1–5 / 6–15 / 16–50)
    - systems implemented (if tracked)
  - Compute simple stats per metric:
    - median, p25, p75 for:
      - lead_response_minutes reduction (percentage)
      - weekly_ops_hours saved
      - crm_adoption_rate increase
      - nps change
  - Write `analytics/global_outcomes.json` with:
    - Aggregated stats
    - Sample sizes

**Files to Create**:
- `backend/src/scripts/roadmapAggregateOutcomes.ts`
- `backend/src/services/roadmapEngine/OutcomeAggregator.ts`
- `analytics/` directory (if not exists)
- Add to `package.json` scripts:
  ```json
  "roadmap:aggregate-outcomes": "tsx backend/src/scripts/roadmapAggregateOutcomes.ts"
  ```

**Validation**:
- JSON file created with expected structure
- Stats computed without errors when no data / small N (defensive coding)
- Can load and parse the output file

---

## SYSTEM L6 — Docs & Tests

### **L6.1.1 — Update Architecture Doc to v1.1 references**

**Goal**: Ensure the implemented behavior matches `SCEND_ROADMAP_ENGINE_ARCHITECTURE_v1.1.md` and add any clarifying notes discovered during implementation.

**Tasks**:
- Re-open `SCEND_ROADMAP_ENGINE_ARCHITECTURE_v1.md`:
  - Confirm all new entities (`TicketInstance`, `ImplementationSnapshot`, `RoadmapOutcome`) match actual field names
  - If any divergence was necessary, document under "Implementation Notes" at the end
- Add short "Operational Usage" snippet showing:
  - Typical cadence: `snapshot → outcomes → refresh → aggregate-outcomes`

**Files to Modify**:
- `SOPs/SCEND_ROADMAP_ENGINE_ARCHITECTURE_v1.md`

**Validation**:
- Doc is self-consistent with actual code
- No TODOs left unresolved in the spec
- New section added with usage examples

---

### **L6.1.2 — Create end-to-end test script**

**Goal**: Validate the complete learning loop with a test firm.

**Tasks**:
- Create test script:
  ```bash
  npm run test:learning-loop
  ```
- Script flow:
  1. Create test firm + roadmap + ticket pack
  2. Mark some tickets as done
  3. Capture baseline snapshot
  4. Capture 60d snapshot with improved metrics
  5. Run outcomes calculation
  6. Run roadmap refresh
  7. Verify all files generated correctly
  8. Verify Section 10 contains outcome data
  9. Clean up test data

**Files to Create**:
- `backend/src/scripts/tests/testLearningLoop.ts`
- Add to `package.json` scripts:
  ```json
  "test:learning-loop": "tsx backend/src/scripts/tests/testLearningLoop.ts"
  ```

**Validation**:
- Script runs without errors
- All intermediate files created
- Can inspect output and verify correctness

---

## SYSTEM L7 — Documentation & Usage Guide

### **L7.1.1 — Create Learning Loop Usage Guide**

**Goal**: Provide clear documentation for ops team on how to use the learning loop.

**Tasks**:
- Create `SOPs/LEARNING_LOOP_USAGE_GUIDE.md` with:
  - Overview of the learning loop
  - When to capture snapshots (baseline, 30d, 60d, 90d)
  - How to use each CLI command
  - What to do with the output
  - Troubleshooting common issues
  - Example walkthrough with Hayes Real Estate

**Files to Create**:
- `SOPs/LEARNING_LOOP_USAGE_GUIDE.md`

**Validation**:
- Guide is clear and actionable
- Examples are accurate
- Links to architecture doc where appropriate

---

### **L7.1.2 — Add CLI help text**

**Goal**: Make all CLI commands self-documenting.

**Tasks**:
- Add `--help` flag to all CLI scripts:
  - `roadmap:snapshot --help`
  - `roadmap:outcomes --help`
  - `roadmap:refresh --help`
  - `roadmap:aggregate-outcomes --help`
  - `ticketpack:sync-from-md --help`
- Each should show:
  - Purpose
  - Required arguments
  - Optional arguments
  - Examples

**Files to Modify**:
- All CLI scripts in `backend/src/scripts/`

**Validation**:
- Running any command with `--help` shows clear usage
- Examples are copy-pasteable

---

## Implementation Order

**Recommended sequence**:

1. **Week 1: Data Layer**
   - L0.1.1, L0.1.2, L0.1.3, L0.1.4, L0.1.5 (all migrations)
   - Run migrations, verify schema

2. **Week 2: Ticket Tracking**
   - L1.1.1, L1.1.2, L1.1.3 (ticket completion + checkboxes)
   - Test with sample ticket pack

3. **Week 3: Metrics & Outcomes**
   - L2.1.1 (snapshot capture)
   - L3.1.1 (outcome calculation)
   - Test with Hayes data

4. **Week 4: Roadmap Evolution**
   - L4.1.1, L4.1.2 (roadmap refresh)
   - Test full cycle

5. **Week 5: Learning & Polish**
   - L5.1.1 (aggregate outcomes)
   - L6.1.1, L6.1.2 (docs + tests)
   - L7.1.1, L7.1.2 (usage guide + help)

---

## Success Criteria

**System is complete when**:
- ✅ All migrations run without errors
- ✅ Can create ticket pack with instances
- ✅ Can mark tickets done via checkbox sync
- ✅ Can capture baseline and milestone snapshots
- ✅ Can calculate outcomes and ROI
- ✅ Can refresh roadmap with implementation progress
- ✅ Section 10 auto-generates with outcome data
- ✅ Can aggregate outcomes across firms
- ✅ All CLI commands have help text
- ✅ End-to-end test passes
- ✅ Usage guide is complete and accurate

---

## Dependencies

**External**:
- TypeScript/Node.js environment
- Database (PostgreSQL assumed based on existing schema)
- Existing roadmap engine components from v1.0 spec

**Internal**:
- Must complete L0 (data layer) before any other systems
- L1 depends on L0.1.2, L0.1.3
- L3 depends on L0.1.4, L0.1.5
- L4 depends on L1, L3
- L5 depends on L0.1.5
- L6, L7 depend on all prior systems

---

## Notes

- **File Storage**: Consider if you want to store snapshot JSON files alongside DB records (optional, for backup/audit)
- **Permissions**: Determine who can capture snapshots, refresh roadmaps (likely owner + superadmin only)
- **Validation**: Add input validation to all CLI scripts (firm exists, version exists, etc.)
- **Error Handling**: All CLI scripts should have proper error handling and user-friendly messages
- **Idempotency**: Make operations idempotent where possible (e.g., can re-run outcome calculation safely)

---

## Future Enhancements (Post-v1)

- **Automated Snapshot Capture**: GHL API integration to pull metrics automatically
- **Slack/Email Notifications**: Alert when milestones reached or outcomes deviate
- **Web UI**: Dashboard for capturing snapshots and viewing outcomes
- **Advanced Analytics**: Predictive modeling, cohort analysis, A/B testing
- **Real-time Progress Tracking**: WebSocket updates when tickets marked done
- **Client-Facing Reports**: Formatted PDF outcome reports for clients

---

**Version**: 1.0
**Date**: November 2024
**Status**: Ready for Implementation
