# Ninkasi Pilot System Map — One Page Architecture

Purpose: Provide a clear mental model of the Ninkasi Ops Event Layer Pilot so executives, operators, and engineers understand how the system works in a single view.

This architecture stabilizes operational signal flow without replacing NetSuite or existing systems.

---

# Core Concept

The pilot converts ERP operational events into structured exception coordination and intelligence.

ERP remains the **system of record**.

The pilot introduces:

• a coordination layer
• a response loop
• an intelligence layer

---

# System Layers

## 1. ERP System of Record

NetSuite

Responsibilities:

• inventory tracking
• SKU management
• warehouse location records
• operational transactions

NetSuite generates the **source operational events**.

---

## 2. Event Detection Layer

SuiteScript Webhooks

SuiteScript detects operational anomalies such as:

• inventory variance
• location mismatch
• repeated SKU discrepancies

These events are sent to the Event Gateway.

---

## 3. Event Gateway

Node / Express service

Responsibilities:

• receive webhook payloads
• validate event structure
• apply exception thresholds
• suppress duplicate alerts
• create exception tickets

This layer converts ERP noise into **actionable signals**.

---

## 4. Coordination Layer

GHL Exception Workflow

Pipeline stages:

Open
Acknowledged
Investigating
Resolved
Escalated

Each exception becomes a structured operational ticket.

SMS alerts notify responsible operators.

---

## 5. Human Response Loop

Operational staff respond through:

• SMS replies
• Tenant Portal interface

Response actions:

Acknowledge
Investigate
Resolve
Escalate

This creates the **operational response record**.

---

## 6. Trust Console Intelligence Layer

Trust Console aggregates ticket lifecycle data to produce operational intelligence.

Metrics calculated:

• Mean Time to Acknowledge
• Mean Time to Resolve
• Recurring SKU variance
• Location variance frequency
• Escalation rate

This layer converts operational behavior into measurable signals.

---

## 7. Executive Visualization

Inventory Integrity Radar

The radar presents the operational stability of the organization in a single screen.

Components:

Operational Integrity Score
Location Stability Grid
Recurring SKU Table
Resolution Velocity Metrics

Executives should understand operational status within **30 seconds**.

---

# Complete Pilot Flow

NetSuite (ERP System of Record)
↓
SuiteScript Event Detection
↓
Event Gateway (Node / Express)
↓
GHL Exception Workflow
↓
SMS / Portal Human Response
↓
Trust Console Aggregation
↓
Inventory Integrity Radar

---

# Strategic Outcome

The pilot demonstrates that operational events can become structured intelligence.

The system provides:

• faster operational response
• improved visibility
• pattern detection
• leadership confidence

This becomes the foundation for expanding the Operational Intelligence Layer.

---

End of Document

