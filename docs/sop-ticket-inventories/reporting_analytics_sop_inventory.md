# Reporting & Analytics SOP Inventory (Ops-Style Format)

Below are the **Reporting & Analytics SOPs**, formatted exactly in the OPS-style structure used throughout the sprint.

---

### **SOP 1 — Standard Marketing Attribution Dashboard**
```
{
  "inventoryId": "REP-001",
  "titleTemplate": "Build a Unified Marketing Attribution Dashboard",
  "category": "Reporting & Analytics",
  "valueCategory": "Performance Tracking",
  "ghlComponents": ["Reporting", "Custom Fields", "Tags", "Workflows"],
  "ghlTriggers": ["Form Submitted", "Tag Added"],
  "ghlActions": ["Update Field", "Create Task"],
  "ghlLimitations": ["Reporting is not fully customizable; relies on default widgets"],
  "description": "Creates a unified attribution dashboard in GHL that consolidates lead source data, campaign performance, and conversion metrics using tags and custom fields triggered during lead intake workflows.",
  "verticalTags": ["Agency", "E-commerce", "Coaching"],
  "implementationStatus": "production-ready"
}
```
---

### **SOP 2 — Lead Source & UTM Tracking Framework**
```
{
  "inventoryId": "REP-002",
  "titleTemplate": "Implement UTM Capture + Lead Source Tracking Framework",
  "category": "Reporting & Analytics",
  "valueCategory": "Data Quality",
  "ghlComponents": ["Forms", "Custom Fields", "Tags", "Workflows", "Reporting"],
  "ghlTriggers": ["Form Submitted"],
  "ghlActions": ["Update Field", "Add Tag"],
  "ghlLimitations": ["UTM parameters must be passed in URLs; cannot auto-detect source"],
  "description": "Adds hidden UTM fields to all lead intake forms, applies source tags, and feeds campaign performance metrics into reporting dashboards for accurate attribution.",
  "verticalTags": ["Agency", "Real Estate", "Professional Services"],
  "implementationStatus": "production-ready"
}
```
---

### **SOP 3 — Sales Pipeline Performance Dashboard**
```
{
  "inventoryId": "REP-003",
  "titleTemplate": "Create Sales Pipeline Velocity & Conversion Dashboard",
  "category": "Reporting & Analytics",
  "valueCategory": "Pipeline Visibility",
  "ghlComponents": ["Pipelines", "Reporting", "Tags", "Custom Fields"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Update Field", "Add Tag"],
  "ghlLimitations": ["Granular velocity metrics require manual calculation or external tools"],
  "description": "Generates a reporting layer that tracks deal movement speed, stage conversion percentages, bottlenecks, and rep performance using GHL's pipeline reporting tools.",
  "verticalTags": ["Agency", "B2B Services", "Coaching"],
  "implementationStatus": "production-ready"
}
```
---

### **SOP 4 — Appointment & Show Rate Analytics**
```
{
  "inventoryId": "REP-004",
  "titleTemplate": "Track Booking, Confirmation, and Show Rate Performance",
  "category": "Reporting & Analytics",
  "valueCategory": "Appointment Performance",
  "ghlComponents": ["Calendars", "Reporting", "Workflows", "Tags"],
  "ghlTriggers": ["Appointment Booked", "Appointment Status Updated"],
  "ghlActions": ["Update Field", "Add Tag"],
  "ghlLimitations": ["Show rate tracking requires consistent rep marking of statuses"],
  "description": "Implements show-rate metrics by tagging appointment outcomes, then visualizes booking → confirmation → show conversion in GHL’s reporting suite.",
  "verticalTags": ["Agency", "Medical", "Coaching", "Trades"],
  "implementationStatus": "production-ready"
}
```
---

### **SOP 5 — Weekly KPI Scoreboard Automation**
```
{
  "inventoryId": "REP-005",
  "titleTemplate": "Automate Delivery of Weekly KPI Scoreboard to Leadership",
  "category": "Reporting & Analytics",
  "valueCategory": "Team Visibility",
  "ghlComponents": ["Reporting", "Workflows", "Email"],
  "ghlTriggers": ["Workflow Scheduled Trigger"],
  "ghlActions": ["Send Email"],
  "ghlLimitations": ["Scoreboard data must exist in GHL reports; cannot embed custom charts"],
  "description": "Sends a weekly automated KPI summary to leadership with key metrics such as leads created, deals moved, revenue closed, appointment show rates, and active campaign performance.",
  "verticalTags": ["Agency", "Coaching", "Professional Services"],
  "implementationStatus": "production-ready"
}
```
---

### **SOP 6 — Delivery & Fulfillment Turnaround Reporting**
```
{
  "inventoryId": "REP-006",
  "titleTemplate": "Implement Project Turnaround Tracking for Delivery Teams",
  "category": "Reporting & Analytics",
  "valueCategory": "Fulfillment Performance",
  "ghlComponents": ["Tasks", "Pipelines", "Reporting", "Custom Fields"],
  "ghlTriggers": ["Task Completed", "Stage Changed"],
  "ghlActions": ["Update Field"],
  "ghlLimitations": ["Advanced time-in-stage reporting may require external BI tools"],
  "description": "Tracks fulfillment turnaround times by capturing time-to-complete tasks, time spent in pipeline stages, and visualizing delivery bottlenecks.",
  "verticalTags": ["Agency", "Trades", "Creative Services"],
  "implementationStatus": "production-ready"
}
```
---

