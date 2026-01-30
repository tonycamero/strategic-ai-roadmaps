# META-TICKET: STAGE-5-INTERPRETIVE-AGENT-CURRENT-FACTS-SNAPSHOT-1

## AUTHORITY
SuperAdmin only  
Stage: 5 — Assisted Synthesis  
Mode: Pre-Canonical Workspace  
Scope: Interpretive Agent (read-only)

## PURPOSE
Enable the Interpretive Agent to reason over the **entire CURRENT FACTS set collectively**, not just individual items or raw artifacts, by injecting a **read-only snapshot** of the CURRENT FACTS proposals into the agent’s session context.

This resolves the current limitation where the agent cannot answer set-level questions such as:
- “Is this CURRENT FACTS list accurate overall?”
- “Is anything missing, overstated, or misrepresented?”
- “Does this fairly reflect the source artifacts as a whole?”

## NON-GOALS (HARD CONSTRAINTS)
- ❌ Agent must NOT modify proposals
- ❌ Agent must NOT add/remove CURRENT FACTS
- ❌ Agent must NOT affect acceptance / rejection / canonicalization
- ❌ No changes to proposal generation, regeneration, or persistence logic
- ❌ No cross-stage side effects

---

## EXECUTION TICKET

# EXEC-TICKET: INJECT-CURRENT-FACTS-SNAPSHOT-INTO-INTERPRETIVE-AGENT-SESSION-1

## TASK SUMMARY
Inject a **read-only CURRENT FACTS snapshot** into the Interpretive Agent’s session at initialization time, and update the agent system prompt so it can evaluate the **entire set collectively** against source artifacts.

---

## REQUIRED BEHAVIOR

### 1. Snapshot Construction
At Interpretive Agent session initialization, construct a snapshot object:

```json
CURRENT_FACTS_SNAPSHOT {
  "snapshotId": "UUID",
  "generatedAt": "ISO_TIMESTAMP",
  "items": [
    {
      "id": "string",
      "text": "string",
      "category": "current_fact",
      "sources": "string[]",
      "status": "pending" | "accepted" | "rejected"
    }
  ],
  "invariants": [
    "read-only",
    "pre-canonical",
    "derived-from-source-artifacts",
    "ui-resolved-state"
  ]
}
```

- Snapshot reflects **current UI state**, not raw artifacts
- Snapshot updates **only when proposals change** (regen / add / remove)
- Snapshot is **not persisted** — session-scoped only

---

### 2. Agent Context Injection
Inject the snapshot into the agent’s context window as **explicit system-provided state**, not user message text.

The agent must clearly “know”:
- This is the **entire CURRENT FACTS set**
- This set is **human-reviewable but not yet canonical**
- It may reason **about the set as a whole**

---

### 3. System Prompt Update (Required)
Update the Interpretive Agent system prompt to include:

> “You are provided with a read-only snapshot of the CURRENT FACTS proposals.  
> These represent the full set of current-state assertions derived from source artifacts.  
> You may evaluate them individually or collectively for accuracy, completeness, bias, or omission.  
> You may not modify, approve, reject, or create proposals.”

---

### 4. UI Contract (No New Controls)
- No UI changes required beyond existing chat box
- Agent responses may now reference:
  - “The current list collectively…”
  - “Across the CURRENT FACTS set…”
- Agent must never imply authority or approval

---

## ACCEPTANCE CRITERIA (DoD)

- ✅ Agent can answer:  
  “Is the CURRENT FACTS list an accurate representation of the source artifacts?”
- ✅ Agent can identify:
  - missing facts
  - over-generalizations
  - under-represented areas
- ✅ Agent cannot:
  - modify proposals
  - suggest acceptance/rejection
  - hallucinate facts not grounded in artifacts
- ✅ Snapshot is clearly treated as **read-only**
- ✅ No regressions to proposal generation or canonical flow

---

## STOP CONDITION
Execution stops once:
- Interpretive Agent can reason over CURRENT FACTS **as a set**
- No mutation pathways exist
- Authority gates remain intact

Await further instruction after completion.
