# CR-UX Master Flow

## Executive-Governed Delivery Spine (A→Z)

---

## Purpose

This document defines the **canonical end-to-end workflow** governing how a firm moves from first contact to measurable ROI inside the system.

It is the **authoritative UX + governance spine** for:

* SuperAdmin surfaces
* Executive Brief mechanics
* Diagnostic and Roadmap workflows
* Snapshot-based ROI tracking

This flow is **non-negotiable**. All SuperAdmin UX, AG tickets, and future implementations must conform to it.

---

## Design Philosophy

This system is not a funnel or an automation engine.

It is a **decision legitimacy engine**.

Therefore:

* Authority is explicit
* Transitions are gated
* Nothing important happens implicitly

---

## Canonical Workflow (A→Z)

### 1. Lead / Owner Signup

**Who:** Business owner or executive sponsor
**Surface:** Public / Auth Onboarding

**Outcome:**

* Firm record created
* Executive authority established

---

### 2. Lead Intake

**Who:** Lead / Owner
**Surface:** Lead Intake UX

**Purpose:**

* Capture the executive’s framing of the business
* Establish initial problem statements

**Notes:**

* This is *directional*, not diagnostic

---

### 3. Lead-Defined Role Invitations

**Who:** Lead / Owner
**Surface:** SuperAdmin → Firm → Role Configuration

**Purpose:**

* Executive defines:

  * Which roles matter
  * What each role is expected to surface
  * Perceived vs latent constraints

This is where **trust and awareness gaps are intentionally exposed**.

---

### 4. Role-Based Team Intakes

**Who:** Invited team members
**Surface:** Role-Specific Intake UX

**Purpose:**

* Capture execution reality
* Surface friction independent of hierarchy

**Constraint:**

* Team members cannot see other intakes

---

### 5. Intake Closure (Executive Gate)

**Who:** Executive only
**Surface:** SuperAdmin → Firm → Intake Control

**Explicit Action:**

* **Close Intake Window**

**Effect:**

* Freezes all intake data
* Prevents late edits
* Signals readiness for synthesis

*No downstream step may proceed without this.*

---

### 6. Executive-Only Brief

**Who:** Executive only
**Surface:** SuperAdmin → Executive Brief

**Purpose:**

* Surface:

  * Non-obvious deltas
  * Trust gaps
  * Awareness mismatches
* Separate leadership signal from execution noise

**Visibility:**

* Completely invisible to delegates

---

### 7. Executive Acknowledgment (Authority Gate)

**Who:** Executive only

**Required Action (one):**

* Acknowledge
* Acknowledge with caveats
* Waive (with reason)

**Effect:**

* Establishes official intent
* Unlocks Diagnostic generation

---

### 8. Diagnostic

**Who:** System-generated, Executive-reviewed
**Surface:** SuperAdmin → Diagnostic View

**Purpose:**

* Translate inputs into constraints
* Produce actionable findings

**Status:**

* Read-only once generated

---

### 9. Diagnostic Release (Executive Gate)

**Who:** Executive only

**Explicit Action:**

* **Release Diagnostic**

**Effect:**

* Diagnostic becomes immutable
* Ticket moderation becomes available

---

### 10. Ticket Review & Moderation

**Who:** Executive (Approve/Reject), Delegates (Prepare)

**Purpose:**

* Filter execution work through executive intent
* Prevent scope creep

**Rules:**

* At least one ticket must be approved
* All tickets must be moderated

---

### 11. Roadmap

**Who:** Executive final authority

**Purpose:**

* Sequence approved work
* Define execution order

**Constraint:**

* Generated only from approved tickets

---

### 12. Roadmap Finalization (Authority Lock)

**Who:** Executive only

**Effect:**

* Locks scope
* Locks success metrics
* Binds downstream tracking

*No changes without a new cycle.*

---

### 13. Snapshot Tracking (ROI)

**Who:** System-generated, Executive-visible

**Purpose:**

* Baseline snapshot
* 30 / 60 / 90-day performance snapshots
* ROI graphs and progress deltas

**Binding:**

* Tied to finalized roadmap version

---

## Governing Invariants

* No executive signal is inferred
* No irreversible action is implicit
* Delegates prepare; executives decide
* Leadership insight never leaks into execution UX

---

## Status

This CR-UX Master Flow is **canonical**.

Any SuperAdmin UX, diagnostic logic, roadmap flow, or agent behavior that violates this sequence is invalid by definition.

---

*End of CR-UX Master Flow*
