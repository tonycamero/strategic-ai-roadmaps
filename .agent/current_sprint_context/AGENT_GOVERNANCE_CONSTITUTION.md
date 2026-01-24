# System Governance Constitution (Meta-Tickets 6–13)
**Status:** RATIFIED / ENFORCED
**Scope:** AI Agent Provisioning, Lifecycle, and Trust

---

## 1. Authority & Provisioning (Ticket 6, 6A)
- **Invariant:** Agents are **instruments of finalized strategy**, not exploratory tools.
- **Canonical Trigger:** Agents may **ONLY** be provisioned via the `FINAL_ROADMAP_GENERATED` event.
- **Exclusive Authority:** Only the **Executive Sponsor** can trigger this. Delegates cannot.
- **Scope Legitimacy:** Agents are bound immutably to:
  - Firm ID
  - Final Roadmap ID
  - Approved Ticket IDs (Rejecting a ticket removes it from agent scope forever).
- **Fail-Safe:** If authority is ambiguous, provisioning **FAILS CLOSED** (No Op).

## 2. Agent Lifecycle (Ticket 6A)
- **States:** `PROVISIONED` → `ACTIVE` ↔ `PAUSED` → `ARCHIVED`.
- **Transitions:**
  - **Pause:** Reversible. Threads freeze.
  - **Archive:** Permanent. Agent effectively dies.
  - **Supersede:** New Roadmap automatically **PAUSES** old agents.
- **Invisibility:** Delegates **NEVER** see agent lifecycle states, configuration, or failure modes.

## 3. Revocation & Audit (Ticket 6B)
- **Control:** Executives must be able to **STOP** (Pause) and **KILL** (Archive) any agent instantly.
- **Audit:** Immutable, append-only logs for every state transition and output.
- **Traceability:** Every output must trace back to: `AgentID + RoadmapID + ApprovedTicketID`.
- **Constraint:** If an agent cannot be audited, it cannot run.

## 4. Output Classification (Ticket 6C)
- **Executive-Only:** Strategic/Sensitive. **NEVER SEEN BY DELEGATES**.
- **Shareable Execution:** Operational guidance. Sanitized of "leadership rationale". Safe for delegates.
- **System-Internal:** Logs/Traces.
- **Sanitization:** "Leadership decided X" → "Do X".

## 5. Workflow Boundaries (Ticket 7)
- **Allowed Destinations:**
  1. Draft Execution Artifacts (SOPs, Tasks) — **Primary**.
  2. Read-Only Reports (Status).
  3. System Logs.
- **Forbidden:** Agents **NEVER** write to Roadmaps, Briefs, or Authority State.
- **Human-in-the-Loop:** All outputs require **Accept/Reject/Ignore**.

## 6. Task Proposals (Ticket 8)
- **Model:** Agents **PROPOSE**. Humans **ACCEPT**.
- **No Assignment:** Agents cannot assign work or deadlines.
- **Rejection:** Is final. No retries/arguing.
- **Sanitization:** Upon acceptance, the artifact loses its "AI Generated" tag and becomes "Approved Work".

## 7. Thread Execution (Ticket 9)
- **Definition:** Threads are **controlled execution lanes**, not open-ended chats.
- **Constraint:** Threads behave like "Single-Use Logic Containers" bound to an accepted task.
- **Failure:** Threads **FAIL CLOSED**. No auto-escalation.

## 8. Business Owner Experience (Ticket 10)
- **Mantra:** "Assistive Gravity, Not Momentum."
- **Feeling:** Clarity → Choice → Control → Confidence.
- **Anti-Pattern:** Surprise, Urgency, "We went ahead and...", Hidden Automation.
- **Success:** The owner forgets the AI is there because the work just flows.

## 9. Trust Repair (Ticket 11)
- **Rejection:** Silent. No arguing.
- **Confusion:** Halts execution.
- **Override:** Immediate compliance.
- **Memory:** Never weaponize past history to persuade.

## 10. System Exit (Ticket 13)
- **Exit:** Firm Deactivation / Roadmap Supersession = **INSTANT ARCHIVAL**.
- **Silence:** No ghost influence. No pending tasks. No "one last thing".
- **Forgetting:** Structural. Agents are unreachable.
- **Re-Entry:** Requires new roadmap, new agents. No resurrection.

---
**Implementation Note:** This constitution overrides any functional requirement. If a feature violates these rules, it is a bug.

