# **HubSpot × AI Technical Integration Reference**

### *Architecture, API Cheat Sheet, and Implementation Guide*

---

## **1. Integration Architecture Diagram**

This is the complete data flow from HubSpot → AI → HubSpot writeback. Drop this into roadmaps or technical appendices.

```text
                          ┌────────────────────────────┐
                          │        HUBSPOT CRM        │
                          │  (Contacts, Deals, etc.)  │
                          └────────────┬──────────────┘
                                       │
                                       │ 1) EVENTS / DATA
                                       │   - contact.created
                                       │   - deal.propertyChange
                                       │   - ticket.created
                                       │   - form submission
                                       │   - email engagement
                          ┌────────────▼──────────────┐
                          │   HUBSPOT TRIGGERS        │
                          │  - Webhooks (app/webhook) │
                          │  - Workflow Webhooks      │
                          │  - Scheduled API pulls    │
                          └────────────┬──────────────┘
                                       │
                                       │ 2) HTTP POST / API CALL
                                       │   payload: objects, props,
                                       │   recent engagements, context
                                       ▼
                     ┌────────────────────────────────────┐
                     │        AI INTEGRATION LAYER        │
                     │  (Your Node/Express or similar)    │
                     ├────────────────────────────────────┤
                     │  a) Validate + normalize payload   │
                     │  b) Fetch additional context       │
                     │  c) Call LLM / AI models           │
                     │     - classify lead                │
                     │     - summarize conversations      │
                     │     - score deals / tickets        │
                     │     - draft follow-up messages     │
                     │  d) Decide actions + updates       │
                     └────────────┬───────────────────────┘
                                  │
                                  │ 3) WRITEBACK TO HUBSPOT
                                  │   via REST APIs
                                  ▼
          ┌─────────────────────────────────────────────────────┐
          │              HUBSPOT PUBLIC APIs                    │
          │  - CRM v3 (contacts, companies, deals, tickets)     │
          │  - Associations                                    │
          │  - Engagements (notes, emails, tasks, calls)       │
          │  - Pipelines / Properties                          │
          │  - Lists / Workflows (indirect via properties)     │
          └────────────┬───────────────────────────────────────┘
                       │
                       │ 4) HUBSPOT AUTOMATIONS REACT
                       │   - Workflows fire on property change
                       │   - Lists auto-update
                       │   - Tasks hit reps' queues
                       │   - Dashboards / reports refresh
                       ▼
           ┌──────────────────────────────────────────────┐
           │          USER-FACING OUTCOMES                │
           │   - Lead AI: qualified, scored, routed       │
           │   - Service AI: summarized, triaged, queued  │
           │   - Mgmt AI: pipeline health & insights      │
           └──────────────────────────────────────────────┘
```

---

## **2. HubSpot API Cheat Sheet for AI Integrations**

This section is both **roadmap-usable** and **dev-ready**. Reference it during implementation or hand it to developers.

### **2.1. Authentication & App Setup**

**Private Apps (Recommended for Server-to-Server)**

* HubSpot now recommends **Private Apps** over OAuth for server-to-server integrations
* Authentication header:
  ```
  Authorization: Bearer <PRIVATE_APP_TOKEN>
  ```

**Required Scopes (Common for AI Use Cases)**

* `crm.objects.contacts.read` / `crm.objects.contacts.write`
* `crm.objects.companies.read` / `crm.objects.companies.write`
* `crm.objects.deals.read` / `crm.objects.deals.write`
* `crm.objects.tickets.read` / `crm.objects.tickets.write`
* `crm.objects.owners.read`
* `crm.schemas.custom.read` / `crm.schemas.custom.write` (for custom objects)
* `crm.objects.emails.read`
* `tickets` (Service Hub)

**Roadmap-Ready Phrasing:**

> "We'll implement a secured private app with least-privilege scopes to read/write CRM data, notes, tasks, and deal/ticket updates."

---

### **2.2. Core CRM Objects (Read/Write Context)**

These are the main API workhorses for AI integrations.

#### **Contacts**

**List/Search Contacts:**
```
GET /crm/v3/objects/contacts
POST /crm/v3/objects/contacts/search
```

**Get Single Contact with Properties:**
```
GET /crm/v3/objects/contacts/{contactId}?properties=firstname,lastname,email,phone
```

**Update Contact (AI Score, Persona):**
```
PATCH /crm/v3/objects/contacts/{contactId}
```
Request body:
```json
{
  "properties": {
    "ai_lead_score": "87",
    "ai_persona": "high_intent_smb_broker",
    "ai_pain_points": "lead_follow_up,agent_accountability"
  }
}
```

#### **Deals**

**Search/Filter Deals:**
```
POST /crm/v3/objects/deals/search
```

**Update Deal Stage/Health:**
```
PATCH /crm/v3/objects/deals/{dealId}
```
Request body:
```json
{
  "properties": {
    "dealstage": "presentationscheduled",
    "ai_health_score": "at_risk",
    "ai_stall_reason": "no_activity_14_days"
  }
}
```

#### **Tickets**

**Search Tickets:**
```
POST /crm/v3/objects/tickets/search
```

**Update Ticket Priority/Status:**
```
PATCH /crm/v3/objects/tickets/{ticketId}
```
Request body:
```json
{
  "properties": {
    "hs_ticket_priority": "HIGH",
    "ai_sentiment": "frustrated",
    "ai_category": "billing_issue"
  }
}
```

#### **Custom Objects**

If you define AI-specific entities (e.g., "AI Insights" object):

**List Schemas:**
```
GET /crm/v3/schemas
```

**Operate on Custom Objects:**
```
GET/POST/PATCH /crm/v3/objects/{objectType}
```

---

### **2.3. Associations (Linking Context)**

When AI needs to relate objects (e.g., attach note to contact + deal):

**Create Association:**
```
PUT /crm/v4/objects/{fromObjectType}/{fromObjectId}/associations/{toObjectType}/{toObjectId}/{associationType}
```

**Example:** Associating a note to both a contact and a deal

---

### **2.4. Engagements: Notes, Tasks, Emails**

This is where AI outputs become visible to users.

> **Note:** HubSpot has legacy Engagements v1 and newer CRM-based objects. Use **CRM v3** style going forward.

#### **Notes (AI Summaries, Insights)**

**Create a Note:**
```
POST /crm/v3/objects/notes
```
Request body:
```json
{
  "properties": {
    "hs_note_body": "AI Summary: Prospect is a 15-agent brokerage in the Hamptons. Main pain points: lead follow-up inconsistency (20% weekend leads never get responses), CRM adoption failure (only 3/15 agents use Follow Up Boss), owner dependency bottleneck. Recommended approach: Pattern 1 (Lead AI) pilot focused on automated lead response within 5 minutes."
  },
  "associations": [
    {
      "to": { "id": "CONTACT_ID" },
      "types": [
        {
          "associationCategory": "HUBSPOT_DEFINED",
          "associationTypeId": 280
        }
      ]
    }
  ]
}
```

#### **Tasks (AI Next Steps)**

**Create a Task:**
```
POST /crm/v3/objects/tasks
```
Request body:
```json
{
  "properties": {
    "hs_task_subject": "Call Roberta about AI roadmap follow-up",
    "hs_task_body": "AI recommends discussing Pattern 1 (Lead AI) implementation. Key talking points: 5-minute response SLA, automated routing, lead scoring.",
    "hs_task_status": "NOT_STARTED",
    "hs_task_priority": "HIGH",
    "hs_timestamp": "2025-11-22T17:00:00.000Z",
    "hubspot_owner_id": "OWNER_ID"
  },
  "associations": [
    { "to": { "id": "CONTACT_ID" }, "types": [...] }
  ]
}
```

#### **Emails/Conversations (Advanced)**

* Logged emails accessible via **Engagements/Emails API**
* You can:
  * Read email bodies
  * Summarize with AI
  * Write output back as a note or update properties

---

### **2.5. Webhooks (Event-Driven AI)**

This is the glue between HubSpot and your AI layer.

#### **HubSpot App Webhooks**

Configure in your app to subscribe to:
* `contact.creation`
* `contact.propertyChange`
* `deal.propertyChange`
* `ticket.creation`
* `ticket.propertyChange`
* `conversation.newMessage` (if using conversations)

**Webhook Payload Example:**
```json
{
  "eventId": 123,
  "subscriptionType": "contact.creation",
  "objectId": 12345,
  "occurredAt": 1732212345678,
  "portalId": 67890,
  "attemptNumber": 0,
  "changeSource": "CRM"
}
```

**Your AI Service Response Flow:**
1. Receive webhook event
2. Fetch full object via CRM API
3. Send content to LLM for analysis
4. Write back updates/notes/tasks via APIs

#### **Workflow Webhooks (Workflow-Specific)**

* Inside a workflow, choose **"Send a webhook"** action
* Point to your AI endpoint
* Payload includes selected properties
* Best for **narrow/specific flows** (e.g., "When lead reaches Stage X, send to AI for deep analysis")

---

### **2.6. Search & Filtering (Batch Jobs / Management AI)**

Power daily/weekly Management AI with batch operations:

**Search Stale Deals:**
```
POST /crm/v3/objects/deals/search
```
Request body:
```json
{
  "filters": [
    {
      "propertyName": "hs_lastmodifieddate",
      "operator": "LT",
      "value": "2025-11-01T00:00:00.000Z"
    }
  ],
  "limit": 100
}
```

**AI Processing Flow:**
1. Pipe results into AI for pipeline review
2. AI identifies stalled deals, missing data, at-risk opportunities
3. Write back:
   * `ai_health_score`
   * `ai_attention_flag`
   * Summary notes
   * Action tasks for reps

---

### **2.7. Rate Limits (Design Consideration)**

**HubSpot API Rate Limits:**
* **Professional/Enterprise:** 100 requests per 10 seconds (per app)
* **Burst limit:** Up to 150 requests in a 10-second window
* **Daily limit:** 500,000 requests per day (Enterprise)

**Design Best Practices:**
* Use **event-driven architecture** (webhooks) for real-time reactions
* Use **batch operations** for bulk updates
* Use **scheduled jobs** (cron-style) for pipeline reviews
* Avoid heavy polling

**Roadmap Phrasing:**

> "We respect HubSpot's API limits by batching operations, using event-driven triggers, and avoiding heavy polling. For typical firm volumes (50-200 contacts/day, 10-50 deals/week), this architecture stays well within standard limits."

---

### **2.8. Property Management (Custom AI Properties)**

Before AI can write custom scores/insights, you need to create custom properties.

**Create Custom Property:**
```
POST /crm/v3/properties/{objectType}
```
Request body:
```json
{
  "name": "ai_lead_score",
  "label": "AI Lead Score",
  "type": "number",
  "fieldType": "number",
  "groupName": "contactinformation",
  "description": "AI-generated lead quality score (0-100)"
}
```

**Common AI Properties to Create:**
* `ai_lead_score` (number, 0-100)
* `ai_persona` (dropdown: high_intent_buyer, tire_kicker, researcher, etc.)
* `ai_pain_points` (text)
* `ai_recommended_action` (text)
* `ai_health_score` (dropdown: healthy, at_risk, stalled)
* `ai_sentiment` (dropdown: positive, neutral, frustrated, angry)
* `ai_summary` (long text)

---

## **3. Implementation Patterns by Use Case**

### **Pattern 1: Lead AI - Typical Flow**

```
1. Form submitted on website
2. HubSpot creates contact + fires webhook
3. AI receives: name, email, company, form answers
4. AI analyzes: "Marketing agency, 10-person team, needs workflow automation"
5. AI writes back:
   - Lead Score: 85/100
   - Persona: "Marketing Agency Owner"
   - Service Category: "Workflow Automation"
   - Pain Points: "Manual client onboarding, scattered tools"
   - Recommended First Touch: [AI-generated personalized email]
6. HubSpot triggers: Assign to Sarah (workflow automation specialist)
7. HubSpot creates task: "Call within 2 hours - high-intent lead"
```

### **Pattern 2: Service AI - Typical Flow**

```
1. Client sends support email
2. HubSpot creates ticket + fires webhook
3. AI receives: email content, client history, previous tickets
4. AI analyzes: "Billing question, frustrated tone, urgent"
5. AI writes back:
   - Category: "Billing"
   - Priority: "High"
   - Sentiment: "Frustrated"
   - Draft Response: [AI-generated empathetic reply]
   - Recommended Owner: "Billing team"
6. HubSpot assigns ticket to billing queue
7. HubSpot creates task: "Respond within 1 hour (SLA)"
```

### **Pattern 3: Management AI - Typical Flow**

```
1. Daily 8am trigger
2. AI pulls all active deals from HubSpot
3. AI analyzes:
   - 3 deals stalled (no activity in 10+ days)
   - 2 deals missing key fields
   - 5 deals likely to close this week (85%+ probability)
   - Pipeline at 87% of monthly target
4. AI writes back:
   - Updates deal health scores
   - Creates "re-engage" tasks for stalled deals
   - Sends executive summary email
5. HubSpot delivers digest to leadership
6. Reps see prioritized action items in their task queue
```

---

## **4. Technical Stack Recommendations**

### **AI Integration Layer (Your Backend)**

**Recommended Stack:**
* **Runtime:** Node.js (Express) or Python (FastAPI)
* **Webhook Receiver:** Express.js route or FastAPI endpoint
* **LLM Access:** OpenAI API, Anthropic Claude, or Azure OpenAI
* **HubSpot SDK:** `@hubspot/api-client` (Node) or `hubspot-api-python` (Python)
* **Database:** PostgreSQL or MongoDB (for storing AI processing logs)
* **Queue:** Redis + Bull (for async webhook processing)
* **Hosting:** Railway, Vercel, AWS Lambda, or GCP Cloud Run

### **Example Express.js Webhook Handler**

```javascript
// POST /webhooks/hubspot/contact-created
app.post('/webhooks/hubspot/contact-created', async (req, res) => {
  const { objectId, subscriptionType } = req.body;
  
  // Respond immediately to HubSpot (required within 5 seconds)
  res.status(200).send('OK');
  
  // Process asynchronously
  await processContactCreation(objectId);
});

async function processContactCreation(contactId) {
  // 1. Fetch full contact from HubSpot
  const contact = await hubspotClient.crm.contacts.basicApi.getById(contactId);
  
  // 2. Send to AI for analysis
  const aiAnalysis = await analyzeLeadWithAI(contact.properties);
  
  // 3. Write back to HubSpot
  await hubspotClient.crm.contacts.basicApi.update(contactId, {
    properties: {
      ai_lead_score: aiAnalysis.score,
      ai_persona: aiAnalysis.persona,
      ai_pain_points: aiAnalysis.painPoints
    }
  });
  
  // 4. Create task for rep
  await hubspotClient.crm.objects.tasks.basicApi.create({
    properties: {
      hs_task_subject: `Follow up with ${contact.properties.firstname}`,
      hs_task_body: aiAnalysis.recommendedAction,
      hubspot_owner_id: aiAnalysis.recommendedOwnerId
    },
    associations: [
      { to: { id: contactId }, types: [...] }
    ]
  });
}
```

---

## **5. Security & Compliance Considerations**

### **Data Handling**

* **Minimize data exposure:** Only send necessary fields to LLM
* **No PII in prompts:** Redact sensitive data before AI processing
* **Audit logging:** Log all AI decisions and HubSpot writes
* **Encryption:** TLS 1.2+ for all API communication

### **HubSpot-Specific**

* **Webhook signature verification:** Validate webhook authenticity
* **Token security:** Store private app tokens in environment variables
* **Scope minimization:** Only request necessary API scopes
* **Error handling:** Graceful failures with retry logic

---

## **6. Roadmap-Ready Summary Block**

Use this in client deliverables:

> **"Under the hood, our AI connects to HubSpot using HubSpot's supported APIs and Webhooks. When something important happens in your CRM—like a new lead, a client question, or a deal stalling—HubSpot sends a small data packet to our AI service. The AI analyzes it, decides what's useful, and writes the results straight back into HubSpot as updated fields, notes, or tasks. Your team never has to leave HubSpot: they just see better data, clearer priorities, and AI-generated summaries where they already work."**

---

## **7. Common Implementation Gotchas**

1. **Webhook timeouts:** HubSpot requires response within 5 seconds → Always respond immediately, process asynchronously
2. **Property creation:** Custom properties must be created before AI can write to them
3. **Association type IDs:** Different for each object pair → Reference HubSpot docs
4. **Rate limit bursts:** Batch writes when possible, use exponential backoff
5. **Deleted records:** Webhook fires on deletion → Check object exists before processing
6. **Multi-portal apps:** objectId alone isn't unique → Always include portalId

---

## **8. Testing & QA Checklist**

- [ ] Webhook endpoint responds within 5 seconds
- [ ] Webhook signature verification works
- [ ] AI processing handles malformed input gracefully
- [ ] All custom properties exist in target HubSpot account
- [ ] Association type IDs are correct for target account
- [ ] Rate limits respected (no 429 errors)
- [ ] Failed writes retry with exponential backoff
- [ ] Logs capture all AI decisions and HubSpot writes
- [ ] Error notifications sent to operations team
- [ ] End-to-end flow tested: webhook → AI → writeback → workflow trigger

---

## **9. Resources & References**

* **HubSpot API Docs:** https://developers.hubspot.com/docs/api-reference
* **Webhooks Guide:** https://developers.hubspot.com/docs/api-reference/webhooks-webhooks-v3/guide
* **CRM Objects API:** https://developers.hubspot.com/docs/guides/crm/using-object-apis
* **Custom Objects:** https://developers.hubspot.com/docs/api-reference/crm-custom-objects-v3/guide
* **Workflow Webhooks:** https://knowledge.hubspot.com/workflows/how-do-i-use-webhooks-with-hubspot-workflows
* **Rate Limits:** https://developers.hubspot.com/docs/api-reference/rate-limits

---

*This technical reference is designed for both roadmap documentation and hands-on implementation. All API patterns are based on HubSpot's current v3/v4 APIs as of November 2025.*
