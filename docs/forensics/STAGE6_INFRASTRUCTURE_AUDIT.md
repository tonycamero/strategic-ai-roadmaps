# Forensic Audit: Stage 6 Infrastructure
**Status:** COMPLETE
**Target Ticket:** META-TICKET-STAGE6-FORENSIC-001
**Authority:** SCEND CANON 001

## 1. Entry Point Map
- **Controller Entry:** `activateTicketModeration`
  - **File:** `backend/src/controllers/superadmin.controller.ts:4146`
  - **HTTP:** `POST /api/superadmin/firms/:tenantId/ticket-moderation/activate`
- **Primary Service:** `diagnosticIngestion.service.ts`
- **Execution Chain:**
  1. `superadmin.controller.ts:activateTicketModeration`
  2. `diagnosticIngestion.service.ts:generateRawTickets`
  3. `diagnosticIngestion.service.ts:generateStage6TicketsFromInputs`
  4. `trustagent/prompts/diagnosticToTickets.ts:buildDiagnosticToTicketsPrompt`

## 2. Inventory Source Map
- **Source:** Generated at runtime from SOP-01 artifacts.
- **File:** `backend/src/services/diagnosticIngestion.service.ts`
- **Method:** `extractInventoryFromArtifacts` (Line 392)
- **Logic:** Parses the `ROADMAP_SKELETON` markdown using the following regex:
  - `bulletRegex`: `/^\s*[-*•]\s*(.*)/`
  - `numberedRegex`: `/^\s*\d+\.\s*(.*)/`
  - `systemRegex`: `/\*\*System\*\*: (.*)/i`
- **Registry:** Current Stage 6 pipeline is **detached** from `docs/sop-ticket-inventories/`. It derives inventory exclusively from markdown outputs.

## 3. Selection Logic Map
- **Authority:** Implicitly determined by the `SOP-01 Roadmap Skeleton`.
- **Filtering:** No algorithmic filtering or "Selection Authority" layer is implemented. If it is a bullet point in the skeleton, it becomes a ticket.
- **Constraints:** Scaling limits (e.g., "Micro: 8-12 tickets") are enforced solely via the LLM system prompt.

## 4. Moderation Activation Path
- **Triggers:** Manually activated by SuperAdmin.
- **Persistence:** tickets are generated via `generateRawTickets` (GPT-4o) and persisted to `tickets_draft`.
- **State Transition:** Creates a `ticketModerationSessions` record with status `active`.

## 5. Persistence Layer
- **Ticket IDs:** Synthetic IDs (`ai-gen-{hash}`).
- **Mappings:** Links to `findings_canonical` artifact but not to discrete finding IDs within the object.
- **Slugs:** Deterministic SHA-1 hash of `inventoryId|category|tier|sprint` used to stabilize IDs across regenerations.

## 6. Projection Interaction
- **Surface:** `TenantLifecycleView` (Projection) is **NOT** currently used in the Stage 6 activation path.
- **Canon Violations:** Direct database queries are used to fetch `tenantDocuments` and `tenants` metadata, bypassing `TenantStateAggregationService`.

## 7. LLM Boundaries
- **Model:** `gpt-4o` (JSON Mode).
- **Prompt:** `trustagent/prompts/diagnosticToTickets.ts`.
- **Inputs:** Raw Markdown artifacts (Diagnostic, AI Leverage, Skeleton, Discovery).
- **Logic:** Expands 1:1 inventory items into rich GHL implementation plans.

---
**Audit Complete.**
