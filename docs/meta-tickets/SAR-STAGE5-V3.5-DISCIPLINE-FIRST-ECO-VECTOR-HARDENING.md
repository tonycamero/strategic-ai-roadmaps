# META-TICKET v2 — SAR-STAGE5-V3.5-DISCIPLINE-FIRST-ECO-VECTOR-HARDENING (AG)

OWNER: Tony Camero
SYSTEM: StrategicAI Roadmaps
SURFACE: Stage 5 — Assisted Synthesis (Proposals + Interpretive Agent)
PRIORITY: P0
MODE: EXECUTION
SCOPE: HARDEN PROMPTS + SCHEMA VALIDATION + UI DISPLAY GUARDRAILS (NO ROADMAP MUTATION)

## CONTEXT
- Stage 5 is now functional and producing proposals with anchors and archetype buckets.
- Hard vetting exposed the remaining failure mode:
  (1) “Automation-first” recommendations slipping through (violates Discipline-First doctrine)
  (2) Economic modeling staying abstract (“revenue friction”, “wasted resources”)
  (3) Constraint rotation still monoculture (Authority/Routing gravity)
  (4) Root-cause collapse / dedupe not aggressive enough
- We must harden Stage 5 to behave as a disciplined, adversarial operational mirror:
  - Never recommend tooling/automation unless state/ownership/queue discipline is established
  - Every proposal must carry a concrete economic mechanism (no MBA filler)
  - Rotation must consider all archetypes before selecting or debating

## NON-NEGOTIABLES
- WSL-only commands (repo is WSL-native). No PowerShell.
- No invented numbers. No ROI hallucinations.
- Verbatim anchoring required for every proposal.
- Agent NEVER writes canonical findings directly; Draft & Approve only.
- Backward compatible: legacy proposals without new fields must not crash UI.

## FILES IN SCOPE
### BACKEND
- backend/src/services/assistedSynthesisAgent.service.ts
- backend/src/services/assistedSynthesisProposals.service.ts
- (optional) backend/src/services/* prompt helpers if present
### FRONTEND
- frontend/src/superadmin/components/AssistedSynthesisAgentConsole.tsx
- frontend/src/superadmin/components/AssistedSynthesisModal.tsx

## GOAL
Stage 5 proposals and interpretive agent must:
1) Enforce Discipline-First (no premature automation recommendations).
2) Enforce Concrete Economic Vector (specific economic mechanisms; ban generic).
3) Enforce Archetype Rotation (must evaluate all archetypes before selecting).
4) Improve Root-Cause Collapse (detect “same root cause?” and reconcile).
5) Preserve anchor integrity (exact quotes) and governance posture.

## DELIVERABLES
A) Prompt hardening (Proposals generator + Interpretive agent) with explicit invariants.
B) JSON schema update + runtime validation (server-side) for proposal blocks.
C) UI: display new fields; safe handling of missing fields; optional cluster grouping remains.
D) Manual verification checklist executed by Tony.
