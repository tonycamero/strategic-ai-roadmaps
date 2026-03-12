# Control Spine Service

The Control Spine is the deterministic operational state engine of StrategicAI.

It reconciles operational signals from multiple systems and produces a shared
execution state that downstream systems can trust.

The Control Spine is responsible for transforming fragmented operational inputs
into a single authoritative operational truth.

---

## Responsibilities

1. Normalize operational units
2. Reconcile inventory signals
3. Resolve production transfers
4. Detect operational divergence
5. Emit trusted operational signals

---

## Inputs

Signals originate from the event layer.

Sources:

- NetSuite ERP events
- warehouse inventory counts
- production transfer records
- supply chain updates
- schedule ingestion (Excel / SharePoint)

Signal types:

warehouse_inventory_signal
production_transfer_signal
erp_inventory_signal
supply_chain_signal
schedule_signal

---

## Core Operations

normalizeOperationalUnits()

Converts all incoming operational measurements into canonical units.

Example conversions:

BBL → gallons  
cases → bottles  
kg → pounds  

---

reconcileInventory()

Compares warehouse counts, ERP records, and production transfers.

Output:

trusted_inventory_signal

---

resolveProductionTransfers()

Ensures production movement events match inventory and schedule states.

---

detectOperationalDivergence()

Identifies mismatches between:

ERP inventory  
warehouse counts  
production logs  
schedule expectations  

Produces:

divergence_event

---

emitTrustedSignals()

Outputs the authoritative operational state.

Signals produced:

trusted_inventory_signal  
authoritative_production_schedule  
supply_chain_alignment_signal  
exception_signal

---

## Future Service Implementation

Planned runtime location:

backend/services/controlSpine/

Functions:

normalizeOperationalUnits(signal)

reconcileInventory(signalSet)

resolveProductionTransfers(signalSet)

detectOperationalDivergence(signalSet)

emitTrustedInventorySignal()

emitAuthoritativeSchedule()