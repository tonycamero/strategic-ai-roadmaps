# META-TICKET v2: META-PUBLIC-COPY-EDIT-BOUNDARY-001

## Goal
Authorize **text-only edits** to the **public-facing marketing pages** of StrategicAI.app, while explicitly preventing any modification to Tenant, SuperAdmin, or authenticated application surfaces.

This ticket establishes a **hard copy-edit boundary**.

---

## Critical Constraints (Non-Negotiable)

- MUST restrict all edits to **public marketing pages only**.
- MUST NOT modify text, labels, copy, or UI strings in:
  - Tenant-facing pages
  - SuperAdmin pages
  - Authenticated application routes
  - Modals, dashboards, or in-app flows
- MUST NOT alter logic, routing, permissions, or component behavior.
- MUST NOT refactor shared components used by both public and app surfaces.
- MUST NOT “clean up” wording outside the explicitly allowed scope.

- MUST store THIS META-TICKET in:
  - `docs/meta-tickets/META-PUBLIC-COPY-EDIT-BOUNDARY-001.md`

- MUST open a PR for review (no direct merges).

---

## Allowed Scope (Explicit)

**IN SCOPE**
- Public marketing routes only, such as:
  - `/`
  - `/pricing`
  - `/how-it-works`
  - `/about`
  - Any other clearly unauthenticated, marketing-only pages
- Text-only changes:
  - Headlines
  - Subhead copy
  - Section labels
  - CTA text
  - Meta title / description for public pages only

**OUT OF SCOPE (Hard Stop)**
- `/app`, `/tenant`, `/dashboard`, `/superadmin`, or equivalent
- Any authenticated or role-gated views
- Any shared constants, enums, or copy files referenced by app surfaces
- Any component used by both public + app contexts unless explicitly duplicated

---

## Execution Rules

- If a component is shared between public and app surfaces:
  - DO NOT edit it.
  - Duplicate it for public use **only if explicitly authorized in a follow-up ticket**.
- If there is ambiguity about whether a page is public or app-facing:
  - STOP
  - REPORT the ambiguity
  - DO NOT proceed

---

## Verification Requirements

Before submitting PR, the Agent MUST confirm:
- No Tenant or SuperAdmin files were touched.
- No authenticated routes were modified.
- Diff is limited to public marketing copy.
- Build passes with no behavioral changes.

---

## Acceptance Criteria

- Public-facing pages reflect the requested text edits.
- Tenant and SuperAdmin copy remains unchanged.
- No logic, routing, or permissions affected.
- META-TICKET persisted correctly.
- PR clearly lists files edited and confirms boundary compliance.

---

## Stop Conditions

- If implementing requested copy edits requires touching Tenant or SuperAdmin text:
  - STOP
  - REPORT why
  - WAIT for authorization
