# Ingestion Service Specification
Location: engineering/ingestion_service_spec.md

Purpose

This document defines the architecture and responsibilities of the ingestion service.

The ingestion service acts as the gateway between external operational systems and the StrategicAI event layer.

Its primary role is to retrieve operational data from source systems and convert it into normalized operational events.


Responsibilities

The ingestion service is responsible for:

connecting to external systems
retrieving operational records
transforming records into canonical events
sending normalized events to the event store


Supported Data Sources

The ingestion service must support multiple types of upstream systems.

Examples include

ERP systems (NetSuite)
Excel spreadsheets
warehouse scanners
production management systems
manual operator inputs
custom APIs


Ingestion Architecture

External System
↓
Source Adapter
↓
Record Mapping
↓
Event Normalization
↓
Event Validation
↓
Event Store


Core Components

Source Adapters

Each external system requires an adapter.

Example adapters

netsuite_adapter
excel_schedule_adapter
api_adapter
manual_input_adapter

Adapters are responsible for retrieving records from the source system.


Mapping Layer

Maps source fields to canonical event fields.

Example

netsuite.createdDate → timestamp
netsuite.recordId → entity_id


Transformation Layer

Transforms raw values into standardized formats.

Examples

timestamp normalization
unit conversion
identifier normalization


Event Builder

Constructs the operational event envelope.

Example output

{
  "event_id": "uuid",
  "event_type": "purchase.order.created",
  "source_system": "netsuite",
  "entity_type": "purchase_order",
  "entity_id": "PO_20332",
  "timestamp": "2026-03-07T09:21:00Z"
}


Validation Layer

Ensures events conform to the operational event schema.

Validation checks include

required fields present
valid timestamp format
valid event type
payload integrity


Event Dispatch

Validated events are written to the event store.

Possible destinations

PostgreSQL event table
event stream system
message queue


Ingestion Modes

The ingestion service supports multiple ingestion modes.


API Polling

The service periodically polls external APIs.

Example

NetSuite REST API


Webhook Ingestion

External systems push events directly to the ingestion service.


File-Based Ingestion

The service monitors file locations for new files.

Example

Excel schedules uploaded to a directory.


Manual Entry

Operators may submit events through manual interfaces.


Error Handling

Failures during ingestion must not halt the system.

Errors are logged and problematic records are skipped.


Example failure log

{
  "error_type": "ingestion_error",
  "source_system": "netsuite",
  "record_id": "PO_20332",
  "reason": "API timeout"
}


Retry Strategy

Transient errors trigger retries.

Examples

network failure
API rate limits


Observability

The ingestion service must provide operational metrics including

records processed
events emitted
errors encountered
ingestion latency


Relationship to SAR Shield

The ingestion service is a core component of SAR Shield.

Operational Systems
↓
Ingestion Service
↓
Event Normalization
↓
Operational Event Store
↓
Intelligence Engines


Security Considerations

The ingestion service must securely store and manage credentials for external systems.

Sensitive credentials must never be stored in source code.


Role in the Platform

The ingestion service is the primary entry point for operational data.

Without ingestion, the platform receives no signals and cannot generate intelligence.