# Agents and Assistants Specification

Complete documentation of all OpenAI assistants and agents in the Strategic AI Roadmaps system.

## Overview

The system uses **3 distinct OpenAI assistants**, each with different purposes, configurations, and access patterns:

1. **Homepage PulseAgent** (Public, Marketing)
2. **Per-Tenant Roadmap Assistants** (Private, Client-Specific)
3. **Superadmin Hayes Agent** (Internal, Operations)

---

## 1. Homepage PulseAgent (Public)

### Purpose
Public-facing conversational agent on tonycamero.com homepage. Handles marketing conversations, answers questions about the Strategic AI Roadmap offering, and qualifies leads.

### Configuration
- **Assistant ID**: `asst_DjpWRemCqKQK6M3J1E4CofqR`
- **Vector Store ID**: `vs_692740a265948191a5c129f967549aa8`
- **Model**: `gpt-4o`
- **Authentication**: None (public endpoint)
- **Rate Limiting**: IP-based and session-based

### Environment Variables
```
OPENAI_HOMEPAGE_ASSISTANT_ID=asst_DjpWRemCqKQK6M3J1E4CofqR
OPENAI_HOMEPAGE_VECTOR_STORE_ID=vs_692740a265948191a5c129f967549aa8
OPENAI_HOMEPAGE_MODEL=gpt-4o
VITE_PULSEAGENT_MODE=live
```

### Prompt/Instructions
Located in: `backend/src/pulseagent/homepagePrompt.ts`
- Export: `HOMEPAGE_PULSEAGENT_PROMPT`
- Constitution-based system with strict JSON output format
- 4-step "Yes Ladder" conversation flow
- Public knowledge only (no tenant data access)

### Knowledge Base
Located in: `backend/storage/homepage-knowledge/`
- `about-tony.md` - Tony Camero's background
- `faq-general.md` - General FAQ
- `offer-strategic-ai-roadmap.md` - Service offering details
- `program-eugene-cohort.md` - Eugene Q1 2026 cohort info

### API Endpoints
```
POST /api/public/pulseagent/homepage/chat
GET  /api/public/pulseagent/homepage/debug
```

### Services & Controllers
- Controller: `backend/src/controllers/pulseagentHomepage.controller.ts`
- Service: `backend/src/services/publicAgentSession.service.ts`
- Routes: `backend/src/routes/pulseagent.routes.ts`

### Frontend Integration
- Component: `frontend/src/pulseagent/PulseAgentShell.tsx`
- API Client: `frontend/src/pulseagent/api.ts`
- Shown on: `/`, `/cohort`, `/ai`, `/eugene-2026` (when not authenticated)

### Database Tables
```sql
public_agent_sessions
  - id (uuid)
  - session_id (text) - Client-side session identifier
  - openai_thread_id (text) - OpenAI thread ID
  - page_context (jsonb)
  - created_at
  - last_activity_at

public_agent_events
  - id (uuid)
  - session_id (text)
  - event_type (text)
  - message (text)
  - metadata (jsonb)
  - created_at
```

### Update Script
```bash
pnpm tsx src/scripts/update_homepage_assistant_instructions.ts
```

---

## 2. Per-Tenant Roadmap Assistants (Private)

### Purpose
Private assistant for each client firm. Helps users navigate their specific roadmap, answers questions about their implementation, and provides context-aware guidance.

### Configuration
- **Assistant ID**: Unique per tenant, stored in `roadmaps.assistant_id`
- **Vector Store ID**: Unique per tenant, stored in `roadmaps.vector_store_id`
- **Model**: `gpt-4o` (or configured per roadmap)
- **Authentication**: Required (owner, ops, sales, delivery roles)
- **Tenant Scoping**: Isolated per client

### Environment Variables
```
OPENAI_API_KEY=sk-...  (shared across all assistants)
```

### Prompt/Instructions
Dynamic per roadmap, includes:
- Tenant context (firm name, industry, team structure)
- Roadmap-specific content
- Role-aware responses
- Access to uploaded roadmap documents

### Knowledge Base
Per-tenant, uploaded to their vector store:
- SOP-01 diagnostic documents
- Roadmap section markdown files
- Custom documentation uploaded by superadmin

### API Endpoints
```
GET  /api/roadmap/sections (authenticated)
POST /api/agents/threads (authenticated, tenant-scoped)
GET  /api/agents/threads/:threadId/messages
```

### Services & Controllers
- Controller: `backend/src/controllers/agent.controller.ts`
- Service: `backend/src/services/agentProvision.service.ts`
- Routes: `backend/src/routes/agent.routes.ts`

### Frontend Integration
- Component: `frontend/src/components/AgentChatPanel.tsx`
- Shown on: `/roadmap`, `/dashboard` (authenticated users)
- Located: Bottom-right chat bubble

### Database Tables
```sql
roadmaps
  - id (uuid)
  - tenant_id (text)
  - assistant_id (text) - OpenAI assistant ID for this roadmap
  - vector_store_id (text) - OpenAI vector store ID
  - status
  - created_at

agent_threads
  - id (uuid)
  - tenant_id (text)
  - user_id (text)
  - openai_thread_id (text)
  - role_type (text) - owner, ops, sales, delivery
  - created_at

agent_thread_messages
  - id (uuid)
  - thread_id (uuid) -> agent_threads.id
  - role (text) - user, assistant
  - content (text)
  - created_at
```

### Provisioning Scripts
```bash
# Provision new tenant assistant
pnpm tsx src/scripts/agentsProvision.ts

# Upload roadmap to vector store
pnpm tsx src/scripts/upload_roadmap_to_vector_store.ts
```

---

## 3. Superadmin Hayes Agent (Internal)

### Purpose
Internal operations agent used by superadmin to generate SOP-01 diagnostics, analyze intake data, and assist with roadmap generation workflow.

### Configuration
- **Assistant ID**: Unique, stored in `diagnostics.assistant_id`
- **Vector Store ID**: Not used (relies on inline context)
- **Model**: `gpt-4o`
- **Authentication**: Superadmin only
- **Context**: Intake responses, tenant data

### Environment Variables
```
OPENAI_API_KEY=sk-...  (shared)
```

### Prompt/Instructions
Located in: `backend/src/sop01/hayesPrompts.ts` (or similar)
- Analyzes intake responses from 4 roles (owner, ops, sales, delivery)
- Generates structured diagnostic outputs
- Produces 4 documents per diagnostic run

### Knowledge Base
- Inline context from intake responses
- No persistent vector store
- Templated analysis framework

### API Endpoints
```
POST /api/superadmin/firms/:tenantId/sop01 (generate diagnostic)
GET  /api/superadmin/firms/:tenantId/diagnostics
```

### Services & Controllers
- Service: `backend/src/services/sop01Engine.ts`
- Controller: `backend/src/controllers/superadmin.controller.ts`
- Routes: `backend/src/routes/superadmin.routes.ts`

### Frontend Integration
- Used in: SuperAdmin firm detail page
- Button: "Generate SOP-01 Diagnostic"
- No chat interface (one-shot generation)

### Database Tables
```sql
diagnostics
  - id (uuid)
  - tenant_id (text)
  - assistant_id (text) - Hayes assistant for this diagnostic
  - status (text) - pending, complete, failed
  - outputs (jsonb) - Generated document metadata
  - created_at
```

### Provisioning Scripts
```bash
# Reprovision Hayes assistant
pnpm tsx src/scripts/reprovision_hayes_assistant.ts
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Strategic AI Roadmaps                     │
└─────────────────────────────────────────────────────────────┘

PUBLIC LAYER (Unauthenticated)
┌──────────────────────────────┐
│  Homepage PulseAgent         │
│  asst_DjpW...                │
│  - Marketing conversations   │
│  - Lead qualification        │
│  - Public knowledge only     │
└──────────────────────────────┘

CLIENT LAYER (Authenticated)
┌──────────────────────────────┐
│  Tenant A Roadmap Agent      │
│  asst_XYZ...                 │
│  - Roadmap Q&A               │
│  - Implementation guidance   │
│  - Tenant-specific docs      │
└──────────────────────────────┘
┌──────────────────────────────┐
│  Tenant B Roadmap Agent      │
│  asst_ABC...                 │
│  - Isolated from Tenant A    │
└──────────────────────────────┘

SUPERADMIN LAYER (Internal)
┌──────────────────────────────┐
│  Hayes Diagnostic Agent      │
│  asst_DEF...                 │
│  - SOP-01 generation         │
│  - Intake analysis           │
│  - Operations support        │
└──────────────────────────────┘
```

---

## Key Differences

| Feature | Homepage PulseAgent | Tenant Roadmap Agent | Hayes Agent |
|---------|-------------------|---------------------|-------------|
| **Access** | Public | Authenticated users | Superadmin only |
| **Scope** | Marketing/sales | Single tenant | Cross-tenant (admin) |
| **Sessions** | Anonymous | User-linked | One-shot |
| **Knowledge** | Static marketing docs | Dynamic roadmap docs | Inline intake data |
| **Updates** | Manual script | Auto on roadmap gen | Manual reprovision |
| **Rate Limits** | Heavy (public) | Normal | None |
| **Vector Store** | Shared, static | Per-tenant, dynamic | None |

---

## Common Configuration

All assistants share:
- **OpenAI API Key**: `OPENAI_API_KEY` (same key, different assistants)
- **Database**: Same Postgres instance (Neon)
- **Backend**: Same Express server
- **Model**: `gpt-4o` (configurable per assistant)

---

## Troubleshooting

### Homepage PulseAgent not responding
1. Check `OPENAI_HOMEPAGE_ASSISTANT_ID` is set
2. Verify assistant instructions updated: `pnpm tsx src/scripts/update_homepage_assistant_instructions.ts`
3. Check public_agent_sessions table exists
4. Verify vector store attached to assistant

### Tenant Roadmap Agent empty/404
1. Check roadmap has `assistant_id` and `vector_store_id` populated
2. Verify documents uploaded to vector store
3. Check agent_threads table for user's thread

### Hayes Agent fails
1. Check all 4 intake roles completed
2. Verify intake responses in database
3. Check SOP-01 prompt configuration
4. Review diagnostic status in database

---

## Environment Variable Checklist

### Production (Vercel/Lambda)
- [ ] `OPENAI_API_KEY`
- [ ] `OPENAI_HOMEPAGE_ASSISTANT_ID`
- [ ] `OPENAI_HOMEPAGE_VECTOR_STORE_ID`
- [ ] `OPENAI_HOMEPAGE_MODEL`
- [ ] `VITE_PULSEAGENT_MODE=live`
- [ ] `DATABASE_URL`
- [ ] `RESEND_API_KEY`
- [ ] `FROM_EMAIL`
- [ ] `FRONTEND_URL`
- [ ] `JWT_SECRET`

### Development (.env)
Same as production, with `FRONTEND_URL=http://localhost:5173`

---

## Maintenance Tasks

### Update Homepage PulseAgent prompt
```bash
cd backend
# Edit: src/pulseagent/homepagePrompt.ts
pnpm tsx src/scripts/update_homepage_assistant_instructions.ts
```

### Upload new knowledge to Homepage PulseAgent
```bash
cd backend
# Add files to: storage/homepage-knowledge/
pnpm tsx src/scripts/upload_homepage_knowledge.ts
```

### Create new tenant roadmap assistant
Automatic on roadmap generation, or manual:
```bash
pnpm tsx src/scripts/agentsProvision.ts
```

### Reprovision Hayes assistant
```bash
pnpm tsx src/scripts/reprovision_hayes_assistant.ts
```

---

## Security Notes

1. **Homepage PulseAgent**: No authentication, rate-limited, no tenant data access
2. **Tenant Agents**: JWT required, tenant-scoped, only their roadmap data
3. **Hayes Agent**: Superadmin only, full access to intake data
4. **API Keys**: Never exposed to frontend, server-side only
5. **Thread IDs**: Stored in database with user/tenant association

---

Last Updated: 2025-12-03
