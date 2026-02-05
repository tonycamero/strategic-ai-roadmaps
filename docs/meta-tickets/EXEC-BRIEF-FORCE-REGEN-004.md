# AG META TICKET — EXEC-BRIEF-FORCE-REGEN-004

## Title
Enable Persistent SuperAdmin “Regenerate Executive Brief” with Explicit Gate Overrides

## Objective
Allow SuperAdmins (SA) to regenerate Executive Brief artifacts at any time to support:
- Artifact contract evolution
- UI verification
- Narrative tuning
- Debugging across Stage 6 → 7 → 8 flows

This must be done **without violating data integrity invariants** and with **explicit operator authority semantics**.

---

## Problem Statement
Existing Executive Brief artifacts may be:
- Generated under outdated narrative or rendering contracts
- Structurally incompatible with the current EXECUTIVE_SYNTHESIS UI expectations

Current backend gating rules prevent regeneration, resulting in:
- “Synthesis Layers Unavailable” errors
- Inability for SA to validate corrected UI and narrative logic
- Forced manual DB or workflow manipulation (undesirable)

---

## Current Gating Rules (Identified)
1. **Intake Window MUST be OPEN**
2. **Existing Draft or Approved Brief blocks generation (409 Conflict)**
3. **Owner Intake + at least one Vector required**

---

## Authority Decision Matrix (MANDATORY)

### Gate 1: Intake Window OPEN
- **Bypass Allowed:** ✅ YES
- **Condition:** `role === superadmin` AND `force=true`
- **Rationale:** Protects participants, not operators. Regen is non-destructive.

---

### Gate 2: Existing Draft / Approved Brief
- **Bypass Allowed:** ✅ YES
- **Condition:** `role === superadmin` AND `force=true`
- **Overwrite Semantics (Required):**
  - Overwrite brief record **in place**
  - Preserve:
    - `created_at`
    - prior approval audit events
  - Update:
    - `updated_at`
    - `metadata.regenBy`
    - `metadata.regenAt`
    - `metadata.regenReason` (default: `"SA_FORCED_REGEN"`)

---

### Gate 3: Owner Intake + Vectors Present
- **Bypass Allowed:** ❌ NO
- **Rationale:** Data integrity invariant
- **Behavior if missing:**
  - Fail-closed
  - Return explicit preflight error:
    > “Regeneration blocked: required intake data missing (Owner Intake or Vectors).”

---

## Backend Changes Required

### API
- Update:
```
POST /api/superadmin/tenants/:tenantId/executive-brief/generate
```
- Add support for:
```
?force=true
```
- Force flag behavior:
- Bypasses Gate 1 & 2
- Does NOT bypass Gate 3

---

### Controller Logic
- Perform **preflight gate evaluation**
- Return structured gate results for UI consumption
- Enforce:
- `EXECUTIVE_SYNTHESIS` mode on regen
- Existing EXEC-BRIEF-EXECUTIVE-DELIVERY-002 rules

---

## Frontend Changes Required

### UI Location
- **SA Execution Authority Panel**
- Executive Brief card

### UI Control
- Persistent button:
```
REGENERATE EXECUTIVE BRIEF
```

### UX Flow
1. On click → run preflight check
2. If blocked → surface reasons inline (no execution)
3. If force path applicable → show confirmation modal:
 > “This will regenerate the Executive Brief using the current synthesis ruleset and overwrite the existing artifact.”
4. Execute regen
5. Auto-refresh artifact view
6. Update status badge (e.g. refreshed timestamp or “REGENERATED”)

---

## Logging & Observability (REQUIRED)
Standardized log format:
```
[ExecutiveBriefRegen]
tenantId=...
actor=superadmin
force=true
gatesBypassed=[intake_window, existing_brief]
regenMode=EXECUTIVE_SYNTHESIS
```

---

## Non-Goals (Explicit)
- ❌ Do NOT allow participant-triggered regen
- ❌ Do NOT bypass missing intake/vector data
- ❌ Do NOT silently overwrite without audit metadata

---

## Acceptance Criteria
- SA can regen old Executive Brief artifacts at any time
- UI no longer errors on stale artifacts
- All regen actions are auditable and explicit
- Data integrity invariants remain intact

---

## Status
READY FOR EXECUTION
