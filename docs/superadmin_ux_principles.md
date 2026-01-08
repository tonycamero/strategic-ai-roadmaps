# SuperAdmin UX Principles

## Delegation‑Safe, Authority‑Aware Design

---

## Purpose

This document defines the **non‑negotiable UX principles** governing SuperAdmin.

These principles exist to:

* Enable safe delegation
* Preserve executive authority
* Prevent silent failure modes
* Guide all future AG tickets and UI changes

They are derived from a delegation walk performed from the POV of **"Future Tony"** operating as executive sponsor rather than daily operator.

These are **invariants**, not preferences.

---

## Core Premise

SuperAdmin is not a dashboard.

It is a **decision surface** for an executive‑led, agent‑assisted system.

Therefore:

* Not all users are equal
* Not all actions are reversible
* Not all information is shareable

The UI must make these distinctions **visible, intuitive, and enforceable**.

---

## UX Principle 1 — Authority Must Be Visible

**Rule**

> The UI must clearly signal *who* is allowed to act, not just *what* can be done.

**Implications**

* Executive‑only actions must be visually distinct
* Delegate‑safe actions must feel preparatory, not final
* Neutral dashboards without ownership cues are forbidden

**Failure Mode Prevented**
Delegates acting beyond mandate due to ambiguity.

---

## UX Principle 2 — Irreversibility Must Be Felt

**Rule**

> Actions that cannot be undone must *feel* irreversible before they are executed.

**Implications**

* Final actions are visually isolated
* Confirmation is explicit, not modal‑noise
* "Generate Final Roadmap"‑class actions cannot visually resemble routine buttons

**Failure Mode Prevented**
Premature or accidental finalization.

---

## UX Principle 3 — Delegates Prepare Decisions, Executives Make Them

**Rule**

> Delegation prepares signal; authority resolves it.

**Implications**

* Delegates can:

  * Moderate tickets
  * Review intakes
  * Surface readiness
* Delegates cannot:

  * Finalize roadmaps
  * Trigger irreversible outputs
  * Alter strategic framing

**Failure Mode Prevented**
Operational efficiency overriding strategic intent.

---

## UX Principle 4 — Status Without Action Is Noise

**Rule**

> Every status must imply a next move or an owner.

**Implications**

* Status panels must resolve to:

  * Ignore
  * Investigate
  * Act
* "Informational‑only" panels are disallowed in SuperAdmin

**Failure Mode Prevented**
Cognitive load without operational value.

---

## UX Principle 5 — Reference Data Must Be Unmistakable

**Rule**

> Canonical or reference firms must never be confused with live work.

**Implications**

* Internal flags such as `reference_only`, `internal`, or `locked`
* Visual de‑emphasis
* Exclusion from urgency surfaces

**Failure Mode Prevented**
Accidental edits, false urgency, or misinterpretation by delegates.

---

## UX Principle 6 — Execution Signals and Leadership Signals Must Never Collapse

**Rule**

> Signals intended for execution and signals intended for leadership must remain visually and logically separate.

**Implications**

* Execution diagnostics are shareable
* Leadership insights are restricted
* UI must not merge these streams even if the data source overlaps

**Executive Brief Surface (Non-Negotiable)**

* Leadership signals are rendered **only** inside a dedicated *Executive Leadership–Only Brief surface*
* This surface:

  * Is visible only to the executive sponsor
  * Is completely invisible (not disabled, not hinted) to delegates
  * Cannot be exported, emailed, or auto-shared
* Downstream actions (Diagnostic finalization, Roadmap generation) are **structurally gated** until the Executive Brief is acknowledged or explicitly waived by the executive

**Failure Mode Prevented**
Loss of trust, narrative contamination, political fallout, or executives being briefed indirectly via execution artifacts.

---

## UX Principle 7 — SuperAdmin Is a Control Plane, Not a Sandbox

**Rule**

> Exploration belongs elsewhere. SuperAdmin is for controlled action.

**Implications**

* No casual experimentation
* No ambiguous affordances
* No "try and see" interactions

**Failure Mode Prevented**
System drift caused by exploratory behavior in a live control surface.

---

## UX Principle 8 — Completion Must Feel Earned

**Rule**

> Outputs should convey that a real process concluded.

**Implications**

* Clear sequencing
* Timestamped completion
* Read‑only or locked states post‑delivery

**Failure Mode Prevented**
Outputs being perceived as interchangeable or provisional.

---

## UX Principle 9 — Guardrails Over Warnings

**Rule**

> Prevent incorrect actions structurally rather than cautioning against them verbally.

**Implications**

* Disabled transitions instead of warning text
* Gated actions instead of confirmations alone

**Failure Mode Prevented**
Alert fatigue and accidental misuse.

---

## UX Principle 10 — AG Tickets Must Respect UX Invariants

**Rule**

> No AG ticket may violate these principles, even if functionally correct.

**Implications**

* UX invariants are part of acceptance criteria
* Any ticket touching outputs, visibility, or workflow progression must explicitly account for:

  * Executive Brief surface behavior
  * Visibility enforcement
  * Gating logic tied to executive acknowledgement
* "Works but collapses leadership vs execution boundaries" is a hard fail

**Failure Mode Prevented**
Incremental erosion of authority, safety boundaries, and executive trust.

---

## Status

This UX Principles document is canonical.

It must be referenced when:

* Designing new SuperAdmin surfaces
* Writing AG tickets
* Refactoring workflows
* Introducing delegation roles

Any deviation requires explicit executive intent.

---

*End of UX Principles*
