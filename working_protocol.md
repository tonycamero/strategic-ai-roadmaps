# AGENT WORKING PROTOCOL (FE-TA CALIBRATION)

This document establishes the ground rules for collaboration to ensure high-velocity execution with zero regressions.

## 1. Optimal Prompt Structure
The "Meta-Ticket" format is the most effective. It should include:
- **Objective**: The high-level "Why".
- **Context**: What has already been verified (e.g., "Backend returns X in Network tab").
- **Required Change**: Specific code blocks or logical targets.
- **Constraints**: "Non-destructive", "Lock this", "Don't touch Y".
- **Success Criteria**: Concrete verification steps.

## 2. Regression Risks
- **Implicit Field Dropping**: When I reconstruct an object during mapping (e.g., `messages.map(...)`), I may accidentally omit fields like `cta` or `reveal` if they aren't explicitly in the template.
- **Wrong File Assumption**: The codebase often has duplicate structures (e.g., `components/TrustAgent` vs `trustagent/`). **AG must always verify the ACTIVE path via `HomePage.tsx` or similar before editing.**
- **Over-reaching Logic**: Refactoring existing code while adding a feature can introduce bugs in legacy paths.

## 3. The "Lock" (Forbidden Behaviors)
Unless explicitly authorized, the following are FORBIDDEN:
- **Refactoring**: No "cleaning up" or "DRY-ing" code outside the immediate requested block.
- **Dependency Drift**: No changes to `package.json`, `pnpm-lock.yaml`, or `node_modules` paths.
- **File Mutation**: No deleting or renaming files.
- **Schema Changes**: No modifications to persistence layers or database structures.

## 4. Extension Format
When extending a system, use the **"Contract-First"** pattern:
- **Interface**: Define the expected data payload.
- **Allowed List**: Explicitly list files that *can* change.
- **Snippet Insertion**: Provide the exact visual block to insert (relying on my creative logic for UI design increases backtracking).

## 5. Coordination Improvements
- **Discovery First**: Start every task with 1-2 tool calls to find the *runtime truth* (active component, port, server state).
- **Mapping Verification**: When adding a new field, always check the "Sanitization/Normalizer" layer (e.g., `safeMessages`).
- **Proof Requirement**: Always provide a specific proof (JSON payload, `curl` result, or file/line confirmation).

---
*Created: 2025-12-18*
