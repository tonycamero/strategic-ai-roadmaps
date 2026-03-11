# Event Normalization Specification
Location: system/event-layer/event_normalization_spec.md


Purpose

This document defines how raw operational data is transformed into canonical Operational Events.

Normalization ensures that heterogeneous source systems produce consistent event structures.

This allows the StrategicAI platform to operate across different industries and technology stacks.


The Normalization Problem

Operational data originates from many inconsistent sources.

Examples:

ERP systems
Excel schedules
Warehouse scanners
APIs
manual data entry
legacy databases

Each system uses:

different field names
different timestamp formats
different identifiers
different data models

Normalization converts this data into a common event language.


Normalization Pipeline

Source Data
↓
Ingestion
↓
Mapping
↓
Transformation
↓
Validation
↓
Operational Event


Stage 1 — Ingestion

Raw data is captured from upstream systems.

Examples:

NetSuite API
Excel schedule files
warehouse scanner feeds
manual operator inputs

Raw ingestion produces Source Records.

Example:

{
  "netsuite_record_id": "PO_20332",
  "status": "Pending Approval",
  "created_at": "03/07/2026 9:21 AM",
  "item": "Cascade Hops",
  "qty": 120
}

This format is not usable by the platform.


Stage 2 — Mapping

Field names are mapped to canonical field names.

Example mapping:

netsuite_record_id → entity_id
created_at → timestamp
item → payload.item_id
qty → payload.quantity

Mapping tables are defined per source system.


Stage 3 — Transformation

Data types are converted to standardized formats.

Examples:

timestamps → ISO8601
IDs → normalized string identifiers
units → standardized units

Example transformation:

03/07/2026 9:21 AM

becomes

2026-03-07T09:21:00Z


Stage 4 — Event Construction

The normalized fields are assembled into the event envelope.

Example output:

{
  "event_id": "b9f1c1c2-8c31-4c22-bc8e-9829a7c32c11",
  "event_type": "purchase.order.created",
  "event_version": "1.0",
  "source_system": "netsuite",
  "entity_type": "purchase_order",
  "entity_id": "PO_20332",
  "timestamp": "2026-03-07T09:21:00Z",
  "ingestion_timestamp": "2026-03-07T09:21:05Z",
  "actor": "system",
  "location": "brewery.procurement",
  "payload": {
    "item_id": "cascade_hops",
    "quantity": 120
  },
  "metadata": {}
}


Stage 5 — Validation

The event is validated against the schema.

Validation checks include:

event_id present
event_type valid
timestamp valid
entity_id present
payload valid JSON

Invalid events are rejected and logged.


Idempotency

Normalization must prevent duplicate events.

This is handled by checking:

event_id
source_record_id
timestamp

Duplicate events are ignored.


Source System Adapters

Each ingestion source requires an adapter.

Example adapters:

netsuite_adapter
excel_schedule_adapter
warehouse_scanner_adapter
manual_event_adapter

Adapters are responsible for:

field mapping
data extraction
normalization rules


Versioning

Normalization rules are versioned.

Example:

normalization_version: 1.0

This ensures that historical events remain interpretable.


Error Handling

Normalization failures must be recorded.

Example failure log:

{
  "error_type": "normalization_failure",
  "source_system": "netsuite",
  "record_id": "PO_20332",
  "reason": "invalid timestamp format"
}


Relationship to SAR Shield

Normalization is performed inside SAR Shield ingestion services.

Operational Systems
↓
SAR Shield Ingestion
↓
Event Normalization
↓
Operational Event Store
↓
Signal Engine
↓
Trust Console


Design Principles

Deterministic

The same source record must always produce the same event.


Traceable

Every normalized event must retain reference to the original source.


Extensible

New source systems can be integrated without changing the core event schema.


Role in the Platform

Normalization is the bridge between messy operational systems and structured intelligence.

Without normalization the StrategicAI platform cannot:

correlate signals
detect operational divergence
derive intelligence
power the Trust Console