# Client Onboarding SOP Inventory (Phase 1 — GHL-Native)

This canvas contains fully validated, GHL-native SOP inventory entries for the **Client Onboarding** category. Each record conforms to the canonical schema and is fully implementable inside GHL today.

---

## SOP 1 — Standardized Client Onboarding Form → Pipeline → Task Checklist

```json
{
  "inventoryId": "ONB-001",
  "titleTemplate": "Standardized Client Onboarding Form → Pipeline → Task Checklist",
  "category": "Client Onboarding",
  "valueCategory": "Client Onboarding",
  "ghlComponents": ["Forms", "Workflows", "Custom Fields", "Tasks", "Pipelines", "Email"],
  "ghlTriggers": ["Form Submitted"],
  "ghlActions": ["Create/Update Opportunity", "Assign Task", "Send Email", "Add Tag"],
  "ghlLimitations": ["Checklist tasks cannot be natively grouped", "Conditional sections require custom fields"],
  "description": "Creates a standardized onboarding process that begins with a unified client intake form, pushes the client into a dedicated onboarding pipeline stage, and generates a required task checklist based on the services purchased.",
  "verticalTags": ["Agency", "Coaching", "Services", "Trades"],
  "implementationStatus": "production-ready"
}
```

---

## SOP 2 — Deal Won → Automated Welcome Packet Delivery

```json
{
  "inventoryId": "ONB-002",
  "titleTemplate": "Deal Won → Automated Welcome Packet Delivery",
  "category": "Client Onboarding",
  "valueCategory": "Client Onboarding",
  "ghlComponents": ["Pipelines", "Workflows", "Email/SMS", "Attachments", "Calendars"],
  "ghlTriggers": ["Pipeline Stage Changed"],
  "ghlActions": ["Send Email", "Send SMS", "Add Tag"],
  "ghlLimitations": ["Attachments require hosted files", "Multi-step packets must be sent as multiple messages"],
  "description": "Automatically sends a prebuilt onboarding welcome sequence when a deal enters the ‘Onboarding’ or ‘Client Won’ stage, including expectations, timelines, and required next steps.",
  "verticalTags": ["Agency", "Freelancer", "Consulting", "Trades"],
  "implementationStatus": "production-ready"
}
```

---

## SOP 3 — Client Asset Collection Workflow

```json
{
  "inventoryId": "ONB-003",
  "titleTemplate": "Client Asset Collection Workflow",
  "category": "Client Onboarding",
  "valueCategory": "Client Onboarding",
  "ghlComponents": ["Forms", "Workflows", "Custom Fields", "Tasks", "Email/SMS"],
  "ghlTriggers": ["Form Submitted", "Stage Changed"],
  "ghlActions": ["Assign Task", "Send Email", "Update Field"],
  "ghlLimitations": ["Clients cannot upload folders", "Large file uploads require external links"],
  "description": "Collect all required assets (logos, passwords, content, questionnaires) via a single structured form and generate related internal tasks based on the assets received.",
  "verticalTags": ["Marketing", "Creative", "Trades", "Real Estate"],
  "implementationStatus": "production-ready"
}
```

---

## SOP 4 — Kickoff Call Scheduling Automation

```json
{
  "inventoryId": "ONB-004",
  "titleTemplate": "Kickoff Call Scheduling Automation",
  "category": "Client Onboarding",
  "valueCategory": "Client Onboarding",
  "ghlComponents": ["Calendars", "Workflows", "Email/SMS", "Tasks"],
  "ghlTriggers": ["Pipeline Stage Changed", "Task Completed"],
  "ghlActions": ["Send SMS", "Send Email", "Create Task", "Assign User"],
  "ghlLimitations": ["No conditional routing without workflows", "Multiple calendars require explicit mapping"],
  "description": "Automatically prompts the new client to book a kickoff call, sends confirmation reminders, and assigns preparation tasks internally.",
  "verticalTags": ["Agency", "Consulting", "Coaching"],
  "implementationStatus": "production-ready"
}
```

---

## SOP 5 — Contract Signed → Onboarding Pipeline Activation

```json
{
  "inventoryId": "ONB-005",
  "titleTemplate": "Contract Signed → Onboarding Pipeline Activation",
  "category": "Client Onboarding",
  "valueCategory": "Client Onboarding",
  "ghlComponents": ["Pipelines", "Workflows", "Custom Fields", "Tags"],
  "ghlTriggers": ["Field Value Changed", "Tag Added"],
  "ghlActions": ["Move to Pipeline Stage", "Send Email", "Update Field"],
  "ghlLimitations": ["E-signature integrations require Zapier or API triggers"],
  "description": "When a client signs a contract (detected via tag or field value), the system activates onboarding stages and triggers the required preparation automations.",
  "verticalTags": ["Agency", "Coaching", "Financial Services"],
  "implementationStatus": "production-ready"
}
```

---

## SOP 6 — Onboarding SLA Watchdog

```json
{
  "inventoryId": "ONB-006",
  "titleTemplate": "Onboarding SLA Watchdog",
  "category": "Client Onboarding",
  "valueCategory": "Client Onboarding",
  "ghlComponents": ["Workflows", "Delays", "Conditions", "Email/SMS", "Tasks"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Notify User", "Assign Task", "Add Tag"],
  "ghlLimitations": ["Cannot track real-time activity; evaluates on delays only"],
  "description": "Monitors onboarding progress. If a client stays stuck in a step for too long (24–72 hrs), it triggers alerts or automatically assigns follow-up tasks.",
  "verticalTags": ["Agency", "Healthcare", "Financial Services"],
  "implementationStatus": "production-ready"
}
```

---

## SOP 7 — Client Expectations Alignment Sequence

```json
{
  "inventoryId": "ONB-007",
  "titleTemplate": "Client Expectations Alignment Sequence",
  "category": "Client Onboarding",
  "valueCategory": "Client Onboarding",
  "ghlComponents": ["Email/SMS", "Workflows", "Custom Fields"],
  "ghlTriggers": ["Pipeline Stage Changed"],
  "ghlActions": ["Send Email", "Send SMS", "Update Field"],
  "ghlLimitations": ["Message templates cannot dynamically show conditional blocks beyond custom fields"],
  "description": "Delivers a structured onboarding expectations sequence that aligns communication cadence, revisions policy, timelines, and deliverable schedule.",
  "verticalTags": ["Agency", "Coaching", "Trades"],
  "implementationStatus": "production-ready"
}
```

---

## SOP 8 — Welcome Survey → Personalized Onboarding Path

```json
{
  "inventoryId": "ONB-008",
  "titleTemplate": "Welcome Survey → Personalized Onboarding Path",
  "category": "Client Onboarding",
  "valueCategory": "Client Onboarding",
  "ghlComponents": ["Forms", "Custom Fields", "Workflows", "Email/SMS", "Tags"],
  "ghlTriggers": ["Form Submitted"],
  "ghlActions": ["Update Field", "Add Tag", "Send Email"],
  "ghlLimitations": ["Branching complexity must be linear; no multi-layered logic trees"],
  "description": "Captures a client’s working style, content preferences, and goals through a welcome survey and personalizes the onboarding communication based on their responses.",
  "verticalTags": ["Agency", "Coaching", "Education"],
  "implementationStatus": "production-ready"
}
```

---

# END OF DOCUMENT

