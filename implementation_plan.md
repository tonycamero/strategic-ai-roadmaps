# Strategic AI Roadmap - Recomposition Orchestration Plan

This document serves as the top-level orchestrator for the parallel efforts of forking the TonyCamero.com site and reshaping the StrategicAI.app platform.

## Execution Chain

### 1. Personal Site Separation (TonyCamero.com)
- **[META-FE-FORK-TONYCAMERO-SITE-001] Fork/Migration (Website-only)**
  - Execution: [EXEC-FE-FORK-TONYCAMERO-SITE-001](file:///wsl$/Ubuntu/home/tonycamero/code/Strategic_AI_Roadmaps/docs/execution-tickets/EXEC-FE-FORK-TONYCAMERO-SITE-001.md)
  - Goal: Isolate the personal site into its own repository.
  - Status: COMPLETED

### 2. Platform Stabilization (StrategicAI.app)
- **[META-FE-BOOT-UNBLOCK-SUPERADMIN-001] Fix FE Boot Unblock (SuperAdmin)**
  - Goal: Fix missing components/routes blocking the SuperAdmin boot.
  - Status: *In Progress (Verification required)*
- **[META-SHARED-IMPORT-CANONICALIZE-001] Shared Import Canonicalization**
  - Goal: Move all frontend imports to the `@roadmap/shared` canonical entry point.
  - Status: *In Progress (Blocked by below fixes)*

#### Blockers / Stability Path
- **[META-BE-500-DIAGNOSTIC-SNAPSHOT-001] Backend Crash Fix (Missing Export)**
  - Execution: [EXEC-BE-500-DIAGNOSTIC-SNAPSHOT-001](file:///wsl$/Ubuntu/home/tonycamero/code/Strategic_AI_Roadmaps/docs/execution-tickets/EXEC-BE-500-DIAGNOSTIC-SNAPSHOT-001.md)
  - Status: COMPLETED
- **[META-BE-ENV-LOAD-RACE-001] Env Race / Migration Script Fix**
  - Execution: [EXEC-BE-ENV-LOAD-RACE-001](file:///wsl$/Ubuntu/home/tonycamero/code/Strategic_AI_Roadmaps/docs/execution-tickets/EXEC-BE-ENV-LOAD-RACE-001.md)
  - Status: COMPLETED
- **[META-FE-PROXY-CANONICALIZE-API-BASE-001] Frontend Proxy Canonicalization**
  - Execution: [EXEC-FE-PROXY-CANONICALIZE-API-BASE-001](file:///wsl$/Ubuntu/home/tonycamero/code/Strategic_AI_Roadmaps/docs/execution-tickets/EXEC-FE-PROXY-CANONICALIZE-API-BASE-001.md)
  - Status: COMPLETED


## Current Status
We are currently finishing the verification of **Shared Import Canonicalization**, which surfaced the stability issues now tracked in tickets 3-5.
