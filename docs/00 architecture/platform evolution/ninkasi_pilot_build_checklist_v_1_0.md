# Ninkasi Ops Event Layer Pilot — Build Checklist (v1.0)

Purpose: Translate the pilot architecture documents into concrete engineering tasks that can be executed by AG and supporting developers. The checklist follows the operational flow from ERP signal detection through Trust Console intelligence visualization.

---

# 1. Exception Event Schema

Create canonical exception object stored in the Trust Console datastore.

Fields:

exception_id  
exception_type  
sku  
location  
variance_amount  
timestamp_created  
assigned_role  
assigned_owner  
status  
timestamp_acknowledged  
timestamp_resolved  
escalation_state  
resolution_notes

Allowed Status Values:

OPEN  
ACKNOWLEDGED  
INVESTIGATING  
RESOLVED  
ESCALATED

---

# 2. NetSuite Exception Detection

Implement SuiteScript triggers for pilot event types.

Initial triggers:

• Inventory variance above configured threshold  
• Location mismatch  
• Unresolved variance exceeding time threshold  
• Recurring SKU variance

Example webhook payload:

{
  "event_type": "inventory_variance",
  "sku": "IPA-12PK",
  "location": "Warehouse B",
  "variance": -32,
  "timestamp": "2026-03-04T18:00:00Z"
}

Webhook destination:

Event Gateway API endpoint

---

# 3. Event Gateway (Node / Express)

Responsibilities:

• Receive NetSuite webhook events  
• Validate event payload  
• Apply exception thresholds  
• Suppress duplicate events  
• Create GHL ticket  
• Store event in Trust Console datastore

Filtering Logic:

If variance < threshold → ignore  
If duplicate event → suppress  
If valid exception → create ticket

---

# 4. GHL Exception Workflow

Create pipeline:

Operational Exceptions

Pipeline Stages:

Open  
Acknowledged  
Investigating  
Resolved  
Escalated

Map webhook fields into GHL ticket properties.

---

# 5. SMS Notification Loop

When ticket is created:

Send SMS to assigned owner.

Message template:

Inventory variance detected

SKU: {sku}
Location: {location}
Variance: {variance}

Reply:
1 Acknowledge
2 Investigating
3 Resolved
4 Escalate

SMS responses must update ticket status automatically.

---

# 6. Tenant Portal — Exception Command Center

Create minimal operational interface.

View:

Active Exceptions Table

Columns:

SKU  
Location  
Status  
Owner  
Created Time

Row click → detail panel.

Actions:

Acknowledge  
Investigating  
Resolve  
Escalate  
Add Notes

Design constraints:

• Mobile friendly  
• Fast load  
• Minimal interface friction

---

# 7. Trust Console Aggregation Service

Compute operational intelligence metrics from exception lifecycle data.

Metrics:

Mean Time To Acknowledge (MTTA)  
Mean Time To Resolve (MTTR)  
Recurring SKU variance count  
Location exception frequency  
Escalation rate

Aggregation windows:

7 days  
30 days  
90 days

---

# 8. Inventory Integrity Radar

Trust Console visualization layout.

Top:

Operational Integrity Score

Middle:

Location Stability Grid

Bottom Left:

Recurring SKU Variance Table

Bottom Right:

Resolution Velocity Metrics

Target requirement:

Executives must understand operational status within 30 seconds.

---

# 9. Escalation Rules

Default escalation ladder:

T+0 minutes → SMS alert to owner  
T+15 minutes → reminder to owner  
T+60 minutes → escalate to supervisor  
T+24 hours → escalate to operations director

All escalations logged in exception record.

---

# 10. Pilot Configuration Session

During onboarding with Ninkasi define:

Variance thresholds  
Exception types monitored  
Ownership mapping  
Escalation contacts  
Locations monitored  
SKU categories monitored

This configuration prevents alert fatigue and ownership ambiguity.

---

# 11. Pilot Success Metrics

Track outcomes during pilot period.

Metrics:

Reduction in Mean Time To Acknowledge  
Reduction in Mean Time To Resolve  
Decrease in recurring SKU variance  
Improved operational visibility for leadership

These metrics justify Phase 2 expansion and roadmap contract.

---

# Pilot System Flow

NetSuite  
↓  
SuiteScript Webhook  
↓  
Event Gateway (Node / Express)  
↓  
GHL Exception Workflow  
↓  
SMS Human Response Loop  
↓  
Trust Console Aggregation  
↓  
Inventory Integrity Radar

---

End of Document

