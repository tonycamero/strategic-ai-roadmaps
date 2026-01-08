# Ticket 1: Firm Detail Page — Delegation-Safe UX Design

## Status
**DESIGN ONLY — NO IMPLEMENTATION**

---

## Design Objective

Create a single-screen Firm Detail page that enforces:
- Delegation safety
- Executive authority preservation
- Future Executive Brief gating readiness

---

## Page Structure

### Section Hierarchy

The Firm Detail page is divided into **THREE ZONES**:

1. **Shared Information Zone** (visible to all)
2. **Delegate Action Zone** (visible to all, actionable by delegates)
3. **Executive Authority Zone** (visible ONLY to executive, reserved for future)

---

## Zone 1: Shared Information Zone

**Visibility:** All users (executive + delegates)

**Purpose:** Provide context and status without granting authority

**Contents:**
- Firm name and metadata
- Intake status (submitted, under review, etc.)
- Ticket moderation status
- Data completeness indicators
- Historical activity log (read-only)
  - **Note:** Excludes executive-only actions (e.g., Brief acknowledgement, strategic framing changes)
  - Only shows shared workflow events (intake submission, ticket reviews, readiness flags)

**Interaction Model:**
- Read-only for all users
- No action buttons
- No state transitions

**Failure Mode Prevented:**
Information asymmetry between executive and delegates on factual status.

---

## Zone 2: Delegate Action Zone

**Visibility:** All users (executive + delegates)

**Purpose:** Enable preparatory work without granting finalization authority

**Contents:**
- Ticket moderation controls
- Intake review tools
- Readiness flagging mechanism
- Draft notes or annotations

**Interaction Model:**
- Delegates can:
  - Mark tickets as reviewed
  - Flag intake as "ready for executive review"
  - Add preparatory notes
- Delegates CANNOT:
  - Finalize diagnostics
  - Generate roadmaps
  - Trigger irreversible outputs

**Visual Treatment:**
- Buttons feel preparatory, not final
- Language emphasizes "prepare" or "surface" rather than "complete"
- No visual weight suggesting authority

**Failure Mode Prevented:**
Delegates accidentally or intentionally acting beyond mandate.

---

## Zone 3: Executive Authority Zone

**Visibility:** Executive ONLY

**Purpose:** Reserve space for future Executive Brief and final authority actions

**Current State:** RESERVED / NOT YET IMPLEMENTED

**Future Contents:**
- Executive Leadership–Only Brief (see Ticket 2)
- Diagnostic finalization trigger
- Roadmap generation trigger
- Strategic framing controls

**Delegate Experience:**
- Zone does NOT exist in delegate view
- Not disabled
- Not grayed out
- Not hinted at
- Completely invisible

**Executive Experience:**
- Zone is visually distinct from Zones 1 and 2
- Clearly labeled as "Executive Authority Required"
- Contains placeholder messaging: "Executive Brief surface will appear here"

**Interaction Model (Future):**
- Executive must acknowledge or waive Executive Brief before:
  - Finalizing diagnostic
  - Generating roadmap
- Gating is structural, not advisory

**Failure Mode Prevented:**
- Delegates inferring executive insights from UI affordances
- Premature finalization without executive review
- Narrative contamination via shared surfaces

---

## Gating Logic (Conceptual)

### Gating Point 1: Diagnostic Finalization

**Trigger Location:** Executive Authority Zone

**Preconditions:**
1. Intake marked as "ready" by delegate OR executive
2. Executive Brief has been:
   - Acknowledged by executive, OR
   - Explicitly waived by executive

**Blocked State:**
- If Executive Brief is "created but unreviewed":
  - Finalization button is structurally disabled
  - System displays: "Executive Brief review required before finalization"
  - No workaround available

**Unblocked State:**
- Executive acknowledges or waives Brief
- Finalization button becomes active
- Action is logged with executive identity

**Failure Mode Prevented:**
Diagnostic finalization without executive strategic review.

---

### Gating Point 2: Roadmap Generation

**Trigger Location:** Executive Authority Zone

**Preconditions:**
1. Diagnostic has been finalized
2. Executive Brief has been acknowledged or waived (same as above)

**Blocked State:**
- If Executive Brief is "created but unreviewed":
  - Roadmap generation is structurally disabled
  - System displays: "Executive Brief review required before roadmap generation"

**Unblocked State:**
- Executive acknowledges or waives Brief
- Roadmap generation becomes active
- Action is logged with executive identity

**Failure Mode Prevented:**
Roadmap generation without executive strategic alignment.

---

## State Visibility Matrix

| User Role  | Zone 1 (Shared) | Zone 2 (Delegate) | Zone 3 (Executive) |
|------------|-----------------|-------------------|--------------------|
| Executive  | Visible         | Visible           | Visible            |
| Delegate   | Visible         | Visible           | **Invisible**      |

---

## Progression Flow (Text Diagram)

```
[Intake Submitted]
       ↓
[Delegate Reviews Tickets]
       ↓
[Delegate Flags "Ready for Executive Review"]
       ↓
[Executive Views Firm Detail]
       ↓
[Executive Authority Zone Appears]
       ↓
[Future: Executive Brief Generated]
       ↓
[Executive Reviews Brief] ──OR── [Executive Waives Brief]
       ↓                              ↓
[Gating Released]  ←──────────────────┘
       ↓
[Executive Finalizes Diagnostic]
       ↓
[Executive Generates Roadmap]
```

---

## Design Invariants

1. **No Ambiguity:** Every action must signal who can execute it
2. **No Inference:** Delegates must not be able to infer executive insights from UI structure
3. **No Workarounds:** Gating must be structural, not advisory
4. **No Noise:** Status without actionability is prohibited

---

## Future Engineering Work Required

This design assumes the following will be implemented in future sprints:

1. **Role-Based Visibility Enforcement**
   - Backend must enforce Zone 3 invisibility for delegates
   - Frontend must not render Zone 3 for delegates (not just hide via CSS)

2. **Executive Brief Lifecycle Management**
   - Brief creation trigger
   - Brief acknowledgement mechanism
   - Brief waiver mechanism
   - State persistence

3. **Gating Enforcement**
   - Structural disabling of finalization and roadmap generation
   - Precondition validation before action execution
   - Audit logging of executive actions

4. **Non-Exportability**
   - Executive Brief must not be exportable, emailable, or shareable
   - No async delivery mechanisms

---

## Failure Modes Prevented by This Design

| Failure Mode | Prevention Mechanism |
|--------------|----------------------|
| Delegate acts beyond mandate | Zone 2 actions are preparatory only |
| Premature finalization | Gating blocks action until exec review |
| Narrative contamination | Zone 3 is invisible to delegates |
| Accidental irreversibility | Final actions isolated in exec-only zone |
| Alert fatigue | Gating is structural, not warning-based |
| Inference of exec insights | No UI hints about Zone 3 for delegates |

---

## Status

**Design Complete:** Yes  
**Implementation Required:** Yes (future sprint)  
**Dependencies:** Ticket 2 (Executive Brief Surface Definition)

---

*End of Ticket 1*
