# Inventory Reconciliation Model

The Inventory Reconciliation Model determines the trusted inventory state by
reconciling multiple operational sources.

Sources often disagree due to operational drift, delayed updates, or manual
processes.

The reconciliation model resolves these conflicts.

---

## Input Sources

warehouse_counts

Physical counts of inventory within warehouse systems.

---

erp_inventory_records

Inventory records stored in ERP systems such as NetSuite.

---

production_transfer_logs

Transfers between production stages.

Examples:

tank transfers  
packaging runs  
repack operations  

---

supply_chain_updates

Incoming materials or finished goods movements.

---

## Reconciliation Algorithm

1. Normalize units
2. Merge signal sources
3. Identify mismatches
4. Determine trusted state
5. Emit reconciliation result

---

## Reconciliation Result

trusted_inventory_signal

Fields:

sku
location
trusted_quantity
confidence_score
reconciliation_sources
timestamp

---

## Divergence Detection

A divergence occurs when:

warehouse_quantity ≠ erp_quantity  
production transfers do not balance  
supply inputs do not match expected inventory  

When divergence occurs:

divergence_event is emitted.

---

## Output Signals

trusted_inventory_signal  
inventory_divergence_event