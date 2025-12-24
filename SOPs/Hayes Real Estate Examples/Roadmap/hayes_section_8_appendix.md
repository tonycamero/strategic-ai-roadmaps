# SECTION 8 — APPENDIX
### Hayes Real Estate Group
### Strategic AI Infrastructure Roadmap

The Appendix provides supporting technical references, diagrams, definitions, and notes that make the overall roadmap easier to implement, maintain, and extend. This section functions as a supporting knowledge base.

---

# 8.1 TOOL PRICING OVERVIEW (2025 ESTIMATES)

## **Go High Level (GHL)**
- $97–$297/mo depending on tier
- Single platform for CRM, automations, pipeline, texting, portal, tasks

## **Twilio (via GHL)**
- ~$1/month per number
- ~$0.0075 per SMS outbound

## **Jotform / Fillout**
- $39–$99/mo depending on volume
- Used for secure file uploads & onboarding packets

## **Trello (Optional Client Portal)**
- $6–$12/user/mo
- Simple and intuitive client-facing status board

## **Make.com (Automation Layer)**
- $9–$29/mo (Starter–Core)
- Enables MLS sync, DocuSign triggers, Google Drive automations

## **Google Workspace**
- $12–$18/user/mo
- Storage, docs, sheets, permissions, templates

---

# 8.2 ROLE PERMISSION MATRIX (GHL)
A simple table describing who can do what.

| Role | Permissions |
|------|-------------|
| **Owner (Roberta)** | Full access, dashboards, automations, reports |
| **Ops Director (Michael)** | Workflow creation, admin tools, pipeline management, reporting |
| **TC (David)** | Pipeline stages, document tracking, client portal, tasks |
| **Agents** | Daily tasks, conversations, pipeline updates, schedule appointments |
| **Clients** | View-only portal access, document uploads |

---

# 8.3 PIPELINE STAGE GLOSSARY

## **Buyer Pipeline**
1. New Lead
2. Contacted
3. Appointment Scheduled
4. Showing Tour
5. Offer Prep
6. Offer Submitted
7. Under Contract
8. Inspections
9. Appraisal
10. Clear to Close
11. Closed

## **Seller Pipeline**
1. New Lead
2. CMA Delivered
3. Appointment Set
4. Listing Signed
5. Photography/Staging
6. Active Listing
7. Offer Review
8. Under Contract
9. Inspections
10. Appraisal
11. Clear to Close
12. Closed

---

# 8.4 MLS → GHL SYNC SPECIFICATION
High-level workflow for Make.com integration.

```
Trigger: MLS Update or New Listing
        ↓
Make.com pulls MLS data fields
        ↓
Transform fields → GHL format
        ↓
Create/Update record in GHL pipeline
        ↓
Trigger: New task for ops / TC
```

### Required Fields Mapping
| MLS Field | GHL Field |
|-----------|-----------|
| Address | Property Address |
| Listing ID | MLS ID |
| Price | Asking Price |
| Status | Deal Stage |
| Agent | Assigned Agent |
| Notes | Internal Notes |

---

# 8.5 DOCUSIGN → STATUS UPDATE TRIGGER
Used to automate contract acceptance and signatures.

### Automation Logic
```
DocuSign Envelope Completed
        ↓
Make.com Fetch Envelope Data
        ↓
Identify Deal by: Email, MLS ID, Client Name
        ↓
Update GHL Pipeline Stage to:
  - Buyer: Under Contract
  - Seller: Under Contract
        ↓
Create TC Tasks
        ↓
Send Client Confirmation Message
```

---

# 8.6 EMAIL & SMS SENDING BEST PRACTICES

## **SMS Best Practices**
- Keep under 320 characters
- Use natural language (not salesy)
- Always include agent name
- Avoid URLs in first message (carriers flag)

## **Email Best Practices**
- Clear subject line
- Max 3–5 sentences
- One CTA per email
- Use short paragraphs

---

# 8.7 GLOSSARY OF TERMS

**SLA (Service Level Agreement)**  
Target performance levels — e.g., 5-minute lead response.

**GHL (Go High Level)**  
All-in-one CRM + workflow automation platform.

**TC (Transaction Coordinator)**  
Handles contract-to-close execution.

**Follow-Up Cadence**  
The scheduled sequence of touchpoints for a new lead.

**Portal Board**  
Client-facing status tracker for deals.

**Lead Scoring**  
Automated categorization of leads: HOT / WARM / COLD.

**Re-Engagement**  
Workflow triggered when lead goes cold.

**Pipeline Velocity**  
Measure of how quickly leads move between stages.

---

# 8.8 SYSTEM CHANGELOG (FOR FUTURE UPDATES)
A recommended practice for Hayes to track future adjustments.

**Template:**
- Date of change
- System updated (GHL/Trello/Make/etc.)
- What changed
- Why it changed
- Owner of change

---

# 8.9 TROUBLESHOOTING GUIDE

## **Issue: Leads not routing correctly**
- Check assignment rules
- Verify agent availability windows
- Confirm tags are applied properly

## **Issue: Follow-up not firing**
- Ensure lead is in correct pipeline
- Check workflow enrollment
- Verify pause conditions

## **Issue: Client not receiving portal link**
- Check automation trigger
- Verify client email
- Confirm board creation workflow executed

## **Issue: MLS data not syncing**
- Check Make.com execution history
- Verify API credentials
- Ensure MLS feed is active

---

# 8.10 SAMPLE DATA DICTIONARY
Defines the main fields used in GHL.

| Field Name | Description |
|------------|-------------|
| Lead Source | Where the lead originated |
| Budget | Buyer’s stated budget |
| Timeline | When they want to move |
| Property Type | Single-family, condo, etc. |
| Stage | Pipeline stage |
| Assigned Agent | Which agent owns the lead |
| Document Status | Pending, Received, Verified |

---

# 8.11 APPENDIX DOCUMENTS
Raw intake documents used to generate the roadmap:
- Intake Forms (Team Leads)
- Discovery Call Notes: `/mnt/data/OUTPUT_3_DISCOVERY_CALL_ANSWERS.md`
- AI Diagnostic Map
- Company Diagnostic Map

---

# END OF SECTION 8

