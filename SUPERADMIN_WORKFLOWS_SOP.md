# Super Admin Workflows SOP

## Purpose

This SOP defines the repeatable operational loops the Super Admin executes during Phase 1 of the Strategic AI Roadmap system: onboarding 20 firms, collecting leadership intake data, constructing roadmaps manually, and tracking pilot proposals and conversions.

## Workflow 1: Onboard a New Firm

### Trigger

Firm expresses interest or is selected for 20→10 cohort.

### Steps

1. Super Admin creates/accepts owner account.
2. Tag the firm with cohort label (e.g., "Eugene Q1 2026").
3. Trigger leadership invites:

   * Owner role (optional if self-registered)
   * Ops Lead
   * Sales Lead
   * Delivery Lead
4. Monitor intake status from SA Dashboard.

### Outputs

* Firm created
* Leadership invites active
* Intake progress displayed in SA Home

---

## Workflow 2: Intake Completion Review

### Trigger

At least one leadership intake submitted.

### Steps

1. SA opens Firm Detail Page.
2. Review each completed intake:

   * Identify bottlenecks
   * Capture quotes
   * Note obvious wins and revenue leaks
3. Add internal notes (3–5 bullets).
4. If all required roles completed:

   * Set Intake Status = Complete.
   * Set Roadmap Status = Ready or In Progress.

### Outputs

* Firm marked as ready for roadmap construction
* Internal insight captured for used in manual roadmap

---

## Workflow 3: Roadmap Delivery

### Trigger

Manual roadmap has been created offline and is ready for delivery.

### Steps

1. Upload or link Roadmap PDF to Firm Detail.
2. Set Roadmap Status = Delivered.
3. Add notes for follow-up call.

### Outputs

* Firm formally receives roadmap
* SA Dashboard reflects updated lifecycle state

---

## Workflow 4: Pilot Tracking

### Trigger

Roadmap debrief meeting held.

### Steps

1. Update Pilot Status:

   * Not Proposed
   * Proposed
   * Won
   * Lost
2. Add internal notes:

   * Key objections
   * Reasons for win/loss
   * Next steps

### Outputs

* Accurate view of 20→10 conversion progress

---

## Workflow 5: Pattern Mining (Weekly)

### Trigger

Weekly operational review.

### Steps

1. Open Intake Inspector.
2. Filter by role (Owner/Ops/Sales/Delivery).
3. Identify recurring chaos loops, systemic bottlenecks, and CRM patterns.
4. Update internal notes and future roadmap frameworks.
5. Capture insights for Phase 2 platform requirements.

### Outputs

* Enhanced roadmap templates
* Clear requirements for future platform builds

---

## Workflow 6: Invite Management

### Trigger

Pending or failed invites.

### Steps

1. Open System Panel.
2. Locate pending invites.
3. Resend or revoke invites if needed.
4. If email delivery fails repeatedly, use manual outreach.

### Outputs

* Leadership roles successfully onboarded

---

## Workflow 7: Health Monitoring

### Trigger

Periodic check or issue reported.

### Steps

1. Review light error logs.
2. Identify repeated errors (invite send failures, intake submission issues).
3. Escalate to developer if systemic.

### Outputs

* Intake portal stability

---

## Notes

* All status changes must be intentional and tied to real-world events (intake completion, roadmap delivery, pilot conversation).
* SA Dashboard acts as the operational command center—no external spreadsheets should be required.
* Keep the system simple until Phase 2, where automation and AI-driven analytics will be layered in.

---

## Quick Reference Table

| Workflow | Trigger | Key Actions | System Impact |
|----------|---------|-------------|---------------|
| **Onboard Firm** | New firm enrolled | Create account, tag cohort, send invites | Firm visible in SA Dashboard |
| **Intake Review** | Intake submitted | Review responses, add notes, update status | Intake Status → Complete |
| **Roadmap Delivery** | Roadmap created | Upload artifact, update status | Roadmap Status → Delivered |
| **Pilot Tracking** | Debrief meeting | Update pilot status, capture objections | Pilot Status updated |
| **Pattern Mining** | Weekly review | Analyze cross-firm patterns, extract insights | Enhanced roadmap templates |
| **Invite Management** | Failed/pending invites | Resend or revoke invites | Leadership roles complete |
| **Health Monitoring** | Periodic check | Review errors, escalate issues | System stability |

---

## Success Indicators

✅ All 20 firms visible in one dashboard  
✅ Intake → Roadmap → Pilot lifecycle tracked accurately  
✅ Internal notes enable team coordination without external tools  
✅ Weekly pattern mining informs better roadmaps  
✅ Zero manual spreadsheet tracking needed  

---

**Status:** Operational playbook complete  
**Owner:** Super Admin (tony@scend.cash)  
**Review Cadence:** Weekly during Phase 1 execution
