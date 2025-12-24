# Ops & Workflow Automation SOP Inventory (Phase 1 — GHL-Native)

This canvas contains **12 fully validated, GHL-native SOP inventory entries** for the **Ops & Workflows** category. Each record conforms to the canonical schema and is fully implementable inside GHL today.

---

## **SOP 1 — Standardized Internal Task Engine (Lead → Client → Delivery)**
```json
{
  "inventoryId": "OPS_INTERNAL_TASK_ENGINE",
  "titleTemplate": "Standardize internal task generation from lead intake through delivery",
  "category": "Ops",
  "valueCategory": "Task Management",
  "ghlComponents": ["Workflows", "Tasks", "Pipelines", "Custom Fields"],
  "ghlTriggers": ["Opportunity Created", "Stage Changed", "Tag Added"],
  "ghlActions": ["Create Task", "Internal Notification", "Update Field"],
  "ghlLimitations": ["No native sub-task hierarchy; checklists must be modeled as multiple tasks"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Whenever a new lead or deal is created or advances, create a consistent task bundle for sales, onboarding, and delivery with owners and due dates.",
  "complexity": "medium",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 2 — Automated Handoff Protocol (Sales → Ops → Delivery)**
```json
{
  "inventoryId": "OPS_HANDOFF_PROTOCOL",
  "titleTemplate": "Automate handoffs between sales, operations, and delivery teams",
  "category": "Ops",
  "valueCategory": "Ops Coordination",
  "ghlComponents": ["Pipelines", "Workflows", "Tasks", "Email"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Create Task", "Internal Notification", "Send Email"],
  "ghlLimitations": ["Cannot enforce acceptance of handoff; relies on internal task completion"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "When a deal hits a defined stage (e.g., Closed Won), auto-create onboarding tasks and notify the next responsible team.",
  "complexity": "medium",
  "dependencies": ["PM_PIPELINE_STANDARDIZATION"],
  "verticalTags": []
}
```
---

## **SOP 3 — Internal SLA Enforcement Workflow**
```json
{
  "inventoryId": "OPS_INTERNAL_SLA_ENFORCEMENT",
  "titleTemplate": "Enforce internal SLAs with timed reminders and task escalation",
  "category": "Ops",
  "valueCategory": "Process Standardization",
  "ghlComponents": ["Workflows", "Tasks", "Pipelines"],
  "ghlTriggers": ["Task Created", "Stage Changed"],
  "ghlActions": ["Internal Notification", "Create Task"],
  "ghlLimitations": ["No native SLA reporting; SLAs modeled through delays and tasks"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "For key stages and tasks, use workflow delays and conditions to escalate when items remain incomplete beyond SLA thresholds.",
  "complexity": "medium",
  "dependencies": ["OPS_INTERNAL_TASK_ENGINE"],
  "verticalTags": []
}
```
---

## **SOP 4 — Daily Ops Digest Email for Active Deals & Tasks**
```json
{
  "inventoryId": "OPS_DAILY_OPS_DIGEST",
  "titleTemplate": "Send a daily ops digest summarizing active deals and priority tasks",
  "category": "Ops",
  "valueCategory": "Executive Visibility",
  "ghlComponents": ["Workflows", "Email", "Smart Lists"],
  "ghlTriggers": ["Schedule"],
  "ghlActions": ["Send Email"],
  "ghlLimitations": ["Digest content is limited to what can be expressed via filters and merge fields"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Use scheduled workflows and smart lists to send a daily email to ops leads with key open deals and overdue tasks.",
  "complexity": "low",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 5 — Overdue Work Recovery System**
```json
{
  "inventoryId": "OPS_OVERDUE_RECOVERY",
  "titleTemplate": "Detect and recover overdue internal work with follow-up tasks and alerts",
  "category": "Ops",
  "valueCategory": "Ops Coordination",
  "ghlComponents": ["Tasks", "Workflows"],
  "ghlTriggers": ["Task Created", "Tag Added"],
  "ghlActions": ["Internal Notification", "Create Task"],
  "ghlLimitations": ["No native task aging triggers; relies on workflow delays to model overdue"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "When a task is created, start a timer and if not completed by a deadline, create escalation tasks and send internal alerts.",
  "complexity": "medium",
  "dependencies": ["OPS_INTERNAL_TASK_ENGINE"],
  "verticalTags": []
}
```
---

## **SOP 6 — Project Intake → Task Checklist Generator**
```json
{
  "inventoryId": "OPS_PROJECT_CHECKLIST_GENERATOR",
  "titleTemplate": "Generate a standardized task checklist from project intake submissions",
  "category": "Ops",
  "valueCategory": "Service Delivery",
  "ghlComponents": ["Forms", "Custom Fields", "Workflows", "Tasks"],
  "ghlTriggers": ["Form Submitted"],
  "ghlActions": ["Create Task", "Update Field"],
  "ghlLimitations": ["No dynamic branching checklists; complexity modeled as multiple workflows"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "When a project intake form is submitted, create a task bundle tailored to project type, owner, and timeline fields.",
  "complexity": "medium",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 7 — Pipeline-to-Task Sync Engine**
```json
{
  "inventoryId": "OPS_PIPELINE_TASK_SYNC",
  "titleTemplate": "Sync pipeline stages to internal task lists with stage-specific checklists",
  "category": "Ops",
  "valueCategory": "Ops Coordination",
  "ghlComponents": ["Pipelines", "Workflows", "Tasks"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Create Task", "Internal Notification"],
  "ghlLimitations": ["No native task groups; each checklist is a set of discrete tasks"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Whenever a deal enters a defined stage, create a preconfigured set of internal tasks for that stage.",
  "complexity": "low",
  "dependencies": ["PM_PIPELINE_STANDARDIZATION"],
  "verticalTags": []
}
```
---

## **SOP 8 — Standardized Client Revision Request Loop**
```json
{
  "inventoryId": "OPS_REVISION_REQUEST_LOOP",
  "titleTemplate": "Standardize client revision requests via forms and internal tasks",
  "category": "Ops",
  "valueCategory": "Client Retention",
  "ghlComponents": ["Forms", "Workflows", "Tasks", "Email"],
  "ghlTriggers": ["Form Submitted"],
  "ghlActions": ["Create Task", "Send Email", "Update Field"],
  "ghlLimitations": ["No file diffing or annotation; revisions tracked via notes and tasks"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Use a standard revision request form that creates tasks for the delivery team and confirms receipt to the client.",
  "complexity": "medium",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 9 — Multi-Owner Work Routing Logic**
```json
{
  "inventoryId": "OPS_MULTI_OWNER_ROUTING",
  "titleTemplate": "Route internal work to the right owner based on role, vertical, or workload",
  "category": "Ops",
  "valueCategory": "Ops Coordination",
  "ghlComponents": ["Workflows", "Custom Fields", "Tasks"],
  "ghlTriggers": ["Task Created", "Form Submitted", "Stage Changed"],
  "ghlActions": ["Assign Owner", "Internal Notification"],
  "ghlLimitations": ["No real-time workload balancing; logic must be modeled with static conditions"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Use conditions on vertical, service line, and role fields to assign tasks to the correct person or team.",
  "complexity": "medium",
  "dependencies": ["OPS_INTERNAL_TASK_ENGINE"],
  "verticalTags": []
}
```
---

## **SOP 10 — Client Status Update Automation**
```json
{
  "inventoryId": "OPS_CLIENT_STATUS_UPDATES",
  "titleTemplate": "Automate client-facing status updates from internal pipeline and task events",
  "category": "Ops",
  "valueCategory": "Client Communication",
  "ghlComponents": ["Pipelines", "Workflows", "Email", "SMS"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Send Email", "Send SMS"],
  "ghlLimitations": ["No conditional message templates based on history; must be modeled as separate branches"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "When a deal hits specific stages, send clients templated status notifications via email/SMS.",
  "complexity": "low",
  "dependencies": ["PM_PIPELINE_STANDARDIZATION"],
  "verticalTags": []
}
```
---

## **SOP 11 — Missed Deadline Escalation System**
```json
{
  "inventoryId": "OPS_MISSED_DEADLINE_ESCALATION",
  "titleTemplate": "Escalate missed deadlines for critical deliverables to management",
  "category": "Ops",
  "valueCategory": "Risk Management",
  "ghlComponents": ["Tasks", "Workflows", "Email"],
  "ghlTriggers": ["Task Created"],
  "ghlActions": ["Internal Notification", "Create Task"],
  "ghlLimitations": ["No native SLA breach object; modeled through workflow delays and conditions"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "For high-priority tasks, use workflow timers to notify management and generate escalation tasks when overdue.",
  "complexity": "medium",
  "dependencies": ["OPS_OVERDUE_RECOVERY"],
  "verticalTags": []
}
```
---

## **SOP 12 — Internal Job Ticketing System**
```json
{
  "inventoryId": "OPS_INTERNAL_JOB_TICKETING",
  "titleTemplate": "Convert internal requests into trackable job tickets with pipeline visibility",
  "category": "Ops",
  "valueCategory": "Service Delivery",
  "ghlComponents": ["Forms", "Pipelines", "Workflows", "Tasks"],
  "ghlTriggers": ["Form Submitted"],
  "ghlActions": ["Create Task", "Create Opportunity", "Internal Notification"],
  "ghlLimitations": ["No Kanban beyond pipeline views; internal jobs modeled as opportunities or tasks"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Use an internal request form to create a job ticket in a dedicated internal pipeline with associated tasks.",
  "complexity": "medium",
  "dependencies": [],
  "verticalTags": []
}
```

---

# END OF DOCUMENT

