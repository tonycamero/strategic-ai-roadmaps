# EXEC-TICKET: STAGE-5-ASSISTED-SYNTHESIS-PROPOSAL-RESOLUTION-UI-1
DATE: 2026-01-22
AUTHORITY MODE: EXECUTIVE
STATUS: APPROVED FOR EXECUTION
STOP-ON-COMPLETION: YES

---

## 🎯 OBJECTIVE

Complete **Stage 5: Assisted Synthesis** by implementing the **Proposal Resolution UI** so that:

- Agent-synthesized findings are reviewable as atomic proposals
- Human authority can reason, edit, accept, reject, or add findings
- Canonical declaration is strictly gated until full resolution
- NO downstream systems (tickets, roadmap, persistence logic) are touched

This ticket **activates** the architecture already implemented.  
It does **not** alter data models or synthesis logic.

---

## 🧠 GOVERNING PRINCIPLES (NON-NEGOTIABLE)

1. **Proposals ≠ Canon**
2. **Human judgment is the only canonizing force**
3. **Evidence must remain visible and clickable**
4. **No auto-resolution, no inference, no shortcuts**
5. **UI must reinforce authority boundaries through affordances**

Any deviation is a hard stop.

---

## 🧩 SCOPE OF WORK

### 1️⃣ Generate Proposals Control

**Add CTA in AssistedSynthesisModal (Center Pane)**

- Button label: `Generate Agent Proposals`
- Calls:
  POST `/api/superadmin/firms/:tenantId/assisted-synthesis/generate-proposals`
- Disabled states:
  - If proposals already exist → show `Regenerate` (requires confirm modal)
- Loading state:
  - Explicit "Agent synthesizing from source artifacts…"

⚠️ This button **only** generates proposals.  
It does not resolve, accept, or canonize anything.

---

### 2️⃣ Atomic Proposal Card Rendering

Render each proposal as an **independent card**, NOT a blob.

Each card MUST include:

- **Type Badge**
  - Current Fact
  - Friction Point
  - Goal
  - Constraint
- **Proposal Text**
  - Agent-authored, editable
- **Evidence Anchors**
  - One or more chips
  - Click → scroll / focus right-pane artifact
- **Status**
  - Pending (default)
  - Accepted
  - Rejected

No collapsing, grouping, or summarizing.

---

### 3️⃣ Resolution Controls (Per Proposal)

Each proposal card must support:

- ✅ Accept
- ❌ Reject
- ✏️ Edit (inline, preserves original text + operator note)
- ➕ Add New Proposal
  - Operator-authored
  - Explicitly marked `Human Added (Pre-Canonical)`

Status must persist immediately in local state and backend.

---

### 4️⃣ Canon Declaration Gate (Hard Lock)

`Declare Canonical Findings` button behavior:

- LOCKED if:
  - Any proposal.status === `pending`
- UNLOCKED only when:
  - All proposals are Accepted or Rejected
- On click:
  - Calls existing `declareCanonicalFindings`
  - No changes to backend logic allowed

Visual affordance must clearly communicate lock reason.

---

### 5️⃣ Required Microcopy (Exact Intent)

Insert visible, non-dismissable copy:

> **"These are agent-generated proposals.  
> Source truth is shown on the right.  
> Nothing here becomes canonical until you explicitly declare it."**

This is governance-critical.

---

## 🚫 OUT OF SCOPE (DO NOT TOUCH)

- Ticket generation logic
- Roadmap generation
- Findings persistence schema
- Assisted synthesis LLM logic
- TruthProbe rules
- Any Stage 6+ behavior

Violating this scope = immediate halt.

---

## 🧪 ACCEPTANCE CRITERIA (DEFINITION OF DONE)

All of the following must be true:

- [ ] Proposals are generated only via explicit user action
- [ ] Proposals render as atomic, resolvable cards
- [ ] Evidence is visible and navigable
- [ ] Accept / Reject / Edit / Add all function correctly
- [ ] Canon button remains locked until zero pending items
- [ ] Canon declaration produces no side effects beyond existing logic
- [ ] No raw human input appears as "findings"
- [ ] UI clearly communicates pre-canonical status

---

## 🛑 STOP CONDITION

After UI resolution is complete and manually verified:

- STOP execution
- Await next authority instruction

Do NOT proceed to Stage 6 or beyond.

---

## 🧠 FINAL NOTE

This ticket completes the **human–agent reasoning loop**.

After this, the system will:
- Think with the agent
- Decide with the human
- Execute deterministically

Proceed deliberately.
