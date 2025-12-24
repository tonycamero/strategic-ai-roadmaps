# EPIC 2 — Roadmap → Ticket Packs → Agent Instruction Engine
Version: FINAL
Status: Approved by Tony
Depends on: EPIC 1 (Roadmap Sections = Canonical Source of Truth)

---

# 🎯 Goal of this EPIC
Turn Roadmaps into actionable execution systems by:
1. Generating Ticket Packs from each roadmap
2. Tracking per-ticket status, notes, assignees, timestamps
3. Binding tickets to roadmap sections (1↔many)
4. Feeding all of this into AI Agents (Owner, Ops, Support)
5. Providing a structured execution pipeline for 30/60/90
6. Enabling future outcome measurement (EPIC 3)

This is the **execution engine**.

---

# 🧱 EPIC 2 Architectural Contract
- `roadmap_sections` is the canonical content.
- `ticketPacks` stores the "collection of tickets for this roadmap."
- `ticketInstances` tracks each ticket's lifecycle.
- Tickets map 1:many to a single `roadmap_sections.sectionNumber`.
- Agents derive instructions and context from:
  - roadmap_sections
  - ticketInstances
  - roadmapMetadata (to be populated in EPIC 2)
- No business logic reads roadmap files.  
- All logic pulls from DB only.

---

# T2.1 — Backend: Ticket Pack Generator (Core)
**Owner:** backend  
**Summary:** Given a roadmapId, generate ticket pack and ticket instances from section content.

### Acceptance Criteria:
- Function: `generateTicketPackForRoadmap(roadmapId: string)`
- Steps:
  1. Ensure one `ticketPacks` row exists for roadmapId.
  2. For each `roadmap_sections` row:
     - Generate 3–7 tickets from contentMarkdown.
     - Use simple prompt: "Generate atomic implementation tasks from this roadmap section."
  3. Insert each ticket into `ticketInstances` with:
     - `ticketId` (auto-generated from section + index, e.g. "S3-T1")
     - `status='not_started'`
     - `assignee=null`
     - `notes=null`
  4. Update totals: `{ tickets, not_started }`
- Must be idempotent: re-running replaces tickets.

---

# T2.2 — Backend: Ticket ↔ Section Binding Schema Enforcement
**Owner:** backend  
**Summary:** Ensure ticketInstances reference a roadmap section.

### Acceptance Criteria:
- Add field: `ticketInstances.sectionNumber`
- Populate with the sectionNumber from the parent section during generation.
- Validate:
  - Must match an existing sectionNumber for roadmapId
- Update queries accordingly.

---

# T2.3 — Backend: Ticket Status Update API
**Owner:** backend  
**Endpoints:**
- `PATCH /api/tickets/:ticketInstanceId/status`
- `PATCH /api/tickets/:ticketInstanceId/assignee`
- `PATCH /api/tickets/:ticketInstanceId/notes`

### Acceptance Criteria:
- Fully update ticketInstance with:
  - status (enum)
  - assignee (string or userId or free text)
  - notes (text)
  - timestamps (started/completed)
- Must update the parent ticketPack totals.

---

# T2.4 — Backend: Roadmap Section Status Derivation
**Owner:** backend  
**Summary:** Section status should reflect ticket progress.

### Acceptance Criteria:
- Background service OR computed update after ticket operations:
  - If all ticketInstances for section = done → `section.status='done'`
  - If any ticketInstances = in_progress → `section.status='in_progress'`
  - If all ticketInstances = not_started → `section.status='planned'`
  - If any = blocked → `section.status='blocked'`
- Update `roadmap_sections.lastUpdatedAt` when status changes.

---

# T2.5 — SuperAdmin UI: Ticket Pack Viewer (Read-Only)
**Owner:** frontend  
**Summary:** Add UI to view tickets grouped by section.

### Acceptance Criteria:
- New SA card: **Ticket Pack**
- Shows:
  - Section → tickets list
  - Status, assignee, notes
  - Progress bar for each section
- Endpoints:
  - `GET /api/superadmin/firms/:tenantId/tickets`

---

# T2.6 — Owner UI: Execution Dashboard (Phase 1)
**Owner:** frontend  
**Summary:** Show owner the "This Week's Focus" execution loop.

### Acceptance Criteria:
- New page: `/owner/roadmap/execution`
- Show:
  - Tickets assigned to owner
  - Overdue tickets
  - Key tasks for the week
  - Section progress summary
- Read-only for now.

---

# T2.7 — Backend: Roadmap Metadata Extractor
**Owner:** backend  
**Summary:** Extract structured metadata for agents from roadmap_sections.

### Acceptance Criteria:
- Function: `extractRoadmapMetadata(roadmapId)`
- For each section:
  - Identify top pain points
  - Identify primary goals
  - Identify recommended systems
  - Identify 30/60/90 steps if present
- Merge into `agentConfigs.roadmapMetadata`
- Called at:
  - Roadmap generation
  - Ticket pack generation

---

# T2.8 — Agent Context Expansion (Owner, Ops, Support)
**Owner:** backend  
**Summary:** Each agent receives roadmap-aware task routing.

### Acceptance Criteria:
- Update agentConfig builder logic:
  - Incorporate:
    - roadmapMetadata
    - section status
    - relevant tickets
  - Provide agent-specific perspective:
    - Ops → workflow + automation + system bugs
    - Owner → decisions + approvals
    - Support → follow-ups + operational correctness
- Deliver context as structured JSON to agent prompt builder.

---

# T2.9 — Agent Commands: Ticket Operations
**Owner:** backend  
**Summary:** Allow agents to modify tickets.

### Acceptance Criteria:
- Add agent tool definitions:
  - `update_ticket_status(ticketId, status)`
  - `add_ticket_note(ticketId, note)`
  - `assign_ticket(ticketId, assignee)`
- Add routing rules so:
  - Ops agent handles ops tickets
  - Owner agent handles decision tickets
  - Support agent handles follow-ups

---

# T2.10 — Ticket Lifecycle Hooks
**Owner:** backend  
**Summary:** Maintain accurate metrics.

### Acceptance Criteria:
- On ticketInstance update:
  - Update ticketPack totals
  - Update roadmapSection status
  - Log auditEvents:
    - ticket_status_changed
    - ticket_assigned
    - ticket_note_added
- Trigger daily metrics update via existing metrics pipeline.

---

# T2.11 — SuperAdmin: Manual Ticket Edit Panel
**Owner:** frontend  
**Summary:** Allow SA to fix bad tickets after generation.

### Acceptance Criteria:
- UI modal:
  - Edit ticket text
  - Change sectionNumber
  - Delete ticketInstance
- Endpoint:
  - `PATCH /api/superadmin/tickets/:ticketInstanceId`
  - `DELETE /api/superadmin/tickets/:ticketInstanceId`
- Must recalc totals.

---

# EPIC 2 Completion Summary
System must support:

1. Ticket packs generated from roadmap_sections  
2. Each ticket tied to a section  
3. Section status driven by ticket status  
4. Owner and SA views for execution  
5. Agent instruction pipeline ready (contexts + tools)  
6. RoadmapMetadata populated  
7. Full audit + metrics tracking  

This activates the Roadmap OS.
