# Operational Event Schema
Location: system/event-layer/operational_event_schema.md

Purpose

This document defines the canonical event structure used by the StrategicAI platform.

All operational signals entering the system must conform to this schema.

The goal of the event schema is to create a normalized language of operational activity across heterogeneous business systems.

Examples of upstream systems include:

ERP systems (NetSuite)
production systems
scheduling tools
warehouse systems
spreadsheets
APIs
manual inputs

All of these must be transformed into Operational Events.


Core Principle

Every meaningful operational activity can be represented as an event.

An event represents a state change in a real-world process.

Examples include:

inventory quantity changed
production batch started
purchase order created
shipment delayed
schedule changed
work order completed

These events become the raw signals used to derive operational intelligence.


Event Envelope Structure

{
  "event_id": "uuid",
  "event_type": "string",
  "event_version": "1.0",
  "source_system": "string",
  "entity_type": "string",
  "entity_id": "string",
  "timestamp": "ISO8601",
  "ingestion_timestamp": "ISO8601",
  "actor": "string",
  "location": "string",
  "payload": {},
  "metadata": {}
}


Field Definitions


event_id

Unique identifier for the event.

Must be globally unique.

Format:

UUIDv4

Purpose:

Ensures event deduplication and traceability.


event_type

Defines the type of operational event.

Examples:

inventory.adjustment
production.batch.started
production.batch.completed
purchase.order.created
shipment.delayed
schedule.updated
exception.triggered

Event types follow the pattern:

domain.action

Examples:

inventory.adjusted
production.batch_started
order.created


event_version

Schema version of the event.

Example:

1.0

Allows schema evolution over time.


source_system

System where the event originated.

Examples:

netsuite
brewery_schedule_excel
warehouse_system
manual_input
api_ingestion


entity_type

Defines the primary entity affected by the event.

Examples:

inventory_item
production_batch
purchase_order
shipment
schedule
work_order


entity_id

Unique identifier for the affected entity.

Examples:

item_20391
batch_992
po_14032
shipment_332


timestamp

Time when the event occurred in the source system.

Format:

ISO8601 UTC

Example:

2026-03-07T15:21:34Z


ingestion_timestamp

Time when the event entered SAR Shield.

This allows detection of:

delayed events
ingestion lag
missing events


actor

Actor responsible for the event.

Examples:

system
employee_id
scheduler
api_user


location

Physical or logical location.

Examples:

brewery.production.floor
warehouse.zone_a
distribution.center


payload

Domain-specific data for the event.

Example:

{
  "item_id": "hops_203",
  "quantity_before": 1200,
  "quantity_after": 900,
  "reason": "production_consumption"
}

Payloads vary depending on event type.


metadata

Optional metadata.

Examples:

{
  "source_file": "brew_schedule.xlsx",
  "import_batch_id": "import_20392",
  "confidence_score": 0.98
}


Event Categories


Inventory Events

inventory.adjusted
inventory.received
inventory.consumed
inventory.transfer
inventory.counted


Production Events

production.batch_started
production.batch_completed
production.batch_delayed
production.recipe_changed


Order Events

order.created
order.updated
order.cancelled
order.fulfilled


Schedule Events

schedule.created
schedule.updated
schedule.cancelled
schedule.delayed


Exception Events

exception.inventory_divergence
exception.production_delay
exception.schedule_conflict
exception.supply_shortage


Compliance Events

brew.batch_started
brew.batch_transferred
brew.packaging_run

cannabis.batch_planted
cannabis.harvest_completed
cannabis.processing_run
cannabis.wholesale_transfer

inventory.reconciliation
compliance.chain_of_custody
compliance.regulatory_report


Event Lifecycle

source system
↓
SAR Shield ingestion
↓
event normalization
↓
event validation
↓
event storage
↓
signal derivation
↓
Trust Console visualization


Design Principles

System-Agnostic

Events must not depend on any specific ERP or system.


Immutable

Events are append-only records.

They must never be modified after creation.


Time-Oriented

The system must preserve the chronological sequence of events.

Operational intelligence emerges from event timelines.


Extensible

Payloads can evolve without breaking the event envelope.


Role in the Platform

The Operational Event Schema is the foundation of the StrategicAI platform.

All higher-level components depend on this layer.

Operational Systems
↓
SAR Shield
↓
Operational Event Schema
↓
Signal Derivation
↓
Trust Console