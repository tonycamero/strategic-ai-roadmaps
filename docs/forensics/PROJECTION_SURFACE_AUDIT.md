# Forensic Audit: Projection Surface Reality
**Status:** COMPLETE
**Target Ticket:** META-TICKET-PROJECTION-ENVELOPE-REALITY-001

## 1. Output Scope (`TenantLifecycleView`)
The centralized Projection service (`TenantStateAggregationService`) emits a comprehensive state object including:
- **Capabilities Matrix:** Explicit boolean gates for `generateTickets`, `assembleRoadmap`, and `generateSynthesis`.
- **Workflow Maturity:** Tracks `discoveryIngested`, `intakesComplete`, and `sop01Complete`.
- **Governance:** Derived from audit event precedence (Approved vs. Delivered).

## 2. Stage 6 Consumption Gap
- **Active Path:** `activateTicketModeration` (Line 4146) **bypasses** the Projection authority.
- **Missing Gate:** The pipeline does not check `view.capabilities.generateTickets.allowed`.
- **Isolation:** Stage 6 persists in using legacy artifact-based validation (`DiagnosticIngestionService`) instead of central readiness flags.

## 3. Envelope Logic Status
- **Programmatic Bounds:** None. 
- **LLM Stewardship:** The system relies on the LLM prompt to respect "Firm Size" constraints rather than enforcing them at the service layer.
- **Missing Signals:** `tenantTier` and `verticalMarkers` are available in the DB but not utilized as constraints in the ticket generation envelope.

## 4. Canon Adherence Audit
- **Violation Found:** Stage 6 activation relies on direct DB selects for findings, tenant metadata, and artifact pointers.
- **Risk:** High drift risk. Interpretive logic is duplicated across the controller and the Projection service, creating a "Split-Brain" scenario where the API behavior may contradict the UI state.

---
**Audit Complete.**
