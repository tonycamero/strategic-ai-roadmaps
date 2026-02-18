# SUPERADMIN_API_CONSTITUTION.md

**StrategicAI — SuperAdmin Control Plane Constitution**  
Version: 1.0  
Status: Canonical  
Authority: Backend Enforcement Layer  

---

# I. PURPOSE

This document defines the **non-negotiable rules** governing:

- SuperAdmin APIs
- Tenant execution state
- Stage transitions
- Artifact authority
- Gate enforcement
- Diagnostic / Roadmap generation rights

It establishes a single doctrine:

> **Execution state is compiled truth, not inferred presence.**

No UI, controller, or convenience flag may override this.

---

# II. CORE DOCTRINE — EXECUTION TRUTH

## 1. Completion Is Compiled (Not Stored)

A stage is COMPLETE only when:

- Required artifacts exist
- Required gates are satisfied
- Required authority events are verified

Completion is never inferred from:

- Row counts
- Timestamps alone
- File presence
- UI toggles

**Execution truth is derived on demand from existing canonical signals.**  
It is not a second source of state. It is a compiler over truth already present.

All stage state must be derived by:

```

ExecutionTruthService

```

No exceptions.

---

## 2. Single Compiler Rule

There is exactly **one** authority compiler of stage state:

```

backend/src/services/executionTruth.service.ts

````

All consumers (SuperAdmin + Tenant UI + Controllers) must call it.

- Frontend never calculates completion.
- Controllers never ladder-derive phase.
- Raw enums are never trusted as “completion.”

---

# III. EXECUTION TRUTH OBJECT

All stage state must conform to:

```ts
interface ExecutionTruth {
  stepId: ExecutionStepId;
  status: 'LOCKED' | 'READY' | 'ACTION_REQUIRED' | 'COMPLETE';

  requirements: {
    artifactPresent: boolean;
    gateSatisfied: boolean;
    authorityVerified: boolean;
  };

  blockers: Array<{
    code: string;
    message: string;
    evidenceRef?: string;
  }>;

  signals: {
    lastTransitionEventId?: string;
    compiledAt: string;
  };
}
````

---

## Status Definitions

### LOCKED

Prerequisites not met.

### READY

Artifacts exist, gates open, awaiting authority action.

### ACTION_REQUIRED

Artifacts present but missing approval / confirmation / resolution.

### COMPLETE

All required signals satisfied and authority verified.

Fail-closed default:
If any required signal is ambiguous → not COMPLETE.

---

# IV. AUTHORITY RULES

## 1. Artifacts ≠ Completion

Artifact presence is a prerequisite only.

Example:

* Executive Brief row exists → artifactPresent = true
* Brief status = APPROVED → authorityVerified = true
* Both required → COMPLETE

`approvedAt` without `status = APPROVED` is invalid.

Consistency checks are mandatory.

---

## 2. Authority Must Be Explicit

Authority signals must be verifiable through:

* Audit events
* Status fields
* Explicit approval markers

Implicit authority is forbidden.

---

## 3. No Silent State Transitions

Controllers must not:

* Auto-mark steps complete
* Update tenant.status directly as a proxy for completion
* Assume progress from counts

All transitions must validate through ExecutionTruthService before persisting any state change.

---

# V. GATE ENFORCEMENT

All generation endpoints must validate through:

```
gate.service.ts
```

AND the compiled execution truth.

Example:

* Cannot generate Diagnostics unless:

  * Executive Brief = COMPLETE
  * Operator sufficiency confirmed
  * No blocking clarification outstanding

Gate logic must not be reimplemented in controllers or frontend components.

---

# VI. FRONTEND RENDERING RULES

Frontend is rendering-only.

It must:

* Consume ExecutionTruth array
* Render status + blockers
* Never compute derived completion

Forbidden patterns:

* `if (count > 0) markComplete`
* `if (status === 'APPROVED') assume done`
* Manual laddering logic in React components

Any UI derivation logic is a constitutional violation.

---

# VII. STAGE CONTRACT MATRIX

Each stage must define:

| Step            | Artifact Required            | Gate Required       | Authority Required             |
| --------------- | ---------------------------- | ------------------- | ------------------------------ |
| OWNER_INTAKE    | Owner intake row             | Intake window open  | None                           |
| TEAM_INTAKES    | All required roles submitted | Intake window open  | None                           |
| EXECUTIVE_BRIEF | Brief artifact exists        | Intake sealed       | Brief APPROVED                 |
| DIAGNOSTIC      | Diagnostic artifact exists   | Brief COMPLETE      | Operator confirmed sufficiency |
| ROADMAP         | Roadmap artifact exists      | Diagnostic COMPLETE | Roadmap finalized event        |

ExecutionTruthService must compile against this matrix.

---

# VIII. FAILURE CONDITIONS

If:

* Migration drift detected
* Required column missing
* Authority signal inconsistent
* Audit event missing
* Status mismatch

System must:

* Fail closed
* Reject generation
* Return structured error
* Log high-visibility signal

Silent drift is forbidden.

---

# IX. DATABASE PARITY REQUIREMENT

Before server boot (production):

```
db:driftcheck
```

must pass.

If drift detected and not allowlisted:

* Server must exit
* Production must fail fast

Schema mismatch may not degrade into runtime 500s.

---

# X. PROHIBITED PATTERNS

The following are constitutional violations:

* Direct mutation of tenants.status as a proxy for completion
* Completion derived from `COUNT(*)`
* Stage inferred from presence of PDF
* UI-driven authority transitions
* Parallel gate logic
* Silent migration patches in production

---

# XI. CHANGE CONTROL

Any modification to:

* Stage requirements
* Authority signals
* Gate logic
* ExecutionTruth schema

Requires:

* Meta-ticket
* Explicit migration plan (if DB touched)
* Test coverage
* Updated matrix in this document

---

# XII. PRINCIPLE

StrategicAI is not a workflow tracker.

It is an **Authority-Governed Execution System**.

* Authority is explicit.
* Completion is compiled.
* State is deterministic.
* Frontend renders.
* Backend adjudicates.

No ambiguity. No inference. No drift.

---

**END OF CONSTITUTION**

