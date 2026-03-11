# Exception Ticket Schema & Data Contract (v1.0)

Purpose: Define the canonical data model used across the Ninkasi Ops Event Layer Pilot. This schema standardizes how operational exceptions move between NetSuite, the Event Gateway, GHL workflows, and the Trust Console intelligence layer.

The schema ensures every system speaks the **same operational language**.

---

# 1. Canonical Exception Object

Every operational anomaly is represented by a single structured object called an **Exception Ticket**.

Core fields:

exception_id
exception_type
sku
location
variance_amount
unit_of_measure
source_system
created_timestamp
assigned_role
assigned_owner
status
acknowledged_timestamp
resolved_timestamp
escalation_state
resolution_notes

---

# 2. Status State Machine

The Exception Ticket progresses through the following lifecycle states:

OPEN
ACKNOWLEDGED
INVESTIGATING
RESOLVED
ESCALATED

Transitions:

OPEN → ACKNOWLEDGED
ACKNOWLEDGED → INVESTIGATING
INVESTIGATING → RESOLVED
INVESTIGATING → ESCALATED
ESCALATED → RESOLVED

All transitions must be timestamped.

---

# 3. NetSuite Event Payload Contract

NetSuite SuiteScript sends an initial event payload to the Event Gateway.

Example payload:

{
  "event_type": "inventory_variance",
  "sku": "IPA-12PK",
  "location": "Warehouse B",
  "variance": -32,
  "unit": "cases",
  "timestamp": "2026-03-04T18:00:00Z",
  "source": "netsuite"
}

Required fields:

• event_type
• sku
• location
• variance
• timestamp

---

# 4. Event Gateway Transformation

The Event Gateway transforms the NetSuite payload into the canonical Exception Ticket format.

Gateway responsibilities:

• validate payload
• apply variance thresholds
• suppress duplicates
• generate exception_id
• assign ownership role

Example transformed object:

{
  "exception_id": "exc_49320",
  "exception_type": "inventory_variance",
  "sku": "IPA-12PK",
  "location": "Warehouse B",
  "variance_amount": -32,
  "unit_of_measure": "cases",
  "source_system": "netsuite",
  "created_timestamp": "2026-03-04T18:00:00Z",
  "assigned_role": "warehouse_supervisor",
  "assigned_owner": "Matt",
  "status": "OPEN"
}

---

# 5. GHL Workflow Mapping

The Exception Ticket must map directly into a GHL pipeline record.

Pipeline: Operational Exceptions

Field mapping:

exception_id → ticket_id
exception_type → category
sku → product_field
location → location_field
variance_amount → variance_field
status → pipeline_stage
assigned_owner → contact_owner

Lifecycle updates from SMS responses must update the canonical object.

---

# 6. SMS Response Mapping

SMS replies map to state transitions.

Response mapping:

1 → ACKNOWLEDGED
2 → INVESTIGATING
3 → RESOLVED
4 → ESCALATED

The system must capture:

• response timestamp
• responding user
• updated ticket status

---

# 7. Trust Console Aggregation Fields

The Trust Console reads exception lifecycle data and computes operational intelligence metrics.

Derived fields:

acknowledgment_delay = acknowledged_timestamp − created_timestamp
resolution_delay = resolved_timestamp − created_timestamp

Aggregated metrics:

Mean Time To Acknowledge (MTTA)
Mean Time To Resolve (MTTR)
Recurring SKU variance frequency
Location variance frequency
Escalation rate

---

# 8. Escalation State Tracking

Escalation states must be recorded explicitly.

Possible values:

NONE
LEVEL_1
LEVEL_2
LEVEL_3

Escalation event example:

{
  "exception_id": "exc_49320",
  "escalation_state": "LEVEL_1",
  "timestamp": "2026-03-04T19:00:00Z",
  "trigger": "unresolved_timeout"
}

---

# 9. Data Persistence Requirements

Exception Tickets must be stored in a persistent datastore used by the Trust Console.

Recommended table name:

exception_tickets

Required indexed fields:

exception_id
sku
location
status
created_timestamp

Indexes enable fast aggregation queries.

---

# 10. Audit Logging

All ticket state transitions must generate an audit record.

Example audit log entry:

{
  "exception_id": "exc_49320",
  "event": "STATUS_CHANGE",
  "previous_status": "OPEN",
  "new_status": "ACKNOWLEDGED",
  "actor": "Matt",
  "timestamp": "2026-03-04T18:07:00Z"
}

Audit logs support operational transparency and debugging.

---

# 11. System Data Flow

NetSuite
↓
SuiteScript Webhook
↓
Event Gateway
↓
Canonical Exception Ticket
↓
GHL Workflow
↓
SMS Response Loop
↓
Trust Console Aggregation

---

# Strategic Outcome

The Exception Ticket Schema becomes the **data backbone** of the Ops Event Layer.

Every operational anomaly flows through this structure, enabling:

• coordinated response
• lifecycle tracking
• pattern detection
• operational intelligence

This schema ensures consistency across all pilot components.

---

End of Document

