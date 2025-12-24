# **HubSpot Email Automation – 10-Step Implementation SOP**

*(Roadmap-ready, 100% tool-specific, written for professional-service firms)*

## **1. Confirm HubSpot Tier + Email Automation Eligibility**

Before designing anything, verify:

* Marketing Hub **Professional or Enterprise** = full workflow email automation
* Marketing Hub **Starter** = limited "simple automation" (usually insufficient for full nurture)
  If they're on Starter, flag this as a constraint in the roadmap.

## **2. Define the Firm's Core Automation Use Cases**

Every firm has 3–5 "money workflows":

* New lead → nurture sequence
* Missed call → follow-up email
* Intake form completed → send next steps
* Proposal sent → automated check-ins
* Onboarding → step-by-step client handoff

Document these clearly in the Roadmap.

## **3. Map the Enrollment Triggers**

Each workflow begins with **one conditional moment**:

* Form submission
* List membership
* Property change (e.g., "Deal Stage → Proposal Sent")
* Email engagement (e.g., clicked link)

Your roadmap should always specify *exactly which trigger* makes sense for that firm.

## **4. Create Email Assets First**

Best practice in HubSpot: **write/build the emails before building the workflow**.
This ensures:

* Clean naming
* Correct sequencing
* No broken references later

Include:

* Subject line
* Body copy
* Personalization tokens (first name, company, deal stage, etc.)
* CTA locations

## **5. Build the Workflow Structure in HubSpot**

Inside **Automation → Workflows**, create a *copy-and-paste template* structure for the firm:

* Trigger
* 2–4 timed delays (1h, 1d, 3d, 7d)
* Conditional branches ("If contact booked a call → end workflow; else → continue")
* Final "Add to list" or "Update property" action

Your roadmap calls this out visually and verbally.

## **6. Insert Guardrails (Suppression Rules)**

Critical for avoiding bad sends:

* Suppress existing customers
* Suppress people in active deals
* Suppress unqualified/lost leads
* Suppress people who unsubscribed from marketing emails

Every Roadmap should specify the suppression logic.

## **7. Configure Reporting & Conversion Signals**

For each workflow, define:

* Email open/click expectations
* Primary KPI (Booked call? Completed intake form? Paid invoice?)
* Secondary KPIs (replies, unsubscribes)

Your roadmap tells the firm exactly what signals matter.

## **8. Add Internal Alerts + Tasks**

HubSpot shines here.
Add actions like:

* "If lead clicked proposal link → create task & alert rep"
* "If onboarding stalled → send task to team inbox"
  This builds accountability into their system.

## **9. QA the Whole Build**

Checklist to insert into the Roadmap:

* All emails tested with "Send test email"
* All links verified
* All personalization tokens have fallback values
* All suppressions applied
* Workflow toggled to "Test mode" before activating

This prevents accidents that destroy trust.

## **10. Launch, Monitor, Optimize**

Your Roadmap specifies a 30-day monitoring window:

* Check performance after 24h, 7d, 14d, 30d
* Identify weak steps (email 2 rarely opened → rewrite subject)
* Tighten delays
* Fix any broken conversion paths

After 30 days, freeze the version and document improvements.

---

# **Roadmap-Ready Summary (Copy/Paste Block)**

Here's a compact version you can paste directly into any Roadmap section for a HubSpot user:

**"HubSpot already supports the automation we need. We will implement a 10-step email automation system using HubSpot's Workflow engine. This includes confirming your license tier, mapping enrollment triggers, creating the email assets, building the nurture paths, adding business-logic guardrails (suppression lists, conditional branches), enabling internal alerts, and deploying real-time reporting. After launch, we monitor for 30 days and optimize based on engagement analytics. No new tools are required."**

---

## **Implementation Timeline**

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Discovery & Setup** | Week 1 | License verification, use case mapping, trigger identification |
| **Email Asset Creation** | Week 1-2 | All email templates built with personalization tokens |
| **Workflow Construction** | Week 2-3 | All workflows built with conditional logic and suppressions |
| **QA & Testing** | Week 3 | Full test of all workflows in test mode |
| **Launch** | Week 4 | Production deployment with monitoring dashboard |
| **Optimization** | Days 1-30 | Performance analysis and iterative improvements |

---

## **Common Pitfalls to Avoid**

1. **Building workflows before emails** → Leads to broken references and rework
2. **Forgetting suppression lists** → Risk sending to customers or unsubscribed contacts
3. **No fallback personalization** → Emails show `[FIRST_NAME]` instead of names
4. **Missing conversion signals** → Can't measure what matters
5. **Skipping test mode** → Accidental sends to real contacts during setup
6. **Set-and-forget mentality** → Workflows degrade without monitoring

---

## **Success Metrics (30-Day Benchmark)**

* **Open Rate**: 25-40% (professional services baseline)
* **Click Rate**: 3-8% (varies by CTA strength)
* **Conversion Rate**: 5-15% (depends on workflow goal)
* **Unsubscribe Rate**: <0.5% (higher indicates poor targeting)
* **Task Completion**: 80%+ (for internal alert workflows)

---

## **Post-Implementation Handoff**

Once workflows are live and optimized, deliver:

1. **Workflow Documentation** – Visual map of each automation with trigger logic
2. **Performance Dashboard** – HubSpot report showing key metrics
3. **Training Materials** – How to edit emails, adjust delays, add new workflows
4. **Optimization Playbook** – What to monitor, when to adjust, how to scale

---

*This SOP is designed for drop-in use within Strategic AI Infrastructure Roadmaps for professional-service firms already using HubSpot Marketing Hub Professional or Enterprise.*
