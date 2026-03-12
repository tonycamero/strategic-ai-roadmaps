# Ninkasi — Ops Event Layer Pilot (NetSuite → GHL → SAR Trust Console) (v1.0)

## Intent

Leverage existing SAR downstream infrastructure to course-correct for Sales-heavy bias and deliver an Ops-dominant, event-driven solution for Ninkasi.

This pilot positions GHL as an internal automation substrate (event orchestration layer) sitting on top of NetSuite and key operational signals—without replacing NetSuite as source of truth.

Positioning language intentionally neutral (not finalized).

---

# Why This Pilot Exists

Observed realities from intake:
- NetSuite is core system of record but trust/visibility gaps exist
- Reporting and operational intelligence depend on manual stitching (VIP/IRI → Excel → Power BI)
- Ops is the champion and owns IT execution (Rissa + Hootie)
- SMS is a culturally viable coordination channel (warehouse/ops)

Operational thesis:
Event-driven coordination reduces fragility faster than “more dashboards.”

---

# Architecture Overview

## Source of Truth
NetSuite

## Event Router + Workflow Engine
GHL (internal orchestration substrate)

## Conversational Handling + Logging
GHL Agents (SMS/email interactive)

## Intelligence Layer
SAR (ingests GHL signals to inform Diagnostics + Trust Console)

---

# Core Pattern

NetSuite event occurs → webhook fires → GHL workflow routes/alerts → humans respond (SMS) → agent logs/labels outcome → SAR ingests event trail → Trust Console reasons on reality over time.

Key rule:
NetSuite remains authoritative for operational records.
GHL orchestrates actions and logs coordination.
SAR models intelligence and recommendations.

---

# NetSuite Webhook Constraints (Design Assumptions)

- Webhooks primarily via SuiteScript (User Event afterSubmit) and/or workflows
- Must respond quickly (target < 5 seconds)
- Retries exist (3 attempts total)

Design implication:
NetSuite should emit minimal payloads; heavy logic lives downstream.

---

# Pilot Scope (Start with ONE High-Signal Stream)

## Pilot Event Stream 1 — Inventory Variance Exception

### Trigger (NetSuite)
Inventory Adjustment record afterSubmit.
Only fire if variance exceeds threshold.

### Payload (Minimal)
- recordType
- recordId
- itemId / SKU
- location
- variance magnitude
- timestamp
- recordUrl
- correlationId

### GHL Workflow Actions
1. Create/Update an “Exception Ticket” record inside GHL (pipeline or custom object)
2. Tag routing fields:
   - exceptionType=inventoryVariance
   - severity=low|med|high
   - owner=role/user
3. Notify via SMS:
   - Primary Ops resolver
   - Secondary backup
4. Start SLA timer
5. Escalation:
   - if unresolved within X hours → escalate to Ops lead

### GHL Agent Interaction (Insertion #1)
Humans can reply to SMS:
- “ACK” to confirm ownership
- “RESOLVED” with brief reason code
- “NEEDS HELP” to escalate immediately

Agent duties:
- Parse responses
- Update ticket status
- Apply tags (reason codes)
- Trigger next workflows (escalation, follow-up, audit note)

### Resolution Recording
Pilot default:
- Resolution tracked in GHL ticket object
- NetSuite remains source of truth for inventory data

Optional later:
- Write-back a resolution note/status to NetSuite via API

---

# Success Metrics (60-Day Pilot)

Choose 2–3 to lock:
- MTTR (mean time to resolution) for inventory exceptions
- Reduction in repeated variance on same SKU/location
- Reduction in manual reconciliation / cross-check time
- Surveyed confidence in NetSuite inventory integrity

---

# SAR Integration (Insertion #2)

## Goal
SAR reads GHL coordination data to inform Trust Console and improve downstream outputs.

## Ingested GHL Signals
- Exception tickets (created/updated)
- Status transitions (open → acknowledged → resolved)
- SLA breach events
- Escalations
- Reason codes (tag taxonomy)
- Human interaction logs (agent-parsed)

## How SAR Uses It

### A) Diagnostic Engine Re-Weighting
For Ops-dominant orgs, elevate:
- Ops & Systems
- Data integrity/reporting flow
- Cross-department handoffs
- Exception management

### B) Discovery Call Notes as Override Layer
Use early exception history + top reason codes to target call:
- Confirm thresholds
- Confirm owners
- Identify chronic SKUs
- Identify broken handoffs

### C) Roadmap Assembly Recommendations
Generate org-model-appropriate recommendations:
- Exception routing architecture
- KPI dashboards (exception counts, SLA breaches)
- Governance rules for escalations
- Integration roadmap (NetSuite → GHL → SAR)

### D) Trust Console Agent Context Enrichment
Trust Console can:
- Reason on lived operational behavior (not just self-report)
- Detect alert fatigue and tune thresholds
- Recommend control layers (redundancy, escalation, ownership)
- Simulate cascades using real exception patterns

---

# Governance & Guardrails

- Advisory + configuration suggestion only (no auto-execution of NetSuite changes)
- Avoid dual-source-of-truth conflicts
- Limit alert frequency (anti-fatigue)
- Require explicit ownership acknowledgement for exceptions
- Maintain auditability of:
  - who acknowledged
  - who resolved
  - why
  - when

---

# Phase Plan (Using Existing Infra)

## Phase 0 — Roadmap Correction (Immediate)
- Re-order diagnostic emphasis to Ops-first for Ninkasi
- Use discovery call notes to validate constraints and fill gaps

## Phase 1 — Pilot Build
- Implement NetSuite webhook trigger for inventory variance
- Implement GHL workflow + ticket object
- Enable SMS agent parsing + tagging

## Phase 2 — SAR Read Path
- Build SAR ingestion of GHL tickets/events
- Feed into Trust Console as contextual data

## Phase 3 — Expand Event Streams (Only After Pilot Success)
Candidate streams:
- Production exception alerts
- Distributor sales variance alerts (IRI)
- Shipment/delivery exceptions

---

# Open Items to Resolve During Sprint (Not Now)

- Variance threshold definition + severity bands
- Escalation timing + owners
- Whether write-back to NetSuite is required
- Data latency expectations (Power BI vs real-time)
- GHL object model choice (pipeline vs custom object)
- Reason code taxonomy

---

# Neutral Positioning Options (Deferred Decision)

- Operational Automation Pilot
- Event-Driven Ops Layer Pilot
- Inventory Integrity & Exception Routing Pilot

Positioning intentionally not frozen in this doc.

