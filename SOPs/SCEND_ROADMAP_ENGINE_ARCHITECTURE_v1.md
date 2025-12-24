# SCEND ROADMAP ENGINE ARCHITECTURE v1.0

## Document Control
- **Version**: 1.0
- **Date**: November 2024
- **Status**: Implementation-Ready Spec
- **Owner**: Scend Engineering Team

---

# 1. Purpose & Scope

## What the Roadmap Construction Engine Does

The **Roadmap Construction Engine** is an internal system that transforms raw firm data into production-ready strategic deliverables. Given intake JSON (owner + leadership team responses), discovery call transcripts, internal SOPs, and the GHL ticket library, the engine outputs:

1. **8-Section Strategic AI Roadmap** (Markdown format with metadata)
2. **Firm-Specific GHL Ticket Pack** (selected from master ticket library, organized into sprints)

The engine systematically diagnoses business problems, maps them to GHL-based solutions, and produces both the strategic narrative (Roadmap) and tactical execution plan (Ticket Pack). This engine will eventually be invoked by the Scend Agent Core system and Warp-based workflows, enabling automated roadmap generation for scale.

**Inputs**:
- Intake JSON (structured responses from owner + ops + sales + delivery leads)
- Discovery call answers (follow-up Q&A in Markdown)
- Internal SOPs (intake processing, discovery execution, roadmap assembly)
- GHL Ticket Library (`SCEND_GHL_TICKET_LIBRARY_v1.md`)

**Outputs**:
- `{firm_slug}_ROADMAP_v1.md` (8 sections + summary)
- `{firm_slug}_TICKET_PACK_v1.md` (selected tickets grouped into sprints)
- Metadata JSON (for agent context injection)

---

# 2. High-Level System Architecture

## Core Components

### 2.1 Intake Parser
**Purpose**: Normalize intake JSON into internal data model.

**Inputs**:
- `{firm}_intakes.json` (owner + leadership answers)
- Schema definition for intake structure

**Outputs**:
- `IntakeRecord[]` objects (one per role)
- Extracted pain points, systems, workflows, bottlenecks

**Dependencies**: None

**Processing**:
- Validates JSON schema
- Extracts structured answers by role (owner, ops, sales, delivery)
- Maps free-text answers to structured fields (pain_points, current_systems, workflow_stuck, etc.)
- Tags responses by domain (lead management, operations, client experience)

---

### 2.2 Discovery Synthesizer
**Purpose**: Convert discovery call Q&A into structured findings.

**Inputs**:
- `OUTPUT_3_DISCOVERY_CALL_ANSWERS.md` (transcribed Q&A)
- Intake records (for cross-reference)

**Outputs**:
- `DiscoveryRecord` (organized by section)
- Key quotes indexed by topic
- Follow-up insights not captured in intake

**Dependencies**: Intake Parser

**Processing**:
- Parses Markdown sections (Lead Management, Systems & Tech, Team Workflows, etc.)
- Extracts direct quotes from each role
- Identifies gaps between intake responses and discovery answers
- Tags insights by urgency (immediate, 90-day, long-term)

---

### 2.3 Diagnostic Engine
**Purpose**: Map symptoms → root causes → constraints → impact.

**Inputs**:
- Intake records
- Discovery record
- Diagnostic SOP (SOP-01 patterns)

**Outputs**:
- `DiagnosticFinding[]` (problem, root cause, impact, affected system)
- Prioritized list (by revenue impact + constraint severity)

**Dependencies**: Intake Parser, Discovery Synthesizer

**Processing**:
- **Symptom Identification**: Extract stated pain points
  - "Lead response time is 4+ hours"
  - "Document collection takes multiple follow-ups"
  - "No single source of truth for pipeline"
  
- **Root Cause Analysis**: Map symptoms to underlying failures
  - Symptom: Slow lead response → Root: No automated routing, weekend leads sit
  - Symptom: Document chaos → Root: No portal, manual email chasing
  - Symptom: Pipeline invisibility → Root: CRM adoption <20%, no shared system

- **Impact Quantification**: Calculate cost of inaction
  - Lead response failure → $300K-$500K annual loss
  - Manual ops overhead → 600-800 hours/year wasted
  - Client experience gaps → NPS risk + churn potential

- **Constraint Mapping**: Identify what breaks at scale
  - At 2× volume: Lead routing collapses, TC overloaded, owner bottleneck worsens

- **Prioritization**: Rank findings by:
  - Revenue impact (high/medium/low)
  - Execution complexity (simple/moderate/complex)
  - Dependency order (some fixes unlock others)

---

### 2.4 System Recommender
**Purpose**: Map diagnostic findings to GHL-based solutions.

**Inputs**:
- Diagnostic findings
- GHL Ticket Library (systems 1-10)
- Firm industry/vertical

**Outputs**:
- `SystemRecommendation[]` (which GHL systems solve which problems)
- Mapping table (Finding ID → System ID → Ticket IDs)

**Dependencies**: Diagnostic Engine, Ticket Library

**Processing**:
- **Finding-to-System Mapping**:
  - Finding: "Lead response time 4+ hours"
    - System 1 (Lead Intake Engine): T1.3.1, T1.3.2, T1.3.3
    - System 2 (Lead Routing): T2.1.3 (time-based routing)
  
  - Finding: "Document collection chaos"
    - System 7 (Document Automation): T7.1.1, T7.1.2, T7.3.1
  
  - Finding: "No client status visibility"
    - System 6 (Client Portal): T6.1.1, T6.2.1, T6.2.3

- **Dependency Resolution**: Some systems must precede others
  - System 1 (intake) before System 3 (follow-up)
  - System 2 (routing) before System 5 (accountability)

- **Pilot Scoping**: Select MVP tickets for 90-day pilot
  - Must-haves: Systems 1, 2, 3 (lead flow)
  - Quick wins: Systems 5, 6 (accountability + client experience)
  - Phase 2: Systems 9, 10 (nurture + analytics)

---

### 2.5 Roadmap Assembler
**Purpose**: Generate 8-section Markdown roadmap from findings + recommendations.

**Inputs**:
- Diagnostic findings
- System recommendations
- Discovery record (for quotes)
- Roadmap Assembly SOP (SOP-03)

**Outputs**:
- `{firm}_ROADMAP_v1.md` (8 sections)
- `summary.md` (250-word executive summary)
- Metadata JSON (pain points, goals, systems, timeline)

**Dependencies**: All prior components

**Processing**:

#### Section 1: Executive Summary
- Business context (industry, team size, revenue)
- Top 3 strategic challenges (from diagnostic findings)
- Recommended solution approach (GHL as spine + AI intelligence layer)
- ROI projection (time savings + revenue impact + cost avoidance)
- Success criteria (measurable outcomes)
- Next steps (90-day roadmap overview)

#### Section 2: Diagnostic Analysis
- Structured breakdown by domain:
  - Lead Flow Diagnostic (current state → failure patterns → root causes → impact)
  - Sales & Conversion Diagnostic
  - Operations & Systems Diagnostic
  - Service Delivery Diagnostic
  - Owner Bottleneck Analysis
  - Volume Stress Test (what breaks at 2× scale)
- Include direct quotes from discovery call
- Quantify each impact in dollar/hour terms

#### Section 3: GHL Architecture Blueprint
- **Replaces generic "System Architecture"**
- GHL location structure (single location vs multi-location)
- Custom field definitions (specific to firm's workflow)
- Pipeline stages (mapped to firm's actual sales process)
- Automation triggers (event-driven workflows)
- Integration map (Zillow, website forms, MLS, etc.)
- API usage (which GHL API endpoints for hybrid AI functions)
- Webhook configurations (for real-time event processing)
- Includes diagrams (Mermaid flowcharts of key workflows)

#### Section 4: Pilot Scope Definition
- **New section specific to GHL deployment**
- Exact workflows to build (from ticket library)
- Success criteria per workflow (measurable KPIs)
- Week-by-week sprint breakdown (what ships each sprint)
- Demo script for go-live (what client sees)
- Rollback procedures (if workflow fails)
- Includes per-workflow specs:
  - Trigger conditions
  - Step-by-step automation logic
  - Custom fields required
  - API calls / webhooks involved
  - Error handling rules
  - Testing checklist

#### Section 5: Implementation Sprint Plan
- **Replaces generic "Implementation Plan"**
- Sprint-by-sprint breakdown (typically 2-week sprints)
- Sprint 1-2: GHL setup + custom fields + pipelines
- Sprint 3-4: Core workflows (lead intake, routing, follow-up)
- Sprint 5-6: Advanced automation (scoring, accountability)
- Sprint 7-8: Client experience (portal, documents, status updates)
- Sprint 9-10: Testing + team training + go-live
- Each sprint includes:
  - Ticket IDs from library
  - Dependencies on prior sprints
  - Validation criteria
  - Team member assignments

#### Section 6: GHL Configuration Docs
- **Replaces generic "SOP Pack"**
- API key setup instructions
- Webhook configuration (URLs, secrets, retry logic)
- Custom field definitions (exportable CSV for import)
- Pipeline stage definitions (names, automation rules)
- User permissions matrix (who can do what)
- Integration configs (Zapier/Make templates if needed)

#### Section 7: Workflow SOPs
- **New section - end-user procedures**
- One SOP per deployed workflow
- Step-by-step instructions for:
  - Normal operation (happy path)
  - Exception handling
  - Troubleshooting common issues
  - Admin maintenance tasks
- Written for non-technical users (agents, ops staff)

#### Section 8: Metrics Dashboard
- **Enhanced with GHL-specific KPIs**
- Standard metrics:
  - Lead response time
  - Conversion rates
  - Time savings (hours/week)
  - Client satisfaction (NPS)
- GHL-specific metrics:
  - Workflow completion rates
  - Automation uptime
  - API error rates
  - SLA compliance
- Dashboard mockups (what owner sees in GHL)

#### Section 9: Appendix
- **Enhanced with GHL resources**
- GHL API reference links
- Webhook payload examples
- Zapier/Make integration templates
- Glossary of GHL terms
- FAQ for common setup questions
- Vendor contact info (GHL support, Scend support)

---

### 2.6 Ticket Mapper
**Purpose**: Select relevant tickets from master library and organize into firm-specific pack.

**Inputs**:
- System recommendations
- GHL Ticket Library
- Firm size/complexity/vertical
- Pilot timeline (default 90 days)

**Outputs**:
- `{firm}_TICKET_PACK_v1.md` (selected + organized tickets)
- Sprint assignments
- Dependency graph

**Dependencies**: System Recommender, Roadmap Assembler

**Processing**:
- **Ticket Selection**: Based on system recommendations
  - If "Lead response time" problem → select all System 1 tickets (T1.1.1 - T1.4.4)
  - If "Client status visibility" problem → select System 6 tickets (T6.1.1 - T6.4.3)

- **Dependency Ordering**: Ensure prerequisites met
  - T1.2.4 (trigger workflow) requires T1.1.3 (pipelines exist)
  - T3.1.1 (follow-up sequence) requires T1.3.1 (intake auto-response)

- **Sprint Grouping**: Organize into 2-week sprints
  - Sprint 1: Foundation (Systems 1-2, ~15-20 tickets)
  - Sprint 2: Automation (System 3-4, ~12-15 tickets)
  - Sprint 3: Experience (Systems 6-7, ~10-12 tickets)
  - Sprint 4: Accountability (System 5, ~8-10 tickets)
  - Sprint 5: Finalization (System 10 + training, ~5-8 tickets)

- **Customization**: Adapt tickets to firm specifics
  - Replace "Buyer/Seller" with firm's actual terminology
  - Add industry-specific qualification questions
  - Customize pipelines to match their stages

- **Validation Criteria**: Add per-ticket pass/fail tests
  - T1.3.1: "Lead submits form → SMS sent within 60 seconds"
  - T6.1.1: "Portal accessible via mobile device"

---

### 2.7 Output Renderer
**Purpose**: Write final Markdown files to deliverables folder.

**Inputs**:
- Assembled roadmap sections
- Ticket pack
- Metadata JSON

**Outputs**:
- `deliverables/{firm_slug}_ROADMAP_v1.md`
- `deliverables/{firm_slug}_TICKET_PACK_v1.md`
- `deliverables/{firm_slug}_metadata.json`

**Dependencies**: Roadmap Assembler, Ticket Mapper

**Processing**:
- Renders Markdown with:
  - Consistent formatting (headings, bullets, code blocks)
  - Mermaid diagrams embedded
  - Table of contents
  - Cross-references between sections
  - Agent Cheatsheet blocks appended to each section
- Validates output:
  - All sections present
  - No broken references
  - Metadata complete
  - Files under size limits (for vector store upload)

---

## System Flow Diagram

```
┌─────────────────┐
│  Intake JSON    │
│  + Discovery MD │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Intake Parser   │─────>│ IntakeRecord[]   │
└─────────────────┘      └────────┬─────────┘
                                  │
         ┌────────────────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│   Discovery     │─────>│ DiscoveryRecord  │
│  Synthesizer    │      └────────┬─────────┘
└─────────────────┘               │
                                  │
         ┌────────────────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│   Diagnostic    │─────>│DiagnosticFinding│
│     Engine      │      └────────┬─────────┘
└─────────────────┘               │
                                  │
         ┌────────────────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│     System      │─────>│ System           │
│  Recommender    │      │ Recommendation[] │
└─────────────────┘      └────────┬─────────┘
                                  │
         ┌────────────────────────┴────────────────────┐
         │                                             │
         ▼                                             ▼
┌─────────────────┐                          ┌─────────────────┐
│    Roadmap      │                          │  Ticket Mapper  │
│   Assembler     │                          │                 │
└────────┬────────┘                          └────────┬────────┘
         │                                            │
         │                                            │
         ▼                                            ▼
┌─────────────────┐                          ┌─────────────────┐
│ Roadmap v1.md   │                          │ Ticket Pack v1  │
└────────┬────────┘                          └────────┬────────┘
         │                                            │
         └────────────────┬───────────────────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  Output Renderer│
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ deliverables/   │
                 │  {firm}_*.md    │
                 └─────────────────┘
```

---

# 3. Data Model

## Entities & Relationships

### 3.1 Firm
Represents the client company.

**Fields**:
- `id`: string (UUID)
- `slug`: string (unique, URL-safe, e.g., "hayes_real_estate")
- `name`: string (e.g., "Hayes Real Estate Group")
- `industry`: string (e.g., "real_estate", "professional_services")
- `team_size`: number
- `annual_revenue`: number (optional)
- `owner_name`: string
- `owner_email`: string
- `cohort`: string (e.g., "Eugene Q1 2026")
- `created_at`: timestamp

**Relationships**:
- Has many `IntakeRecord`
- Has many `DiscoveryRecord`
- Has one `Roadmap`
- Has one `TicketPack`

---

### 3.2 IntakeRecord
Structured responses from leadership intake forms.

**Fields**:
- `id`: string (UUID)
- `firm_id`: string (FK to Firm)
- `role`: enum (owner | ops | sales | delivery)
- `user_name`: string
- `user_email`: string
- `answers`: JSONB (key-value pairs of questions → answers)
- `submitted_at`: timestamp

**Key Answer Fields** (varies by role):
- Owner: `top_priorities`, `biggest_frustration`, `ideal_state`, `workflow_stuck`, `growth_barriers`
- Ops: `current_systems`, `tech_stack`, `automation_level`, `pain_points`, `data_quality`
- Sales: `sales_process`, `lead_generation`, `crm_tools`, `conversion_challenges`
- Delivery: `delivery_process`, `project_management`, `team_size`, `bottlenecks`

**Relationships**:
- Belongs to one `Firm`
- Referenced by many `DiagnosticFinding`

---

### 3.3 DiscoveryRecord
Follow-up Q&A from discovery call transcripts.

**Fields**:
- `id`: string (UUID)
- `firm_id`: string (FK to Firm)
- `call_date`: timestamp
- `sections`: JSONB array (one per topic area)
  - Each section: `title`, `questions[]` (question, role, answer)
- `key_insights`: text array (synthesized findings)
- `priority_actions`: text array (from Q17 "top 3 priorities")

**Relationships**:
- Belongs to one `Firm`
- Referenced by many `DiagnosticFinding`

---

### 3.4 DiagnosticFinding
Structured problem diagnosis.

**Fields**:
- `id`: string (UUID)
- `firm_id`: string (FK to Firm)
- `domain`: enum (lead_management | sales | operations | delivery | owner_bottleneck)
- `symptom`: text (stated problem)
- `root_cause`: text (underlying failure)
- `impact`: text (cost in $ or hours)
- `impact_quantified`: number (annual $ loss or hours wasted)
- `constraint_severity`: enum (low | medium | high | critical)
- `affected_roles`: text array (which roles suffer from this)
- `evidence_sources`: text array (intake IDs, discovery sections)
- `priority_score`: number (1-100, calculated)

**Relationships**:
- Belongs to one `Firm`
- References many `IntakeRecord` (evidence)
- References one `DiscoveryRecord` (evidence)
- Has many `SystemRecommendation` (solutions)

---

### 3.5 SystemRecommendation
Maps findings to GHL systems.

**Fields**:
- `id`: string (UUID)
- `firm_id`: string (FK to Firm)
- `finding_id`: string (FK to DiagnosticFinding)
- `system_id`: string (from ticket library, e.g., "SYSTEM_1")
- `system_name`: string (e.g., "Lead Intake Engine")
- `ticket_ids`: text array (selected tickets, e.g., ["T1.1.1", "T1.3.1"])
- `implementation_phase`: enum (mvp | quick_win | phase_2)
- `sprint_number`: number (which sprint this deploys in)
- `expected_outcome`: text (what this system fixes)
- `success_metrics`: JSONB (KPIs to track)

**Relationships**:
- Belongs to one `Firm`
- Belongs to one `DiagnosticFinding`
- References many `Ticket` (via ticket_ids)

---

### 3.6 Roadmap
Container for the 8-section roadmap.

**Fields**:
- `id`: string (UUID)
- `firm_id`: string (FK to Firm)
- `version`: string (e.g., "v1.0")
- `status`: enum (draft | in_review | finalized)
- `generated_at`: timestamp
- `finalized_at`: timestamp (nullable)
- `metadata`: JSONB
  - `top_pain_points`: text array
  - `primary_goals`: text array
  - `systems_recommended`: text array
  - `timeline`: object (30/60/90 day milestones)
  - `roi_projection`: object (time_savings, revenue_impact, cost_avoidance)

**Relationships**:
- Belongs to one `Firm`
- Has many `RoadmapSection` (8 sections)

---

### 3.7 RoadmapSection
Individual sections of the roadmap.

**Fields**:
- `id`: string (UUID)
- `roadmap_id`: string (FK to Roadmap)
- `section_number`: number (1-10, where 10 is outcomes/learning)
- `section_name`: enum (executive_summary | diagnostic_analysis | ghl_architecture | pilot_scope | implementation_sprint | ghl_config | workflow_sops | metrics_dashboard | appendix | outcomes_learning)
- `content_markdown`: text (full Markdown content)
- `status`: enum (planned | in_progress | implemented | deprecated)
- `last_updated_at`: timestamp
- `agent_cheatsheet`: JSONB
  - `section_role`: text
  - `important_facts`: text array (top 3)
  - `key_decisions`: text array (top 3)
  - `expected_actions`: text array (top 3)
  - `connections`: text (how this section relates to others)
- `word_count`: number
- `diagrams`: text array (Mermaid diagram definitions)

**Relationships**:
- Belongs to one `Roadmap`

---

### 3.8 Ticket
Reference to master ticket library.

**Fields**:
- `ticket_id`: string (PK, e.g., "T1.1.1")
- `system_id`: string (e.g., "SYSTEM_1")
- `system_name`: string (e.g., "Lead Intake Engine")
- `subsystem_id`: string (e.g., "1.1")
- `subsystem_name`: string (e.g., "Lead Capture Setup")
- `title`: text (e.g., "Configure GHL inbound phone number")
- `description`: text (full task description)
- `dependencies`: text array (other ticket IDs that must complete first)
- `validation_criteria`: text array (pass/fail tests)
- `estimated_hours`: number
- `ticket_type`: enum (ghl_native | hybrid | external)
- `tags`: text array (e.g., ["real_estate", "lead_management"])

**Relationships**:
- Referenced by many `SystemRecommendation`
- Referenced by many `TicketPack` (via pack assignments)

---

### 3.9 TicketPack
Firm-specific selection and organization of tickets.

**Fields**:
- `id`: string (UUID)
- `firm_id`: string (FK to Firm)
- `version`: string (e.g., "v1.0")
- `status`: enum (not_started | in_progress | completed)
- `total_tickets`: number
- `total_sprints`: number
- `sprint_assignments`: JSONB array
  - Each sprint: `sprint_number`, `name`, `ticket_instances[]`, `planned_start`, `planned_end`
- `totals`: JSONB (rollup stats)
  - `tickets`: number (total)
  - `done`: number
  - `in_progress`: number
  - `blocked`: number
  - `not_started`: number
- `created_at`: timestamp

**Relationships**:
- Belongs to one `Firm`
- References many `Ticket` (via sprint_assignments)

---

### 3.10 TicketInstance
Per-firm instance of a ticket with completion state.

**Fields**:
- `id`: string (UUID)
- `ticket_pack_id`: string (FK to TicketPack)
- `ticket_id`: string (FK to Ticket, e.g., "T1.3.1")
- `status`: enum (not_started | in_progress | blocked | done | skipped)
- `assignee`: string (nullable, e.g., "Michael", "Scend Impl")
- `started_at`: timestamp (nullable)
- `completed_at`: timestamp (nullable)
- `notes`: text (nullable)

**Relationships**:
- Belongs to one `TicketPack`
- References one `Ticket`

---

### 3.11 ImplementationSnapshot
Point-in-time metrics capture for learning loop.

**Fields**:
- `id`: string (UUID)
- `firm_id`: string (FK to Firm)
- `date`: timestamp
- `label`: enum (baseline | 30d | 60d | 90d | custom)
- `source`: enum (manual | ghl_export | api)
- `metrics`: JSONB
  - `lead_response_minutes`: number (nullable)
  - `lead_to_appt_rate`: number (nullable, 0-1)
  - `close_rate`: number (nullable, 0-1)
  - `crm_adoption_rate`: number (nullable, 0-1)
  - `weekly_ops_hours`: number (nullable)
  - `nps`: number (nullable, -100 to 100)
- `notes`: text (nullable)

**Relationships**:
- Belongs to one `Firm`
- Referenced by many `RoadmapOutcome`

---

### 3.12 RoadmapOutcome
Realizations and learning from roadmap implementation.

**Fields**:
- `id`: string (UUID)
- `firm_id`: string (FK to Firm)
- `roadmap_id`: string (FK to Roadmap)
- `baseline_snapshot_id`: string (FK to ImplementationSnapshot)
- `at_30d_snapshot_id`: string (nullable, FK to ImplementationSnapshot)
- `at_60d_snapshot_id`: string (nullable, FK to ImplementationSnapshot)
- `at_90d_snapshot_id`: string (nullable, FK to ImplementationSnapshot)
- `deltas`: JSONB
  - `lead_response_minutes`: number (nullable)
  - `lead_to_appt_rate`: number (nullable)
  - `crm_adoption_rate`: number (nullable)
  - `weekly_ops_hours`: number (nullable)
  - `nps`: number (nullable)
- `realized_roi_12_months_estimate`: JSONB (nullable)
  - `time_savings_hours_annual`: number
  - `time_savings_value_annual`: number
  - `revenue_impact_annual`: number
  - `cost_avoidance_annual`: number
  - `net_roi_percent`: number
- `status`: enum (on_track | at_risk | off_track)
- `notes`: text (nullable)

**Relationships**:
- Belongs to one `Firm`
- Belongs to one `Roadmap`
- References many `ImplementationSnapshot`

---

## Entity Relationship Diagram

```
┌─────────┐
│  Firm   │
└────┬────┘
     │
     ├─────> IntakeRecord (1:N)
     │
     ├─────> DiscoveryRecord (1:1)
     │
     ├─────> DiagnosticFinding (1:N)
     │          │
     │          └─────> SystemRecommendation (1:N)
     │                      │
     │                      └─────> Ticket (N:M via ticket_ids)
     │
     ├─────> Roadmap (1:1)
     │          │
     │          ├─────> RoadmapSection (1:10)
     │          │
     │          └─────> RoadmapOutcome (1:N)
     │                      │
     │                      └─────> ImplementationSnapshot (N:M)
     │
     ├─────> TicketPack (1:1)
     │          │
     │          └─────> TicketInstance (1:N)
     │                      │
     │                      └─────> Ticket (N:1)
     │
     └─────> ImplementationSnapshot (1:N)
```

---

# 4. Core Workflows

## 4.1 New Firm → First Roadmap

**Input Requirements**:
- `intake/{firm_slug}_intakes.json` (owner + leadership answers)
- `intake/{firm_slug}_discovery.md` (call transcript)
- Access to `SCEND_GHL_TICKET_LIBRARY_v1.md`
- Access to SOPs (01, 02, 03)

**Steps**:

1. **Initialize Firm Record**
   - Extract firm metadata from intake (name, industry, team size)
   - Generate firm slug (e.g., "hayes_real_estate")
   - Create Firm entity in database

2. **Parse Intake Data**
   - Call `IntakeParser.parse(intakeJSON)`
   - Create `IntakeRecord` for each role (owner, ops, sales, delivery)
   - Validate all required fields present
   - Store records in database

3. **Synthesize Discovery Insights**
   - Call `DiscoverySynthesizer.process(discoveryMD, intakeRecords)`
   - Extract Q&A by section
   - Identify gaps between intake and discovery
   - Create `DiscoveryRecord`
   - Store in database

4. **Run Diagnostic Analysis**
   - Call `DiagnosticEngine.analyze(intakeRecords, discoveryRecord)`
   - For each domain (lead mgmt, sales, ops, delivery, owner):
     - Identify symptoms
     - Trace root causes
     - Quantify impact
     - Assess constraints
   - Create `DiagnosticFinding[]`
   - Calculate priority scores
   - Store findings in database

5. **Generate System Recommendations**
   - Call `SystemRecommender.recommend(diagnosticFindings, ticketLibrary)`
   - Map each finding to relevant GHL systems
   - Select specific tickets per system
   - Resolve dependencies
   - Assign to implementation phases (MVP / Quick Win / Phase 2)
   - Organize into sprints
   - Create `SystemRecommendation[]`
   - Store in database

6. **Assemble Roadmap**
   - Call `RoadmapAssembler.build(firm, findings, recommendations, discovery)`
   - Generate each of 8 sections:
     - Section 1: Executive Summary (findings → ROI → next steps)
     - Section 2: Diagnostic Analysis (detailed breakdown per domain)
     - Section 3: GHL Architecture (custom fields, pipelines, webhooks)
     - Section 4: Pilot Scope (workflows to build, success criteria)
     - Section 5: Implementation Sprints (week-by-week plan)
     - Section 6: GHL Config Docs (API keys, webhooks, permissions)
     - Section 7: Workflow SOPs (end-user procedures)
     - Section 8: Metrics Dashboard (KPIs to track)
     - Section 9: Appendix (GHL resources, glossary)
   - Generate summary.md (250-word overview)
   - Create Agent Cheatsheet blocks per section
   - Create `Roadmap` and `RoadmapSection[]` entities
   - Store in database

7. **Map Tickets to Pack**
   - Call `TicketMapper.createPack(firm, recommendations, ticketLibrary)`
   - Select tickets from library based on recommendations
   - Group into sprints (typically 5 sprints for 90-day pilot)
   - Add validation criteria per ticket
   - Customize tickets to firm specifics
   - Create `TicketPack` entity
   - Store in database

8. **Render Output Files**
   - Call `OutputRenderer.render(roadmap, ticketPack)`
   - Generate `deliverables/{firm_slug}_ROADMAP_v1.md`
     - Include TOC
     - Embed Mermaid diagrams
     - Format code blocks
     - Add cross-references
   - Generate `deliverables/{firm_slug}_TICKET_PACK_v1.md`
     - Organize by sprint
     - Include dependencies
     - Add validation criteria
   - Generate `deliverables/{firm_slug}_metadata.json`
     - Extract roadmap metadata for agent context
   - Write files to disk

9. **Validate Outputs**
   - Check all sections present (9 sections + summary)
   - Verify no broken references
   - Validate Markdown syntax
   - Ensure metadata complete
   - Check file sizes (<100KB per section for vector store)

10. **Return Completion Status**
    - Output file paths
    - Validation results
    - Summary stats (word count, ticket count, sprint count)

**Outputs**:
- `deliverables/hayes_real_estate_ROADMAP_v1.md` (complete 8-section roadmap)
- `deliverables/hayes_real_estate_TICKET_PACK_v1.md` (85 tickets in 5 sprints)
- `deliverables/hayes_real_estate_metadata.json` (for agent injection)

**Error Handling**:
- If intake JSON invalid → return schema validation errors
- If discovery file missing → generate roadmap with intake only (flag for manual review)
- If ticket library unavailable → fail with clear error
- If any component throws → log error, partial outputs retained for debugging

---

## 4.2 Revisions / New Version of Roadmap

**Trigger Conditions**:
- Updated intake (client re-submitted answers)
- New discovery call (follow-up Q&A)
- SOP changes (diagnostic patterns updated)
- Ticket library changes (new systems added)
- Client feedback (wants different scope)

**Steps**:

1. **Load Existing Roadmap**
   - Fetch `Roadmap` and all `RoadmapSection[]` from database
   - Load `TicketPack` and assigned tickets
   - Retrieve all diagnostic findings and recommendations

2. **Identify Changes**
   - If new intake → re-run `IntakeParser.parse()`
   - If new discovery → re-run `DiscoverySynthesizer.process()`
   - Compare new vs old `IntakeRecord[]` and `DiscoveryRecord`
   - Flag changed answers

3. **Re-run Affected Components**
   - If diagnostic inputs changed → re-run `DiagnosticEngine.analyze()`
   - If findings changed → re-run `SystemRecommender.recommend()`
   - If recommendations changed → re-run `RoadmapAssembler.build()`
   - Otherwise, skip unchanged components

4. **Version Control**
   - Increment version (v1.0 → v1.1 for minor, v2.0 for major)
   - Archive previous version
   - Create new `Roadmap` entity with incremented version
   - Link to same `Firm`

5. **Generate Diff Report**
   - Compare old vs new roadmap sections
   - Highlight changed sections
   - Generate change summary (what changed and why)
   - Include in metadata

6. **Render Updated Files**
   - Write new version: `{firm}_ROADMAP_v1.1.md`
   - Write updated ticket pack: `{firm}_TICKET_PACK_v1.1.md`
   - Write metadata: `{firm}_metadata_v1.1.json`
   - Generate changelog: `{firm}_ROADMAP_CHANGELOG.md`

7. **Notify Stakeholders**
   - Flag in database that new version available
   - Agent can surface change notification to owner

**Versioning Rules**:
- **Minor version (v1.0 → v1.1)**: Updated answers, refined diagnostics, no scope change
- **Major version (v1.0 → v2.0)**: New systems added, pilot scope expanded, significant re-architecture

---

## 4.3 Ticket Mapping Workflow

**Purpose**: Select and organize tickets from master library into firm-specific pack.

**Inputs**:
- `SystemRecommendation[]` (which systems to build)
- `SCEND_GHL_TICKET_LIBRARY_v1.md` (master catalog)
- Firm metadata (industry, size, complexity)
- Pilot timeline (default 90 days)

**Steps**:

1. **Load Ticket Library**
   - Parse `SCEND_GHL_TICKET_LIBRARY_v1.md`
   - Index tickets by system_id and ticket_id
   - Load dependency graph

2. **Filter by Recommendations**
   - For each `SystemRecommendation`:
     - If recommends "System 1" → select all T1.x.x tickets (unless explicitly excluded)
     - If recommends "System 3.1" only → select T3.1.x tickets (not all of System 3)
   - Result: Initial ticket set

3. **Apply Industry Customization**
   - If real estate → include T1.4.1 (buyer qualification)
   - If e-commerce → exclude T1.4.1, include T1.4.5 (product interest capture)
   - Replace generic terminology with firm-specific terms

4. **Resolve Dependencies**
   - Build dependency graph
   - Ensure no ticket selected without its prerequisites
   - If T3.1.1 selected but not T1.3.1 → auto-add T1.3.1
   - Order tickets topologically

5. **Group into Sprints**
   - Default: 2-week sprints
   - Sprint 1 (Foundation): Systems 1-2 (intake + routing)
   - Sprint 2 (Automation): Systems 3-4 (follow-up + scoring)
   - Sprint 3 (Experience): Systems 6-7 (portal + documents)
   - Sprint 4 (Accountability): System 5 (tasks + SLAs)
   - Sprint 5 (Finalization): System 10 + training
   - Ensure each sprint has 10-20 tickets (balanced workload)

6. **Add Validation Criteria**
   - For each ticket, define pass/fail test:
     - T1.3.1: "Lead submits form → SMS sent <60s → SMS contains {lead_name}"
     - T6.1.1: "Portal accessible on mobile → Client can see status → Tasks update in real-time"
   - Link to test scripts if automated testing available

7. **Calculate Time Estimates**
   - Sum estimated hours per ticket
   - Validate sprint workload (should be 40-80 hours per sprint for 1-2 person team)
   - Flag if timeline infeasible

8. **Generate Ticket Pack Document**
   - Write Markdown:
     - Header: Firm name, version, total tickets, total sprints
     - Sprint-by-sprint breakdown
     - Ticket details (ID, title, description, validation, dependencies)
     - Timeline Gantt chart (if possible)
     - Execution notes
   - Create `TicketPack` entity with `sprint_assignments` JSONB

9. **Return Pack**
   - Output: `{firm}_TICKET_PACK_v1.md`
   - Store in database
   - Link to `Firm` and `Roadmap`

**Edge Cases**:
- If firm too small → reduce scope (exclude System 9, 10)
- If firm very large → expand scope (add System 11: Advanced Analytics)
- If dependencies create circular loop → flag error, manual resolution required

---

## 4.4 Roadmap Refresh Workflow

**Purpose**: Update roadmap based on implementation progress and outcome measurements.

**Trigger Conditions**:
- Significant ticket completion milestone (e.g., sprint completed, system fully deployed)
- New metrics snapshot captured (30d/60d/90d)
- Client requests roadmap update
- Major scope change or pivot

**Inputs**:
- `TicketPack` with current ticket statuses
- Latest `Roadmap` and `RoadmapSection[]`
- `RoadmapOutcome` (if available)
- `ImplementationSnapshot[]` (baseline + recent)

**Steps**:

1. **Load Current State**
   - Fetch current `Roadmap` (e.g., v1.0)
   - Fetch all `RoadmapSection[]` for this roadmap
   - Fetch `TicketPack` with all `TicketInstance[]`
   - Fetch latest `RoadmapOutcome` (if exists)

2. **Compute System-Level Completion**
   - Group `TicketInstance[]` by system (System 1, System 2, etc.)
   - Calculate per-system stats:
     ```typescript
     systemCompletion = {
       "Lead Intake Engine": { done: 7, total: 7, pct: 100 },
       "Lead Routing": { done: 5, total: 8, pct: 62 },
       "Follow-Up Automation": { done: 0, total: 12, pct: 0 },
       // ...
     }
     ```
   - Determine system status:
     - `implemented`: 100% tickets done
     - `in_progress`: >0% and <100% tickets done
     - `planned`: 0% tickets done

3. **Update Section Statuses**
   - **Section 1 (Executive Summary)**:
     - If >50% of MVP systems implemented → rewrite from "proposed" to "delivered" tone
     - Include realized outcomes if `RoadmapOutcome` exists
   
   - **Section 3 (GHL Architecture)**:
     - Mark subsections as `implemented` if corresponding tickets done
     - Add "Deployed: [date]" annotations
   
   - **Section 4 (Pilot Scope)**:
     - Move completed workflows from "Planned" to "Delivered" section
     - Add success criteria validation results if available
   
   - **Section 5 (Implementation Sprint Plan)**:
     - Mark completed sprints with "✅ Delivered [date]"
     - Update remaining sprints with revised timeline if needed
     - Move deferred work to explicit "Phase 2 Backlog" subsection
   
   - **Section 8 (Metrics Dashboard)**:
     - If snapshots exist, replace projected KPIs with actual measurements
     - Add before/after comparison charts

4. **Generate/Update Section 10: Outcomes & Learning**
   - If `RoadmapOutcome` exists:
     - Load baseline and latest snapshot (30d/60d/90d)
     - Generate comparison table:
       ```markdown
       ## Baseline vs 60 Days
       
       | Metric | Baseline | 60 Days | Change |
       |--------|----------|---------|--------|
       | Lead response time | 12 min | 3.5 min | ↓ 71% |
       | Weekly ops hours | 12 hrs | 5 hrs | ↓ 7 hrs |
       | CRM adoption | 20% | 73% | +53 pts |
       | NPS | 42 | 61 | +19 pts |
       
       ### Realized ROI (annualized estimate)
       - Time savings: 364 hours/year (~$18,200)
       - Revenue impact: $52,500/year (extra closed deals)
       - Net ROI: ~420% over 12 months
       ```
     - Add status assessment:
       - `on_track`: metrics improving as projected
       - `at_risk`: some metrics flat or declining
       - `off_track`: significant underperformance
   - If no snapshots yet:
     - Add "Baseline Pending" placeholder
     - Include guidance on when/how to capture metrics

5. **Update Metadata**
   - Add `implementation_progress` object:
     ```json
     "implementation_progress": {
       "tickets_completed": 45,
       "tickets_total": 85,
       "pct_complete": 53,
       "systems_implemented": ["Lead Intake Engine", "Lead Routing"],
       "systems_in_progress": ["Follow-Up Automation"],
       "last_updated": "2025-03-15"
     }
     ```
   - If `RoadmapOutcome` exists, add `realized_roi` alongside `roi_projection`

6. **Version Control**
   - Increment version:
     - Minor (v1.0 → v1.1): progress update, no scope change
     - Major (v1.0 → v2.0): significant scope change, new systems added
   - Archive previous version
   - Create new `Roadmap` entity with incremented version

7. **Generate Changelog**
   - Create `{firm}_ROADMAP_CHANGELOG.md`:
     ```markdown
     # Roadmap Changelog: v1.0 → v1.1
     
     ## Implementation Progress
     - Systems 1-2 fully implemented (15 tickets)
     - System 3 in progress (5 of 12 tickets done)
     
     ## Realized Outcomes (60 days)
     - Lead response time: 12min → 3.5min (71% improvement)
     - CRM adoption: 20% → 73%
     
     ## Updates to Roadmap
     - Section 1: Rewritten with delivered systems
     - Section 4: Systems 1-2 moved to "Delivered"
     - Section 10: Added 60-day outcome report
     ```

8. **Render Updated Files**
   - Write `{firm}_ROADMAP_v1.1.md`
   - Write `{firm}_TICKET_PACK_v1.1.md` (with checkbox updates)
   - Write `{firm}_metadata_v1.1.json`
   - Write `{firm}_ROADMAP_CHANGELOG.md`

9. **Notify Stakeholders**
   - Set flag in database: `roadmap.needs_agent_reprovision = true`
   - Agent system can surface notification to owner
   - Trigger agent re-provisioning if automated

**Outputs**:
- Updated roadmap with implementation progress reflected
- Ticket pack with current completion status
- Changelog documenting what changed
- Updated metadata for agent consumption

**When to Run**:
- After each sprint (every 2 weeks)
- After capturing new metrics snapshot (30/60/90 days)
- Before client review meetings
- When significant milestones reached

---

## 4.5 Outcome Capture & Learning Loop

**Purpose**: Close the feedback loop by measuring real-world results and feeding them back into future roadmaps.

**Components**:

### 4.5.1 Snapshot Capture

**Input Methods**:

1. **Manual Entry** (initial approach)
   - CLI command: `npm run roadmap:snapshot`
   - Prompts for metrics:
     - Average lead response time (minutes)
     - Lead-to-appointment rate (%)
     - Close rate (%)
     - CRM adoption rate (%)
     - Weekly ops hours (hours)
     - NPS score
   - Stores as `ImplementationSnapshot`

2. **GHL Export** (future)
   - Export CSV from GHL reporting
   - Parse and convert to snapshot
   - Validate data quality

3. **API Integration** (future)
   - Direct API calls to GHL
   - Real-time metric pull
   - Automated snapshot creation

**Snapshot Labels**:
- `baseline`: Before implementation starts
- `30d`: 30 days after go-live
- `60d`: 60 days after go-live
- `90d`: 90 days after go-live (pilot complete)
- `custom`: Ad-hoc measurements

**Storage**:
- Database: `implementation_snapshots` table
- Files (optional): `/metrics/{firm_slug}/snapshots/{label}_{date}.json`

---

### 4.5.2 Outcome Calculation

**Process**:

1. **Load Snapshots**
   - Fetch baseline snapshot
   - Fetch latest snapshot for each milestone (30d/60d/90d)

2. **Compute Deltas**
   ```typescript
   deltas = {
     lead_response_minutes: baseline.metrics.lead_response_minutes - at60d.metrics.lead_response_minutes,
     weekly_ops_hours: baseline.metrics.weekly_ops_hours - at60d.metrics.weekly_ops_hours,
     crm_adoption_rate: at60d.metrics.crm_adoption_rate - baseline.metrics.crm_adoption_rate,
     nps: at60d.metrics.nps - baseline.metrics.nps,
     // ...
   }
   ```

3. **Convert to ROI**
   - Load original roadmap metadata (projected ROI)
   - Calculate realized values:
     ```typescript
     // Time savings
     const weeklyHoursSaved = deltas.weekly_ops_hours;
     const annualHoursSaved = weeklyHoursSaved * 52;
     const annualValueSaved = annualHoursSaved * blendedHourlyRate;
     
     // Revenue impact
     const closeRateImprovement = deltas.close_rate;
     const extraDealsPerYear = closeRateImprovement * annualLeadVolume;
     const revenueImpact = extraDealsPerYear * avgDealValue;
     
     // Net ROI
     const totalBenefit = annualValueSaved + revenueImpact;
     const implementationCost = roadmapMetadata.estimated_cost || 30000;
     const netROI = (totalBenefit / implementationCost) * 100;
     ```

4. **Classify Status**
   - `on_track`: ≥80% of projected improvements realized
   - `at_risk`: 50-79% of projected improvements realized
   - `off_track`: <50% of projected improvements realized

5. **Store Outcome**
   - Create `RoadmapOutcome` entity
   - Link to snapshots
   - Store deltas and realized ROI

---

### 4.5.3 Learning Loop: Aggregate Outcomes

**Purpose**: Use realized outcomes from all firms to improve future roadmap projections.

**Process**:

1. **Aggregate All Outcomes**
   - Fetch all `RoadmapOutcome[]` across firms
   - Group by industry, firm size, systems implemented

2. **Calculate Distributions**
   ```typescript
   aggregateStats = {
     lead_response_time_reduction: {
       median: 68,  // % reduction
       p25: 52,
       p75: 81,
       firms: 7
     },
     weekly_ops_hours_saved: {
       median: 8.5,  // hours
       p25: 6.2,
       p75: 11.3,
       firms: 7
     },
     // ...
   }
   ```

3. **Store Global Insights**
   - Write `/analytics/global_outcomes.json`
   - Include:
     - Median improvements per metric
     - Confidence intervals (p25-p75)
     - Sample size (number of firms)
     - Typical timeline to realize benefits

4. **Feed Into Future Projections**
   - When generating new roadmap for Firm X:
     - Load `global_outcomes.json`
     - Use median values as baseline projection
     - Adjust based on firm-specific factors
     - Reference distributions in roadmap:
       > "Based on 7 prior implementations, firms typically see 52-81% reduction in lead response time (median: 68%)"

---

### 4.5.4 CLI Commands

**Snapshot Capture**:
```bash
npm run roadmap:snapshot -- \
  --firm hayes_real_estate \
  --label baseline \
  --source manual
```

**Outcome Calculation**:
```bash
npm run roadmap:outcomes -- \
  --firm hayes_real_estate \
  --roadmap-version v1.0
```

**Aggregate Learning**:
```bash
npm run roadmap:aggregate-outcomes
```

**Roadmap Refresh**:
```bash
npm run roadmap:refresh -- \
  --firm hayes_real_estate \
  --roadmap-version v1.0
```

---

# 5. Integration Points (Warp & Agent System)

## 5.1 Warp Integration

**Call Signature**:
```typescript
interface RoadmapEngineInput {
  firmId: string;
  intakeFilePath: string;  // absolute path to intake JSON
  discoveryFilePath: string;  // absolute path to discovery MD
  options?: {
    skipDiscovery?: boolean;  // generate from intake only
    dryRun?: boolean;  // validate inputs without writing outputs
    targetVersion?: string;  // force specific version number
  };
}

interface RoadmapEngineOutput {
  success: boolean;
  roadmapPath: string;  // path to generated roadmap
  ticketPackPath: string;  // path to generated ticket pack
  metadataPath: string;  // path to metadata JSON
  stats: {
    wordCount: number;
    ticketCount: number;
    sprintCount: number;
    estimatedHours: number;
  };
  errors?: string[];
  warnings?: string[];
}

// Example usage in Warp
const result = await roadmapEngine.generate({
  firmId: "hayes_real_estate",
  intakeFilePath: "/path/to/hayes_intakes.json",
  discoveryFilePath: "/path/to/hayes_discovery.md"
});
```

**Warp Command**:
```bash
# Warp ticket to generate roadmap
warp roadmap generate \
  --firm hayes_real_estate \
  --intake ./intake/hayes_intakes.json \
  --discovery ./intake/OUTPUT_3_DISCOVERY_CALL_ANSWERS.md
```

**Output Locations**:
- Roadmap: `/deliverables/{firm_slug}_ROADMAP_v1.md`
- Ticket Pack: `/deliverables/{firm_slug}_TICKET_PACK_v1.md`
- Metadata: `/deliverables/{firm_slug}_metadata.json`

---

## 5.2 Agent System Integration

**Context**: The Roadmap Engine is the **"Roadmap Builder"** module within the broader `agent-system-architecture-v1.md`.

**How They Coexist**:

1. **Roadmap Engine** = Content generation system
   - Produces strategic documents (Roadmap + Ticket Pack)
   - Runs offline/on-demand (not real-time)
   - Invoked when new firm onboards or roadmap updates needed

2. **Agent System** = Conversational intelligence layer
   - Consumes roadmap content (via metadata injection)
   - Answers questions about roadmap
   - Guides implementation
   - Runs online/real-time (during client interactions)

**Integration Flow**:

1. **Roadmap Generation**:
   - Warp or superadmin triggers `roadmapEngine.generate()`
   - Engine produces Roadmap + Ticket Pack + Metadata

2. **Agent Provisioning**:
   - After roadmap generated, call `assistantProvisioning.service.ts`
   - Inject roadmap metadata into agent instructions:
     ```typescript
     const metadata = JSON.parse(fs.readFileSync(`deliverables/${firmSlug}_metadata.json`));
     const instructions = composeInstructions(firm, metadata);
     ```
   - Upload roadmap sections to vector store (for retrieval)
   - Update `agent_configs` table with roadmap metadata

3. **Agent Usage**:
   - Owner asks: "What are my top 3 priorities?"
   - Agent retrieves from metadata: `top_pain_points[]`
   - Agent answers with roadmap-specific details

4. **Roadmap Updates**:
   - If roadmap revised → re-run agent provisioning
   - Agent automatically uses new version

**No Duplication**:
- Roadmap Engine does NOT have its own conversational interface
- Agent System does NOT generate roadmaps
- Clear separation: Engine = authoring, Agent = consuming

---

# 6. Non-Goals & Assumptions

## Non-Goals (What This Engine Does NOT Do)

1. **No Direct GHL API Calls**
   - Engine plans and documents GHL workflows
   - Does NOT actually configure GHL (that's manual or separate automation)

2. **No Real-Time Execution**
   - Engine is batch-oriented (generate roadmap, write files, done)
   - Does NOT monitor GHL deployments or track ticket completion in real-time

3. **No Client-Facing UI**
   - Engine has no web interface
   - Outputs are Markdown files (rendered elsewhere)

4. **No Multi-Language Support**
   - All outputs in English
   - No i18n for roadmaps or tickets

5. **No Custom LLM Training**
   - Uses OpenAI API for any AI-assisted generation
   - Does NOT fine-tune models or train custom embeddings

6. **No Agent-to-Agent Communication**
   - Engine does NOT coordinate with other agents
   - It's a single-purpose module

7. **No Workflow Orchestration**
   - Engine does NOT execute tickets or track sprints
   - That's handled by project management tools (external to this system)

---

## Assumptions

1. **SOPs Kept Up to Date**
   - Assumes `SOP-01`, `SOP-02`, `SOP-03` reflect current best practices
   - If SOPs change, engine behavior changes

2. **Intake JSON Schema Stable**
   - Expects consistent structure across firms
   - Schema breaking changes require engine update

3. **Ticket Library Authoritative**
   - `SCEND_GHL_TICKET_LIBRARY_v1.md` is source of truth for all tickets
   - No ad-hoc ticket creation outside library

4. **Discovery Calls Completed**
   - Assumes intake + discovery both available for best results
   - Can run with intake only, but quality degrades

5. **GHL as Standard Platform**
   - All recommendations assume GHL as operational layer
   - No fallback for non-GHL clients

6. **Single Firm per Execution**
   - Engine processes one firm at a time
   - Batch processing multiple firms requires multiple invocations

7. **File System Access**
   - Engine assumes read/write access to:
     - `/intake/` (input files)
     - `/deliverables/` (output files)
     - `/SOPs/` (reference docs)
     - `/backend/storage/roadmaps/` (for later upload to DB)

8. **PostgreSQL Database**
   - Assumes Scend database available for storing entities
   - Uses existing schema (no new migrations in v1)

---

# 7. Example: Hayes Real Estate

## 7.1 Inputs

**Intake File**: `intake/Hayes_Real_Estate_Group-intakes-2025-11-21.json`
- Owner (Roberta): 11 questions answered
- Ops (Michael): 6 questions answered
- Sales (Sarah): 6 questions answered
- Delivery (Jasmine): 6 questions answered

**Discovery File**: `SOPs/Hayes Real Estate Examples/OUTPUT_3_DISCOVERY_CALL_ANSWERS.md`
- 17 follow-up questions across 7 sections
- Includes direct quotes from Roberta, Michael, Sarah
- Identifies top 3 priorities (Q17)

**Firm Metadata** (extracted from intake):
- Name: Hayes Real Estate Group
- Industry: Real Estate (property management + sales)
- Team Size: 15 agents + 1 TC + 1 ops + owner
- Annual Volume: ~85 transactions, targeting $100M
- Location: Southampton, NY

---

## 7.2 Workflow Execution

### Step 1: Parse Intake
**IntakeParser** extracts:
- **Owner pain points**:
  - "Everything bottlenecks through me"
  - "Leads slip through cracks"
  - "No pipeline visibility"
  
- **Ops pain points**:
  - "Manual data entry duplicated across systems"
  - "Document collection is a mess"
  - "3-4 hours weekly just for reporting"

- **Sales pain points**:
  - "Lead response time 4+ hours on average"
  - "CRM adoption <20% (only 3 of 15 agents use FUB)"
  - "No automated follow-up sequences"

- **Delivery pain points**:
  - "Transaction coordinator not notified for 2-3 days after contract"
  - "Clients constantly asking for status updates"
  - "Inspection scheduling = phone tag"

**Output**: 4 `IntakeRecord` objects stored in database.

---

### Step 2: Synthesize Discovery
**DiscoverySynthesizer** processes 17 Q&A:
- Confirms intake findings
- Adds specifics:
  - "Weekend leads sit until Monday" (Q1)
  - "20% of weekend leads never get response" (Q1)
  - "Only 3 agents use FUB" (Q2)
  - "Lead scoring doesn't exist" (Q15)
  - "Top 3 priorities: lead response, client portal, document automation" (Q17)

**Output**: 1 `DiscoveryRecord` with key insights indexed by topic.

---

### Step 3: Run Diagnostics
**DiagnosticEngine** generates findings:

**Finding 1: Lead Response Failure**
- **Symptom**: 4+ hour response time, 20% weekend leads missed
- **Root Cause**: No automated routing, no weekend monitoring, group text assignment
- **Impact**: $300K-$500K annual loss (15-25% conversion hit)
- **Constraint**: At 2× volume, response time worsens exponentially
- **Priority Score**: 95/100 (critical)

**Finding 2: CRM Adoption Collapse**
- **Symptom**: 3 of 15 agents use FUB, rest use texts/notes
- **Root Cause**: No training, clunky UI, no enforcement
- **Impact**: Zero pipeline visibility for owner, can't coach agents
- **Constraint**: No data = no scalability
- **Priority Score**: 85/100 (high)

**Finding 3: Document Collection Chaos**
- **Symptom**: Multiple follow-ups for each document, 3-4 day delays
- **Root Cause**: No portal, email-based collection, manual tracking
- **Impact**: 10+ hours/week wasted, contract delays, client frustration
- **Constraint**: TC at capacity, cannot scale
- **Priority Score**: 75/100 (high)

**Finding 4: Client Status Visibility Gap**
- **Symptom**: Clients constantly asking "what's the status?"
- **Root Cause**: No portal, manual updates, agent-dependent communication
- **Impact**: Agent burnout, client dissatisfaction, NPS risk
- **Constraint**: Impacts retention and referrals
- **Priority Score**: 70/100 (medium-high)

**Output**: 15 `DiagnosticFinding` objects (above are top 4).

---

### Step 4: System Recommendations
**SystemRecommender** maps findings to GHL systems:

**Finding 1 (Lead Response)** → **System 1 (Intake)** + **System 2 (Routing)** + **System 3 (Follow-Up)**
- Tickets: T1.1.1-T1.4.4, T2.1.1-T2.3.3, T3.1.1-T3.4.3
- Expected Outcome: <2min response time, automated 14-day sequence
- Success Metrics: Response time, lead-to-appointment rate

**Finding 2 (CRM Adoption)** → **System 5 (Accountability)**
- Tickets: T5.1.1-T5.3.5
- Expected Outcome: Agent activity dashboard, SLA tracking
- Success Metrics: CRM login rate, task completion rate

**Finding 3 (Document Chaos)** → **System 7 (Document Automation)**
- Tickets: T7.1.1-T7.3.3
- Expected Outcome: Client portal for uploads, auto-tracking
- Success Metrics: Document collection time, TC hours saved

**Finding 4 (Status Visibility)** → **System 6 (Client Portal)** + **System 8 (Contract-to-Close)**
- Tickets: T6.1.1-T6.4.3, T8.1.1-T8.3.3
- Expected Outcome: Client-facing status page, proactive updates
- Success Metrics: "Where's my deal?" inquiry rate, NPS

**Output**: 6 `SystemRecommendation` objects, ~85 tickets selected.

---

### Step 5: Assemble Roadmap
**RoadmapAssembler** generates 8 sections:

**Section 1: Executive Summary**
- Business context: Hayes Real Estate Group, $100M target, 85 → 115 deals
- Top 3 challenges: Lead response gap, CRM adoption failure, client experience inconsistency
- Solution: GHL as operational spine + AI intelligence layer
- ROI: 320-450% over 12 months ($90K-$120K net benefit)
- Success criteria: <2min response time, 80% CRM adoption, +15 NPS
- Next steps: Week 1-2 finalize architecture, Week 3-4 pilot System 1

**Section 2: Diagnostic Analysis**
- 6 subsections (Lead Flow, Sales, Ops, Delivery, Owner Bottleneck, Volume Stress Test)
- Each includes: Current State → Failure Patterns → Root Causes → Impact
- Quotes from Roberta, Michael, Sarah
- Quantified impacts ($300K-$500K lead loss, 600-800 hours annual waste)

**Section 3: GHL Architecture Blueprint**
- Custom fields: property_address, property_type, lease_end_date, lead_source, lead_score
- Pipelines: Buyer Pipeline (New → Qualified → Showing → Application → Lease), Seller Pipeline
- Automations: Lead intake trigger, 60-second SMS, follow-up sequences
- Integrations: Zillow API, website forms, MLS sync
- Webhooks: New lead, contract signed, document uploaded
- Mermaid diagram of lead flow

**Section 4: Pilot Scope Definition**
- 6 workflows to build:
  1. Lead Intake + Auto-Response (System 1)
  2. Lead Routing + Agent Assignment (System 2)
  3. Buyer Follow-Up Sequence (System 3.1)
  4. Client Transaction Portal (System 6.1)
  5. Document Upload Automation (System 7.1)
  6. Agent Accountability Dashboard (System 5.1)
- Success criteria per workflow
- Week-by-week sprint breakdown (Sprints 1-5, 2 weeks each)
- Demo script for go-live (Owner logs in → sees dashboard → assigns lead → lead auto-responds)

**Section 5: Implementation Sprint Plan**
- Sprint 1 (Weeks 1-2): GHL setup, custom fields, pipelines (15 tickets)
- Sprint 2 (Weeks 3-4): Lead intake, routing, auto-response (18 tickets)
- Sprint 3 (Weeks 5-6): Follow-up sequences, scoring (14 tickets)
- Sprint 4 (Weeks 7-8): Client portal, documents (16 tickets)
- Sprint 5 (Weeks 9-10): Agent dashboards, training, go-live (12 tickets)
- Total: 75 tickets (85 originally, 10 deferred to Phase 2)

**Section 6: GHL Configuration Docs**
- API key setup (step-by-step)
- Webhook URLs + secrets
- Custom field CSV (ready to import)
- Pipeline stage definitions
- User permissions matrix (Owner = full, Agents = limited, TC = read-only)

**Section 7: Workflow SOPs**
- 6 SOPs (one per workflow):
  - "How to Accept a Lead Assignment"
  - "How to Upload Client Documents"
  - "How to Check Transaction Status"
  - "How to Use the Agent Dashboard"
  - "Troubleshooting: Lead Not Auto-Responding"
  - "Admin: Resetting a Broken Workflow"

**Section 8: Metrics Dashboard**
- KPIs:
  - Lead response time (target: <2min)
  - Lead-to-appointment rate (target: 40%+)
  - CRM login rate (target: 80%+ agents daily)
  - Document collection time (target: <24hr)
  - Client satisfaction (target: NPS 60+)
- GHL-specific:
  - Workflow completion rate (target: >95%)
  - API error rate (target: <1%)
  - SLA compliance (target: 98%)
- Dashboard mockup (screenshot of what owner sees)

**Section 9: Appendix**
- GHL API docs links
- Webhook payload examples
- Zapier template (if used)
- Glossary (Contact, Opportunity, Pipeline, Workflow, Trigger, etc.)
- FAQ (10 common setup questions)
- Support contacts (Scend, GHL)

**Output**: `HAYES_ROADMAP_v1.md` (9 sections, ~15,000 words, 8 Mermaid diagrams)

---

### Step 6: Map Tickets
**TicketMapper** creates firm-specific pack:
- Selects 85 tickets from library (Systems 1-8, partial System 10)
- Groups into 5 sprints
- Adds Hayes-specific customization:
  - Replace "Buyer/Seller" stays as-is (real estate)
  - Add custom field: "property_type" dropdown
  - Customize qualification questions for luxury market
- Adds validation criteria per ticket:
  - T1.3.1: "Test lead form submission → verify SMS sent <60s → check SMS contains lead name"
- Total estimated hours: 180 hours (36 hours/sprint, ~18 hours/week for 2-person team)

**Output**: `HAYES_TICKET_PACK_v1.md` (85 tickets, 5 sprints, 10 weeks)

---

### Step 7: Render Files
**OutputRenderer** writes:
- `deliverables/hayes_real_estate_ROADMAP_v1.md` (15,234 words)
- `deliverables/hayes_real_estate_TICKET_PACK_v1.md` (85 tickets)
- `deliverables/hayes_real_estate_metadata.json`:
  ```json
  {
    "firm_slug": "hayes_real_estate",
    "version": "v1.0",
    "top_pain_points": [
      "Lead response time 4+ hours causing 15-25% conversion loss",
      "Manual workflows consuming 8-12 hrs/week",
      "CRM adoption <20%, zero pipeline visibility"
    ],
    "primary_goals": [
      "Achieve <2min lead response time",
      "Recover 10+ hours/week operational time",
      "Improve NPS by +15 points"
    ],
    "systems_recommended": [
      "Lead Intake Engine",
      "Lead Routing & Assignment",
      "Follow-Up Automation",
      "Client Portal",
      "Document Automation",
      "Agent Accountability"
    ],
    "timeline": {
      "30_day": "Systems 1-2 live (lead intake + routing)",
      "60_day": "Systems 3-5 live (follow-up + accountability)",
      "90_day": "Systems 6-7 live (client portal + documents), pilot complete"
    },
    "roi_projection": {
      "time_savings_hours_annual": 720,
      "time_savings_value_annual": 36000,
      "revenue_impact_annual": 52500,
      "cost_avoidance_annual": 18000,
      "net_roi_12_months": 381
    }
  }
  ```

---

### Step 8: Validate
- All 9 sections present ✓
- No broken references ✓
- Mermaid diagrams valid ✓
- Metadata complete ✓
- Files under size limit ✓

**Engine Output**:
```json
{
  "success": true,
  "roadmapPath": "/deliverables/hayes_real_estate_ROADMAP_v1.md",
  "ticketPackPath": "/deliverables/hayes_real_estate_TICKET_PACK_v1.md",
  "metadataPath": "/deliverables/hayes_real_estate_metadata.json",
  "stats": {
    "wordCount": 15234,
    "ticketCount": 85,
    "sprintCount": 5,
    "estimatedHours": 180
  },
  "errors": [],
  "warnings": []
}
```

---

## 7.3 What Happens Next

**Agent Provisioning**:
1. Upload roadmap sections to vector store
2. Inject metadata into agent instructions
3. Re-provision Hayes assistant

**Result**: When Roberta asks agent "What are my top priorities?", agent responds:
> "Based on your roadmap, your top 3 priorities are:
> 1. **Lead Response Automation** - We need to get your response time from 4+ hours down to <2 minutes. This is costing you $300K-$500K annually.
> 2. **Client Transaction Portal** - Your clients shouldn't have to ask 'What's the status?' They should be able to log in and see it instantly.
> 3. **Document Collection Automation** - Michael is spending 10+ hours/week chasing documents. We need a secure upload portal.
>
> We're currently in Sprint 1 (GHL setup). Systems 1-2 will be live in 2 weeks, which solves priority #1."

Agent is now **roadmap-aware** and can guide implementation.

---

# END OF SPECIFICATION

**Document Status**: Implementation-Ready  
**Next Steps**: 
1. Review with engineering team
2. Begin component implementation (start with IntakeParser)
3. Create test suite using Hayes as reference case
4. Build Warp integration layer
5. Deploy to production environment

**Version History**:
- v1.0 (Nov 2024): Initial specification
- v1.1 (Nov 2024): Added ticket completion tracking, roadmap refresh workflow, outcome capture & learning loop
