# META-TICKET v2 — ASSISTED-SYNTHESIS-V3.4
Title: Stage 5 Upgrade — Full Intake Loading + Hard Constraint Selection + Economic Cascade + Evidence-First Clustering  
Authority: Human Operator (Final Arbiter)  
Executor: AG  
Scope: Backend + Frontend  
Risk: Medium (Prompt Expansion + Schema Change)

---

# OBJECTIVE

Upgrade Stage 5 Assisted Synthesis to:

1. Load full verbatim Team Member Intakes (no compression).
2. Enforce Hard Constraint Selection Protocol (9 archetypes).
3. Enforce Economic Cascade modeling (Mechanical → Operational → Economic).
4. Remove 12-proposal cap (allow 30+ if evidence substantiated).
5. Require anchor-backed proposals only (no structural assumptions).
6. Add Auto-Clustering in UI (by archetype → economic vector).
7. Preserve Draft & Approve pattern (Agent cannot write directly).

---

# HARD GOVERNANCE RULES

G1 — No Anchor, No Proposal  
If a proposal lacks at least one verbatim anchor quote from artifacts → discard.

G2 — No Synthetic Clustering  
Agent may tag archetype, but UI must cluster mechanically by archetype field.
Do NOT allow agent to define clusters narratively.

G3 — No Duplicate Root Causes  
Before emitting proposal:
- Compare against previously emitted proposals in same session.
- Merge if root cause text similarity > threshold (avoid inflation).

G4 — Economic Vector Must Be Structural  
economic_vector cannot contain invented numbers or ROI estimates. Must reference structural economic mechanisms (e.g., throughput suppression, margin compression, rework load).

G5 — Evidence Density Threshold  
If artifact corpus is thin, agent must state: “Evidence insufficient to substantiate additional proposals.”

---

# EXECUTION TICKET — V3.4 IMPLEMENTATION

## PHASE 1 — BACKEND
File: `assistedSynthesisAgent.service.ts`
- `loadTenantContext()`: Fetch all intakes joined with users. Map to `TEAM_MEMBER_INTAKES_VERBATIM`.
- `buildSystemPrompt()`: Enforce archetype protocol, economic cascade, and remove proposal cap.
- Update `SAR_PROPOSAL` schema.

File: `assistedSynthesisProposals.service.ts`
- Apply matching prompt upgrades and intake context.

## PHASE 2 — FRONTEND
File: `AssistedSynthesisAgentConsole.tsx`
- Update `ProposalBlock` and `ProposalCard` for cascade/archetype fields.

File: `AssistedSynthesisModal.tsx`
- Implement Auto-Clustering by archetype and economic_vector.
- Implement Deduplication guard.

---

# VERIFICATION CHECKLIST
1. Agent cites specific team intake quotes.
2. Proposals contain cascade triplet.
3. Archetype selection varies across tenants.
4. More than 12 proposals generated when justified.
5. UI clusters correctly.
6. Legacy proposals render safely.
7. Deduplication works as expected.
