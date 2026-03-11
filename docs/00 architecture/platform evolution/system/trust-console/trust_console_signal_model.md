# Trust Console Signal Model
Location: system/trust-console/trust_console_signal_model.md


Purpose

This document defines the signal model used by the Trust Console.

Signals are the interface between operational intelligence and human decision makers.

Operational events represent raw activity.  
Signals represent interpreted meaning.

The Trust Console does not display raw events.  
It displays signals derived from event analysis.


Conceptual Flow

Operational Systems
↓
Event Ingestion
↓
Operational Events
↓
SAR Shield Processing
↓
Signals
↓
Trust Console


Signal Definition

A signal represents an operational insight derived from one or more events.

Signals may represent:

alerts
metrics
warnings
state transitions
operational summaries


Signal Envelope Structure

{
  "signal_id": "uuid",
  "signal_type": "string",
  "signal_version": "1.0",
  "entity_type": "string",
  "entity_id": "string",
  "timestamp": "ISO8601",
  "severity": "string",
  "confidence": "float",
  "source_events": [],
  "payload": {},
  "metadata": {}
}


Field Definitions


signal_id

Unique identifier for the signal.

Must be globally unique.

Format:

UUIDv4


signal_type

Defines the meaning of the signal.

Examples:

inventory.warning
inventory.divergence
production.delay
schedule.conflict
shipment.risk
system.anomaly


signal_version

Schema version of the signal.

Example:

1.0


entity_type

Primary entity referenced by the signal.

Examples:

inventory_item
production_batch
purchase_order
shipment
schedule


entity_id

Unique identifier of the entity affected.


timestamp

Time when the signal was generated.


severity

Indicates signal importance.

Possible values:

info
warning
critical


confidence

Represents the confidence level of the signal.

Range:

0.0 – 1.0

Example:

0.92


source_events

List of operational events used to derive the signal.

Example:

[
  "event_88213",
  "event_88217"
]


payload

Signal-specific data.

Example:

{
  "expected_inventory": 1200,
  "actual_inventory": 900,
  "variance": -300
}


metadata

Additional contextual information.

Examples:

{
  "calculation_window": "24h",
  "algorithm_version": "1.2"
}


Signal Categories


Alert Signals

Immediate operational issues.

Examples:

inventory.divergence
production.delay
schedule.conflict


Metric Signals

Aggregated operational indicators.

Examples:

inventory.turnover_rate
production_throughput
schedule_adherence


Risk Signals

Forward-looking operational risk detection.

Examples:

inventory.shortage_risk
production.capacity_risk


State Signals

Represent operational state changes.

Examples:

batch.started
batch.completed
shipment.in_transit
shipment.delivered


Signal Lifecycle

Signals move through a lifecycle.

generated
↓
evaluated
↓
displayed
↓
acknowledged
↓
resolved


Example Lifecycle

inventory divergence detected
↓
signal generated
↓
operator alerted
↓
investigation initiated
↓
issue resolved


Signal Aggregation

Signals may be aggregated to produce higher-level insights.

Example:

multiple production delays
↓
production efficiency degradation signal


Trust Console Views

Signals populate several Trust Console views.

Operational Alert Feed

Real-time alerts requiring attention.


Operational Dashboard

Aggregated metrics and performance indicators.


Entity Inspection View

Detailed signals associated with a specific entity.


Exception Center

High-severity operational anomalies.


Signal Prioritization

Signals are prioritized based on:

severity
confidence
operational impact


Example Priority Calculation

priority_score =
severity_weight
× confidence
× operational_impact


Relationship to Divergence Engine

The Divergence Engine is the primary generator of exception signals.

Example:

expected inventory = 1200
actual inventory = 900

Resulting signal:

inventory.divergence


Relationship to Metrics Engine

The Metrics Engine produces metric signals.

Example:

schedule adherence = 93%

Signal:

schedule_adherence.metric


Design Principles


Human-Readable

Signals must translate complex operational data into clear insights.


Actionable

Every signal should guide a decision or investigation.


Traceable

Signals must always reference the events that generated them.


Composable

Signals may combine multiple event streams.


Role in the Platform

Signals are the bridge between machine intelligence and human operators.

Without signals, operators would need to manually interpret raw events.

The Trust Console exists to surface signals in a way that enables rapid operational decision making.