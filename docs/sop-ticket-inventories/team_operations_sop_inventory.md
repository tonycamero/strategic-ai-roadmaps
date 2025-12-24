# Team Operations SOP Inventory (GHL-Native)

Structured in **full JSON inventory format**, matching the canonical format used across Pipeline, CRM, Ops, Client Onboarding, Reporting, and Finance inventories. Every SOP below is **100% buildable in GHL today** using Tasks, Workflows, Pipelines, Calendars, User Assignment, Email/SMS, and Dashboards.

---

## Team Operations SOP Inventory (Labeled for Human Review)

---

### SOP 1 — Internal Task Assignment and Accountability Workflow
```json
{
  "inventoryId": "TEAM-001",
  "titleTemplate": "Internal Task Assignment and Accountability Workflow",
  "category": "Team Operations",
  "valueCategory": "Task Management",
  "ghlComponents": ["Workflows", "Tasks", "Users", "Conditions", "Email/SMS"],
  "ghlTriggers": ["Task Created", "Tag Added", "Opportunity Stage Changed"],
  "ghlActions": ["Assign Task", "Notify User", "Update Task", "Send Email", "Add Tag"],
  "ghlLimitations": [
    "No native task dependencies",
    "Tasks cannot be grouped hierarchically"
  ],
  "description": "Establishes a standard method for auto-assigning tasks to the correct team member based on role, pipeline stage, or tagged project type. Improves accountability and reduces manual delegation bottlenecks.",
  "verticalTags": ["Agency", "Consulting", "Trades", "Real Estate"],
  "implementationStatus": "production-ready"
}
```

---

### SOP 2 — Daily Team Work Summary Digest (Slack/Email)
```json
{
  "inventoryId": "TEAM-002",
  "titleTemplate": "Daily Team Work Summary Digest (Slack/Email)",
  "category": "Team Operations",
  "valueCategory": "Team Communication",
  "ghlComponents": ["Workflows", "Tasks", "Email", "SMS", "Custom Fields"],
  "ghlTriggers": ["Scheduled", "Task Completed"],
  "ghlActions": ["Send Email", "Send SMS", "Fetch Tasks", "Format Summary"],
  "ghlLimitations": [
    "Summaries cannot dynamically filter by user without additional custom fields"
  ],
  "description": "Sends an automated daily digest summarizing tasks completed, overdue, or upcoming. Helps the team stay aligned without manual check-ins and reduces reliance on meetings.",
  "verticalTags": ["Agency", "Healthcare", "Trades", "Coaching"],
  "implementationStatus": "production-ready"
}
```

---

### SOP 3 — Internal SLA Monitoring for Overdue Tasks
```json
{
  "inventoryId": "TEAM-003",
  "titleTemplate": "Internal SLA Monitoring for Overdue Tasks",
  "category": "Team Operations",
  "valueCategory": "Performance Management",
  "ghlComponents": ["Workflows", "Conditions", "Delays", "Tasks", "Email/SMS"],
  "ghlTriggers": ["Task Created", "Delay Timer"],
  "ghlActions": ["Notify User", "Escalate to Manager", "Add Tag", "Assign Task"],
  "ghlLimitations": [
    "Cannot track real-time task edits; evaluates on timer"
  ],
  "description": "Creates a rules-based system to monitor overdue tasks and notify responsible team members or escalate to leadership when tasks exceed SLA thresholds.",
  "verticalTags": ["Agency", "Consulting", "Trades"],
  "implementationStatus": "production-ready"
}
```

---

### SOP 4 — Weekly Leadership Scorecard Automation
```json
{
  "inventoryId": "TEAM-004",
  "titleTemplate": "Weekly Leadership Scorecard Automation",
  "category": "Team Operations",
  "valueCategory": "Reporting",
  "ghlComponents": ["Custom Fields", "Workflows", "Reports", "Dashboards", "Email"],
  "ghlTriggers": ["Scheduled Weekly"],
  "ghlActions": ["Pull Report", "Format Summary", "Send Email"],
  "ghlLimitations": [
    "GHL dashboards limited to native metrics",
    "No cross-object calculated fields without API"
  ],
  "description": "Automates a weekly leadership scorecard summarizing KPIs such as tasks completed, overdue items, deal movement, and upcoming deadlines.",
  "verticalTags": ["Agency", "Coaching", "Sales Teams", "Trades"],
  "implementationStatus": "production-ready"
}
```

---

### SOP 5 — Round-Robin Task Assignment System
```json
{
  "inventoryId": "TEAM-005",
  "titleTemplate": "Round-Robin Task Assignment System",
  "category": "Team Operations",
  "valueCategory": "Task Management",
  "ghlComponents": ["Workflows", "Users", "Custom Fields", "Tasks"],
  "ghlTriggers": ["Task Created", "Tag Added"],
  "ghlActions": ["Assign User", "Update Field", "Add Tag"],
  "ghlLimitations": [
    "True round-robin requires a custom field to store the next user index"
  ],
  "description": "Implements a round-robin assignment engine that evenly distributes tasks to team members while maintaining fairness and preventing overload.",
  "verticalTags": ["Agency", "Customer Support", "Sales Ops"],
  "implementationStatus": "production-ready"
}
```

---

### SOP 6 — Internal Notifications for Pipeline Stage Changes
```json
{
  "inventoryId": "TEAM-006",
  "titleTemplate": "Internal Notifications for Pipeline Stage Changes",
  "category": "Team Operations",
  "valueCategory": "Team Communication",
  "ghlComponents": ["Pipelines", "Workflows", "Email/SMS", "Tasks"],
  "ghlTriggers": ["Opportunity Stage Changed"],
  "ghlActions": ["Notify User", "Assign Task", "Update Field"],
  "ghlLimitations": [
    "Cannot conditionally notify multiple teams without branching logic"
  ],
  "description": "Notifies the appropriate team members whenever a deal moves stages, ensuring everyone stays aligned and handoffs are executed smoothly.",
  "verticalTags": ["Agency", "Trades", "Real Estate", "Consulting"],
  "implementationStatus": "production-ready"
}
```

---

## Status: COMPLETE
Team Operations — GHL-native, reality-anchored, production-grade.

