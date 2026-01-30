# META TICKET — STAGE 6 PIPELINE CORRECTION + SCHEMA PARITY GUARDRAILS

**ID:** META-STAGE6-DATA-GENEALOGY-PARSER-FIX-002  
**OWNER:** Tony  
**STATUS:** EXECUTED  
**SCOPE:** Targeted (No Feature Expansion)

---

## 🎯 OBJECTIVE

Correct the Stage 6 Ticket Moderation pipeline so that **GHL SOP Tickets are actually generated** by the authoritative Ticket Architect, and prevent future false-negative / paradox failures caused by **schema drift between execution branches**.

This META explicitly separates **root-cause logic failure** from **schema masking errors** and enforces hard guardrails so neither can obscure the other again.

---

## 🔒 NON-NEGOTIABLE INVARIANTS

### **I1 — Authoritative Brain (No Prompt Drift)**
Stage 6 MUST invoke the canonical Ticket Architect:
- `buildDiagnosticToTicketsPrompt`
- `generateRawTickets`
- No forked prompts, no shadow logic.

### **I2 — Correct Data Genealogy**
Stage 6 MUST derive ticket inventory from **approved SOP artifacts** (e.g. `ROADMAP_SKELETON`, `DIAGNOSTIC_MAP`), not:
- raw Findings
- Proposed text
- cosmetic title cleanup

If inventory extraction returns empty, the system must **fail closed** with a diagnostic error.

### **I3 — Inventory Parser Compatibility**
`extractInventoryFromArtifacts` MUST correctly parse the **actual file format in use**.

Current reality:
- ROADMAP_SKELETON uses **bullet-based action items**
- Legacy parser expects `**System**: Name` headers

**Mismatch = zero inventory = zero tickets = silent failure**  
This must be corrected.

### **I4 — No Silent Empty AI Calls**
If extracted inventory length is `0`:
- DO NOT call OpenAI
- Return `409 INVENTORY_EMPTY`
- Include artifact IDs + parser signature used

### **I5 — Atomic Draft Creation**
Ticket Moderation activation must remain atomic:
- Session creation + draft ticket inserts in one transaction
- No orphan sessions
- No partial writes

### **I6 — Explicit Regen / Idempotency**
If an active moderation session exists:
- Block regeneration (`400 ACTIVE_SESSION_EXISTS`)
- No silent overwrite
- No duplicate drafts

### **I7 — Schema Parity Guardrail (NEW)**
When **Ticket Moderation UI loads**:

- If querying `tickets_draft` (active session path),
- And required columns are missing,

The backend MUST:
- Fail closed with structured error
- NOT throw raw PostgresError

**Required minimum parity columns:**
- `category`
- `tier`
- `sprint`
- `status`
- `title`
- `implementation_steps`
- `roi_notes`
- `time_estimate_hours`

---

## ⚠️ FAILURE MODE TO PREVENT (Documented)

> Health checks passed on `sop_tickets`, but runtime queried `tickets_draft` → crash.

This META requires **branch-aware diagnostics** so this class of paradox cannot recur.

---

## ✅ ACCEPTANCE CRITERIA

### Parser Fix (COMPLETED)
- `extractInventoryFromArtifacts` successfully extracts inventory from bullet-based ROADMAP_SKELETON
- Logs confirm non-zero inventory
- AI receives meaningful input
- Draft tickets generated with full fidelity

### Guardrails (COMPLETED)
- Empty inventory → `500 INVENTORY_EMPTY` (Fail Closed)
- Schema mismatch → `500 DRAFT_SCHEMA_MISMATCH`

### Regression Safety
* No change to prompt semantics
* No cosmetic-only fixes masquerading as logic repair
* Findings ≠ Tickets invariant preserved

---

## 🧭 OUT OF SCOPE (EXPLICIT)

* Title wording polish (“Proposed: …”)
* Ticket quality tuning
* Roadmap generation
* UI enhancements

These belong in follow-on tickets.
