# PROJECTION_MODERATION_SURFACE_REALITY.md

**Ticket Authority:** EXECUTION-TICKET-PROJECTION-MODERATION-FORENSIC-001
**Mode:** READ-ONLY
**Date:** 2026-03-02

---

## 1. SCHEMA SNAPSHOTS

### ticketModerationSessions
**File:** `backend/src/db/schema.ts` (lines 1136–1147)

```
ticket_moderation_sessions {
  id:                uuid, PK, defaultRandom
  tenantId:          uuid, NOT NULL, FK → tenants.id (cascade delete)
  sourceDocId:       uuid, NOT NULL, FK → tenant_documents.id
  sourceDocVersion:  varchar(255)
  status:            varchar(50), NOT NULL, default 'active'   ← 'active' | 'complete' | 'archived'
  startedBy:         uuid, FK → users.id (set null on delete)
  startedAt:         timestamp(tz), NOT NULL, defaultNow
  completedAt:       timestamp(tz)
  createdAt:         timestamp(tz), NOT NULL, defaultNow
  updatedAt:         timestamp(tz), NOT NULL, defaultNow
}
```

No unique constraint per tenant. Multiple sessions can exist simultaneously in schema.

---

### tickets_draft
**File:** `backend/src/db/schema.ts` (lines 1149–1180)

```
tickets_draft {
  id:                    uuid, PK, defaultRandom
  tenantId:              uuid, NOT NULL, FK → tenants.id (cascade delete)
  moderationSessionId:   uuid, NOT NULL, FK → ticket_moderation_sessions.id (cascade delete)
  findingId:             varchar(255), NOT NULL
  findingType:           varchar(100), NOT NULL
  ticketType:            varchar(100), NOT NULL        ← Diagnostic|Optimization|ConstraintCheck|CapabilityBuild
  title:                 text, NOT NULL
  description:           text, NOT NULL
  evidenceRefs:          jsonb
  status:                varchar(50), NOT NULL, default 'pending'  ← 'pending' | 'accepted' | 'rejected'
  category:              varchar(100)
  tier:                  varchar(50)
  ghlImplementation:     text
  implementationSteps:   json
  successMetric:         text
  roiNotes:              text
  timeEstimateHours:     integer, default 0
  sprint:                integer, default 30
  painSource:            text
  createdAt:             timestamp(tz), NOT NULL, defaultNow
  updatedAt:             timestamp(tz), NOT NULL, defaultNow
}
```

**Unique Index:**
```
moderation_session_finding_idx UNIQUE ON (moderationSessionId, findingId)
```

Note: `findingId` in `tickets_draft` is set to `ai-gen-${randomUUID().substring(0,8)}` during AI generation — it is NOT a real `FND-*` finding ID.
File: `backend/src/controllers/superadmin.controller.ts`, line 4273

---

### sop_tickets
**File:** `backend/src/db/schema.ts` (lines 696–733)

```
sop_tickets {
  id:                           uuid, PK, defaultRandom
  tenantId:                     uuid, NOT NULL, FK → tenants.id (cascade delete)
  diagnosticId:                 varchar(255), FK → diagnostics.id (cascade delete)
  ticketId:                     varchar(50), NOT NULL                ← e.g. "S3-T1"
  title:                        varchar(255), NOT NULL
  description:                  text, NOT NULL
  category:                     varchar(100)
  tier:                         varchar(50)
  valueCategory:                varchar(100)
  owner:                        varchar(100)
  priority:                     varchar(50)
  sprint:                       integer, default 1
  timeEstimateHours:            integer, default 0
  costEstimate:                 integer, default 0
  projectedHoursSavedWeekly:    integer, default 0
  projectedLeadsRecoveredMonthly: integer, default 0
  approved:                     boolean, default false
  adminNotes:                   text
  ticketType:                   varchar(50)
  roadmapSection:               text
  inventoryId:                  text
  isSidecar:                    boolean, default false
  painSource:                   text
  currentState:                 text
  targetState:                  text
  aiDesign:                     text
  ghlImplementation:            text
  implementationSteps:          json
  dependencies:                 json (string[])
  moderationStatus:             varchar(30), default 'pending'
  status:                       varchar(20), NOT NULL, default 'generated'   ← generated|pending|approved|rejected|locked
  successMetric:                text
  roiNotes:                     text
  moderatedAt:                  timestamp(tz)
  moderatedBy:                  uuid, FK → users.id
  createdAt:                    timestamp(tz), NOT NULL, defaultNow
  updatedAt:                    timestamp(tz), NOT NULL, defaultNow
}
```

---

## 2. RELATIONSHIPS

```
tenants (1) ──── (N) ticket_moderation_sessions
ticket_moderation_sessions.sourceDocId ──── tenant_documents.id
ticket_moderation_sessions (1) ──── (N) tickets_draft
  (via tickets_draft.moderationSessionId)
tenants (1) ──── (N) sop_tickets
sop_tickets.diagnosticId ──── diagnostics.id
```

**No FK relationship exists between `tickets_draft` and `sop_tickets`.**
**No FK relationship exists between `ticket_moderation_sessions` and `sop_tickets`.**
These are parallel pipelines.

---

## 3. EXECUTION CHAIN DIAGRAM — activateTicketModeration

```
POST /firms/:tenantId/ticket-moderation/activate
superadmin.routes.ts:351 (with validateTicketSchema middleware)
  ↓
superadmin.controller.ts:activateTicketModeration (line 4146)
  ↓
  STEP 1: Direct DB SELECT → tenant_documents
          WHERE tenantId = X AND category = 'findings_canonical'
          ORDER BY createdAt DESC LIMIT 1
          [NO PROJECTION GATE — direct DB read]
  ↓
  STEP 2: Direct DB SELECT → ticket_moderation_sessions
          WHERE tenantId = X AND status = 'active'
          LIMIT 1
          [Guard: return 400 if active session already exists]
  ↓
  STEP 3: Direct DB SELECT → tenant_documents
          WHERE tenantId = X AND category = 'sop_output'
          [Fetch SOP-01 artifacts for AI generation context]
  ↓
  STEP 4: Direct DB SELECT → tenants
          WHERE id = X
          [Fetch firmSizeTier, teamHeadcount for AI prompt]
  ↓
  STEP 5: generateRawTickets() [AI generation via trustagent]
          Input: tenantId, diagMap { firmSizeTier, teamHeadcount, firmName }
          Input: sop01Artifacts { diagnosticMap, roadmapSkeleton, ... }
  ↓
  STEP 6: db.transaction()
            INSERT → ticket_moderation_sessions (new session)
            INSERT → tickets_draft (bulk, from rawTickets)
              findingId = `ai-gen-${randomUUID().substring(0,8)}`
              findingType = 'AI_SOP_GEN'
              ticketType = 'Implementation'
  ↓
  STEP 7: INSERT → audit_events
          eventType: TICKET_MODERATION_ACTIVATED
          entityType: ticket_moderation_session
          entityId: session.id
```

---

## 4. ALL DB READS — ticketModerationSessions

| Operation | File | Lines | Filter |
|---|---|---|---|
| SELECT id (active check - ingest freeze guard) | `superadmin.controller.ts` | 3599–3606 | tenantId + status='active' |
| SELECT id (active check - appendNote freeze guard) | `superadmin.controller.ts` | 3768–3775 | tenantId + status='active' |
| SELECT all (existing session guard - activate) | `superadmin.controller.ts` | 4177–4186 | tenantId + status='active' |
| SELECT all (get active session) | `superadmin.controller.ts` | 4334–4343 | tenantId + status='active' |
| SELECT all (getTicketsForDiagnostic) | `ticketModeration.service.ts` | 40–49 | tenantId + status='active' |
| SELECT all (reset script) | `scripts/reset_moderation.ts` | 20 | status='active' (global) |

---

## 5. ALL DB READS — tickets_draft

| Operation | File | Lines | Filter |
|---|---|---|---|
| SELECT subset (getTicketsForDiagnostic) | `ticketModeration.service.ts` | 52–67 | moderationSessionId = activeSession.id, ORDER BY createdAt ASC |
| SELECT status grouped (getModerationStatus) | `ticketModeration.service.ts` | 250–257 | tenantId, GROUP BY status |
| SELECT status grouped (command center summary) | `superadmin.controller.ts` | 3176–3181 | tenantId, GROUP BY status |
| SELECT all (getActiveModerationSession) | `superadmin.controller.ts` | 4349–4353 | moderationSessionId = session.id, ORDER BY createdAt ASC |

---

## 6. ALL STATE MUTATIONS — tickets_draft

| Operation | File | Lines | Mutation |
|---|---|---|---|
| INSERT bulk (activateTicketModeration) | `superadmin.controller.ts` | 4294 | status='pending', findingId=synthetic |
| UPDATE status (updateTicketApproval - draft path) | `ticketModeration.service.ts` | 171–183 | status = 'accepted' or 'rejected' |

---

## 7. ALL STATE MUTATIONS — ticketModerationSessions

| Operation | File | Lines | Mutation |
|---|---|---|---|
| INSERT new session (activateTicketModeration) | `superadmin.controller.ts` | 4262–4268 | status='active', sourceDocId=canonicalDoc.id |
| DELETE (reset script only) | `scripts/reset_moderation.ts` | 31 | by id array |
| No UPDATE to completedAt or status='complete' found in application code | — | — | completedAt column never written |

---

## 8. LIFECYCLE GATING LOGIC

### Projection Involvement in Moderation Pipeline

**activateTicketModeration:** NO projection gate.
- Validates canonical findings exist via direct DB SELECT (line 4157).
- Does NOT call `getTenantLifecycleView()`.
- Uses `canGenerateTickets` from projection? NO.

**getActiveModerationSession:** NO projection gate.

**getTicketsForDiagnostic:** NO projection gate.

**updateTicketApproval / approveTickets / rejectTickets:** NO projection gate.

**getModerationStatus:** NO projection gate.

**ingestDiscoveryNotes:** YES — projection gate present.
- Calls `getTenantLifecycleView` (line 3593).
- Checks `capabilities.ingestDiscoveryNotes.allowed` (line 3594).
- Also adds freeze guard: direct DB SELECT on `ticketModerationSessions` WHERE status='active' (lines 3599–3606).

**appendDiscoveryNote:** NO projection gate.
- Uses freeze guard via direct DB SELECT on `ticketModerationSessions` WHERE status='active' (lines 3768–3775).

---

## 9. READINESS INFERENCE OUTSIDE PROJECTION

### activateTicketModeration (superadmin.controller.ts:4146)
- Infers "canonical findings ready" via direct DB SELECT on `tenant_documents` WHERE category='findings_canonical' (line 4157–4167).
- Does NOT use `projection.artifacts.hasCanonicalFindings`.
- Does NOT use `projection.derived.canGenerateTickets`.
- This is a **Canon violation**: readiness inference outside projection.

### getModerationStatus (ticketModeration.service.ts:248)
- Infers "readyForRoadmap" by computing `pending === 0 && approved > 0` directly from DB counts.
- No projection involvement.

### getTicketsForDiagnostic (ticketModeration.service.ts:35)
- Uses active session existence as proxy for "Stage 6 mode active."
- No projection involvement.

---

## 10. SESSION LIFECYCLE SUMMARY

```
STATE MACHINE (ticket_moderation_sessions.status):

  [created] → 'active'       (activateTicketModeration — INSERT)
  'active'  → 'complete'     (NO application-layer path found — completedAt never written)
  'active'  → [deleted]      (reset_moderation.ts script only — no controller path)
  'active'  → 'archived'     (defined in schema comment, no write path found)
```

**Finding:** The session lifecycle is incomplete. No controller-layer transition from `active` → `complete` was found in the source. The `completedAt` column is never written by application code.
