# GHL-Centric Roadmap Refactor: System Analysis Report

## Executive Summary

To pivot the Strategic AI Roadmaps system around **whitelabel GoHighLevel (GHL) as the spine for all pilot deployments**, significant changes are required across database schema, roadmap content structure, UI components, and agent intelligence layer.

**Core Insight**: Current system treats roadmaps as **generic AI strategy documents**. New system must treat them as **GHL pilot deployment blueprints** with concrete implementation paths, API integration specs, and workflow automation configs.

---

## 1. DATABASE SCHEMA CHANGES

### Current State
- `roadmaps` table: Generic status tracking (draft/in_progress/delivered)
- `pilotStage`: Vague lifecycle tracking (proposed/active/completed)
- `tenant_documents`: Generic document storage without pilot-specific metadata
- No GHL-specific fields or pilot configuration storage

### Required Changes

#### A. New `ghl_pilot_configs` Table
```sql
CREATE TABLE ghl_pilot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- GHL Instance Configuration
  ghl_location_id VARCHAR(255),
  ghl_api_key_encrypted TEXT,
  ghl_webhook_secret VARCHAR(255),
  ghl_environment VARCHAR(20) DEFAULT 'sandbox', -- sandbox | production
  
  -- Pilot Scope
  pilot_type VARCHAR(50) NOT NULL, -- crm_automation | lead_response | workflow_builder | full_stack
  workflows_enabled JSONB DEFAULT '[]'::jsonb, -- ["lead_intake", "maintenance_tickets", "client_onboarding"]
  integrations JSONB DEFAULT '{}'::jsonb, -- {"zapier": {...}, "make": {...}}
  
  -- Deployment Status
  setup_status VARCHAR(30) DEFAULT 'pending', -- pending | provisioning | active | paused | decomissioned
  go_live_date DATE,
  pilot_start_date DATE,
  pilot_end_date DATE,
  
  -- Success Metrics
  baseline_metrics JSONB DEFAULT '{}'::jsonb,
  target_metrics JSONB DEFAULT '{}'::jsonb,
  actual_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Technical Specs
  custom_fields_config JSONB DEFAULT '[]'::jsonb,
  pipeline_config JSONB DEFAULT '{}'::jsonb,
  automation_triggers JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### B. Extend `roadmaps` Table
```sql
ALTER TABLE roadmaps
  ADD COLUMN ghl_pilot_config_id UUID REFERENCES ghl_pilot_configs(id),
  ADD COLUMN pilot_scope_doc_url VARCHAR(500), -- Link to detailed pilot scope (Notion/Google Doc)
  ADD COLUMN implementation_timeline JSONB, -- Week-by-week sprint plan
  ADD COLUMN ghl_workflow_ids JSONB DEFAULT '[]'::jsonb, -- Actual GHL workflow UUIDs
  ADD COLUMN deployment_checklist JSONB DEFAULT '[]'::jsonb; -- [{step, status, notes}]
```

#### C. Extend `tenant_documents` Table
```sql
ALTER TABLE tenant_documents
  ADD COLUMN document_type VARCHAR(50), -- roadmap_section | ghl_config | workflow_spec | api_doc | sop
  ADD COLUMN ghl_workflow_ref VARCHAR(255), -- Links doc to specific GHL workflow
  ADD COLUMN pilot_phase VARCHAR(30); -- discovery | design | build | pilot | production
```

---

## 2. ROADMAP CONTENT STRUCTURE CHANGES

### Current State
8-section generic AI roadmap:
1. Executive Summary (business case)
2. Diagnostic Analysis (pain points)
3. System Architecture (tech stack)
4. High-Leverage Systems (recommendations)
5. Implementation Plan (timeline)
6. SOP Pack (procedures)
7. Metrics Dashboard (KPIs)
8. Appendix (resources)

### Required Changes

#### New 10-Section GHL Pilot Roadmap

1. **Executive Summary** *(unchanged but reframed)*
   - Business context + GHL as solution anchor
   
2. **Diagnostic Analysis** *(enhanced)*
   - Add: "GHL Workflow Mapping" subsection
   - Map each pain point to specific GHL features/automations
   
3. **GHL Architecture Blueprint** *(replaces generic System Architecture)*
   - GHL location structure
   - Custom field definitions
   - Pipeline stages & automation rules
   - Integration map (Zapier/Make workflows)
   - API endpoints to be used
   - Webhook configurations
   
4. **Pilot Scope Definition** *(NEW)*
   - Exact workflows to be built
   - Success criteria per workflow
   - Week-by-week sprint breakdown
   - Demo script for go-live
   - Rollback procedures
   
5. **GHL Workflow Specifications** *(NEW - replaces High-Leverage Systems)*
   - One subsection per workflow
   - Each includes:
     - Trigger conditions
     - Step-by-step automation logic
     - Custom field requirements
     - API calls / webhooks
     - Error handling
     - Testing checklist
   
6. **Implementation Sprint Plan** *(replaces generic Implementation Plan)*
   - Sprint 1-2: GHL setup + custom fields
   - Sprint 3-4: Core workflows (lead intake, CRM sync)
   - Sprint 5-6: Advanced automation + integrations
   - Sprint 7-8: Testing + team training
   - Sprint 9: Pilot go-live
   
7. **GHL Configuration Docs** *(replaces SOP Pack)*
   - API key setup
   - Webhook configuration
   - Custom field definitions (exportable CSV)
   - Pipeline stage definitions
   - User permissions matrix
   
8. **Workflow SOPs** *(NEW)*
   - End-user procedures for each workflow
   - Troubleshooting guides
   - Admin maintenance tasks
   
9. **Metrics Dashboard** *(enhanced)*
   - Add: GHL-specific KPIs (workflow completion rates, automation uptime, API error rates)
   
10. **Appendix** *(enhanced)*
    - Add: GHL API reference links, webhook payload examples, Zapier/Make templates

---

## 3. UI/UX CHANGES

### A. Dashboard Changes

#### Current State
- Generic "Roadmap Status" card (Draft/Finalized)
- No pilot-specific tracking

#### Required
- **GHL Pilot Status Card** (replaces Roadmap Status):
  - Shows: Setup phase, workflows deployed, go-live date
  - Color-coded status: Gray (pending) → Blue (provisioning) → Green (active)
  - Quick actions: "Configure GHL", "View Workflows", "Test Sandbox"
  
- **Pilot Progress Timeline**:
  - Visual sprint tracker (similar to PhaseTimeline but GHL-specific)
  - Shows: Sprint 1-9 with completion status
  - Milestone markers: Setup Complete → First Workflow Live → Pilot Launch
  
- **GHL Integration Health Card**:
  - API status indicator
  - Webhook health check
  - Last sync timestamp
  - Error log link

#### New Dashboard Layout
```
Left Column:
- Journey Progress (unchanged)
- Key Findings (unchanged)
- GHL Pilot Status Card (NEW - replaces Roadmap Status)
- Leadership Team Status

Right Column:
- Pilot Progress Timeline (NEW)
- GHL Integration Health (NEW)
- This Week's Focus (pilot-specific tasks)
- Documents (filtered: GHL configs, workflow specs)
```

### B. Roadmap Viewer Changes

#### Current State
- Generic markdown viewer
- 8 static sections

#### Required
- **Interactive GHL Blueprint Mode**:
  - Toggle view: "Documentation" vs "Implementation"
  - Implementation view shows:
    - Checklist overlay on each section
    - "Mark as Complete" buttons
    - Link to actual GHL location (opens in new tab)
    - Copy code blocks (for API calls, webhook configs)
  
- **Workflow Visualizer**:
  - New tab/section: "Workflow Map"
  - Visual flowchart of all GHL workflows (Mermaid diagrams)
  - Click workflow → see detailed spec + implementation status
  
- **GHL Configuration Exporter**:
  - Button: "Export GHL Configs"
  - Generates CSV of custom fields, pipelines, automations
  - Ready to import into actual GHL instance

---

## 4. AGENT INTELLIGENCE CHANGES

### Current State
- Generic agent personality: "consultant guiding AI adoption"
- Roadmap treated as reference doc for questions
- No pilot-specific guidance

### Required Changes

#### A. Agent Personality Update (`agentPersonality.ts`)

Add GHL Implementation Specialist persona:
```typescript
You are a GHL Implementation Specialist guiding {Owner Name} through their pilot deployment.

Core Expertise:
- GoHighLevel platform architecture & best practices
- Workflow automation design patterns
- API integration debugging
- Pilot success metrics tracking

When discussing the roadmap:
- Always reference specific GHL features/workflows
- Provide copy-paste GHL config snippets when relevant
- Ask clarifying questions about their GHL environment
- Warn about common GHL pitfalls (API rate limits, webhook timeouts, etc.)

If owner asks about implementation:
- Walk through step-by-step in GHL UI terms
- Offer to generate automation logic pseudocode
- Suggest testing procedures
```

#### B. Roadmap Context Enhancement (`assistantProvisioning.service.ts`)

Current: Generic "business_context" with roadmap summary

Required: **GHL-specific context injection**:
```typescript
GHL Pilot Context:
- Pilot Type: {crm_automation}
- Target Workflows: {lead_intake, maintenance_tickets, client_onboarding}
- GHL Environment: {sandbox/production}
- Go-Live Date: {2026-03-15}
- Current Sprint: {Sprint 3 - Core Workflows}
- Setup Status: {provisioning/active/paused}

Active Workflows:
1. Lead Intake Automation
   - Trigger: New contact via web form
   - Actions: Tag assignment, pipeline stage update, welcome email
   - Status: Built, testing in sandbox
   - Test URL: {ghl_sandbox_link}

2. Maintenance Ticket Routing
   - Trigger: Email to maintenance@...
   - Actions: Parse email, create opportunity, assign to vendor
   - Status: In development (Sprint 4)

When answering questions:
- Reference workflow names from this list
- Check current sprint to suggest next actions
- Use GHL terminology (Contacts, Opportunities, Pipelines, Workflows)
```

#### C. New Agent Capabilities

**Workflow Debugging Assistant**:
- If owner says "workflow not triggering", agent asks:
  - "Which workflow? {list from roadmap}"
  - "What's the trigger condition?"
  - "Can you share the GHL workflow ID?"
  - Then walks through debugging steps

**Sprint Planning Assistant**:
- Knows current sprint from roadmap
- Suggests next week's tasks based on timeline
- Reminds about upcoming milestones

**Configuration Generator**:
- Owner: "I need a custom field for property address"
- Agent: "Here's the GHL custom field config JSON you can import: {...}"

---

## 5. BACKEND SERVICE CHANGES

### Current State
- `roadmap.controller.ts`: Generic CRUD for roadmap sections
- No GHL-specific endpoints

### Required New Services

#### A. `ghlPilotConfig.service.ts`
```typescript
- createPilotConfig(tenantId, pilotType, workflows[])
- updateSetupStatus(pilotConfigId, status)
- storeGhlCredentials(pilotConfigId, locationId, apiKey)
- testGhlConnection(pilotConfigId) // Validates API key
- syncWorkflowStatus(pilotConfigId) // Fetches actual GHL workflow status
- generateConfigExport(pilotConfigId) // CSV/JSON of custom fields, pipelines
```

#### B. `ghlWebhook.service.ts` *(NEW)*
```typescript
- registerWebhook(pilotConfigId, eventType)
- handleIncomingWebhook(payload)
- logWebhookEvent(pilotConfigId, event)
- validateWebhookSignature(payload, secret)
```

#### C. `pilotMetrics.service.ts` *(NEW)*
```typescript
- trackBaselineMetric(pilotConfigId, metric, value)
- recordActualMetric(pilotConfigId, metric, value)
- calculateROI(pilotConfigId)
- generatePilotReport(pilotConfigId) // Weekly status report
```

### Required API Routes

```typescript
// GHL Pilot Config
POST   /api/pilot/config
GET    /api/pilot/config/:tenantId
PUT    /api/pilot/config/:configId
DELETE /api/pilot/config/:configId

// GHL Integration
POST   /api/pilot/:configId/test-connection
POST   /api/pilot/:configId/sync-workflows
GET    /api/pilot/:configId/webhook-logs

// Pilot Metrics
POST   /api/pilot/:configId/metrics/baseline
POST   /api/pilot/:configId/metrics/actual
GET    /api/pilot/:configId/metrics/report

// Configuration Export
GET    /api/pilot/:configId/export/custom-fields
GET    /api/pilot/:configId/export/pipelines
GET    /api/pilot/:configId/export/workflows
```

---

## 6. MIGRATION STRATEGY

### Phase 1: Schema & Data (Week 1)
1. Add new database tables (`ghl_pilot_configs`, extended columns)
2. Migrate Hayes roadmap to new 10-section format
3. Create pilot config for Hayes (sandbox environment)
4. Update agent context with GHL-specific instructions

### Phase 2: Backend Services (Week 2)
1. Build `ghlPilotConfig.service.ts`
2. Build `ghlWebhook.service.ts`
3. Build `pilotMetrics.service.ts`
4. Add new API routes
5. Test with Hayes pilot config

### Phase 3: UI Components (Week 3)
1. Build GHL Pilot Status Card
2. Build Pilot Progress Timeline
3. Build GHL Integration Health Card
4. Update RoadmapViewer with Implementation Mode
5. Add Configuration Exporter

### Phase 4: Agent Enhancement (Week 4)
1. Update agent personality for GHL specialization
2. Enhance roadmap context injection
3. Add workflow debugging capabilities
4. Add configuration generation
5. Re-provision Hayes assistant

### Phase 5: Testing & Validation (Week 5)
1. End-to-end pilot flow test with Hayes
2. Validate GHL API integration
3. Test webhook handling
4. Verify metrics tracking
5. User acceptance testing with Roberta

---

## 7. CRITICAL DEPENDENCIES

### Must Have Before Starting
1. **GHL Partner Account**: Access to create whitelabel sub-accounts
2. **GHL API Access**: Confirm API tier/limits for pilot volume
3. **Webhook Infrastructure**: Ensure backend can receive/process GHL webhooks
4. **Sample GHL Configs**: Export from existing GHL instance for template

### External Integrations
- Zapier/Make API access (if workflow integrations required)
- Twilio/SendGrid (if SMS/email workflows needed)
- Stripe/payment processor (if payment workflows needed)

---

## 8. RISK ASSESSMENT

### High Risk
- **GHL API Changes**: Platform updates could break integrations
  - Mitigation: Version lock API calls, maintain fallback procedures
  
- **Pilot Scope Creep**: Clients requesting features beyond GHL capabilities
  - Mitigation: Define hard pilot boundaries in roadmap Section 4

### Medium Risk
- **Webhook Reliability**: GHL webhook failures could cause sync issues
  - Mitigation: Build retry logic, admin alert system
  
- **Training Overhead**: Teams unfamiliar with GHL UI
  - Mitigation: Record video walkthroughs, embed in roadmap

### Low Risk
- **Data Migration**: Moving from test to production environment
  - Mitigation: GHL has export/import tools

---

## 9. SUCCESS METRICS

### System-Level KPIs
- Pilot setup time: <3 days (from roadmap approval to GHL sandbox live)
- Workflow deployment success rate: >95%
- GHL API uptime: >99.5%
- Agent query resolution rate (GHL-specific): >80% first response

### Business KPIs (Per Pilot)
- Time-to-value: <30 days (from start to first workflow live)
- Workflow adoption: >80% team usage within 60 days
- ROI realized: >200% within 12 months
- Pilot-to-production conversion: >70%

---

## 10. RECOMMENDATION

**Proceed with refactor** using phased approach outlined in Section 6.

**Priority Order**:
1. Database schema (foundational)
2. Backend services (enables integration)
3. Agent intelligence (improves UX immediately)
4. UI components (makes system tangible)

**Estimated Total Effort**: 4-5 weeks for full implementation

**Key Success Factor**: Start with Hayes as pilot-of-the-pilot. Use their feedback to refine before scaling to other tenants.

---

## APPENDIX: Example Hayes GHL Pilot Config

```json
{
  "tenant_id": "hayes-uuid",
  "pilot_type": "crm_automation",
  "workflows_enabled": [
    "lead_intake_web_form",
    "maintenance_ticket_routing",
    "client_onboarding_email_sequence"
  ],
  "ghl_location_id": "hayes-sandbox-12345",
  "ghl_environment": "sandbox",
  "pilot_start_date": "2026-02-01",
  "pilot_end_date": "2026-04-30",
  "baseline_metrics": {
    "lead_response_time_minutes": 240,
    "ops_manual_hours_per_week": 10,
    "client_satisfaction_nps": 45
  },
  "target_metrics": {
    "lead_response_time_minutes": 2,
    "ops_manual_hours_per_week": 2,
    "client_satisfaction_nps": 60
  },
  "custom_fields_config": [
    {"name": "property_address", "type": "text", "required": true},
    {"name": "property_type", "type": "dropdown", "options": ["residential", "commercial"]},
    {"name": "lease_end_date", "type": "date"}
  ],
  "pipeline_config": {
    "name": "Property Management Pipeline",
    "stages": ["New Lead", "Qualified", "Showing Scheduled", "Application", "Lease Signed"]
  }
}
```

---

**END OF ANALYSIS**
