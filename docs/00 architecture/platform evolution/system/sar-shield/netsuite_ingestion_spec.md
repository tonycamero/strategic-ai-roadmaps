# NetSuite Ingestion Specification
Location: system/sar-shield/netsuite_ingestion_spec.md

Purpose

This document defines how SAR Shield ingests operational data from NetSuite.


NetSuite Data Sources

purchase orders
inventory records
inventory adjustments
production orders
shipment records
vendor records


Ingestion Methods

NetSuite REST API
NetSuite Webhooks
Scheduled API polling
CSV exports


Typical Ingestion Pipeline

NetSuite API
↓
NetSuite Adapter
↓
Record Mapping
↓
Event Normalization
↓
Operational Event Store


Example NetSuite Record

{
  "recordType": "purchaseOrder",
  "id": "PO_20332",
  "status": "Pending Approval",
  "createdDate": "2026-03-07"
}


Normalized Event

{
  "event_type": "purchase.order.created",
  "entity_type": "purchase_order",
  "entity_id": "PO_20332",
  "timestamp": "2026-03-07T09:21:00Z"
}


Supported Event Types

purchase.order.created
purchase.order.updated
inventory.adjustment
inventory.received
shipment.created
shipment.delayed


Adapter Responsibilities

authentication
API polling
record extraction
field mapping
event normalization


Error Handling

If NetSuite API fails:

retry logic is triggered
failure is logged
ingestion resumes after recovery


Relationship to SAR Shield

NetSuite acts as a primary operational data source for the system.