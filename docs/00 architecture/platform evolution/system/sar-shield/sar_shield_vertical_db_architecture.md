# SAR Shield Vertical Database Architecture
Location: system/sar-shield/sar_shield_vertical_db_architecture.md

Purpose

This document defines the database architecture used by SAR Shield.

SAR Shield does not use a single monolithic database. Instead it uses a modular vertical database model designed to support multiple industries.

The architecture separates the StrategicAI core system from operational telemetry databases used for each vertical domain.

This design allows the platform to scale across industries without contaminating the core system schema.


Core Architecture

StrategicAI Core DB
+
Vertical Operational DBs


StrategicAI Core Database

The StrategicAI core database stores system-level data and is intentionally kept pure.

Examples of core entities:

firms
diagnostics
strategic roadmaps
users
tenants
trust console signals
event registry

The core database does not store operational telemetry from production systems.

Operational telemetry is stored in vertical databases.


Vertical Operational Databases

Each operational domain receives its own database schema.

Examples:

brewery_ops_db
print_manufacturing_ops_db
distribution_ops_db
logistics_ops_db

Each vertical database contains operational tables specific to that industry.


Example Brewery Database

Tables may include:

inventory_items
inventory_movements
production_batches
brew_schedule
tank_status
ingredient_consumption
purchase_orders
shipments


Example Print Manufacturing Database

Tables may include:

print_jobs
job_schedule
paper_inventory
press_status
production_runs
job_delays


Vertical Database Responsibilities

Vertical databases are responsible for:

storing operational telemetry
maintaining high-frequency operational data
supporting ingestion pipelines
supporting divergence detection
supporting metrics generation


Event Layer Integration

Vertical databases feed the Event Layer through SAR Shield ingestion pipelines.

Operational DB
↓
Ingestion Adapter
↓
Event Normalization
↓
Operational Event Schema
↓
Signal Engine


Benefits of Vertical Database Architecture

Isolation

Industry schemas remain isolated.


Scalability

New industries can be added without affecting existing deployments.


Security

Operational data remains segregated per tenant.


Performance

Operational queries do not compete with core system queries.


Relationship to SAR Shield

SAR Shield acts as the bridge between vertical operational databases and the StrategicAI intelligence layer.


Operational Systems
↓
Vertical Operational DB
↓
SAR Shield Ingestion
↓
Operational Event Layer
↓
Trust Console


Future Evolution

Vertical databases may evolve into dedicated telemetry clusters capable of supporting:

high-frequency event ingestion
real-time streaming analytics
predictive operational modeling