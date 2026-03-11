# Ninkasi Pilot Deployment Specification
Location: pilots/Ninkasi/ninkasi_pilot_deployment_spec.md


Purpose

This document defines the deployment architecture and operational scope for the Ninkasi pilot.

The purpose of the pilot is to demonstrate the StrategicAI operational intelligence system in a real production environment by capturing operational signals, detecting divergence, and delivering actionable insights through the Trust Console.

The Ninkasi pilot serves as the first real-world implementation of the platform.


Pilot Objectives

The pilot focuses on three primary goals.

1. Demonstrate real-time operational signal capture.
2. Detect operational divergence across production and inventory systems.
3. Provide clear operational intelligence through the Trust Console.


Operational Context

Ninkasi Brewing operates a production and distribution environment involving:

raw ingredient inventory
production scheduling
batch production
inventory consumption
finished goods inventory
shipments and distribution

These operations generate continuous operational activity that can be captured as events.


Pilot System Architecture

Operational Systems
↓
Data Sources
↓
SAR Shield Ingestion
↓
Operational Event Layer
↓
Divergence Engine
↓
Metrics Engine
↓
Signal Engine
↓
Trust Console


Pilot Data Sources

The Ninkasi pilot will ingest operational data from the following sources.

NetSuite ERP

purchase orders
inventory adjustments
shipment records
vendor records

Production Scheduling

brew schedule spreadsheets
production planning files

Manual Operational Inputs

operator-reported incidents
production delays
schedule adjustments


Ingestion Pipelines

Three ingestion pipelines will be active during the pilot.


NetSuite Ingestion Pipeline

NetSuite API
↓
NetSuite Adapter
↓
Event Normalization
↓
Operational Event Store


Excel Schedule Pipeline

Excel schedule files
↓
Excel Adapter
↓
Row Mapping
↓
Event Normalization
↓
Operational Event Store


Manual Event Pipeline

Operator input interface
↓
Manual Event Adapter
↓
Event Normalization
↓
Operational Event Store


Operational Entities Modeled

The pilot will model several operational entities.

production_batch
inventory_item
purchase_order
shipment
production_schedule


Example Events Generated

production.batch.scheduled
production.batch.started
production.batch.completed
inventory.adjusted
purchase.order.created
shipment.created


Divergence Detection

The divergence engine will monitor operational state for anomalies.

Example divergences include:

inventory discrepancies
production schedule delays
missing or delayed shipments
unexpected inventory consumption


Example Divergence

Expected inventory: 1200 kg hops  
Actual inventory: 900 kg hops  

Generated signal:

exception.inventory_divergence


Operational Metrics

The metrics engine will calculate operational performance indicators including:

production throughput
schedule adherence
inventory turnover
order fulfillment time


Example Metric

schedule_adherence

Definition:

percentage of production batches that begin within their scheduled window.


Signal Generation

Signals derived from divergence detection and metric calculations will be sent to the Trust Console.

Signal types include:

inventory divergence
production delay
schedule conflict
inventory shortage risk


Trust Console Views

The Trust Console will present pilot signals through several views.

Operational Alert Feed

real-time operational alerts


Operational Dashboard

aggregated performance metrics


Entity Inspection View

detailed operational history for specific entities


Exception Center

high-priority operational anomalies


Deployment Topology

The pilot system will run as a modular service stack.

Services

ingestion-service
event-store
divergence-engine
metrics-engine
signal-engine
trust-console


Infrastructure

The pilot may run on a cloud environment using:

containerized services
managed database services
secure API integrations


Security

Access to operational data must be restricted.

Controls include:

API authentication
role-based access control
secure credential storage


Monitoring

The pilot must monitor system health and ingestion performance.

Metrics tracked include:

events ingested
signals generated
ingestion latency
system uptime


Success Criteria

The pilot will be considered successful if it demonstrates the following capabilities.

Operational data can be ingested reliably.

Operational events are generated consistently.

Divergence detection produces meaningful signals.

Trust Console displays actionable intelligence.


Pilot Outcomes

If successful, the pilot will validate the StrategicAI architecture and support expansion into additional operational environments including:

manufacturing
print production
distribution logistics
supply chain operations


Role in the Platform

The Ninkasi pilot represents the first production validation of the StrategicAI operational intelligence architecture.

It serves as a proving ground for:

SAR Shield
Operational Event Layer
Divergence Engine
Trust Console