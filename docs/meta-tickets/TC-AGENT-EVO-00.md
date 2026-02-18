META-TICKET v2 — TC-AGENT-EVO-00 — TRUST CONSOLE AGENT: ARCHITECTURAL INTERROGATION → CURRENT-STATE EXTRACTION → PLAN → AG BUILD

SCOPE / INTENT
- Purpose: Evolve Trust Console agent posture toward “strategic thinking partner by role” while remaining advisory-only.
- Execution discipline: One step at a time. Architectural interrogation ONLY first. No coding/building until plan is approved.
- This series produces a factual map, then extracts current agent state, then drafts a surgical plan, then hands to AG for implementation.

HARD CONSTRAINTS
- Step 1 is READ-ONLY architecture interrogation. NO code edits. NO dependency changes. NO refactors. NO feature builds.
- No new services. No schema explosion. No runtime injection frameworks in this phase.
- Maintain advisory-only authority. No execution capability introduced.
- Follow SCOPE LOCK: if a required change touches forbidden files, STOP and report.

STOP CONDITIONS (FAIL-CLOSED)
- Any need to modify files during interrogation → STOP and report.
- Any discovery of execution hooks / mutation surfaces in agent layer → STOP and report with file paths.
- Any ambiguity about where prompts/agents live → continue mapping, do not guess.

DELIVERABLES (ORDERED, REQUIRED)
D1) Current-State Architecture Map (Trust Console + Agent surfaces)
D2) Current Agent State Extraction (prompts, modes, guardrails, context injection)
D3) Gap Map vs Trust Console Agent Evolution Framework v1.0
D4) Surgical Evolution Plan (prompt-level posture shift only) + Guardrail reinforcement plan
D5) AG Build Packet (exact files, diffs, tests, rollback)

============================================================
EXEC-TICKET — TC-AGENT-EVO-01 — ARCHITECTURAL INTERROGATION (READ-ONLY) — MAP TRUST CONSOLE TOPOLOGY

OBJECTIVE
- Produce D1: a factual architecture map of the Trust Console + Agent-related surfaces WITHOUT reading prompt contents yet.
- Identify where the agent could live (candidate modules) and how Trust Console data flows in/out.

ALLOWED ACTIONS
- Repo read-only commands: ls/find/rg/cat (no edits), open files for inspection, note file paths.
- No running builds, no migrations, no installs.

TASKS (CHECKLIST)
1) Repo Topology
   - Identify monorepo boundaries: apps/, packages/, backend/, api/, functions/, services/, etc.
   - Note frameworks: Next/React/Vite/Express/Netlify Functions/etc.

2) Trust Console Surface Map
   - Locate UI entrypoints for Trust Console (routes/pages/screens).
   - Locate backend entrypoints serving Trust Console (API routes/functions/controllers).
   - Identify data access layer(s): db clients, repositories, ORMs.

3) Agent Surface Discovery (STRUCTURE ONLY)
   - Identify directories/files with names suggesting agent/prompt/copilot/assistant/reasoning.
   - Identify any “mode” or “context injection” modules by filename only (do not extract content yet).

4) Integration Touchpoints (HIGH LEVEL)
   - Identify existing inbound webhook handlers / event ingestion surfaces (route names only).
   - Identify any outward integrations (GHL/NetSuite/SMS) by module names only.

OUTPUT (D1)
- A single architecture map with:
  - UI nodes (Trust Console)
  - API nodes
  - Data layer nodes
  - Candidate agent modules (by path)
  - Integration nodes (by path/category)
- No prompt text copied yet. Only file paths and relationships.

EVIDENCE REQUIRED
- List of discovered directories/files with paths.
- Short description per node (1 line).

============================================================
EXEC-TICKET — TC-AGENT-EVO-02 — CURRENT AGENT STATE EXTRACTION (READ-ONLY) — PROMPTS / MODES / GUARDRAILS / CONTEXT

PREREQUISITE
- TC-AGENT-EVO-01 completed and D1 produced.

OBJECTIVE
- Produce D2: extract the current agent state precisely (prompt text, mode definitions, guardrails, and context sources).

ALLOWED ACTIONS
- Read-only inspection of the specific agent-related files identified in TC-AGENT-EVO-01.

TASKS (CHECKLIST)
1) Identify Agent Identity
   - Where is the agent defined? (class/function/config)
   - What is its stated role/identity?

2) Prompt Extraction
   - Extract full system prompt(s) and any appended instruction blocks.
   - Extract any “Roadmap Mode” / “Trust Console Mode” text if present.

3) Guardrails Extraction
   - Find advisory-only enforcement language.
   - Identify prohibitions (execution, irreversible actions, etc.).
   - Identify any safety filters, validators, or post-processors.

4) Context Binding
   - Enumerate what context is fed in:
     - intake JSON
     - roadmap artifacts
     - trust console data
     - tenant/org metadata
     - role metadata (if any)
   - Record how/where context is assembled.

5) Tool/Action Surfaces
   - Identify any tool-calling or action hooks wired to the agent (even if disabled).
   - Note endpoints/functions the agent can call.

OUTPUT (D2)
- “Agent State Snapshot” containing:
  - Prompt blocks (verbatim)
  - Mode blocks (verbatim)
  - Guardrail blocks (verbatim)
  - Context assembly path map
  - Any execution/tool surfaces list

STOP CONDITIONS
- If agent has ANY active execution hooks that could modify external systems → STOP and report immediately.

============================================================
EXEC-TICKET — TC-AGENT-EVO-03 — GAP MAP (CURRENT vs ASPIRATIONAL) — NO CHANGES

PREREQUISITE
- D2 completed.

OBJECTIVE
- Produce D3: a capability matrix comparing current agent to Trust Console Agent Evolution Framework v1.0.

DIMENSIONS (REQUIRED)
1) Identity posture (Roadmap Copilot vs Strategic Thinking Partner)
2) Role adaptivity (Owner/Ops/Sales/Delivery)
3) Org-vector anchoring (explicit/implicit/none)
4) Structural inference (none/limited/explicit assumptions)
5) Failure modeling (linear vs 1st/2nd/3rd order)
6) Governance taxonomy (none/partial/full)
7) Advisory-only boundaries (weak/medium/strong)
8) Config suggestion separation (analysis vs recommendation separation)
9) Prompt complexity risk (token growth / drift risk)

OUTPUT (D3)
- Matrix:
  - Current behavior evidence (cite file path + snippet reference)
  - Missing capability description
  - Classify each missing item as:
    A) Prompt-only possible now
    B) Requires architecture later

============================================================
EXEC-TICKET — TC-AGENT-EVO-04 — SURGICAL EVOLUTION PLAN (PROMPT-LEVEL ONLY) + TEST PLAN

PREREQUISITE
- D3 completed.

OBJECTIVE
- Produce D4: the minimal plan to shift posture NOW (before Ninkasi pilot) without architecture changes.

CONSTRAINTS
- No new injection framework.
- No new services.
- No schema changes.
- Prompt delta target: <= +15% length increase.
- Preserve roadmap workflow integrity.

PLAN CONTENT (REQUIRED)
1) Target posture statement (1 paragraph)
2) Prompt diffs (exact insertions/replacements)
3) Role-sensitivity heuristic rules (non-schema)
4) Structural inference rules + assumption disclosure format
5) Advisory-only reinforcement rules
6) “Analysis vs Configuration Suggestions” separation template
7) Non-goals list (explicitly exclude governance taxonomy, cascade engine, org-vector schema)
8) Regression test prompts (Owner/Ops/Sales/Delivery + Roadmap flow)

OUTPUT (D4)
- A ready AG build plan with:
  - exact file targets
  - exact text diffs
  - acceptance criteria
  - rollback steps

============================================================
EXEC-TICKET — TC-AGENT-EVO-05 — AG BUILD PACKET (HANDOFF ONLY; NO BUILD BY US)

PREREQUISITE
- D4 completed and approved.

OBJECTIVE
- Produce D5: a single packet AG can execute safely.

CONTENTS (REQUIRED)
1) Files to modify (explicit list)
2) Exact diff blocks
3) Test commands (if any) + expected outcomes
4) Validation checklist
5) Rollback commit plan

OUTPUT (D5)
- “AG Build Packet — Trust Console Agent Posture v1.1”

============================================================
OPERATOR NOTES
- This ticket series is intentionally sequential and fail-closed.
- Do not collapse steps.
- Do not code until TC-AGENT-EVO-04 is approved.
