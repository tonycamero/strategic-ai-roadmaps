# Trust Console Event Taxonomy v1.0
### Operational Signal Layer for SAR Shield

This taxonomy defines the minimum operational signal language exposed from NetSuite through the SAR Shield Event Gateway into the Trust Console.

All operational intelligence for the pilot resolves into these event classes.

---

# Event Class 1 — Definition Integrity

These detect ambiguity entering the operational execution chain.

## 1. Definition Gate Failure

**Trigger**

An order enters the production pipeline without required attributes.

Examples

- Missing SKU attributes
- Incomplete specification fields
- Undefined production routing
- Missing lot or batch mapping

**NetSuite Signals**

SalesOrder
WorkOrder
ItemFulfillment

**Alert Recipients**

- Operations Manager
- Production Planner

**Trust Console Actions**

- Resolve Definition
- Pause Execution
- Return to Intake

---

## 2. Change Order Reset

Definition changes after production readiness.

Examples

- Quantity change
- Packaging change
- Routing change
- Specification change

This introduces execution instability.

**Alert Recipients**

- Operations
- Production
- Inventory

**Trust Console Actions**

- State Reset
- Re-validate readiness
- Notify affected operators

---

# Event Class 2 — Inventory Integrity

These detect supply distortion.

## 3. Inventory Variance

Stock mismatch between expected and actual inventory.

**Trigger**

Variance exceeds defined tolerance.

Examples

- Keg counts
- Packaging materials
- Ingredient inventory

**Alert Recipients**

- Inventory Manager
- Production Planner

**Trust Console Actions**

- Recount inventory
- Reconcile variance
- Adjust production schedule

---

## 4. Stockout Risk

Inventory forecast indicates shortage before next delivery.

**Signal Sources**

InventoryItem
PurchaseOrder
DemandForecast

**Alert Recipients**

- Purchasing
- Production

**Trust Console Actions**

- Expedite purchase order
- Adjust production plan

---

## 5. Overstock Risk

Inventory levels exceed consumption horizon.

**Impact**

- Capital lockup
- Spoilage risk
- Warehouse congestion

**Trust Console Actions**

- Reduce purchase orders
- Adjust production batch sizes

---

# Event Class 3 — Production Signal

These detect execution pressure.

## 6. Schedule Compression

Production window shrinks due to upstream delays.

Example

start_time – actual_ready_time < tolerance

**Alert Recipients**

- Production
- Operations

**Trust Console Actions**

- Rebalance schedule
- Reprioritize jobs

---

## 7. Production Block

Execution cannot begin.

Examples

- Missing material
- Equipment unavailable
- Operator unavailable
- Specification unresolved

**Trust Console Actions**

- Escalate block
- Resolve constraint
- Resume execution

---

## 8. Throughput Deviation

Actual production rate falls below expected rate.

Examples

- Line slowdown
- Quality rework
- Mechanical downtime

**Alert Recipients**

- Production Manager
- Operations

**Trust Console Actions**

- Investigate root cause
- Adjust downstream commitments

---

# Event Class 4 — Fulfillment Signal

These detect customer-facing delivery risk.

## 9. Fulfillment Risk

Order delivery timeline is in jeopardy.

**Trigger**

Projected completion exceeds promised ship date.

**Alert Recipients**

- Fulfillment
- Operations
- Customer Service

**Trust Console Actions**

- Expedite production
- Adjust logistics
- Notify customer

---

## 10. Same-Day Release Pressure

Orders arrive at shipping dock the same day as required departure.

**Trust Console Actions**

- Flag schedule compression
- Surface upstream definition failures

---

# Event Class 5 — Operator Signal

These capture human-driven operational intelligence.

## 11. Manual Override

Operator bypasses system logic.

Examples

- Manual inventory adjustment
- Manual routing change
- Emergency scheduling

These are critical operational signals.

**Trust Console Actions**

- Capture override reason
- Log event
- Surface pattern to SAR

---

## 12. Operator Exception Report

Operator manually reports an operational issue.

Examples

- Packaging defect
- Supplier delay
- Equipment degradation

**Input Surface**

Mobile form submission.

**Trust Console Actions**

- Create operational event
- Notify relevant roles
- Log signal for SAR analysis

---

# Signal Flow Architecture

NetSuite

↓

SAR Shield Event Gateway

↓

Event Normalization

↓

Trust Console

---

# Trust Console Views

Executives

- Operational signal health
- Exception summary
- Margin pressure indicators

Operations

- Active exceptions
- Resolution actions
- Mobile response controls

Inventory

- Stock variance alerts
- Supply risk alerts

---

# Pilot Event Set

The Ninkasi pilot should begin with the following core events:

1. Definition Gate Failure
2. Inventory Variance
3. Schedule Compression
4. Fulfillment Risk
5. Manual Override

These five signals will surface the majority of operational friction during the pilot.

---

# Strategic Role

This taxonomy becomes the universal operational language of StrategicAI.

ERP → SAR Shield → Operational Truth

Once the event layer exists, SAR can diagnose systemic operational friction across organizations.

