# Inventory Integrity Radar

## Purpose

The **Inventory Integrity Radar** is the first executive-grade visualization for the Trust Console within the Ninkasi Ops Event Layer Pilot. Its role is to convert raw operational exception events into a **clear operational stability signal** that leadership can understand in under 30 seconds.

The radar does not replace ERP reporting or BI tools. Instead it provides a **behavioral signal layer** that reveals patterns in operational variance and response performance.

This screen should make invisible operational friction immediately visible.

---

# Core Outcome

Enable leadership and operations to instantly answer:

• Where operational drift is occurring
• Which SKUs repeatedly trigger inventory exceptions
• How quickly the team resolves operational issues
• Whether escalation thresholds are being breached

The radar converts exception events into a **stability index for the operation.**

---

# Data Inputs

All signals originate from the **Ops Event Layer** driven by NetSuite events and coordinated through GHL workflow tickets.

Each exception event should capture:

- SKU
- Location / Line
- Timestamp created
- Timestamp acknowledged
- Timestamp resolved
- Owner
- Escalation state
- Resolution notes

Derived fields:

- MTTR (Mean Time To Resolution)
- Escalation occurrence
- SKU recurrence count

---

# Radar Components

## 1. Location Stability Grid

Displays exception activity by operational location.

Example:

Location | Exceptions | Avg MTTR | Escalations
--- | --- | --- | ---
Warehouse A | 3 | 45m | 0
Warehouse B | 11 | 2h | 3
Packaging Line 2 | 7 | 1h15m | 1
Cold Storage | 2 | 20m | 0

Visual risk indicators:

• Green – Stable
• Yellow – Moderate drift
• Red – High variance

Thresholds should be configurable in Trust Console settings.

---

## 2. Recurring SKU Detection

Identifies SKUs that repeatedly trigger variance events.

Example:

Top Recurring Variance SKUs (30 days)

IPA-12PK – 5 incidents
Pilsner-Keg – 4 incidents
Seasonal-Case – 3 incidents

Purpose:

Reveal systemic operational issues such as:

• packaging inconsistencies
• barcode mismatches
• counting method errors
• supplier packaging differences

---

## 3. Resolution Velocity

Measures the operational response capability of the organization.

Metrics:

- Average MTTR
- Fastest resolution
- Slowest resolution
- Escalation percentage

Example summary:

Average MTTR: 54 minutes
Escalations this month: 3
Fastest resolution: 9 minutes
Slowest resolution: 5h 12m

---

## 4. Operational Integrity Score

A simple executive signal summarizing operational stability.

Example:

Inventory Integrity Score

Locations stable: 3
Locations drifting: 1
Recurring SKUs: 2
Average MTTR: 54 minutes
Escalations this month: 3

This score becomes the **monthly operational confidence indicator.**

---

# Visual Design Principles

The radar must follow Trust Console design philosophy:

• Calm, minimal UI
• Immediate signal recognition
• No dashboard clutter
• Executives understand status in < 30 seconds

Preferred layout:

Top: Integrity Score
Middle: Location Stability Grid
Bottom Left: Recurring SKU Table
Bottom Right: Resolution Velocity

---

# Data Aggregation Window

Default: 30 days

Alternative selectable ranges:

• 7 days
• 30 days
• 90 days

Rolling window aggregation is preferred.

---

# Implementation Notes

The radar requires **no new infrastructure**.

Data sources already exist within the pilot:

NetSuite → Event detection
GHL → Ticket lifecycle
Trust Console → Aggregation and visualization

Trust Console only needs to:

• ingest ticket lifecycle data
• compute MTTR
• count SKU and location occurrences
• compute escalation frequency

No AI processing required.

---

# Strategic Value

The radar demonstrates immediate platform value by proving:

• operational signals can be captured
• response behavior can be measured
• systemic issues can be surfaced

This visualization becomes the **proof artifact** for expanding into additional operational intelligence modules.

---

# Future Extensions

Once validated, the radar pattern can be extended to other operational domains:

Production Stability Radar
Supply Chain Delay Radar
Distributor Variance Radar
Staff Reliability Radar

Each radar follows the same pattern:

ERP Event → Exception Workflow → Human Response → Pattern Visualization

---

# Success Criteria for Pilot

The Inventory Integrity Radar is considered successful if it enables Ninkasi leadership to quickly identify:

• operational drift locations
• recurring SKU variance
• slow response patterns
• escalation risk

within a single Trust Console screen.

If leadership can understand operational stability in under 30 seconds, the radar is successful.

