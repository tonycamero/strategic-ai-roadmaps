# Ticket Inventory & Diagnostic Ingestion Contract

## 1. TicketInventoryItem (Wire & Backend DTO)
Canonical shape for a ticket as returned by `GET /api/superadmin/tickets/:tenantId/:diagnosticId`.
Fields are camelCase.

### ID Semantics & Types
| Field | DB Type | Format | Notes |
|-------|---------|--------|-------|
| `sop_tickets.id` | UUID | UUIDv4 | Primary Key. **MUST be UUID.** Never use nanoid/string. |
| `sop_tickets.diagnostic_id` | VARCHAR | `diag_<nanoid>` | Semantic grouping ID. Matches `diagnostics.id`. |
| `sop_tickets.ticket_id` | VARCHAR | `T-1`, `S3-T1` | Human-readable/public ID. |
| `tenants.id` | UUID | UUIDv4 | Foreign Key. |

| Field | Type | Backend (TS) | DB (SQL) | Required |
|-------|------|--------------|----------|----------|
| id | uuid | id | id | Yes |
| ticketId | string | ticketId | ticket_id | Yes |
| title | string | title | title | Yes |
| description | string | description | description | Yes |
| category | string | category | category | Yes |
| tier | string | tier | tier | Yes |
| priority | string | priority | priority | Yes |
| sprint | number | sprint | sprint | Yes |
| timeEstimateHours | number | timeEstimateHours | time_estimate_hours | Yes |
| approved | boolean | approved | approved | Yes |
| roiNotes | string | roiNotes | roi_notes | Yes |
| ghlImplementation | string | ghlImplementation | ghl_implementation | Yes |
| moderatedAt | string | moderatedAt | moderated_at | No |
| moderatedBy | string | moderatedBy | moderated_by | No |

## 2. DiagnosticArtifact Envelope
Used during ingestion/rerun.

```json
{
  "sop01DiagnosticMarkdown": "string",
  "sop01AiLeverageMarkdown": "string",
  "sop01DiscoveryQuestionsMarkdown": "string",
  "sop01RoadmapSkeletonMarkdown": "string",
  "inventoryItems": "TicketInventoryItem[] (optional/normalized)"
}
```

## 3. ticketStats State Model
Computed summary for UI checklist.

- **NO_TICKETS_YET**: `total === 0`. Blocks roadmap. UI: "Diagnostic Generated — Findings Pending".
- **PENDING**: `pending > 0`. Blocks roadmap. UI: "Ticket Moderation Required (N pending)".
- **COMPLETE**: `pending === 0 && total > 0`. Enables roadmap assembly if `approved > 0`.
