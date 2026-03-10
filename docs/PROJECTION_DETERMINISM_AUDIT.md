# PROJECTION_DETERMINISM_AUDIT.md

**Ticket Authority:** EXECUTION-TICKET-PROJECTION-DETERMINISM-FORENSIC-001
**Mode:** READ-ONLY
**Date:** 2026-03-02

All answers reference `backend/src/services/tenantStateAggregation.service.ts`.

---

## STRICT YES/NO MATRIX

| Question | Answer | Evidence |
|---|---|---|
| Are any queries non-ordered? | **YES** | See #1 |
| Are any lists unsorted before projection emission? | **YES** | See #2 |
| Are any derived booleans dependent on transient DB state? | **YES** | See #3 |
| Are capability reasons ordered deterministically? | **NO** | See #4 |
| Is projectionVersion hardcoded or derived? | **HARDCODED** | See #5 |
| Is computedAt safe for deterministic comparisons? | **NO** | See #6 |

---

## 1. ARE ANY QUERIES NON-ORDERED? — YES

### resolveWorkflow: allIntakes query (line 344–347)
```typescript
const allIntakes = await (trx || db)
    .select()
    .from(intakes)
    .where(eq(intakes.tenantId, tenantId));
    // NO orderBy clause
```
No `ORDER BY` present. The order of `allIntakes` rows depends on the database engine's internal row evaluation order (undefined for Postgres without explicit ORDER BY).

This matters because:
- `rolesCompleted` is built from `Array.from(new Set(...allIntakes.filter(i => i.completedAt).map(i => i.role)))` (line 349–351).
- Set insertion order is preserved in JavaScript, but input order is non-deterministic without DB ordering.

### resolveWorkflow: sop01Docs query (line 359–365)
```typescript
const sop01Docs = await (trx || db)
    .select()
    .from(tenantDocuments)
    .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.sopNumber, 'SOP-01')
    ));
    // NO orderBy clause
```
No `ORDER BY`. Used in `requiredOutputs.every(out => sop01Docs.some(d => d.outputNumber === out))` — ordering doesn't affect boolean result here, but the full `sop01Docs` array is unordered.

### resolveWorkflow: roadmapDocs query (line 383–389)
```typescript
const roadmapDocs = await (trx || db)
    .select()
    .from(tenantDocuments)
    .where(and(
        eq(tenantDocuments.tenantId, tenantId),
        eq(tenantDocuments.category, 'roadmap')
    ));
    // NO orderBy clause
```
No `ORDER BY`. Used in `requiredSections.every(section => roadmapDocs.some(d => d.section === section))` (line 402–404) and `findingsComplete: roadmapDocs.length > 0` (line 472). The section match is unaffected by order; length is also unaffected.

### analytics query: allTickets (line 195–198)
```typescript
const allTickets = await (trx || db)
    .select()
    .from(sopTickets)
    .where(eq(sopTickets.tenantId, tenantId));
    // NO orderBy clause
```
No `ORDER BY`. Used in `resolveExecutiveAnalytics()`. Analytics computations use `.filter()` and `.reduce()`, which preserve array order but the order itself is not guaranteed.

---

## 2. ARE ANY LISTS UNSORTED BEFORE PROJECTION EMISSION? — YES

### workflow.rolesCompleted (line 349–351)
```typescript
const rolesCompleted: string[] = Array.from(new Set(
    allIntakes.filter(i => i.completedAt).map(i => i.role as string)
));
```
`rolesCompleted` is emitted to the public `TenantLifecycleView` as-is. Its order depends on the insertion order of `allIntakes` rows into the Set, which in turn depends on the unordered DB query result above. Two identical database states with different physical storage order could produce different `rolesCompleted` arrays.

### derived.blockingReasons (lines 662–683)
```typescript
const blockingReasons: string[] = [];
if (!workflow.hasOwnerIntake) blockingReasons.push('INTAKE_INCOMPLETE');
if (!['APPROVED', 'DELIVERED'].includes(governance.executiveBriefStatus)) blockingReasons.push('NO_REVIEWED_BRIEF');
if (!operator.confirmedSufficiency) blockingReasons.push('KNOWLEDGE_NOT_CONFIRMED');
if (!artifacts.diagnostic.exists) blockingReasons.push('NO_DIAGNOSTIC');
...
if (!synthesisReady && !blockingReasons.includes('SYNTHESIS_NOT_READY')) {
    blockingReasons.push('SYNTHESIS_NOT_READY');
}
```
`blockingReasons` array is built by sequential conditional push. The order is code-determined (stable), but the inclusion of `SYNTHESIS_NOT_READY` is appended conditionally and could appear out of position relative to the other reasons depending on which gates are triggered. The array order is stable for a given code version but is not sorted or normalized before emission.

---

## 3. ARE ANY DERIVED BOOLEANS DEPENDENT ON TRANSIENT DB STATE? — YES

### workflow.discoveryComplete (line 380)
```typescript
const discoveryComplete = !!discoveryNote && !!tenant?.discoveryComplete;
```
This condition AND's:
- `discoveryNote`: the latest `discovery_call_notes` row (only checking `id`, not status).
- `tenant.discoveryComplete`: a mutable boolean column on `tenants` (`discovery_complete`).

`tenants.discovery_complete` is a standalone mutable flag, not derived from an audit event. It can be updated independently of a `discovery_call_notes` row. If these two diverge, `discoveryComplete` produces an inconsistent result.

### workflow.discoveryIngested (lines 447–462)
```typescript
const [ingestedNote] = await (trx || db)
    .select({ id: discoveryCallNotes.id })
    .from(discoveryCallNotes)
    .where(and(
        eq(discoveryCallNotes.tenantId, tenantId),
        eq(discoveryCallNotes.status, 'ingested')
    ))
    .limit(1);
discoveryIngested = !!ingestedNote;
```
`discoveryCallNotes.status` is a mutable `varchar(20)` column (`'draft' | 'ingested'`). Any direct DB mutation to this field changes the projection output on the next call. No audit event is verified; the flag is entirely dependent on the transient state of this column.

### artifacts.diagnostic (lines 490–513)
```typescript
const [tenantPointer] = await (trx || db)
    .select({ lastDiagnosticId: tenants.lastDiagnosticId })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
```
`tenants.lastDiagnosticId` is a mutable `varchar(255)` on the `tenants` table. If updated concurrently, a different `diagnosticResult` is returned. The diagnostic `status` resolved from this is also a mutable column (`diagnostics.status`).

---

## 4. ARE CAPABILITY REASONS ORDERED DETERMINISTICALLY? — NO

### buildCapabilityMatrix (lines 721–759)
```typescript
return {
    lockIntake: {
        allowed: opts.derived.canLockIntake,
        reasons: opts.derived.blockingReasons   // ← same array for all capabilities
    },
    generateDiagnostic: {
        allowed: opts.derived.canGenerateDiagnostic,
        reasons: opts.derived.blockingReasons   // ← same array for all capabilities
    },
    ...
}
```

Every capability's `reasons` array is the same `blockingReasons` reference — a global list of ALL blocking reasons, not filtered to the specific capability. This means:

1. A capability's `reasons` may include reasons irrelevant to that specific capability.
2. The `reasons` array order is insertion-order from `computeDerivedFlags()`, which is code-defined but not alphabetical or semantically grouped.
3. `SYNTHESIS_NOT_READY` is conditionally injected after all others (line 681–683), making its position in the array non-deterministic relative to the set of active reasons.

---

## 5. IS projectionVersion HARDCODED OR DERIVED? — HARDCODED

**File:** `backend/src/services/tenantStateAggregation.service.ts`, line 31

```typescript
export const PROJECTION_VERSION = "1.0.0";
```

`projectionVersion` is a static string constant. It is:
- Not computed from schema version.
- Not derived from any migration or contract version.
- Not tied to any formal versioning mechanism.
- Used in `meta.projectionVersion` on every projection emission (line 231).

---

## 6. IS computedAt SAFE FOR DETERMINISTIC COMPARISONS? — NO

**File:** `backend/src/services/tenantStateAggregation.service.ts`, line 232

```typescript
computedAt: new Date().toISOString()
```

`computedAt` is a **wall-clock timestamp generated at call time**. It is:
- Not monotonic (NTP adjustments, clock skew can go backwards).
- Not tied to any DB transaction timestamp.
- Different on every projection call even with identical DB state.
- Not suitable as a cache key, version comparator, or determinism anchor.

Two projections fetched one millisecond apart return different `computedAt` values despite potentially identical underlying state.

---

## ADDITIONAL FINDINGS

### resolveGovernance: parallel queries not in ORDER BY
**Lines 276–314:** Executive brief and audit events are each fetched with `orderBy(desc(createdAt))` — these individual queries are ordered. ✅

### resolveArtifacts: findings query
**Lines 523–531:** `orderBy(desc(tenantDocuments.createdAt))` present. ✅

### resolveArtifacts: roadmap query
**Lines 516–521:** `orderBy(desc(roadmaps.createdAt))` present. ✅

### resolveWorkflow: blocking clarifications (lines 415–428)
Returns only `id` via `LIMIT 1`. Order irrelevant to boolean result. ✅ (trivially deterministic)

### resolveWorkflow: discoveryNote fetch (lines 373–378)
`orderBy(desc(discoveryCallNotes.createdAt))` present. ✅

### resolveWorkflow: vectorCount (lines 406–410)
Aggregate `count(*)` — deterministic. ✅

### Derived engine (computeDerivedFlags)
Executes zero DB queries. Pure function of its inputs. Fully deterministic given deterministic inputs. ✅

However, inputs include `workflow.rolesCompleted` (non-deterministic order) and `artifacts.diagnostic.status` (dependent on mutable transient column). So while the engine itself is pure, its inputs are not fully deterministic.
