# PROJECTION_FINDINGS_SURFACE_REALITY.md

**Ticket Authority:** EXECUTION-TICKET-PROJECTION-CANONICAL-FINDINGS-FORENSIC-001
**Mode:** READ-ONLY
**Date:** 2026-03-02

---

## 1. WHERE ARE CANONICAL FINDINGS STORED?

Canonical findings are stored in the `tenant_documents` table, **not in a dedicated findings table**.

**Table:** `tenant_documents`
**Discriminator Column:** `category = 'findings_canonical'`
**Schema file:** `backend/src/db/schema.ts` (lines 413–447)

---

## 2. FULL DB SCHEMA SNAPSHOT

```
tenant_documents {
  id:                uuid, PK, defaultRandom
  tenantId:          uuid, FK → tenants.id (cascade delete)
  ownerUserId:       uuid, FK → users.id (set null on delete)
  filename:          varchar(255), NOT NULL
  originalFilename:  varchar(255), NOT NULL
  filePath:          text, NOT NULL
  fileSize:          integer, NOT NULL
  mimeType:          varchar(100)
  content:           text                        ← findings JSON stored here
  storageProvider:   varchar(50)
  section:           text
  sopNumber:         text
  outputNumber:      text
  category:          varchar(50), NOT NULL       ← 'findings_canonical'
  title:             varchar(255), NOT NULL
  description:       text
  uploadedBy:        uuid, FK → users.id (set null on delete)
  isPublic:          boolean, NOT NULL, default false
  createdAt:         timestamp, NOT NULL, defaultNow
  updatedAt:         timestamp, NOT NULL, defaultNow
}
```

**Unique Index:**
```
tenant_doc_sop_idx UNIQUE ON (tenantId, category, sopNumber, outputNumber)
```

---

## 3. ORDERING FIELDS

- **No ordering column specific to findings.** Consumers order by `createdAt DESC` and take `LIMIT 1`.
- Findings are implicitly ordered by insertion timestamp only.
- There is no `position`, `index`, `order`, or `seq` column on `tenant_documents`.

---

## 4. VERSIONING

- **No version column on `tenant_documents`.** The `version` field does NOT exist on this table.
- No `findingsVersion`, `schemaVersion`, or `compilerVersion` column present.
- The only version-tracking mechanism is the `createdAt` timestamp.

---

## 5. EVENT LOG

- **No dedicated event log for findings mutations.**
- A single `auditEvents` row is inserted with `eventType: 'FINDINGS_DECLARED'` when findings are first declared.
- `auditEvents` schema: `{ id, tenantId, actorUserId, actorRole, eventType, entityType, entityId, metadata, createdAt }`
- The `entityId` field is set to `findingsObject.id` (a `randomUUID()` generated at declaration time, **not the `tenant_documents.id`**).
- There is no audit trail for subsequent reads, lookups, or re-declarations.

---

## 6. STABLE ARTIFACT HASH

- **No stable artifact hash column on `tenant_documents`.**
- The `FindingsService.createFinding()` computes a content-based `sourceTextHash` per individual finding (SHA-256 of `tenantId:type:description:salt`).
- The `findingsObject.id` at persistence time is a `randomUUID()` — **not content-derived**.
  - File: `backend/src/services/findings.service.ts`, line 143
- Therefore: **no stable, deterministic artifact-level hash exists for the stored `findings_canonical` document**.

---

## 7. AUTHORITATIVE PRIMARY KEY

- **`tenant_documents.id`** (UUID, `defaultRandom`) — not content-derived.
- The `findingsObject.id` used at generation time (`randomUUID()`) is stored only inside the JSON `content` blob, not as the DB row's PK.

---

## 8. SOFT DELETE

- **No soft delete.** No `deletedAt`, `isDeleted`, or `archivedAt` column exists on `tenant_documents`.
- `proposed` findings (category `findings_proposed`) are "archived" by mutating `category` to `findings_proposed_archived`. No such pattern exists for `findings_canonical`.
  - File: `backend/src/controllers/superadmin.controller.ts`, lines 3993–3999

---

## 9. ARE FINDINGS IMMUTABLE ONCE DECLARED?

- **No immutability enforcement on `tenant_documents`.**
- The table has no `isImmutable` flag (unlike `executive_brief_artifacts` which does).
- There is no DB constraint, trigger, or application-layer check that prevents re-insertion of a new `findings_canonical` row for the same tenant.
- `declareCanonicalFindings` does NOT check for an existing `findings_canonical` row before inserting a new one. Calling it twice would produce two rows.
  - File: `backend/src/services/findings.service.ts`, lines 121–178

---

## READ PATHS

### READ PATH 1 — Projection (resolveArtifacts)
**File:** `backend/src/services/tenantStateAggregation.service.ts`
**Lines:** 523–531

```typescript
const [findings] = await (trx || db)
    .select({ id: tenantDocuments.id })
    .from(tenantDocuments)
    .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'findings_canonical')
    ))
    .orderBy(desc(tenantDocuments.createdAt))
    .limit(1);
```
Returns: existence check only (`hasCanonicalFindings: !!findings`). Does NOT read `content`.

---

### READ PATH 2 — activateTicketModeration (superadmin.controller.ts)
**File:** `backend/src/controllers/superadmin.controller.ts`
**Lines:** 4157–4167

```typescript
const [canonicalDoc] = await db
    .select()
    .from(tenantDocuments)
    .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'findings_canonical')
    ))
    .orderBy(desc(tenantDocuments.createdAt))
    .limit(1);
```
Returns: full row including `content`. Content is parsed on line 4195. **Direct DB read — does NOT go through projection.**

---

### READ PATH 3 — ticketGeneration.controller.ts
**File:** `backend/src/controllers/ticketGeneration.controller.ts`
**Lines:** 15–22

```typescript
const [doc] = await db.select()
    .from(tenantDocuments)
    .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'findings_canonical')
    ))
    .orderBy(desc(tenantDocuments.createdAt))
    .limit(1);
```
Returns: full row including `content`. **Direct DB read — does NOT go through projection.**

---

## WRITE PATHS

### WRITE PATH 1 — FindingsService.declareCanonicalFindings (only write path)
**File:** `backend/src/services/findings.service.ts`
**Lines:** 151–164

```typescript
await trx.insert(tenantDocuments).values({
    tenantId,
    category: 'findings_canonical',
    title: 'Canonical Findings (Operator Reviewed)',
    filename: `findings-canonical-${discoveryRecord.id}.json`,
    originalFilename: `findings-canonical-${discoveryRecord.id}.json`,
    description: 'Promoted from Stage 5 Assisted Synthesis',
    content: JSON.stringify(findingsObject),
    fileSize: Buffer.byteLength(JSON.stringify(findingsObject)),
    filePath: 'virtual://findings',
    uploadedBy: actorUserId,
    createdAt: new Date(),
    updatedAt: new Date()
});
```

**Invocation chain:**
1. `POST /api/superadmin/firms/:tenantId/findings/declare`
2. → `superadmin.controller.ts:declareCanonicalFindings` (line 4115)
3. → `FindingsService.declareCanonicalFindings` (line 4125)
4. → `db.transaction` → `trx.insert(tenantDocuments)`

The write path includes:
- Projection gate re-check inside transaction (`getTenantLifecycleView` line 123)
- `capabilities.declareCanonicalFindings.allowed` gate (line 126)
- Fetch of `discoveryCallNotes` for `discoveryRef` (lines 131–140)
- Insert of `auditEvents` row (lines 167–174)

---

## PROJECTION INTERACTION GRAPH

```
getTenantLifecycleView()
  └── resolveArtifacts()
        └── SELECT id FROM tenant_documents
              WHERE tenantId = X AND category = 'findings_canonical'
              ORDER BY createdAt DESC LIMIT 1
              → hasCanonicalFindings: boolean (presence-only)

buildCapabilityMatrix()
  └── declareCanonicalFindings.allowed =
        synthesis.ready && lifecycleValid && !hasCanonicalFindings
```

**Projection does NOT read findings content. It only checks existence.**

---

## NON-PROJECTION ACCESS

| Location | File | Line | Mode |
|---|---|---|---|
| `activateTicketModeration` | `superadmin.controller.ts` | 4157–4167 | Direct DB SELECT (full row + content) |
| `handleGenerateTicketsFromDiscovery` | `ticketGeneration.controller.ts` | 15–22 | Direct DB SELECT (full row + content) |
| Test stub | `stage6.refusal.ts` | 37 | Test-only mock |
| Projection test | `tenantStateAggregation.projection.test.ts` | 94 | Test-only mock |

Both non-test non-projection reads occur in controllers that **bypass projection for the content read itself**, though `declareCanonicalFindings` does invoke projection for the gating check.

---

## MUTATION HISTORY

No mutation history exists for `findings_canonical` rows after initial insert. There is no:
- UPDATE path for `findings_canonical`
- Audit events for reads
- Version bump mechanism
- Changelog table
