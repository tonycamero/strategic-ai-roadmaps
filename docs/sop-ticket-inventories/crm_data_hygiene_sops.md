# CRM & Data Hygiene SOP Inventory (Phase 1 — GHL-Native)

This canvas contains **9 fully validated, GHL-native, zero-hallucination SOP inventory entries** for the **CRM & Data Hygiene** category. Each SOP strictly conforms to the canonical schema and is implementable inside GHL today.

---

## **SOP 1 — UTM & Lead Source Normalization System**
```json
{
  "inventoryId": "CRM_UTM_NORMALIZATION",
  "titleTemplate": "Normalize all UTM and lead source data into standardized fields and tags",
  "category": "CRM",
  "valueCategory": "Data Quality",
  "ghlComponents": ["Forms", "Custom Fields", "Tags", "Workflows"],
  "ghlTriggers": ["Form Submitted"],
  "ghlActions": ["Update Field", "Add Tag"],
  "ghlLimitations": ["No multi-touch attribution; limited UTM persistence across channels"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Use UTM fields + workflows to apply standardized source tags and ensure data completeness.",
  "complexity": "low",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 2 — Contact Field Schema Standardization**
```json
{
  "inventoryId": "CRM_FIELD_SCHEMA_STANDARDIZATION",
  "titleTemplate": "Establish a standardized contact field schema and enforce required data population",
  "category": "CRM",
  "valueCategory": "Data Hygiene",
  "ghlComponents": ["Custom Fields", "Workflows"],
  "ghlTriggers": ["Contact Created", "Tag Added"],
  "ghlActions": ["Internal Notification", "Create Task"],
  "ghlLimitations": ["Cannot block creation of incomplete contacts"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Define required fields and workflows to notify teams when contact records are missing key data.",
  "complexity": "medium",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 3 — Duplicate Contact Prevention Workflow**
```json
{
  "inventoryId": "CRM_DUPLICATE_PREVENTION",
  "titleTemplate": "Reduce duplicate contacts with tag-based prevention and manual merge workflows",
  "category": "CRM",
  "valueCategory": "Data Hygiene",
  "ghlComponents": ["Tags", "Custom Fields", "Workflows"],
  "ghlTriggers": ["Contact Created"],
  "ghlActions": ["Internal Notification"],
  "ghlLimitations": ["Cannot auto-merge contacts via API; relies on manual cleanup"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Detect dupes using phone/email, tag them, and notify ops for manual merge.",
  "complexity": "low",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 4 — Global Tagging Conventions & Auto-Tag Framework**
```json
{
  "inventoryId": "CRM_TAGGING_CONVENTIONS",
  "titleTemplate": "Implement global tagging conventions and automate tag application via workflows",
  "category": "CRM",
  "valueCategory": "Data Quality",
  "ghlComponents": ["Tags", "Workflows"],
  "ghlTriggers": ["Tag Added", "Form Submitted"],
  "ghlActions": ["Add Tag", "Remove Tag"],
  "ghlLimitations": ["No hierarchical tag groups; must be manually organized"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Create a canonical tag library and use workflows to enforce structured tagging.",
  "complexity": "low",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 5 — Contact Lifecycle Stage Framework (Cold → Warm → Hot)**
```json
{
  "inventoryId": "CRM_LIFECYCLE_STAGE_FRAMEWORK",
  "titleTemplate": "Create lifecycle stages and automate movement based on engagement and activity",
  "category": "CRM",
  "valueCategory": "Lead Qualification",
  "ghlComponents": ["Custom Fields", "Tags", "Workflows"],
  "ghlTriggers": ["Tag Added", "Form Submitted"],
  "ghlActions": ["Update Field", "Add Tag"],
  "ghlLimitations": ["No scoring model; relies on basic activity signals"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Assign lifecycle stage fields and automate transitions based on behavior and tags.",
  "complexity": "medium",
  "dependencies": ["CRM_TAGGING_CONVENTIONS"],
  "verticalTags": []
}
```
---

## **SOP 6 — Customer Data Enrichment Workflow**
```json
{
  "inventoryId": "CRM_DATA_ENRICHMENT",
  "titleTemplate": "Enrich contact profiles with missing data using form requests and tasks",
  "category": "CRM",
  "valueCategory": "Client Onboarding",
  "ghlComponents": ["Workflows", "Email", "Tasks", "Custom Fields"],
  "ghlTriggers": ["Tag Added", "Opportunity Created"],
  "ghlActions": ["Send Email", "Create Task", "Update Field"],
  "ghlLimitations": ["Cannot auto-enrich from external APIs without sidecars"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Trigger enrichment email/forms when essential data points are missing.",
  "complexity": "medium",
  "dependencies": ["CRM_FIELD_SCHEMA_STANDARDIZATION"],
  "verticalTags": []
}
```
---

## **SOP 7 — GDPR/TCPA Compliance Tagging & Consent Tracking**
```json
{
  "inventoryId": "CRM_COMPLIANCE_TAGGING",
  "titleTemplate": "Implement compliance tagging for GDPR/TCPA opt-ins with workflows",
  "category": "CRM",
  "valueCategory": "Compliance",
  "ghlComponents": ["Forms", "Custom Fields", "Tags", "Workflows"],
  "ghlTriggers": ["Form Submitted"],
  "ghlActions": ["Add Tag", "Update Field", "Internal Notification"],
  "ghlLimitations": ["No automated audit log; relies on static fields and tagging"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Capture explicit consent fields and automate tagging rules.",
  "complexity": "low",
  "dependencies": [],
  "verticalTags": []
}
```
---

## **SOP 8 — Smart List Segmentation Framework**
```json
{
  "inventoryId": "CRM_SMART_LIST_FRAMEWORK",
  "titleTemplate": "Build standardized smart list segmentation for lifecycle and campaign targeting",
  "category": "CRM",
  "valueCategory": "Segmentation",
  "ghlComponents": ["Smart Lists", "Tags", "Custom Fields"],
  "ghlTriggers": [],
  "ghlActions": [],
  "ghlLimitations": ["Smart list filters are static; no AND/OR groupings beyond native UI"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Define segmented audience buckets using lifecycle fields and tags.",
  "complexity": "low",
  "dependencies": ["CRM_LIFECYCLE_STAGE_FRAMEWORK", "CRM_TAGGING_CONVENTIONS"],
  "verticalTags": []
}
```
---

## **SOP 9 — Cold Contact Detection & Cleanup Workflow**
```json
{
  "inventoryId": "CRM_COLD_CONTACT_CLEANUP",
  "titleTemplate": "Detect cold or unengaged contacts and assign cleanup or reactivation tasks",
  "category": "CRM",
  "valueCategory": "Data Hygiene",
  "ghlComponents": ["Workflows", "Tasks", "Tags"],
  "ghlTriggers": ["Tag Added"],
  "ghlActions": ["Create Task", "Add Tag"],
  "ghlLimitations": ["Cannot detect engagement patterns beyond tag/application triggers"],
  "isSidecar": false,
  "implementationStatus": "production-ready",
  "implementationPattern": "Tag-based inactivity detection → cleanup tasks + optional nurture reactivation.",
  "complexity": "medium",
  "dependencies": [],
  "verticalTags": []
}
```

---

# END OF DOCUMENT

