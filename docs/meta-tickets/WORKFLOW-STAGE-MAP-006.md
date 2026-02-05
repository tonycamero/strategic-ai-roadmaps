# META-TICKET: WORKFLOW-STAGE-MAP-006
## Canonical Workflow Spine: Brief → Diagnostic → Discovery Call → Roadmap (Stages + Status Contracts)

**STATUS: READY**
**TYPE: EXECUTION**
**PRIORITY: HIGH**
**SCOPE: IMPLEMENTATION-ONLY (CANONICAL STAGE SPINE + STATUS MODEL; NO NEW OUTPUT CONTENT)**

### OBJECTIVE
Lock the multi-artifact pipeline into a single deterministic "stage spine" so SA flows can be debugged and extended without drift:

1. Define canonical workflow stages and allowed transitions
2. Add an API truth probe endpoint that returns stage readiness + blockers
3. Ensure SA UI can render consistent readiness banners for every stage

### ABSOLUTE CONSTRAINTS
- Do NOT implement Diagnostic/Discovery/Roadmap synthesis content in this ticket
- Do NOT change Executive Brief logic
- Keep schema changes minimal and additive

### SCOPE (IN)

**A) Canonical stage model**

Create `backend/src/types/workflowStage.ts`:
- `enum WorkflowStage = { INTAKE, EXEC_BRIEF, DIAGNOSTIC, DISCOVERY_CALL, ROADMAP }`
- `enum StageStatus = { NOT_READY, READY, IN_PROGRESS, COMPLETE, BLOCKED }`
- `type StageBlocker = { code, message, details? }`
- `type WorkflowTruthProbe = { tenantId, stages: Record<WorkflowStage, { status, blockers[] }> }`

**B) Truth probe resolver**

Create `backend/src/services/workflowTruthProbe.service.ts`:
- `resolveWorkflowTruthProbe(tenantId)`

Rules:
- EXEC_BRIEF READY requires: intake complete + vectors present + operator sufficiency event if applicable
- Later stages can return NOT_READY placeholders with clear blockers (do not guess)

**C) API endpoint**

Add `GET /api/superadmin/firms/:tenantId/workflow/truth-probe` returning `WorkflowTruthProbe`
Include requestId headers + standardized error payloads.

**D) SA UI minimal rendering**

In SA Firm detail, render a "Workflow" panel listing stages with status + blockers (no redesign; simple list)

### OUT OF SCOPE
- Generating new artifacts beyond existing Executive Brief
- PDF changes
- Major DB schema rework

### DELIVERABLES
- ⏳ Ticket persisted to docs/meta-tickets/
- ⏳ Canonical stage model types created
- ⏳ Truth probe resolver implemented
- ⏳ API endpoint created with requestId support
- ⏳ SA UI displays stage spine for a tenant
- ⏳ No regression in existing brief flows

### DEFINITION OF DONE
- Truth probe returns deterministic stage status with blockers
- SA UI displays stage spine for a tenant
- No regression in existing brief flows
- Ticket persisted verbatim

### AUTHORITY
Derives from: EXEC-BRIEF-VALIDATION-KIT-003, EXEC-BRIEF-GOVERNANCE-REALIGN-004
