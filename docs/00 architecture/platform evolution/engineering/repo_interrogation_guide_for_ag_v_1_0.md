# Repo Interrogation Guide for AG — Ninkasi Pilot (v1.0)

Purpose: Provide a structured method for AG (engineering agent) to determine what components already exist in the repository and what must be built to support the Ninkasi Ops Event Layer Pilot.

This guide prevents duplicate work and ensures implementation aligns with the pilot architecture.

---

# Step 1 — Locate Existing API Server

Search the repository for server frameworks.

Look for:

• Express.js server initialization
• Fastify / NestJS alternatives
• API route folders

Typical locations:

/server
/src/server
/api
/services

Key files to identify:

server.ts
server.js
app.ts
index.ts

Objective:

Confirm where new endpoints for the Event Gateway should be implemented.

---

# Step 2 — Identify Webhook Handling Infrastructure

Search the repo for webhook handlers.

Keywords:

webhook
handleWebhook
incomingEvent
postEvent

Typical patterns:

router.post('/webhook/...')

Goal:

Determine whether a webhook ingestion layer already exists that can receive NetSuite events.

---

# Step 3 — Inspect Data Storage Layer

Determine how the system persists operational data.

Search for:

• ORM usage (Prisma, TypeORM, Drizzle)
• Database client initialization
• Model definitions

Files to locate:

schema.prisma
entities
models
migrations

Objective:

Confirm where the **Exception Event Schema** should be defined.

---

# Step 4 — Check Existing Messaging / Notification Integrations

Search for integrations that could support SMS notifications.

Look for:

Twilio
GHL API
SendGrid
SMTP

Keywords:

sendSMS
notifyUser
sendMessage
notificationService

Goal:

Determine whether SMS infrastructure already exists or must be added.

---

# Step 5 — Inspect Existing Portal UI

Locate the tenant-facing interface.

Possible locations:

/frontend
/client
/apps/web
/src/ui

Search for:

Dashboard components
Table views
Ticket interfaces

Goal:

Identify the correct location for implementing the **Exception Command Center** UI.

---

# Step 6 — Locate Aggregation / Analytics Services

Search for services that compute metrics.

Keywords:

metrics
analytics
aggregate
stats
insights

Look for background workers or scheduled jobs.

Goal:

Determine whether a service exists that can compute:

MTTA
MTTR
Exception counts
Escalation rates

---

# Step 7 — Check Configuration Management

Identify where environment variables and system configuration are stored.

Look for:

.env files
config directories
settings modules

Goal:

Add configuration entries for:

variance thresholds
escalation timing
notification endpoints

---

# Step 8 — Map Existing Domain Models

Search the repo for related domain objects.

Possible names:

Incident
Ticket
Alert
Event
Issue

Goal:

Determine whether the new **Exception Ticket object** should extend an existing model or be created as a new entity.

---

# Step 9 — Evaluate Logging Infrastructure

Operational systems must log all exception activity.

Search for:

logger
pino
winston

Confirm ability to log:

webhook events
status transitions
escalations

---

# Step 10 — Produce Repo State Report

After interrogation, AG should produce a report containing:

Existing Components

• API server
• database layer
• messaging integrations
• UI framework

Missing Components

• Event Gateway endpoint
• Exception Event schema
• SMS response parser
• Trust Console aggregation logic

This report becomes the starting point for implementation planning.

---

# Expected Outcome

After completing this interrogation process, AG should know exactly:

• where new code must be added
• which services already exist
• which integrations must be created

This eliminates implementation ambiguity and accelerates pilot build.

---

End of Document

