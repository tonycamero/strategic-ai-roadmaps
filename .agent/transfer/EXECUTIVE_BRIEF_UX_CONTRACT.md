# Executive Brief UX Contract & Security Boundaries
**Status:** IMPLEMENTED / ENFORCED
**Scope:** SuperAdmin Control Plane

## Core Philosophy
The Executive Brief is the "Crown Jewel" artifact. It represents the private, unfiltered strategic reality of the firm. It is **NOT** a shared document. It is an **Authority Artifact**.

## 1. Structural Invisibility (The "Ghost" Pattern)
- **Constraint:** Non-executive users (Delegates) must **NEVER** know the Executive Brief exists.
- **Implementation:** The UI component (`ExecutiveBriefSurface`) is conditionally rendered from the server/client logic.
- **DOM Security:** It is not merely "hidden" with CSS; it is **absent** from the DOM for unauthorized roles.
- **Outcome:** A delegate inspecting the page source sees zero evidence of the brief's existence.

## 2. Fail-Closed Security
- **Constraint:** If permission checks fail, error out, or are ambiguous, the system defaults to **NO ACCESS**.
- **Backend:** API endpoints (`/exec-brief`) verify `requireExecutiveAuthority()` before execution.
- **Frontend:** `AuthorityGuard` wrapper ensures client-side checks align with server rules.

## 3. The "Acknowledged" Gate
- **Constraint:** Downstream actions (Diagnostic Synthesis, Roadmap) are **physically disabled** until the Brief is in a finalized state (`ACKNOWLEDGED` or `WAIVED`).
- **UX Signal:** The "Execute Diagnostic" button is greyed out. A status indicator shows "LOCKED" unless the Brief is resolved.
- **Rationale:** We cannot automate strategy until leadership has confirmed the diagnosis.

## 4. Read/Write Sovereignty
- **Constraint:** Only the Executive Sponsor (or SuperAdmin acting as them) can explicitly transition status.
- **Anti-Pattern:** Auto-acknowledgment by time or scroll depth is strictly forbidden.

## 5. Visual Language
- **Aesthetic:** Distinct from the rest of the interface. Uses premium signals (purple/gold accents) to denote "Executive Zone".
- **Tone:** Serious, high-stakes, private.
