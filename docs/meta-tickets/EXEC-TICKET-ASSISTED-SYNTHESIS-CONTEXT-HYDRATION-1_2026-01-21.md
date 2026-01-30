EXECUTION TICKET
ID: EXEC-TICKET-ASSISTED-SYNTHESIS-CONTEXT-HYDRATION-1
TITLE: Stage 5 Assisted Synthesis — hydrate all source artifacts + generate TRUE agent proposals (no verbatim raw-to-finding mapping)
AUTHORITY: META-TICKET-ASSISTED-SYNTHESIS-CONTEXT-HYDRATION-1 + GOVERNANCE.md + V2 Canon intent (Pre-Canonical Workspace)
PRIORITY: P0 (blocks usable Stage 5 + contaminates operator trust)

NON-NEGOTIABLES / HARD STOPS
- Do NOT ask for approval mid-stream; execute strictly within scope and stop at DoD.
- Do NOT modify Ticket Generation, Ticket Moderation logic, Roadmap Assembly, or Canonical Findings rules.
- Do NOT "deterministically extract findings" from raw notes. Proposed Findings MUST be agent-synthesized proposals.
- Do NOT unarchive or surface legacy tickets as current artifacts. If present, isolate/ignore by status+origin filters.
- Proposed Findings are PRE-CANONICAL and must remain editable + rejectable. Canonical is created ONLY by human declaration gate.

PROBLEM STATEMENT
A) Stage 5 "Proposed Findings (Draft)" is currently showing verbatim human input (raw notes / transcript blob) under "Current Facts".
B) Stage 5 Source Artifacts panel is incomplete: Exec Brief (5 parts) and Diagnostic (4 parts) are not fully loaded/visible.
C) "Reason with Agent" exists visually but the agent is not provisioned with full artifact context or a proper proposal-generation step.
D) Ingest Raw Notes is intermittently null/SCHEMA_VIOLATION due to FE/BE payload mismatch (must be made robust).

GOAL STATE (WHAT "CORRECT" LOOKS LIKE)
Stage 4: Ingest Discovery Call Notes (RAW)
- Captures: session metadata + ONE raw capture field (notes/transcript/Q&A paste)
- Persists as tenant_documents artifact: discovery_raw (or existing agreed key) with provenance and timestamp
- No extraction, no findings, no synthesis, no canon creation here

Stage 5: Assisted Synthesis (PRE-CANONICAL)
- 3-pane wide modal:
  LEFT 20%: Authority controls + readiness counters + invariants
  CENTER 40%: Proposed Findings (Draft) = AG-generated proposals ONLY (atomic items) grouped:
    - Current Facts, Friction Points, Goals, Constraints
  RIGHT 40%: Source Artifacts (Read-only Truth), fully hydrated tabs:
    - Raw Notes (Stage 4 artifact)
    - Discovery Q&A (rendered Q list + operator answers if captured; if not, show "Not captured")
    - Diagnostic (ALL 4 parts)
    - Exec Brief (ALL 5 parts)
- "Declare Canonical Findings" remains locked until every proposal item is resolved (accept/reject/edit/add)
- No verbatim transcript blobs appear as "Current Facts" proposals.

AGENT PROVISIONING REQUIREMENT
- "Generate Proposals" step must call an LLM-backed service with a strict prompt to output ONLY structured ProposedFindings (atomic, grounded, no solutions).
- Deterministic FindingsService.extractFindings() must NOT be used for proposals. It can remain for legacy/other uses but Stage 5 proposals must use LLM synth service.
- All artifact context must be assembled and passed into the synth call (Raw Notes + Diagnostic sections + Exec Brief sections + any Q&A answers).

IMPLEMENTATION TASKS (ORDERED)

PHASE 0 — Stabilize Raw Ingest (Schema + UX)
1) Verify FE payload sent by Ingest Raw Notes modal matches BE schema exactly.
   - Fix SCHEMA_VIOLATION by aligning keys, required fields, and types.
   - Add backend error response that returns which field failed (developer-only), but UI remains fail-closed.
2) Ensure Stage 4 stores raw capture to tenant_documents with deterministic artifactKey (e.g., discovery_raw) and includes: tenantId, firmId, createdAt, source="superadmin", schemaVersion.

PHASE 1 — Hydrate Source Artifacts in Stage 5 (Full Context)
3) Identify how Exec Brief is stored (tenant_documents or exec_briefs table). Map and expose ALL 5 sections in one endpoint.
4) Identify how Diagnostic is stored (diagnostics table or tenant_documents). Map and expose ALL 4 sections in one endpoint.
5) Extend Stage 5 "source artifacts" fetch to load:
   - raw notes artifact
   - discovery Q&A artifact (if exists) OR placeholder state
   - diagnostic (4 parts)
   - exec brief (5 parts)
6) Update AssistedSynthesisModal tabs to render each part explicitly (no single "Executive Summary only" views).
   - Exec Brief: render 5 distinct panels/accordions with labels matching existing artifact section names
   - Diagnostic: render 4 distinct panels/accordions with labels matching existing diagnostic sections

PHASE 2 — Replace "verbatim mapping" with TRUE agent proposal generation
7) Create a new backend service: assistedSynthesisProposals.service.ts
   - Input: all hydrated artifacts + optional operator notes
   - Output: ProposedFindingsDraft object:
     {
       version: "v2.0-proposal-1",
       items: Array<{ id, type: "CurrentFact"|"FrictionPoint"|"Goal"|"Constraint", text, evidenceRefs: Array<{artifact:"raw"|"execBrief"|"diagnostic"|"qna", quote, location?}>, status:"pending" }>
     }
   - MUST produce atomic items (one claim per item) and MUST include at least 1 evidenceRef per item (quote can be short excerpt).
   - MUST avoid solutions/implementation language.
8) Add endpoints:
   - POST /api/superadmin/firms/:id/assisted-synthesis/generate-proposals
     - server loads artifacts, calls LLM synth, persists as tenant_documents artifactKey: findings_proposed (or existing key)
   - GET /api/superadmin/firms/:id/assisted-synthesis/proposals
     - returns persisted proposed findings (no generation)
9) Update UI:
   - CENTER column displays proposal items only (not raw transcripts)
   - Add button: "Generate Proposals" (if none exist) and "Regenerate Proposals" (guarded: requires confirm modal + archives previous proposed artifact)
   - Keep Accept/Reject/Edit/Add flows; resolution required before Declare Canonical.

PHASE 3 — Guardrails + Backward Compatibility
10) Ensure any legacy deterministic extractor is NOT called by Stage 5 flows.
11) Ensure proposed findings artifact is distinct from canonical (findings_canonical) and canonical is created ONLY by existing declare endpoint.
12) Ensure "Current Facts" cannot be seeded directly from raw notes without LLM proposal call.
13) Add provenance markers to proposed findings:
   - generatedBy: "assistedSynthesisProposals.service"
   - sourceArtifactIds: [rawDocId, diagnosticDocId..., execBriefDocId...]
   - createdAt
14) Add explicit UI microcopy:
   - "Proposed Findings are agent drafts. Source of truth is the right panel. You must accept/edit before canon."

FILES / SURFACES (LIKELY)
Frontend:
- src/superadmin/components/DiscoveryNotesModal.tsx (or IngestDiscoveryCallNotesRaw modal)
- src/superadmin/components/AssistedSynthesisModal.tsx
- src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx
- src/lib/api.ts (endpoints)

Backend:
- src/controllers/superadmin.controller.ts (new handlers)
- src/services/assistedSynthesisProposals.service.ts (NEW)
- src/services/discoveryCallService.ts (raw persistence)
- src/services/documentService/tenant_documents helpers
- src/services/executiveBrief.service.ts (or equivalent)
- src/services/diagnostic.service.ts (or equivalent)
- src/ai/* (existing OpenAI client wrapper)

LLM PROMPT CONTRACT (STRICT)
- Output must be JSON only, matching ProposedFindingsDraft schema.
- No narrative, no advice, no steps, no prioritization, no tickets.
- Each item must include 1+ evidenceRefs with short quotes from sources.
- If insufficient evidence, omit the item (do NOT infer).

DEFINITION OF DONE (DoD)
- Ingest Raw Notes succeeds with no SCHEMA_VIOLATION; persisted artifact exists and is viewable in Stage 5 "Raw Notes".
- Stage 5 shows Exec Brief with 5 distinct sections and Diagnostic with 4 distinct sections.
- Stage 5 "Proposed Findings" contains ONLY agent-generated proposal items (atomic, evidence-anchored). No verbatim transcript blobs appear as "Current Facts".
- "Generate Proposals" creates/persists findings_proposed and populates UI.
- "Declare Canonical Findings" remains locked until all proposal items are resolved.
- No changes to tickets/roadmap logic; legacy unarchived tickets do not appear in Stage 5 context surfaces.

ACCEPTANCE TEST (MANUAL)
1) Select a test firm → Stage 4 → paste raw notes → Ingest Raw Notes → PASS
2) Open Stage 5 modal:
   - Right tabs show Raw Notes, Discovery Q&A (or placeholder), Diagnostic (4), Exec Brief (5)
3) Click "Generate Proposals":
   - proposals populate center column as atomic items with evidence chips/quotes
4) Accept/reject all → Declare Canonical enables → click (existing flow) → Stage 6 unlocks

STOP CONDITION
- After DoD is met, stop and report only: endpoints added, files touched, and how to test.
