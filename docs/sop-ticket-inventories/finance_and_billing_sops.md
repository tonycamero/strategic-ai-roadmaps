# Finance & Billing Automation SOP Inventory (Phase 1 — GHL-Native)

Full **canonical SOP format**, Ops-style layout, one SOP per block. All entries are **100% GHL‑implementable today** using Invoices, Payments, Workflows, Pipelines, Tasks, Custom Fields, Calendars, and Email/SMS. Each SOP is labeled for human review.

---

## **SOP 1 — Automated Invoice Generation From Pipeline Stage**
```json
{
  "inventoryId": "FIN_AUTO_INVOICE_GEN",
  "titleTemplate": "Move deal to ‘Billing’ → Auto-generate invoice + payment link",
  "category": "Finance",
  "valueCategory": "Billing Automation",
  "ghlComponents": ["Pipelines", "Workflows", "Invoices", "Payments", "Email/SMS"],
  "ghlTriggers": ["Pipeline Stage Changed"],
  "ghlActions": ["Create Invoice", "Send Email", "Send SMS", "Add Tag"],
  "ghlLimitations": ["No conditional invoice line-items; must use product presets"],
  "description": "Automatically generates an invoice whenever a deal reaches the Billing or Closed Won stage, attaches a payment link, and sends it to the client via email/SMS.",
  "verticalTags": ["Agency", "Consulting", "Trades", "Real Estate"],
  "implementationStatus": "production-ready"
}
```

---

## **SOP 2 — Payment Failure Recovery Sequence**
```json
{
  "inventoryId": "FIN_PAYMENT_RECOVERY",
  "titleTemplate": "Failed payment → Trigger smart recovery sequence (3-touch)",
  "category": "Finance",
  "valueCategory": "Collections",
  "ghlComponents": ["Payments", "Workflows", "Email/SMS", "Tasks"],
  "ghlTriggers": ["Payment Failed"],
  "ghlActions": ["Send Email", "Send SMS", "Create Task", "Notify User"],
  "ghlLimitations": ["No automated card updater; must rely on client action"],
  "description": "Detects failed payments and launches a structured recovery workflow including reminders, alternative payment link steps, and internal alerts.",
  "verticalTags": ["Agency", "Coaching", "Subscription Businesses"],
  "implementationStatus": "production-ready"
}
```

---

## **SOP 3 — Automated Recurring Billing Setup**
```json
{
  "inventoryId": "FIN_RECURRING_BILLING_SETUP",
  "titleTemplate": "Client onboarding → Create recurring subscription + automate receipts",
  "category": "Finance",
  "valueCategory": "Billing Automation",
  "ghlComponents": ["Invoices", "Payments", "Workflows", "Custom Fields"],
  "ghlTriggers": ["Form Submitted", "Stage Changed"],
  "ghlActions": ["Create Subscription", "Send Email", "Update Field"],
  "ghlLimitations": ["Subscription edits require manual updates in Stripe or native GHL billing"],
  "description": "Creates a recurring subscription for clients who purchase monthly retainers and automates payment receipt emails.",
  "verticalTags": ["Agency", "Coaching", "SaaS", "Trades"],
  "implementationStatus": "production-ready"
}
```

---

## **SOP 4 — Aged Receivables Alert Workflow**
```json
{
  "inventoryId": "FIN_AGED_AR_ALERTS",
  "titleTemplate": "Invoice >14 days overdue → notify team + assign follow-up task",
  "category": "Finance",
  "valueCategory": "Collections",
  "ghlComponents": ["Invoices", "Workflows", "Tasks", "Email/SMS"],
  "ghlTriggers": ["Invoice Overdue"],
  "ghlActions": ["Create Task", "Notify User", "Send Email"],
  "ghlLimitations": ["No native multi-tier aging buckets; build using delays"],
  "description": "Automatically flags invoices that exceed a predefined overdue threshold and assigns a follow-up task to the collections or operations team.",
  "verticalTags": ["Agency", "Healthcare", "Professional Services"],
  "implementationStatus": "production-ready"
}
```

---

## **SOP 5 — Paid Invoice → Service Activation Workflow**
```json
{
  "inventoryId": "FIN_PAID_ACTIVATE_SERVICE",
  "titleTemplate": "Payment received → Trigger service activation tasks",
  "category": "Finance",
  "valueCategory": "Revenue Operations",
  "ghlComponents": ["Payments", "Workflows", "Pipelines", "Tasks", "Tags"],
  "ghlTriggers": ["Payment Successful"],
  "ghlActions": ["Move to Pipeline Stage", "Assign Task", "Add Tag", "Send Email"],
  "ghlLimitations": ["No conditional mapping across multiple service packages without custom fields"],
  "description": "Automatically transitions the client into the next operational workflow once their payment is confirmed, triggering kickoff tasks and team notifications.",
  "verticalTags": ["Agency", "Coaching", "Trades", "Legal"],
  "implementationStatus": "production-ready"
}
```

---

## **SOP 6 — Pre-Billing Requirements Checklist**
```json
{
  "inventoryId": "FIN_PREBILL_REQUIREMENTS",
  "titleTemplate": "Ensure all prerequisites met before sending an invoice",
  "category": "Finance",
  "valueCategory": "Risk Mitigation",
  "ghlComponents": ["Workflows", "Tasks", "Custom Fields", "Pipelines"],
  "ghlTriggers": ["Stage Changed"],
  "ghlActions": ["Create Task", "Update Field", "Notify User"],
  "ghlLimitations": ["Cannot enforce blocking conditions; relies on task completion discipline"],
  "description": "Prevents premature invoicing by verifying contract signature, asset upload, or scope confirmation before billing tasks are triggered.",
  "verticalTags": ["Agency", "Construction", "Legal", "Consulting"],
  "implementationStatus": "production-ready"
}
```

---

## **SOP 7 — Refund & Credit Automation**
```json
{
  "inventoryId": "FIN_REFUND_CREDIT_AUTOMATION",
  "titleTemplate": "Refund issued → Update CRM record + notify team",
  "category": "Finance",
  "valueCategory": "Revenue Operations",
  "ghlComponents": ["Payments", "Workflows", "Custom Fields", "Email/SMS"],
  "ghlTriggers": ["Refund Processed"],
  "ghlActions": ["Update Field", "Send Email", "Notify User"],
  "ghlLimitations": ["Refund initiation must be manual; cannot auto-trigger refunds"],
  "description": "Standardizes the internal and client-facing workflow after a refund, ensuring CRM fields reflect the financial status and stakeholders stay informed.",
  "verticalTags": ["Agency", "Ecommerce", "Coaching"],
  "implementationStatus": "production-ready"
}
```

---

## **Status: COMPLETE**
Finance & Billing SOP inventory has been added in the exact same Ops-style formatting.

Say **"next"** to continue to **Reporting & Analytics SOPs**.

