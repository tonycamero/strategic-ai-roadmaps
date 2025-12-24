# Tenant Schema Model (Post-Migration 023)

**Last Updated:** 2025-12-08  
**Migration Applied:** `023_refactor_owner_to_tenant.sql`

This document defines the canonical multi-tenant data model for Strategic AI Roadmaps after the tenant scoping refactor.

---

## Core Principles

1. **Tenants are the central scoping entity** — all customer data is scoped to a tenant
2. **Users belong to tenants** — via `users.tenantId`
3. **Tenants have owner users** — via `tenants.ownerUserId`
4. **No more "ownerId" ambiguity** — legacy column removed everywhere

---

## Table Structure

### `tenants`
**Purpose:** Multi-tenant organization/company records

| Column | Type | References | Notes |
|--------|------|------------|-------|
| `id` | uuid | - | Primary key |
| `name` | varchar | - | Tenant display name |
| `ownerUserId` | uuid | `users.id` | The user who owns this tenant |
| `status` | varchar | - | active, prospect, pilot_candidate, etc. |
| `cohortLabel` | varchar | - | Cohort grouping |
| `createdAt` | timestamp | - | |
| `updatedAt` | timestamp | - | |

**Key Indexes:**
- `idx_tenants_cohort_status` on `(cohortLabel, status)`

---

### `users`
**Purpose:** User accounts (owners, staff, superadmin)

| Column | Type | References | Notes |
|--------|------|------------|-------|
| `id` | uuid | - | Primary key |
| `email` | varchar | - | Unique |
| `tenantId` | uuid | `tenants.id` | Which tenant this user belongs to (NULL for superadmin) |
| `role` | varchar | - | owner, admin, staff, superadmin |
| `name` | varchar | - | Display name |
| `createdAt` | timestamp | - | |

**Foreign Keys:**
- `users.tenantId` → `tenants.id` (SET NULL on delete)

**Notes:**
- SuperAdmin users have `tenantId = NULL` or point to a special "Platform Administration" tenant
- Tenant owners: `users.id = tenants.ownerUserId`

---

### `intakes`
**Purpose:** Customer intake form submissions

| Column | Type | References | Notes |
|--------|------|------------|-------|
| `id` | uuid | - | Primary key |
| `tenantId` | uuid | `tenants.id` | **Tenant scoping column** |
| `status` | varchar | - | draft, submitted, processed |
| `formData` | jsonb | - | Intake answers |
| `createdAt` | timestamp | - | |

**Foreign Keys:**
- `intakes.tenantId` → `tenants.id` (CASCADE on delete)

**Key Indexes:**
- `idx_intakes_tenant_status_createdAt` on `(tenantId, status, createdAt)`

---

### `roadmaps`
**Purpose:** Generated strategic roadmap documents

| Column | Type | References | Notes |
|--------|------|------------|-------|
| `id` | uuid | - | Primary key |
| `tenantId` | uuid | `tenants.id` | **Tenant scoping column** |
| `createdByUserId` | uuid | `users.id` | User who created/generated this roadmap |
| `status` | varchar | - | draft, published, archived |
| `content` | jsonb | - | Roadmap sections/data |
| `createdAt` | timestamp | - | |

**Foreign Keys:**
- `roadmaps.tenantId` → `tenants.id` (CASCADE on delete)
- `roadmaps.createdByUserId` → `users.id` (SET NULL on delete)

**Key Indexes:**
- `idx_roadmaps_tenant_status_createdAt` on `(tenantId, status, createdAt)`

**Migration Notes:**
- Old `ownerId` column dropped
- `createdByUserId` backfilled from old `ownerId` (user reference)
- `tenantId` backfilled from `users.tenantId` join

---

### `tenant_documents`
**Purpose:** Uploaded documents (PDFs, etc.)

| Column | Type | References | Notes |
|--------|------|------------|-------|
| `id` | uuid | - | Primary key |
| `tenantId` | uuid | `tenants.id` | **Tenant scoping column** |
| `ownerUserId` | uuid | `users.id` | User who uploaded the document |
| `fileName` | varchar | - | |
| `contentType` | varchar | - | |
| `uploadedAt` | timestamp | - | |

**Foreign Keys:**
- `tenant_documents.tenantId` → `tenants.id` (CASCADE)
- `tenant_documents.ownerUserId` → `users.id` (SET NULL)

**Notes:**
- Renamed from `ownerId` → `ownerUserId` (clarifies it's a user reference)

---

### `discovery_call_notes`
**Purpose:** Notes from discovery calls with tenants

| Column | Type | References | Notes |
|--------|------|------------|-------|
| `id` | uuid | - | Primary key |
| `tenantId` | uuid | `tenants.id` | **Tenant scoping column** |
| `createdByUserId` | uuid | `users.id` | User who created the notes |
| `content` | text | - | |
| `createdAt` | timestamp | - | |

**Foreign Keys:**
- `discovery_call_notes.tenantId` → `tenants.id` (CASCADE)
- `discovery_call_notes.createdByUserId` → `users.id` (SET NULL)

**Notes:**
- Renamed from `ownerId` → `createdByUserId` (clarifies it's the note author)

---

### `invites`
**Purpose:** Tenant invitation records

| Column | Type | References | Notes |
|--------|------|------------|-------|
| `id` | uuid | - | Primary key |
| `tenantId` | uuid | `tenants.id` | **Tenant scoping column** |
| `email` | varchar | - | Invitee email |
| `role` | varchar | - | Role they'll receive |
| `status` | varchar | - | pending, accepted, expired |

**Foreign Keys:**
- `invites.tenantId` → `tenants.id` (CASCADE)

---

### `sop_tickets`
**Purpose:** SOP/ticket generation and moderation

| Column | Type | References | Notes |
|--------|------|------------|-------|
| `id` | uuid | - | Primary key |
| `tenantId` | uuid | `tenants.id` | **Tenant scoping column** |
| `moderationStatus` | varchar(20) | - | pending, approved, rejected |
| `approved` | boolean | - | Legacy (kept for migration safety) |
| `diagnosticId` | varchar | - | |

**Foreign Keys:**
- `sop_tickets.tenantId` → `tenants.id` (CASCADE)

**Key Indexes:**
- `idx_sop_tickets_tenant_diagnostic_status` on `(tenantId, diagnosticId, moderationStatus)`

**Migration Notes:**
- Added `moderationStatus` column
- Backfilled from `approved` boolean (true → 'approved', false → 'rejected', NULL → 'pending')

---

## Query Patterns

### ✅ Correct (Tenant-Scoped)
```typescript
// Always filter by tenant
const intakes = await db.select()
  .from(intakesTable)
  .where(eq(intakesTable.tenantId, currentUser.tenantId));

// For owner-only operations
const tenant = await db.select()
  .from(tenantsTable)
  .where(and(
    eq(tenantsTable.id, currentUser.tenantId),
    eq(tenantsTable.ownerUserId, currentUser.id)
  ));
```

### ❌ Prohibited (Cross-Tenant Risk)
```typescript
// NEVER: Fetch by ID without tenant check
const intake = await db.select()
  .from(intakesTable)
  .where(eq(intakesTable.id, intakeId)); // ❌ Missing tenantId filter

// NEVER: Join without tenant boundaries
const results = await db.select()
  .from(roadmapsTable)
  .leftJoin(intakesTable, eq(roadmapsTable.intakeId, intakesTable.id)); // ❌ No tenant scope
```

---

## SuperAdmin Special Cases

**Platform Administration Tenant:**
- SuperAdmin users (`role = 'superadmin'`) have their own tenant
- This tenant (`name = 'Platform Administration'`, `cohortLabel = 'PLATFORM'`) is for:
  - Internal operational data
  - SuperAdmin-specific configurations
  - Non-customer administrative records

**Cross-Tenant Access:**
- SuperAdmin can impersonate tenants via special middleware
- All impersonation actions MUST be logged
- See `VALIDATION_CHECKLIST.md` for superadmin validation steps

---

## Migration History

**023_refactor_owner_to_tenant.sql** (Applied 2025-12-08)
- Renamed `users.owner_id` → `tenantId`
- Renamed `tenants.owner_id` → `ownerUserId`
- Renamed `intakes.owner_id` → `tenantId`
- Roadmaps: added `tenantId` + `createdByUserId`, dropped `owner_id`
- Renamed `tenant_documents.owner_id` → `ownerUserId`
- Renamed `discovery_call_notes.owner_id` → `createdByUserId`
- Added `sop_tickets.moderation_status`
- Created 8 performance indexes

**Data Fixup Steps (Pre-Migration):**
1. Dropped all old `owner_id` FK constraints
2. Updated users to point to tenant IDs (not user IDs)
3. Created superadmin tenant
4. Updated intakes and invites to reference tenants
5. Applied migration SQL

---

## Security Implications

See `DATA_SECURITY_PROTOCOL.md` for full details. Key points:

1. **Every query must scope to tenantId** (unless explicitly superadmin)
2. **JWT tokens include tenantId** for request-level validation
3. **Middleware guards** enforce tenant boundaries
4. **No raw owner_id references** remain in runtime code
5. **Vector stores, agent threads, and file storage** must also respect tenant boundaries

---

## Related Documentation

- `VALIDATION_CHECKLIST.md` — Runtime validation steps
- `AGENT_CLEANUP_TICKETS.md` — Remaining agent subsystem refactoring
- `REFACTOR_CHECKPOINT.md` — Migration completion summary
- `DATA_SECURITY_PROTOCOL.md` — Security implementation guide

---

## Glossary

- **Tenant:** A customer organization (e.g., "Hayes Real Estate Group")
- **Owner:** The primary user who owns a tenant (`tenants.ownerUserId`)
- **tenantId:** The foreign key linking records to their tenant
- **ownerUserId:** Clarified user reference (not tenant reference)
- **createdByUserId:** User who created a specific record
- **SuperAdmin:** Platform operator with cross-tenant visibility
