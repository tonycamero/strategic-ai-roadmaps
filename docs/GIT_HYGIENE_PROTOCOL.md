# Git Hygiene & Change Control Protocol
**Status:** Canonical  
**Authority:** META-TICKET-GIT-HYGIENE-AND-LOCK-1  
**Last Updated:** 2026-01-21  
**Applies To:** All contributors, agents, and automation acting on this repository

---

## 1. Purpose

This document formalizes the existing Git usage patterns of the repository to:

- prevent silent drift
- preserve execution provenance
- enforce ticket-based authority
- constrain agent behavior to approved execution surfaces

This protocol **documents reality**. It does not introduce new tooling, workflows, or enforcement mechanisms.

---

## 2. Canonical Branch Declaration

### Authoritative Branch
- **`main`** is the sole canonical and authoritative branch.
- `origin/HEAD` explicitly points to `origin/main`.

No work is considered final, valid, or authoritative until merged into `main`.

### Execution Branches
- Feature or execution branches (e.g. `feature/roadmap-assembly-v1`) are **non-authoritative**.
- These branches are permitted as temporary execution surfaces only.
- They must map clearly to a defined scope or ticket.

---

## 3. Ticket → Commit Traceability Rule

All commits **must** be traceable to a governing ticket.

### Required
- Every commit message must reference a ticket ID:
  - META tickets (e.g. `META-TICKET-GIT-HYGIENE-AND-LOCK-1`)
  - CR-UX tickets (e.g. `CR-UX-6.2`)
  - FIX tickets (e.g. `FIX-LOCK-INTAKE-1`)

### Prohibited
- Anonymous commits
- “cleanup”, “wip”, or scope-less messages
- Commits that cannot be traced to an approved ticket

If a change cannot be tied to a ticket, it is **invalid by definition**.

---

## 4. Lock Rules (Read-Only Surfaces)

The following files and directories are **locked by default**:

- Governance documents
- SOPs
- Schema definitions
- Canonical protocol files

Modification of these surfaces requires an **explicit Meta Ticket** authorizing the change.

Absence of authorization = no change, regardless of perceived correctness.

---

## 5. Agent Execution Constraints

Agents operating in this repository are constrained as follows:

Agents **may not**:
- create or rename branches
- merge branches
- rewrite history
- infer scope
- invent artifacts
- modify locked documents without authorization

Agents **may only** act:
- within the bounds of an explicitly delegated ticket
- on files declared in-scope by that ticket

All other actions are non-compliant.

---

## 6. Execution Provenance

Current execution context (as verified during audit):

- Environment: WSL
- Primary operator: Tony Camero
- Mode: single-user / supervised agent execution

This context reinforces the **Junior Developer / Obedience-First** agent contract.

---

## 7. Enforcement Philosophy

This protocol prioritizes:

- clarity over automation
- discipline over speed
- authority over cleverness

Future tooling (CI, hooks, automation) may be layered later **only if explicitly authorized**.

---

## 8. Canonical Status

This document is **canonical**.

Any behavior, assumption, or instruction that contradicts this protocol is invalid unless superseded by a newer Meta Ticket.

---

**END OF DOCUMENT**
