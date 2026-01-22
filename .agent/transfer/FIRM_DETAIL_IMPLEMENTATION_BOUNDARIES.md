# SuperAdmin Firm Detail Page — Implementation Boundaries
**Component:** `SuperAdminControlPlaneFirmDetailPage.tsx`
**Status:** PRODUCTION

## 1. Zoning Architecture
The page is strictly divided into three "Zones" of decreasing visibility and increasing authority.

### Zone 1: Shared Core Artifacts (Public/Team)
- **Visibility:** All Roles (Executive, Delegate, Operator).
- **Contents:** Firm Metadata, Team List, Intake Status, Operational Integrity.
- **Intent:** "This is who we are."
- **Component:** Top-level cards, Metadata rows.

### Zone 2: Delegation & Preparation (Delegate Layer)
- **Visibility:** All Roles (primary workspace for Delegates).
- **Contents:** Pre-analysis tasks, Knowledge Base assembly, Team Role validation.
- **Intent:** "This is the work executing the strategy."
- **Component:** Action cards for preparatory work.

### Zone 3: Executive Authority (Executive Only)
- **Visibility:** **EXECUTIVE SPONSOR / SUPERADMIN ONLY**.
- **Contents:** Executive Brief, Synthesis Engine, Roadmap Finalization, Gating Controls.
- **Intent:** "This is where I decide."
- **Implementation:** Wrapped in `<AuthorityGuard requiredCategory={AuthorityCategory.EXECUTIVE}>`.
- **Invariants:** Hidden from DOM for delegates.

## 2. Gating Mechanics
- **Diagnostic Gating:** Roadmap actions are strictly gated by the `diagnosticStatus` (from Ticket 5).
- **Status Dependencies:**
  - Brief `ACKNOWLEDGED` → Unlocks Diagnostic Synthesis (`generateSop01`).
  - Diagnostic `readyForRoadmap` (Moderated) → Unlocks Roadmap Finalization (`generateFinalRoadmap`).
- **Visual Feedback:**
  - **LOCKED:** Grey/Dimmed.
  - **RELEASED:** Green/Emerald status text.
  - **PENDING:** Amber warning with specific blocker count (e.g., "3 tickets pending moderation").

## 3. Data Integrity & State
- **Single Source of Truth:** `getFirmDetail` endpoint now returns a composite object including `diagnosticStatus` and `executiveBriefStatus`.
- **Refetch Strategy:** Critical actions (`generateSop01`, `generateFinalRoadmap`) trigger a full page reload or state refresh to ensure gates are re-evaluated server-side.

## 4. Role Simulation (Verification)
- **Tool:** `RoleSimulator` component (floating bottom-right).
- **Purpose:** Allows SuperAdmins to instantly toggle between "Executive" and "Delegate" views to verify structural visibility rules (- "Structural Invisibility").
- **Constraint:** Development/SuperAdmin use only.
