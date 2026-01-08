# Ticket 2: Executive Leadership–Only Brief — UX Surface Contract

## Status
**DESIGN ONLY — NO IMPLEMENTATION**

This document defines the UX contract for a future surface.  
It does NOT implement or simulate functionality.

---

## Design Objective

Define the UX contract for an Executive Leadership–Only Brief that:
- Preserves executive authority
- Prevents narrative contamination
- Gates downstream actions
- Remains completely invisible to delegates

---

## Surface Identity

**Name:** Executive Leadership–Only Brief

**Purpose:**  
Provide strategic, leadership-level insights to the executive sponsor that are:
- Separate from execution diagnostics
- Not shareable with delegates
- Required for informed decision-making before finalization

**Non-Purpose:**  
This is NOT:
- A diagnostic summary
- A roadmap preview
- An execution artifact
- A shareable report

---

## Visibility Rules

### Rule 1: Executive-Only Visibility

**Who Can See:**
- Executive sponsor ONLY

**Who CANNOT See:**
- Delegates
- External users
- Future roles (unless explicitly granted executive-level access)

**Enforcement Method:**
- Surface does not exist in delegate view
- Not disabled
- Not grayed out
- Not hinted at via empty states or placeholders
- Completely invisible

**Failure Mode Prevented:**
Delegates inferring executive insights from UI affordances or empty states.

---

### Rule 2: No Inference Leakage

**Constraint:**  
Delegates must not be able to infer:
- That the Brief exists
- That the executive has reviewed it
- What it contains
- When it was generated

**Design Implication:**
- No "waiting for executive review" messaging visible to delegates
- No status indicators tied to Brief lifecycle
- Gating messages must be generic (e.g., "Executive review required") without referencing the Brief

**Failure Mode Prevented:**
Delegates reverse-engineering executive insights from system behavior.

---

## Lifecycle States

The Executive Brief has **FOUR** lifecycle states:

### State 1: Not Created

**Definition:**  
The Brief does not yet exist for this firm.

**Trigger:**  
Firm is in early intake stages; executive has not yet requested Brief generation.

**User Experience (Executive):**
- Executive Authority Zone displays: "Executive Brief not yet generated"
- Option to trigger generation (future implementation)

**User Experience (Delegate):**
- No indication of Brief existence

**Gating Behavior:**
- Diagnostic finalization: BLOCKED
- Roadmap generation: BLOCKED

---

### State 2: Created (Unreviewed)

**Definition:**  
The Brief has been generated but the executive has not yet reviewed it.

**Trigger:**  
Executive or system triggers Brief generation.

**User Experience (Executive):**
- Executive Authority Zone displays: "Executive Brief ready for review"
- Brief content is accessible
- Two actions available:
  1. Acknowledge (mark as reviewed)
  2. Waive (explicitly skip review)

**User Experience (Delegate):**
- No indication of Brief existence

**Gating Behavior:**
- Diagnostic finalization: BLOCKED
- Roadmap generation: BLOCKED
- Block message (executive view): "Review or waive Executive Brief to proceed"

---

### State 3: Reviewed / Acknowledged

**Definition:**  
The executive has reviewed the Brief and acknowledged its contents.

**Trigger:**  
Executive clicks "Acknowledge" or equivalent action.

**User Experience (Executive):**
- Executive Authority Zone displays: "Executive Brief reviewed"
- Brief remains accessible (read-only)
- Gating is released

**User Experience (Delegate):**
- No indication of Brief existence

**Gating Behavior:**
- Diagnostic finalization: UNBLOCKED
- Roadmap generation: UNBLOCKED

**Audit Log:**
- Timestamp of acknowledgement
- Executive identity

---

### State 4: Explicitly Waived

**Definition:**  
The executive has chosen to skip reviewing the Brief.

**Trigger:**  
Executive clicks "Waive Review" or equivalent action.

**User Experience (Executive):**
- Executive Authority Zone displays: "Executive Brief waived"
- Brief remains accessible (read-only)
- Gating is released

**User Experience (Delegate):**
- No indication of Brief existence

**Gating Behavior:**
- Diagnostic finalization: UNBLOCKED
- Roadmap generation: UNBLOCKED

**Audit Log:**
- Timestamp of waiver
- Executive identity

**Failure Mode Prevented:**
Executive being blocked by Brief generation failures or delays.

---

## State Transition Diagram (Text)

```
[Not Created]
      ↓ (Executive or system triggers generation)
[Created (Unreviewed)]
      ↓
      ├─→ [Acknowledged] (Executive reviews)
      │
      └─→ [Waived] (Executive skips)
```

**Note:** Once acknowledged or waived, the state is terminal for that Brief instance.

---

## Gating Relationship

### Gated Actions

The Executive Brief gates the following downstream actions:

1. **Diagnostic Finalization**
2. **Roadmap Generation**

### Gating Logic

**Precondition for Unblocking:**
- Brief state is "Acknowledged" OR "Waived"

**Blocked States:**
- "Not Created"
- "Created (Unreviewed)"

**Blocking Mechanism:**
- Structural disabling (not advisory warnings)
- Action buttons are non-interactive
- System displays: "Executive review required before proceeding"

**Unblocking Mechanism:**
- Executive acknowledges or waives Brief
- System immediately releases gating
- Action buttons become interactive

---

### Gating Visibility to Delegates

**Critical Constraint:**  
Delegates must NOT see Brief-specific gating messages.

**Delegate-Facing Messaging:**
- Generic: "Awaiting executive review"
- No mention of "Brief"
- No indication of what is being reviewed

**Executive-Facing Messaging:**
- Explicit: "Review or waive Executive Brief to proceed"
- Clear indication of blocking state

**Failure Mode Prevented:**
Delegates inferring executive workflow from gating messages.

---

## Interaction Constraints

### Constraint 1: Read-Only After Review

**Rule:**  
Once acknowledged or waived, the Brief is read-only.

**Rationale:**  
Prevent post-hoc editing that could undermine audit integrity.

---

### Constraint 2: No Export

**Rule:**  
The Brief cannot be exported as PDF, CSV, or any other format.

**Rationale:**  
Prevent uncontrolled distribution outside the executive-only surface.

---

### Constraint 3: No Email or Async Sharing

**Rule:**  
The Brief cannot be emailed, shared via link, or delivered asynchronously.

**Rationale:**  
Ensure the Brief is consumed live within the executive-only surface.

---

### Constraint 4: No Delegate Access (Even with Link)

**Rule:**  
Even if a delegate obtains a direct link or URL, the system must deny access.

**Rationale:**  
Prevent circumvention via URL sharing.

**Failure Mode Prevented:**
Accidental or intentional sharing of executive insights with delegates.

---

## Separation from Diagnostic and Roadmap Outputs

### Diagnostic Output

**Purpose:**  
Execution-level artifact summarizing findings, tickets, and readiness.

**Audience:**  
Shareable with delegates and external stakeholders.

**Relationship to Executive Brief:**
- Diagnostic does NOT contain executive insights
- Diagnostic is generated AFTER Brief is acknowledged or waived
- Diagnostic is structurally separate from Brief

---

### Roadmap Output

**Purpose:**  
Final deliverable outlining strategic priorities and timelines.

**Audience:**  
Shareable with delegates and external stakeholders.

**Relationship to Executive Brief:**
- Roadmap does NOT contain executive insights
- Roadmap is generated AFTER Brief is acknowledged or waived
- Roadmap is structurally separate from Brief

---

### Executive Brief

**Purpose:**  
Leadership-level strategic insights for executive decision-making.

**Audience:**  
Executive ONLY.

**Relationship to Diagnostic and Roadmap:**
- Brief informs executive's framing decisions
- Brief is NOT embedded in or referenced by Diagnostic or Roadmap
- Brief remains invisible to anyone who sees Diagnostic or Roadmap

**Failure Mode Prevented:**
Executive insights leaking into shareable execution artifacts.

---

## Future Engineering Work Required

This design assumes the following will be implemented in future sprints:

### 1. Brief Generation Logic
- Trigger mechanism (executive-initiated or system-initiated)
- Content generation (future AI behavior or manual authoring)
- Storage and retrieval

### 2. Visibility Enforcement
- Backend role-based access control
- Frontend rendering logic (Brief surface only appears for executive)
- URL access denial for non-executive users

### 3. Lifecycle State Management
- State transitions (Not Created → Created → Acknowledged/Waived)
- State persistence
- Audit logging

### 4. Gating Enforcement
- Precondition validation before diagnostic finalization
- Precondition validation before roadmap generation
- Structural disabling of gated actions

### 5. Interaction Constraints
- Read-only enforcement after acknowledgement/waiver
- Export prevention
- Email/sharing prevention
- Link-based access denial

### 6. Delegate-Safe Messaging
- Generic gating messages for delegate view
- Explicit gating messages for executive view

---

## Failure Modes Prevented by This Design

| Failure Mode | Prevention Mechanism |
|--------------|----------------------|
| Narrative contamination | Brief is invisible to delegates |
| Premature finalization | Gating blocks action until exec review |
| Accidental sharing | No export, email, or link sharing |
| Inference of exec insights | No UI hints or status indicators for delegates |
| Loss of audit trail | Acknowledgement and waiver are logged |
| Circumvention via URL | Backend denies access to non-executive users |
| Post-hoc editing | Brief is read-only after review |

---

## Design Invariants

1. **Invisibility is Absolute:** Delegates must have zero indication of Brief existence
2. **Gating is Structural:** Not advisory, not bypassable
3. **Separation is Enforced:** Brief never appears in Diagnostic or Roadmap
4. **Acknowledgement is Logged:** Every state transition is auditable

---

## Status

**Design Complete:** Yes  
**Implementation Required:** Yes (future sprint)  
**Dependencies:** Ticket 1 (Firm Detail Page UX Design)

---

*End of Ticket 2*
