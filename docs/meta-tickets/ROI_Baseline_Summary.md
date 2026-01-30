# AG META-TICKET

**Title:** Read-Only ROI Baseline Summary in SuperAdmin → Progressive Executive Overrides Post-Roadmap

## Objective

Introduce a **read-only ROI Baseline Summary** in the SuperAdmin Execute surface that:

1. Clearly displays the tenant’s **Baseline Snapshot** (source of truth)
2. Prevents edits or overrides **until the Roadmap is generated**
3. Automatically **unlocks Executive Overrides & Progress Snapshots** once the Roadmap exists

This preserves authority sequencing while removing current UX ambiguity.

---

## Authority Model (Non-Negotiable)

### Phase 1 — Pre-Roadmap

* **Who:** Tenant Executive (via Baseline Intake)
* **What:** Baseline metrics only
* **SuperAdmin:** Read-only visibility
* **No overrides permitted**

### Phase 2 — Post-Roadmap

* **Who:** Executive + SuperAdmin
* **What:** 30/60/90 snapshots, overrides, progress deltas
* **Controls exposed conditionally**

---

## UI / UX Requirements

### 1. New Panel: “ROI Baseline Summary” (Read-Only)

**Location**

* SuperAdmin Execute page
* Adjacent to or beneath Strategic Context & ROI

**Displays**

* Snapshot Label: `BASELINE`
* Captured At (timestamp)
* Core Metrics:

  * Monthly Lead Volume
  * Avg Response Time
  * Close Rate
  * Ops/Admin Headcount
  * Derived Weekly Ops Hours
* Badge:
  `SOURCE: Tenant Intake`

**States**

* ✅ Baseline Exists → render summary
* ⚠️ No Baseline → show:

  > “Baseline not yet captured by tenant”
  > CTA: “Request Baseline Intake”

**No inputs. No buttons. No mutation.**

---

### 2. Conditional Unlock: Overrides & Progress Controls

**Condition**

```ts
latestRoadmap !== null
```

**Before Roadmap**

* SnapshotInputModal hidden
* MetricsCard is display-only
* Tooltip:

  > “Overrides unlock after roadmap generation”

**After Roadmap**

* Enable:

  * SnapshotInputModal
  * 30 / 60 / 90 Day snapshots
  * Consultant overrides (flagged + audited)

---

## Backend Requirements

### Data

* Read baseline snapshot from:

  * `implementation_metrics_snapshots`
  * where `type = 'BASELINE'`

### Flags

Expose to frontend:

```ts
hasBaseline: boolean
hasRoadmap: boolean
```

### Audit

* Overrides must:

  * never mutate BASELINE snapshot
  * always create new snapshot rows
  * include `actor_role` + `reason`

---

## Frontend Implementation Notes

### Components

* New: `BaselineSummaryPanel.tsx`
* Reuse snapshot display components (read-only mode)

### Gating Logic

```ts
const canOverrideMetrics = !!latestRoadmap;
```

### Visual Language

* Baseline → neutral / slate
* Overrides → amber
* Improvements → emerald

---

## Definition of Done

* [ ] SuperAdmin can **see** baseline metrics
* [ ] SuperAdmin **cannot edit** baseline pre-roadmap
* [ ] Overrides UI is **hidden** pre-roadmap
* [ ] Overrides UI **auto-appears** post-roadmap
* [ ] All overrides create new snapshots (no mutation)
* [ ] Audit trail preserved

---

## Why This Matters (for you, not the agent)

This preserves:

* **Epistemic integrity** (baseline truth)
* **Executive sovereignty** (their numbers first)
* **Consultant credibility** (changes only after strategy exists)
* **Narrative clarity** in sales + delivery

You’re building a system that **teaches authority through UI**, not docs.
