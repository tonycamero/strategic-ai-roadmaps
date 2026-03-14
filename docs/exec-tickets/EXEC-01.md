# EXEC-01 — Identity Projection Patch

**Parent META:** META-LIFECYCLE-EXECUTION-PATH-01
**Stage:** Lifecycle Execution Activation
**Priority:** Critical

---

# Objective

Expose **identity and authority context** through the tenant lifecycle snapshot so that Control Plane execution surfaces can correctly evaluate authority rules.

Execution panels currently render but appear inactive because the UI cannot resolve the current user's authority context.

This ticket introduces a **minimal identity projection patch** to the snapshot service.

---

# Scope

Modify the lifecycle snapshot service so that the snapshot response includes identity fields required by AuthorityGuard and execution surfaces.

Target service:

```
resolveTenantLifecycleSnapshot()
```

File location:

```
backend/src/services/resolveTenantLifecycleSnapshot.ts
```

---

# Problem

The snapshot currently returns:

```
tenant
owner
teamMembers
artifacts
roadmap
tickets
```

But the UI requires identity context such as:

```
currentUserId
authorityCategory
role
```

Without these fields AuthorityGuard cannot determine whether execution surfaces should activate.

---

# Required Fields

Add an identity object to the snapshot response:

```
identity: {
  currentUserId
  ownerUserId
  role
  authorityCategory
}
```

---

# Implementation

## Step 1 — Resolve Current User

Use the active session user id.

Example pattern:

```
const currentUser = await db
  .select()
  .from(users)
  .where(eq(users.id, session.userId))
  .limit(1);
```

---

## Step 2 — Extract Identity Fields

From the user record resolve:

```
id
role
authorityCategory
```

---

## Step 3 — Attach Identity to Snapshot

Extend the snapshot return object:

```
identity: {
  currentUserId: currentUser?.id ?? null,
  ownerUserId: projection.identity.ownerUserId ?? null,
  role: currentUser?.role ?? null,
  authorityCategory: currentUser?.authorityCategory ?? null
}
```

---

# Resulting Snapshot Structure

The snapshot response must now contain:

```
{
  tenantId
  projection
  tenant
  owner
  teamMembers
  artifacts
  roadmap
  tickets
  identity
}
```

---

# UI Dependencies

The following components rely on these identity fields:

```
AuthorityGuard
ExecutionAuthorityPanel
ControlPlaneExecutionSurface
```

AuthorityGuard will evaluate:

```
authorityCategory
role
```

to determine execution permissions.

---

# Acceptance Criteria

The identity object appears in snapshot responses:

```
/api/tenants/:tenantId/snapshot
```

The response must include:

```
identity.currentUserId
identity.ownerUserId
identity.role
identity.authorityCategory
```

Execution surfaces in the Control Plane must render without authority blocking errors.

---

# Verification

Call the snapshot endpoint and confirm:

```
GET /api/tenants/:tenantId/snapshot
```

Response must contain:

```
identity: {
  currentUserId
  ownerUserId
  role
  authorityCategory
}
```

---

# Completion Signal

This ticket is complete when:

• Snapshot includes identity projection
• AuthorityGuard components resolve identity context
• Control Plane execution surfaces activate correctly

---

# Next Ticket

After completion:

```
EXEC-02 — Projection Lifecycle Adapter Stabilization
```
