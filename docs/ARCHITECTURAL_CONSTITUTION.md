# ARCHITECTURAL CONSTITUTION
StrategicAI Platform Governance Document

Version: 1.0  
Status: Active  
Authority: SSOT Projection Spine  

---

# 1. Purpose

This document defines the **constitutional architecture** of the StrategicAI platform.

The system is governed by structural authority layers that enforce:

• schema integrity  
• controller responsibility boundaries  
• stage pipeline contracts  
• projection-based mutation authority  

These layers ensure the system remains stable even when developed with autonomous agents.

The architecture is designed so that **illegal actions are rejected by the system itself**, rather than relying on developer discipline.

---

# 2. Constitutional Principle

StrategicAI is governed by **structural authority rather than developer intent**.

This means:

• system state determines what actions are allowed  
• architectural boundaries enforce responsibility  
• mutations cannot occur unless authorized by projection state  

The system therefore behaves as a **constitutional execution environment**.

---

# 3. Authority Layers

The platform is governed by four primary authority layers.

---

## 3.1 Schema Authority

Database schema authority resides in **Neon Postgres**.

The Drizzle schema file is a mirror of the database structure and must not be modified without explicit migration authorization.

Protected file:

backend/src/db/schema.ts

Guardrail:

scripts/guardrails/schemaIntegrityCheck.js

Rule:

Schema modifications are prohibited unless accompanied by a formal migration ticket.

Build will fail if unauthorized changes are detected.

---

## 3.2 Controller Authority Boundary

Controllers are orchestration layers only.

Controllers may perform:

• validation  
• service invocation  
• response formatting  
• projection checks  

Controllers may NOT perform:

• ticket generation  
• artifact transformation  
• business logic computation  
• pipeline stage processing  

Guardrail:

scripts/guardrails/controllerBoundaryCheck.js

Example violation:

Generating tickets inside `superadmin.controller.ts`.

Correct architecture:

Controller calls a service.

---

## 3.3 Stage Pipeline Contracts

The StrategicAI pipeline is divided into stages with strict responsibility boundaries.

Cross-stage logic contamination is prohibited.

Guardrail:

scripts/guardrails/stageBoundaryCheck.js

---

### Stage-5 Authority

Responsibilities:

• artifact rendering  
• artifact normalization  
• artifact projection  

Stage-5 must NOT:

• generate tickets  
• compile roadmap graphs  

---

### Stage-6 Authority

Responsibilities:

• canonical findings processing  
• ticket generation  
• proposal materialization  
• moderation session activation  

Stage-6 must NOT:

• render artifacts  
• compile roadmap graphs  

---

### Stage-7 Authority

Responsibilities:

• roadmap graph compilation  
• execution envelope generation  
• dependency graph creation  

Stage-7 must NOT:

• generate tickets  
• mutate findings artifacts  

---

## 3.4 Projection Authority

All mutation operations must pass through **Projection Authority**.

Projection state determines whether a mutation is allowed.

Examples of mutation operations:

• ticket generation  
• ticket approval  
• roadmap compilation  
• execution envelope creation  

Guard:

backend/src/middleware/projectionAuthorityGuard.ts

Rule:

If projection state indicates `mutationLocked`, the operation must fail.

This prevents illegal state transitions.

---

# 4. Canonical Stage-6 Ticket Generation

Ticket generation must follow this canonical pipeline:

Projection Gate  
↓  
Canonical Findings Retrieval  
↓  
Ticket Generation Service  
↓  
Proposal Materialization  
↓  
Moderation Session Activation  

Allowed generator:

backend/src/services/ticketGeneration.service.ts

Function:

generateTicketsFromFindings()

Controllers must not implement ticket generation logic.

---

# 5. Guardrail System

The repository contains automated guardrails that enforce this constitution.

Guardrails run during the build process.

Location:

scripts/guardrails/

Active protections:

• schemaIntegrityCheck.js  
• controllerBoundaryCheck.js  
• stageBoundaryCheck.js  

These scripts abort the build if violations occur.

---

# 6. Mutation Safety Model

The platform follows a **fail-closed mutation model**.

Meaning:

• operations are denied unless explicitly allowed  
• projection state determines legal actions  
• unauthorized mutations fail immediately  

This ensures system integrity even when agents are performing development.

---

# 7. Architectural Philosophy

StrategicAI uses **structural intelligence architecture**.

Rather than relying on developer discipline, the system enforces rules automatically.

Key principles:

• authority defined by structure  
• boundaries enforced by architecture  
• system state governs execution  

This design allows the platform to remain stable even in autonomous development environments.

---

# 8. Organizational Mirror

The same constitutional pattern used in this architecture mirrors the StrategicAI methodology used for organizations.

Software governance layer:

Structure  
↓  
Boundaries  
↓  
State Visibility  
↓  
Action Permission  

Organizational governance layer:

Structure  
↓  
Role Clarity  
↓  
Operational Visibility  
↓  
Executive Authority  

StrategicAI applies the same structural intelligence principles at both levels.

---

# 9. Amendment Process

Changes to this constitution require:

1. Architectural governance ticket  
2. explicit schema or stage migration approval  
3. guardrail updates if boundaries change  

Constitutional changes must never be performed implicitly.

---

# 10. Closing Principle

The StrategicAI platform is not governed by convention.

It is governed by **architectural law**.

The system itself enforces its rules.

This ensures the platform remains stable, transparent, and trustworthy as it evolves.