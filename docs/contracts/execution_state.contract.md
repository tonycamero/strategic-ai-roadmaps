# Execution State Contract

**Version:** 1.0  
**Status:** ACTIVE  
**Endpoint:** `GET /api/superadmin/execution/:tenantId/:diagnosticId`

---

## Purpose

The Execution State API provides a **single source of truth** for the current state of the gated roadmap generation workflow. It aggregates data from multiple sources to compute milestone status, blocking reasons, and next actions.

**Key Principles:**
- ✅ Read-only aggregator (no mutations)
- ✅ No business logic duplication
- ✅ Explicit blocking codes matching backend gates
- ✅ UI never guesses state

---

## Request

```
GET /api/superadmin/execution/:tenantId/:diagnosticId
Authorization: Bearer <token>
```

**Path Parameters:**
- `tenantId` (string, required) - Tenant UUID
- `diagnosticId` (string, required) - Diagnostic ID (e.g., `diag_abc123`)

---

## Response

```typescript
interface ExecutionState {
  tenantId: string;
  diagnosticId: string;
  milestones: MilestoneStatus[];
  nextAction?: string;
}

interface MilestoneStatus {
  id: string;
  label: string;
  status: 'BLOCKED' | 'READY' | 'COMPLETE' | 'IN_PROGRESS';
  blockingCode?: string;
  blockingReason?: string;
  metadata?: Record<string, any>;
}
```

**Example Response:**

```json
{
  "tenantId": "883a5...",
  "diagnosticId": "diag_abc123",
  "milestones": [
    {
      "id": "M1",
      "label": "SOP-01 Diagnostic Generated",
      "status": "COMPLETE",
      "metadata": {
        "diagnosticId": "diag_abc123",
        "createdAt": "2026-01-19T..."
      }
    },
    {
      "id": "M2",
      "label": "Discovery Synthesis Created",
      "status": "COMPLETE",
      "metadata": {
        "selectedCount": 15,
        "version": 1,
        "confidenceLevel": "high"
      }
    },
    {
      "id": "M3",
      "label": "Tenant Lead Approval",
      "status": "BLOCKED",
      "blockingCode": "DISCOVERY_NOT_APPROVED",
      "blockingReason": "Awaiting tenant lead approval.",
      "metadata": {
        "approvalState": "pending"
      }
    }
  ],
  "nextAction": "Send Discovery Review link to Tenant Lead"
}
```

---

## Milestones

### M1: SOP-01 Diagnostic Generated

**Data Source:** `diagnostics` table

**Statuses:**
- `BLOCKED` - Diagnostic not found
- `COMPLETE` - Diagnostic exists

**Blocking Codes:**
- `DIAGNOSTIC_NOT_FOUND`

---

### M2: Discovery Synthesis Created

**Data Sources:**
- `discovery_call_notes` (latest by diagnostic)
- `synthesis_json.selectedInventory` length

**Statuses:**
- `BLOCKED` - No synthesis OR < 12 items
- `COMPLETE` - Synthesis exists with ≥12 items

**Blocking Codes:**
- `DISCOVERY_REQUIRED` - No synthesis
- `INSUFFICIENT_SELECTION` - < 12 items

**Metadata:**
- `selectedCount` - Number of inventory items
- `version` - Discovery note version
- `confidenceLevel` - Operator confidence

---

### M3: Tenant Lead Approval

**Data Source:** `discovery_call_notes.approval_state`

**Statuses:**
- `BLOCKED` - `pending` or `changes_requested`
- `COMPLETE` - `approved`

**Blocking Codes:**
- `DISCOVERY_NOT_APPROVED`

**Metadata:**
- `approvalState` - Current state
- `rejectionReason` - If changes requested
- `approvedBy` - User ID who approved
- `approvedAt` - Approval timestamp

---

### M4: Generate Tickets

**Data Source:** `sop_tickets` count

**Statuses:**
- `READY` - No tickets generated yet (all gates passed)
- `COMPLETE` - Tickets exist

**Metadata:**
- `ticketCount` - Number of tickets

---

### M5: Ticket Moderation Complete

**Data Source:** `sop_tickets.moderation_status`

**Statuses:**
- `IN_PROGRESS` - Pending tickets exist
- `COMPLETE` - All tickets approved/rejected

**Blocking Codes:**
- `TICKETS_PENDING`

**Metadata:**
- `total` - Total tickets
- `pending` - Pending count
- `approved` - Approved count
- `rejected` - Rejected count

---

### M6: Roadmap Assembly Ready

**Data Source:** TBD (roadmap table when implemented)

**Statuses:**
- `READY` - All tickets moderated, ready to assemble
- `COMPLETE` - Roadmap assembled

**Metadata:**
- `approvedTicketCount` - Number of approved tickets

---

## Blocking Codes

All blocking codes match the backend `TicketGenerationErrorCode` enum:

```typescript
enum TicketGenerationErrorCode {
  DISCOVERY_REQUIRED = 'DISCOVERY_REQUIRED',
  DISCOVERY_NOT_APPROVED = 'DISCOVERY_NOT_APPROVED',
  INSUFFICIENT_SELECTION = 'INSUFFICIENT_SELECTION',
  INVENTORY_MISMATCH = 'INVENTORY_MISMATCH',
  DIAGNOSTIC_NOT_FOUND = 'DIAGNOSTIC_NOT_FOUND',
  NO_VALID_TICKETS = 'NO_VALID_TICKETS',
  TICKETS_PENDING = 'TICKETS_PENDING'
}
```

---

## Error Responses

**404 Not Found:**
```json
{
  "error": "Diagnostic not found"
}
```

**400 Bad Request:**
```json
{
  "error": "tenantId and diagnosticId are required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to retrieve execution state"
}
```

---

## Usage Examples

### Operator Execution Panel

```typescript
const response = await fetch(
  `/api/superadmin/execution/${tenantId}/${diagnosticId}`
);
const state: ExecutionState = await response.json();

// Render milestone stack
state.milestones.forEach(milestone => {
  renderMilestone(milestone);
  
  // Show primary action only for next eligible step
  if (milestone.status === 'BLOCKED' || milestone.status === 'READY') {
    renderPrimaryAction(milestone);
  }
});
```

### Discovery Gate Check

```typescript
const m3 = state.milestones.find(m => m.id === 'M3');

if (m3?.blockingCode === 'DISCOVERY_NOT_APPROVED') {
  if (m3.metadata?.approvalState === 'changes_requested') {
    showReviseButton();
  } else {
    showSendReviewLinkButton();
  }
}
```

---

## Implementation Notes

**Read-Only Aggregator:**
- Service reads from existing tables
- No mutations
- No business logic duplication

**Performance:**
- Queries are indexed
- Response cached for 30s (optional)
- Lightweight JSON payload

**Extensibility:**
- New milestones can be added
- Metadata is flexible
- Blocking codes are explicit

---

## Related Endpoints

- `POST /api/discovery/:tenantId/approve` - Approve synthesis
- `POST /api/discovery/:tenantId/request-changes` - Request changes
- `POST /api/superadmin/tickets/generate/:tenantId/:diagnosticId` - Generate tickets
- `GET /api/discovery/:tenantId` - Get discovery notes

---

**End of Contract**
