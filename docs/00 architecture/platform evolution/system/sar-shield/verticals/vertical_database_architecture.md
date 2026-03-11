# SAR Shield Vertical Database Architecture
Location: system/sar-shield/verticals/vertical_database_architecture.md

Purpose

This document defines the modular vertical database architecture used by SAR Shield.

The StrategicAI platform separates core system data from operational telemetry data.

Operational telemetry varies widely between industries, therefore each vertical domain maintains its own operational database.


Architecture Overview

StrategicAI Core DB
+
Vertical Operational DBs


StrategicAI Core Database

Stores platform-level entities.

Examples

tenants
firms
diagnostics
roadmaps
users
signals
event registry

The core database intentionally does NOT store operational telemetry.


Vertical Databases

Each industry vertical receives a dedicated operational telemetry database.

Examples

brewery_ops_db
cannabis_ops_db
manufacturing_ops_db

These databases store raw operational data ingested from external systems.


Vertical Responsibilities

Vertical databases store

operational telemetry
inventory records
production records
schedule records
domain-specific entities


Event Layer Relationship

Operational telemetry is converted into canonical operational events.

Operational DB
↓
SAR Shield ingestion
↓
Event normalization
↓
Operational event layer
↓
Signal generation
↓
Trust Console


Benefits

Isolation

Industry schemas remain independent.

Extensibility

New industries can be added without changing the core system.

Performance

High-volume operational telemetry does not impact core system performance.

Security

Tenant and vertical data can be isolated at the database level.


Initial Vertical Deployments

The first verticals supported are:

brewery
cannabis