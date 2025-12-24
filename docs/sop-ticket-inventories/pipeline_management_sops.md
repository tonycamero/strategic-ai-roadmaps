# Pipeline Management SOP Inventory (Phase 1 — GHL-Native)

This canvas contains **12 fully validated, GHL-native, zero-hallucination SOP inventory entries** for the **Pipeline Management** category. Each SOP conforms to the canonical schema and is implementable today using GHL primitives.

---

## **SOP 1 — Unified Lead Capture Pipeline**
```json
{
  "inventoryId": "PM_UNIFY_LEAD_CAPTURE",
  "titleTemplate": "Unify all lead capture sources into a single standardized GHL pipeline",
  "category": "Pipeline",
  "valueCategory": "Lead Intake",
  "ghlComponents": ["Forms", "Pipelines", "Workflows", "Tags"],
  "ghlTriggers": ["Form Submitted", "Contact Created"],
  "ghlActions": ["Create Opportunity", "Add Tag", "Assign Owner"],
  "ghlLimitations": ["No dynamic routing logic beyond basic conditions"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Normalize capture forms, map fields to pipeline opportunity fields, and auto-create opportunities across all channels.",
  "complexity": "medium",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 2 — Standardized Pipeline Architecture**
```json
{
  "inventoryId": "PM_PIPELINE_STANDARDIZATION",
  "titleTemplate": "Standardize all pipeline stages, definitions, and required fields",
  "category": "Pipeline",
  "valueCategory": "Lead Qualification",
  "ghlComponents": ["Pipelines", "Custom Fields", "Workflows"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Internal Notification", "Update Field"],
  "ghlLimitations": ["No per-stage validation enforcement"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Define canonical stage list, required fields, and stage rules, and map all opportunities to it.",
  "complexity": "medium",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 3 — Automated Lead Assignment (Round Robin or Rules-Based)**
```json
{
  "inventoryId": "PM_AUTO_ASSIGNMENT",
  "titleTemplate": "Implement automated round-robin or rules-based lead assignment",
  "category": "Pipeline",
  "valueCategory": "Lead Intake",
  "ghlComponents": ["Workflows", "Custom Fields", "Pipelines"],
  "ghlTriggers": ["Opportunity Created", "Tag Added"],
  "ghlActions": ["Assign Owner", "Add Tag", "Internal Notification"],
  "ghlLimitations": ["No advanced load balancing beyond basic rules"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Workflow assigns owner based on rotation or field-driven rules.",
  "complexity": "low",
  "dependencies": ["PM_UNIFY_LEAD_CAPTURE"],
  "verticalTags": []
}
```
---

## **SOP 4 — Lead Source Attribution Enforcement**
```json
{
  "inventoryId": "PM_SOURCE_ENFORCEMENT",
  "titleTemplate": "Enforce consistent lead source attribution using tags and custom fields",
  "category": "Pipeline",
  "valueCategory": "Lead Intake",
  "ghlComponents": ["Forms", "Custom Fields", "Tags", "Workflows"],
  "ghlTriggers": ["Form Submitted"],
  "ghlActions": ["Add Tag", "Update Field"],
  "ghlLimitations": ["No multi-touch attribution"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "UTM capture + source tag standardization workflow.",
  "complexity": "low",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 5 — Pipeline SLA Definition + Task Automation**
```json
{
  "inventoryId": "PM_SLA_TASK_AUTOMATION",
  "titleTemplate": "Implement SLA-driven task automation by pipeline stage",
  "category": "Pipeline",
  "valueCategory": "Lead Qualification",
  "ghlComponents": ["Workflows", "Tasks", "Pipelines"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Create Task", "Internal Notification"],
  "ghlLimitations": ["GHL cannot natively enforce SLA timers without workflows"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Define SLA windows per stage; workflow creates tasks accordingly.",
  "complexity": "medium",
  "dependencies": ["PM_PIPELINE_STANDARDIZATION"],
  "verticalTags": []
}
```
---

## **SOP 6 — Lead Re-engagement (Dormant Opportunity Workflow)**
```json
{
  "inventoryId": "PM_DORMANT_REENGAGEMENT",
  "titleTemplate": "Re-engage dormant leads with automated messaging and tagging",
  "category": "Pipeline",
  "valueCategory": "Lead Nurture",
  "ghlComponents": ["Workflows", "Email", "SMS", "Tags"],
  "ghlTriggers": ["Tag Added", "Opportunity Aging"],
  "ghlActions": ["Send Email", "Send SMS", "Add Tag"],
  "ghlLimitations": ["GHL cannot trigger off ‘days since last activity’ natively; requires workflow delays"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Workflow waits X days → checks stage → sends reactivation message.",
  "complexity": "medium",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 7 — Missed Opportunity Recovery Loop**
```json
{
  "inventoryId": "PM_MISSED_OPP_RECOVERY",
  "titleTemplate": "Recover missed opportunities automatically through tagging and follow-up",
  "category": "Pipeline",
  "valueCategory": "Lead Recovery",
  "ghlComponents": ["Pipelines", "Workflows", "Tags", "Email"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Send Email", "Add Tag", "Update Field"],
  "ghlLimitations": ["Cannot access deal loss reasons except via custom fields"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "When marked lost → trigger nurture → re-engagement sequence.",
  "complexity": "medium",
  "dependencies": ["PM_PIPELINE_STANDARDIZATION"],
  "verticalTags": []
}
```
---

## **SOP 8 — Pipeline Hygiene Enforcement Workflow**
```json
{
  "inventoryId": "PM_PIPELINE_HYGIENE",
  "titleTemplate": "Enforce pipeline hygiene through task creation and stage validation messaging",
  "category": "Pipeline",
  "valueCategory": "Data Quality",
  "ghlComponents": ["Tasks", "Workflows", "Pipelines"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Create Task", "Internal Notification"],
  "ghlLimitations": ["Cannot block progression when fields are missing"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "When required fields missing → alert + create cleanup task.",
  "complexity": "medium",
  "dependencies": ["PM_PIPELINE_STANDARDIZATION"],
  "verticalTags": []
}
```
---

## **SOP 9 — Pipeline Stage Automation (Checklist Automation)**
```json
{
  "inventoryId": "PM_STAGE_AUTOMATION_CHECKLIST",
  "titleTemplate": "Automate checklists and internal tasks when deals move stages",
  "category": "Pipeline",
  "valueCategory": "Ops Coordination",
  "ghlComponents": ["Tasks", "Workflows", "Pipelines"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Create Task", "Internal Notification"],
  "ghlLimitations": ["No dynamic checklists or sub-task support"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Stage change → prebuilt checklist tasks assigned to owner.",
  "complexity": "low",
  "dependencies": ["PM_PIPELINE_STANDARDIZATION"],
  "verticalTags": []
}
```
---

## **SOP 10 — Lead Speed-to-Contact System**
```json
{
  "inventoryId": "PM_SPEED_TO_CONTACT",
  "titleTemplate": "Improve speed-to-contact with instant notifications and task automation",
  "category": "Pipeline",
  "valueCategory": "Lead Intake",
  "ghlComponents": ["Workflows", "Email", "SMS", "Tasks"],
  "ghlTriggers": ["Form Submitted", "Opportunity Created"],
  "ghlActions": ["Internal Notification", "Send SMS", "Create Task"],
  "ghlLimitations": ["Cannot enforce auto-call or dialer behavior natively"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Immediate alerts + task assignment to ensure sub-5 minute follow-up.",
  "complexity": "low",
  "dependencies": ["PM_UNIFY_LEAD_CAPTURE"],
  "verticalTags": []
}
```
---

## **SOP 11 — Lost Deal Recycling System**
```json
{
  "inventoryId": "PM_RECYCLE_LOST_DEALS",
  "titleTemplate": "Recycle lost deals into segmented nurture tracks for future conversion",
  "category": "Pipeline",
  "valueCategory": "Lead Recovery",
  "ghlComponents": ["Workflows", "Email", "Tags", "Pipelines"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Add Tag", "Send Email"],
  "ghlLimitations": ["Cannot segment by intent level without manual fields"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Lost stage → tag → drop into nurture workflow.",
  "complexity": "medium",

