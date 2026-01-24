# CANONICAL GOVERNANCE DOCS INVENTORY

**Generated:** 2026-01-19  
**Purpose:** Locate all canonical governance documents that define hard behavioral boundaries for AG  
**Status:** Discovery Complete (Restored to Original Locations)

---

## 🔒 CORE GOVERNANCE / GUARDRAILS (MANDATORY INGEST)

### 1. **AG JAIL PROMPT · EXECUTION SURFACE RECOMPOSITION**
**Status:** NOT FOUND as standalone file  
**Notes:** May be embedded in other docs or referenced implicitly. Need to search content for "Junior Developer" role contract.

### 2. **Guardrails.md**
**Status:** NOT FOUND as standalone file  
**Location Candidates:**
- Content may be distributed across multiple files
- Check `docs/GOVERNANCE.md` (contains some guardrail content)
- Check `.agent/current_sprint_context/AGENT_GOVERNANCE_CONSTITUTION.md`

**Related Files Found:**
- `docs\GOVERNANCE.md`
- `.agent\current_sprint_context\AGENT_GOVERNANCE_CONSTITUTION.md`

### 3. **Do Not Break These Invariants**
**Status:** NOT FOUND as standalone file  
**Location Candidates:**
- Content likely embedded in GOVERNANCE.md or task files
- Check docs that reference "invariants"

**Files Mentioning Invariants:**
- `docs\design_sprint_summary.md`
- `docs\rebuild\ticket_2_executive_brief_ux_contract.md`
- `docs\rebuild\CR_UX_MASTER_FLOW.md`
- `docs\rebuild\SUPERADMIN_UX_PRINCIPLES.md`
- `docs\GOVERNANCE.md`

---

## 🧭 EXECUTION & STATE AUTHORITY DOCS

### 4. **Execution State Contract**
**Status:** ✅ FOUND  
**Location:** `docs\contracts\execution_state.contract.md`

### 5. **Authority Spine / Authority Map**
**Status:** NOT FOUND as standalone file  
**Notes:** Referenced in GOVERNANCE.md but no dedicated file found

**Files Mentioning Authority/RBAC:**
- `docs\GOVERNANCE.md`
- `docs\INTEGRATION_COMPLETE_CR-OPERATOR-EXECUTION-PANEL.md`
- `docs\SIRSI_SAR_HANDOFF_CONTRACT.md`
- `docs\rebuild\RBAC_PROJECTION.md.resolved`

**Verification Script:**
- `scripts\verify_superadmin_authority.sh`

---

## 🧱 CANONICAL STRUCTURE DOCS

### 6. **Canonical Directory / Canonical Registry**
**Related Files:**
- `CANONICAL_WORKDIR.md`
- `CANONICAL_PDF_COMPLETE.md`
- `.agent\current_sprint_context\CANONICAL_VERIFICATION_REPORT.md`

**Verification Scripts:**
- `backend\src\scripts\verify_canonical_tickets.ts`

### 7. **SCEND_GHL_TICKET_LIBRARY_v1.md**
**Status:** ✅ FOUND  
**Location:** `SOPs\SCEND_GHL_TICKET_LIBRARY_v1.md`

**Related Files:**
- `SOPs\SCEND_ROADMAP_ENGINE_LEARNING_LOOP_TICKET_PACK_v1.md`
- `SOPs\SCEND_ROADMAP_ENGINE_ARCHITECTURE_v1.md`
- `GHL_ROADMAP_REFACTOR_ANALYSIS.md`

---

## 📜 SCOPE & CHANGE CONTROL

### 8. **SCOPE LOCK.txt**
**Status:** NOT FOUND  
**Notes:** No file with this exact name exists

**Related Files (Scope/Freeze Control):**
- `docs\EXECUTION_FREEZE.md`
- `SA-EXEC-BRIEF-FREEZE-TAG-1-VERIFICATION.md`

### 9. **Definition of Done (DoD)**
**Status:** NOT FOUND as standalone file  
**Notes:** Likely embedded in META-TICKET files

**Files Mentioning DoD/Definition of Done:**
- `docs\tasks\CR-SA-DISCOVERY-REVIEW-SURFACE-1.md`
- `docs\tasks\CR-OPERATOR-EXECUTION-PANEL-GENERALIZED-1.md`
- `docs\tasks\CR-DISCOVERY-GATE-ENFORCE-1.md`
- `CHAMBER_TEAM_INTAKES_COMPLETE.md`
- `docs\GOVERNANCE.md`

---

## 🧪 VERIFICATION / PROOF DOCS

### 10. **Truth Probe Specification**
**Status:** NOT FOUND as standalone file  
**Notes:** Referenced in GOVERNANCE.md

**Files Mentioning Truth Probe:**
- `docs\GOVERNANCE.md`

### 11. **Verification Scripts / Proof Artifacts**
**Status:** ✅ FOUND (Multiple)

**Proof Scripts:**
- `backend\scripts\prove_truth.sh`
- `backend\scripts\prove_it.sh`

**Verification Scripts:**
- `backend\src\scripts\verify_ticket_moderation.ts`
- `backend\src\scripts\verify_canonical_tickets.ts`
- `backend\src\scripts\verify_snapshot.ts`
- `backend\src\scripts\verify_readiness_signals.ts`
- `backend\src\scripts\verify_id_semantics.ts`
- `backend\src\scripts\verify_intake_freeze.ts`
- `backend\src\scripts\verify_sop01_generation.ts`
- `backend\src\scripts\verify_roadmap_assembly.ts`
- `scripts\verify_superadmin_authority.sh`
- `verify-migrations.sh`
- `verify_agent_configs.sh`

---

## 📋 ADDITIONAL GOVERNANCE-RELATED DOCS FOUND

### Implementation Boundaries
- `docs\meta_ticket_implementation_boundaries.md`
- `docs\rebuild\FIRM_DETAIL_IMPLEMENTATION_BOUNDARIES.md`
- `.agent\current_sprint_context\FIRM_DETAIL_IMPLEMENTATION_BOUNDARIES.md`

### UX Principles & Contracts
- `docs\superadmin_ux_principles.md`
- `docs\rebuild\SUPERADMIN_UX_PRINCIPLES.md`
- `.agent\current_sprint_context\SUPERADMIN_UX_PRINCIPLES.md`
- `docs\rebuild\CR_UX_MASTER_FLOW.md`
- `.agent\current_sprint_context\CR_UX_MASTER_FLOW.md`

### Contracts
- `docs\contracts\execution_state.contract.md`
- `docs\contracts\discovery.contract.md`
- `docs\contracts\tickets.contract.md`
- `docs\ticket_2_executive_brief_ux_contract.md`
- `docs\rebuild\ticket_2_executive_brief_ux_contract.md`

### Meta Tickets & Tasks
- `docs\rebuild\META_TICKET_CR_ROOT.md`
- `.agent\current_sprint_context\META_TICKET_CR_ROOT.md`
- `docs\tasks\CR-OPERATOR-EXECUTION-PANEL-GENERALIZED-1.md`
- `docs\tasks\CR-DISCOVERY-GATE-ENFORCE-1.md`
- `docs\tasks\CR-HARDEN-ROADMAP-GEN-DISCOVERY-GATED-1.md`
- `docs\tasks\CR-SA-DISCOVERY-REVIEW-SURFACE-1.md`
- `docs\tasks\CR-DISCOVERY-ARTIFACT-UNIFY-1.md`
- `docs\tasks\CR-DISCOVERY-DIAG-LINK-1.md`

### Audit & Repo Analysis
- `docs\REPO_AUDIT_2026-01-12.md`
- `docs\audit\CR-UX_AUDIT_TRAIL.md`
- `docs\rebuild\EXEC_SURFACE_REPO_TRUTH.md.resolved`
- `docs\rebuild\EXEC_SURFACE_REPO_TRUTH2.md.resolved`
- `docs\rebuild\REPO-FACTS.md.resolved`
