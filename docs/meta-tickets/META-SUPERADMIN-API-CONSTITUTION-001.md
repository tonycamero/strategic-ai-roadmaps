
# META TICKET

**ID:** META-SUPERADMIN-API-CONSTITUTION-001
**Title:** SuperAdmin API Constitution (Canonical Contract Definition)
**Status:** ACTIVE
**Owner:** Tony Camero
**Agent:** Antigravity (AG)
**Created:** 2026-01-24

---

### 🎯 PURPOSE

Establish a **canonical, explicit, governed API contract** for all **SuperAdmin frontend surfaces**, with `SuperAdminControlPlaneFirmDetailPage` as the **primary authority driver**.

This ticket exists to **eliminate API drift**, **prevent hallucinated capabilities**, and **restore compile determinism** by making all SuperAdmin API expectations explicit, typed, and reviewable.

---

### 🧠 PROBLEM STATEMENT

The frontend currently references **numerous SuperAdmin API methods** that:

* Do not exist in `api.ts`
* Exist only implicitly in backend controllers
* Were partially removed or renamed
* Represent aspirational / unfinished system phases

This has resulted in:

* 100+ TypeScript errors
* Unclear authority boundaries
* UI assuming powers not formally granted
* Impossible-to-reason-about execution state

---

### 🧭 SCOPE (STRICT)

This ticket **DOES NOT**:

* Implement backend logic
* Invent new product behavior
* Modify runtime flows
* Patch legacy pages beyond documentation

This ticket **ONLY**:

* Enumerates required API methods
* Defines canonical signatures
* Classifies authority and lifecycle
* Produces a typed frontend contract

---

### 🧱 CANONICAL TARGET

Primary authority surface:

```
src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx
```

Secondary consumers:

* SuperAdmin execution components
* Moderation & synthesis panels
* Roadmap / diagnostic orchestration UI

---

### 🧩 DELIVERABLES

#### 1. **SuperAdmin API Capability Inventory**

A definitive list of all API calls referenced by SuperAdmin UI, grouped by domain:

* Tenant Control
* Intake Lifecycle
* Diagnostic Lifecycle
* Discovery / Synthesis
* Roadmap Assembly
* Moderation
* Execution Authority
* Read-only Telemetry

Each method must be classified as:

* ✅ **Canonical (exists + required)**
* 🟡 **Declared-but-unimplemented**
* ❌ **Invalid / legacy / hallucinated**

---

#### 2. **Canonical `api.superadmin` Contract**

A typed extension of `api.ts` (or sub-object) that:

* Declares **every allowed SuperAdmin method**
* Uses correct request/response shapes
* Explicitly throws `NOT_IMPLEMENTED` for unbacked endpoints
* Becomes the **single source of truth** for frontend authority

*No silent failures. No guessing.*

---

#### 3. **Authority Notes**

For each API method:

* Who may call it (Executive / Delegate / Operator)
* Whether it mutates state or is read-only
* Which execution phase it belongs to (Intake, Diagnostic, Discovery, Roadmap, Execution)

---

### 🚫 HARD CONSTRAINTS

* **No backend changes**
* **No new endpoints invented**
* **No UI refactors**
* **No legacy page deletion**
* **No weakening of TypeScript strictness**

---

### 🧪 ACCEPTANCE CRITERIA

This META ticket is complete when:

* A written **SuperAdmin API Constitution** exists
* All SuperAdmin frontend API expectations are explicit
* It is possible to say, with certainty:

  > “This UI is allowed to do exactly this — and nothing more.”

Follow-on EXECUTION tickets may then:

* Stub missing APIs
* Refactor UI expectations
* Or formally deprecate features

---

### 📌 NEXT TICKETS (BLOCKED UNTIL THIS IS DONE)

* EXEC: SuperAdmin API Stub Implementation
* EXEC: SuperAdmin Compile Stabilization
* EXEC: Control Plane → Execution Plane Separation
* EXEC: Phase-Gated Authority Enforcement

---

### 🔒 GOVERNANCE NOTE

Any future SuperAdmin UI work **must reference this constitution**.
No component may call an API method not declared here.
