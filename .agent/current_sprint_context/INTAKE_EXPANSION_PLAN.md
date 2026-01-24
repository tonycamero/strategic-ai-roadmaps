# Intake Expansion Plan

## Role-as-Vector Model (Pre-Implementation)

---

## Purpose

This document memorializes the agreed approach for expanding Strategic AI Roadmap intakes beyond a small executive group **without increasing complexity, forcing hierarchy, or overfitting titles**.

The goal is to capture how execution *actually* flows through the organization by treating roles as **vectors of influence**, not static job descriptions.

---

## Core Design Principle

**Roles are lenses, not titles.**

The intake system is designed to learn:

* Direction of influence
* Degree of enablement vs ownership
* Where friction accumulates
* How decisions and handoffs propagate

This avoids brittle org charts and enables accurate cross-functional diagnosis.

---

## Intake Entry Pattern

### Single Entry Point

**Action:** `Add Role Participant`

All participants — executives, facilitators, operators — enter through the same intake flow.

This preserves equity of signal and prevents premature hierarchy.

---

## Intake Flow Structure

### Step 1: Role Orientation (Self-Identification)

**Prompt:**
“How do you primarily contribute to execution?”

**Selectable options (multi-select):**

* Enable / facilitate work
* Own outcomes
* Coordinate across teams
* Allocate resources
* Set priorities
* Remove blockers

This step distinguishes facilitators/enablers from controllers or executors.

---

### Step 2: Domain Vector

**Prompt:**
“Where do you spend most of your time?”

**Selectable domains:**

* Manufacturing
* Production
* Packaging
* Distribution
* Brand / Marketing
* Finance / Capital
* Operations Coordination
* Other (free text)

Participants may select multiple domains, reflecting real overlap.

---

### Step 3: Role Unpacking (Interaction-Based)

These questions are designed to surface friction, not preferences.

**A. Tools & Systems**
“What tools or systems do you rely on most to do your job?”

**B. Cross-Org Collaboration**
“Which other teams do you depend on most — and where does coordination typically break down?”

**C. Friction Signal**
“If you could remove one recurring obstacle that slows execution, what would it be?”

---

## Executive Variant (Same Spine)

Senior executives (finance, capital, operations oversight) use the same intake structure, with emphasis placed on decision confidence rather than task execution.

Additional prompts may include:

* “Where do you lack confidence when making decisions?”
* “What information arrives too late to be useful?”

No separate executive intake is required.

---

## Analytical Advantage

Responses are intentionally unstructured enough to allow:

* Post-hoc clustering by agents
* Automatic surfacing of contradictions
* Pattern detection across domains and seniority

The intelligence layer performs synthesis; the UI remains simple.

---

## Roadmap Impact

This intake expansion enables the Strategic AI Roadmap to:

* Reflect true execution dynamics
* Separate human workflow constraints from data constraints
* Justify (or disqualify) enterprise AI initiatives with evidence

---

## Status

This plan is memorialized for alignment and communication purposes.

No implementation work has commenced.

---

*End of Document*

---
# Lead-Defined Intake Model

## with AG Sprint Bifurcation (Memorialized)

---

## Purpose

This document memorializes the **Lead-Defined Intake Model** and outlines how development work is cleanly **bifurcated into distinct AG Sprints**.

The intent is to:

* Preserve executive authority and signal quality
* Avoid premature overengineering
* Separate discovery intelligence from implementation logic
* Enable parallel progress without scope bleed

---

## Core Principle

**The lead defines the lenses. The system extracts the truth.**

Rather than relying on participant self-labeling, the primary sponsor (e.g., President) explicitly defines which roles matter and why. The platform then generates role-aware intakes and synthesizes insight across them.

This mirrors how real organizations operate and ensures high-signal diagnostics.

---

## Intake Architecture (Two-Step Model)

### Step 1: Lead-Defined Role Declaration

The lead sponsor initiates participation by defining the role context for each invitee.

**Lead inputs:**

* Role label (e.g., Manufacturing Facilitator, Distribution Enablement, Ops Coordination)
* Optional description: why this person matters and what they enable
* Optional domain emphasis (manufacturing, brand, finance, etc.)

This step captures *intent*, not data.

---

### Step 2: Role-Aware Participant Intake

Each invitee receives:

* A personalized invitation
* Explicit framing of their role as defined by the lead
* A shared intake spine with role-aware emphasis

**Universal intake spine:**

* What they enable or are accountable for
* Where execution slows or breaks
* Which teams/systems they depend on most
* What recurring friction costs the most time or energy

The system does not fragment into separate forms; interpretation happens downstream.

---

## Intelligence Layer Advantage

This model enables the system to compare:

* **Lead intent** vs **lived reality**
* Executive expectations vs operational friction
* Perceived vs actual constraints

These deltas are often the true drivers of execution failure.

---

## AG Sprint Bifurcation

To avoid scope collision, development is intentionally segmented into the following compartments:

---

### AG Sprint A — Intake & Role Intelligence

**Focus:**

* Lead-defined role declaration logic
* Role-aware intake generation
* Signal capture and normalization

**Outputs:**

* High-fidelity role-level input data
* Tagged signals for downstream analysis

**Explicitly Excludes:**

* Diagnostics
* Recommendations
* Roadmap generation

---

### AG Sprint B — Diagnostic & Constraint Synthesis

**Focus:**

* Pattern detection across role inputs
* Contradiction and alignment analysis
* Identification of governing constraints

**Outputs:**

* Diagnostic narratives
* Constraint hypotheses

**Explicitly Excludes:**

* Implementation planning
* Tool selection
* AI build logic

---

### AG Sprint C — Strategic Roadmap Assembly

**Focus:**

* Prioritization logic
* Sequencing (30/60/90 days)
* Decision framing for leadership

**Outputs:**

* Strategic AI Roadmap
* Go / No-Go enterprise recommendation

**Explicitly Excludes:**

* Engineering
* Vendor evaluation
* Custom AI development

---

### AG Sprint D — Enterprise Architecture (Optional / Paid)

**Focus:**

* Data readiness validation
* System interaction mapping
* AI-appropriate use case definition

**Outputs:**

* Enterprise AI Architecture Plan
* Build vs buy recommendations

**Status:**

* Not part of free Roadmap engagement
* Triggered only if justified

---

## Why This Separation Matters

* Prevents automating broken processes
* Keeps the Roadmap diagnostic, not prescriptive
* Allows leadership to stop or proceed with confidence
* Enables parallel evolution of the platform

---

## Status

This model and sprint segmentation are memorialized for:

* Internal alignment
* Client communication
* AG task planning

No implementation work has commenced.

---

*End of Document*

---
# Lead-Defined Intake Model

## Perception vs Reality Contrast Layer (Memorialized)

---

## Purpose

This document extends the Lead-Defined Intake Model by introducing an explicit **Perception vs Reality Contrast Layer**.

The intent is to:

* Capture executive assumptions alongside operational truth
* Make misalignment visible without blame
* Increase diagnostic power of the Strategic AI Roadmap
* Elevate the quality of participant responses through clear framing

---

## Core Insight

**The most valuable signal lives in the delta between what leadership believes is broken and what operators actually experience.**

Rather than treating executive assumptions as noise to be filtered out, this model captures them as first-class input and contrasts them with role-level reality.

---

## Extended Intake Architecture (Three-Step Model)

### Step 1: Lead-Defined Role Declaration

As previously defined, the lead sponsor identifies:

* The role lens (e.g., Manufacturing Facilitator, Distribution Enablement)
* Why this role matters to execution
* Optional domain emphasis

This establishes *who* is being invited and *why*.

---

### Step 2: Lead-Defined Perceived Constraints

For each invited role, the lead is prompted to articulate their **current perception** of that role’s primary constraints or frustrations.

**Lead prompt (internal):**
"From your perspective, what are the main constraints or recurring frustrations this role experiences today?"

**Optional follow-up:**
"What do you believe you need from this role in order to improve execution?"

These inputs capture executive mental models — not as truth, but as hypothesis.

---

### Step 3: Role-Aware Participant Intake (Reality Capture)

The invited participant receives:

* A personalized invitation
* Clear framing of why they were selected
* Explicit reference to the lead’s perception

**Invitation framing (participant-facing):**

> “Jerome expressed that you may be experiencing **[perceived constraint]**, and that what he needs is for you to surface **[area of clarity or friction]**, so that we can **[intended outcome]**.”

The participant then completes the standard role-aware intake spine:

* What they enable or are accountable for
* Where execution actually slows or breaks
* Which teams or systems they depend on most
* What recurring friction costs the most time or energy

This creates a structured opportunity for confirmation, refinement, or contradiction.

---

## Analytical Advantage

This contrast layer enables the system to:

* Measure alignment between leadership perception and lived reality
* Surface blind spots without accusation
* Identify false constraints vs real constraints
* Detect trust gaps or communication breakdowns

These deltas often reveal the *true governing constraint*.

---

## Roadmap Impact

By explicitly contrasting perception and reality, the Strategic AI Roadmap can:

* Avoid automating around incorrect assumptions
* Prioritize issues that matter across levels
* Frame recommendations in leadership-relevant language

This strengthens both credibility and adoption.

---

## Guardrails

* Executive perceptions are treated as hypotheses, not directives
* Participant responses are never shown verbatim without synthesis
* Output focuses on patterns, not individuals

Psychological safety is preserved by design.

---

## Status

This Perception vs Reality Contrast Layer is memorialized for:

* Internal design alignment
* Client communication transparency
* AG diagnostic enhancement

No implementation work has commenced.

---

*End of Document*

---
# Lead-Facing Role Definition

## Perceived Constraints & Awareness Gaps

*(Draft copy – pre-implementation)*

---

## Context (Shown to Lead)

Before inviting this participant, we want to capture **your current perspective**.

These inputs are not treated as truth or instruction — they are treated as **hypotheses** that help us later contrast leadership perception with lived reality.

There are no right answers. Precision is more useful than diplomacy.

---

## Step 1: Role Framing

**Prompt:**
“How would you describe this person’s role in execution?”

**Inputs:**

* Role label (free text)
* Why this role matters right now (1–2 sentences)

---

## Step 2: Known / Stated Frictions

**Prompt:**
“What has this person (or people in this role) explicitly said is hard, broken, or frustrating today?”

**Guidance (inline helper text):**

* Things they complain about
* Issues they raise in meetings
* Bottlenecks they name themselves
* Problems they ask for help with

**Input:**
Free text

---

## Step 3: Suspected / Unstated Constraints

**Prompt:**
“What do you believe is actually constraining this role, even if they don’t articulate it this way?”

**Guidance (inline helper text):**

* Blind spots you see from your vantage point
* Structural issues they may have normalized
* Constraints they may be compensating for
* Problems they might not yet be aware of

**Input:**
Free text

---

## Step 4: Leadership Need

**Prompt:**
“What do you need this role to surface or clarify in order for the organization to move forward?”

**Guidance (inline helper text):**

* What you wish you understood better
* Decisions that feel under-informed
* Signals that arrive too late

**Input:**
Free text

---

## Step 5: Intended Outcome (Optional)

**Prompt:**
“If this role were fully unblocked, what would be different?”

**Guidance (inline helper text):**

* What would improve first
* What would stop being a recurring issue
* What success would look like in practice

**Input:**
Free text

---

## How This Is Used (Shown After Completion)

* Your inputs are treated as **hypotheses**, not directives
* Participants are invited to confirm, refine, or contradict them
* Outputs focus on **patterns**, not individuals
* The goal is alignment, not blame

This contrast significantly improves the quality of the Strategic AI Roadmap.

---

*End of Draft Copy*

---
# Executive Leadership–Only Brief

## Private Sense-Making Output (Memorialized)

**Audience:** Lead Sponsor Only
**Distribution:** Restricted
**Purpose:** Leadership sense-making, not execution planning

---

## Orientation: What This Is (and Is Not)

This brief is a private synthesis of leadership-level signals surfaced during the Strategic AI Roadmap process.

It is:

* Not a performance evaluation
* Not a cultural diagnosis
* Not a set of recommendations
* Not intended for cross-functional distribution

Its purpose is to surface **patterns of perception, awareness, and signal flow** that influence execution but do not belong in a shared roadmap.

All observations are pattern-based and non-attributable.

---

## Leadership Perception vs Operational Reality

Across most areas, leadership intent and operational behavior are directionally aligned.

However, several meaningful divergences emerged — not in goals, but in how constraints are experienced and compensated for day to day.

Where alignment is high, execution friction is typically mechanical.
Where alignment is low, friction becomes adaptive and invisible.

**Illustrative Pattern:**

**Leadership Perception**
The primary constraint is tooling, throughput, or system limitation.

**Operational Reality (Patterned)**
The dominant constraint appears to be coordination across handoffs, with tooling acting as an amplifier rather than the root cause.

These deltas represent hypotheses, not conclusions.

---

## Awareness Gaps (Unseen or Normalized)

Several constraints surfaced that appear to be normalized within teams and therefore under-signaled upward.

These are not issues being avoided; they are issues being adapted around.

Adaptation has preserved short-term execution, but at the cost of predictability and early visibility.

Common patterns include:

* Informal workarounds replacing explicit ownership
* Late-stage confirmation substituting for early alignment
* Rework absorbed locally rather than escalated

---

## Trust & Signal Flow

Signal flow across the organization is generally healthy, but uneven.

In high-velocity contexts, signals tend to compress upward late, once options are already constrained.

In cross-functional settings, feedback is often softened to preserve momentum rather than precision.

This appears to be an efficiency behavior, not a cultural failure.

---

## Decision Latency & Risk

The primary leadership-level risk surfaced is not incorrect decision-making, but **late decision-making**.

In several instances, leadership clarity arrives after teams have already compensated locally.

This increases resilience in the moment, while reducing strategic optionality over time.

---

## What Not to Solve with AI

Several surfaced constraints are not meaningfully addressable through AI, automation, or data systems.

These include:

* Ambiguity in cross-functional ownership
* Informal escalation norms
* Adaptive workarounds replacing shared process

Automating these conditions would likely obscure signal rather than resolve constraint.

---

## Leadership Levers (Non-Prescriptive)

The following levers are implied by observed patterns. They are not recommendations.

* Clarifying where precision outweighs speed
* Making late-arriving signals safe to surface earlier
* Naming which constraints should not be adapted around

Which levers matter — and when — remains a leadership judgment.

---

## Closing Reflection

The signals surfaced reflect an organization that is functional, adaptive, and committed.

The gaps identified are not failures; they are the natural byproduct of scale, complexity, and growth.

This brief exists to support leadership awareness and sense-making.

How, or whether, to act on it is entirely at your discretion.

---

*End of Private Brief*


---
# Executive Leadership–Only Output

## Technical Execution Plan (AG-Ready)

---

## Purpose

This document defines **how** the Executive Leadership–Only Brief is technically produced, filtered, and delivered — with explicit emphasis on surfacing **non-obvious deltas** between leadership perception and organizational reality.

It exists to ensure the platform can:

* Reveal signals executives *cannot see directly*
* Separate intuition from evidence
* Compress time-to-decision on high-stakes moves

It is written to guide future **AG tickets**, prevent scope bleed, and ensure that leadership-level signals are handled with precision, safety, and intentional separation from the Strategic AI Roadmap.

---

## Core Constraint

The platform must support **multi-layer truth extraction** without collapsing all signal into a single output.

Therefore:

* Not all insights surface to all audiences
* Not all signals become recommendations
* Not all analysis is rendered visible

This requires explicit architectural separation.

---

## High-Level Architecture

```
Intake Inputs
  ├─ Lead-Defined Role + Perceived Constraints
  ├─ Role Participant Reality Intakes
  └─ Executive Self-Intake (optional)

            ↓

Signal Normalization Layer
  ├─ De-identification
  ├─ Role tagging
  ├─ Domain tagging
  └─ Seniority weighting

            ↓

Analytical Bifurcation
  ├─ Stream A: Execution Signals (Roadmap)
  └─ Stream B: Leadership Signals (Private)

            ↓

Output Assembly
  ├─ Strategic AI Roadmap (Shared)
  └─ Executive Leadership–Only Brief (Private)
```

---

## Signal Classification Rules

During analysis, all extracted signals must be classified into **one (and only one)** of the following categories:

### Category A — Execution Signals

**Definition:**
Signals that describe observable workflow breakdowns, coordination friction, tooling mismatch, or process constraints.

**Examples:**

* Handoffs unclear between teams
* Manual reconciliation between systems
* Work queues backing up
* Ownership ambiguity causing delay

**Routing:**

* Included in Diagnostic
* Included in Strategic AI Roadmap
* Never attributed to individuals

---

### Category B — Leadership Signals

**Definition:**
Signals that describe *non-obvious deltas* between leadership perception and operational reality, including awareness gaps, trust dynamics, normalized dysfunction, and signal latency.

These signals are, by definition:

* Invisible to dashboards
* Rarely escalated directly
* Often rationalized away as "normal" at scale

**Examples:**

* Problems people no longer escalate because "that’s just how it works"
* Feedback being softened or reframed upward
* Late-arriving signals shaping decisions after cost is already incurred
* Leadership assumptions contradicted by consistent cross-role evidence

**Routing:**

* Explicitly excluded from Roadmap
* Routed only to Executive Leadership–Only Brief

---

## AG Sprint Mapping

### AG Sprint B1 — Execution Diagnostics

**Consumes:**

* Category A signals

**Produces:**

* Execution constraint narratives
* Cross-functional friction maps

**Forbidden:**

* Commentary on trust, leadership awareness, or perception gaps

---

### AG Sprint B2 — Leadership Signal Analysis

**Consumes:**

* Category B signals
* Lead-perceived vs reality deltas

**Produces:**

* Pattern abstractions
* Awareness gap summaries
* Leadership-level risk framing

**Forbidden:**

* Recommendations
* Attribution
* Action planning

---

## Executive Brief Assembly Logic

The Executive Leadership–Only Brief is assembled to make **non-obvious deltas legible** without exposing individuals or inducing defensiveness.

It is constructed using:

* Aggregated Category B patterns
* Lead-perceived vs reality contrasts
* Abstracted deltas (no quotes, no names)
* Framing templates that emphasize *decision impact*, not fault

**Hard constraints:**

* No raw intake text
* No individual-level commentary
* No comparative ranking of roles or teams
* No recommendations or action plans

The output answers one question only:

> *“Where does leadership belief diverge from operational reality in ways that materially affect scale, risk, or speed?”*

---

## Delivery Safeguards

Because this brief surfaces **non-obvious leadership deltas**, delivery is tightly controlled.

The system must enforce:

* Restricted visibility (lead sponsor only)
* No export or auto-email by default
* Explicit manual release by operator

The brief is designed to be **delivered live**, framed as a leadership instrument — not a report, audit, or evaluation.

---

## AG Ticket Guardrails

When creating AG tickets:

* Treat the Executive Leadership–Only Brief as a **separate product**
* Never bundle with Roadmap generation
* Require explicit acceptance criteria around signal routing
* Include test cases where leadership signals must be excluded from shared outputs

---

## Status

This technical execution plan is memorialized to guide:

* AG sprint planning
* Platform architecture decisions
* Safety and scope enforcement

No implementation work has commenced.

---

*End of Technical Execution Plan*
---
# Delta Contrast Frame

## Perceived vs. Lived Reality (AG Canon)

---

## Purpose

This document defines the **Delta Contrast Frame**: the canonical mechanism used to surface *non-obvious gaps* between leadership perception and operational reality.

It exists to:

* Prevent platitudes and obvious findings
* Convert intuition into evidence-backed contrast
* Anchor executive insight without blame, attribution, or prescription

This frame is used **only** for analysis and executive-level synthesis. It is never exposed verbatim to participants.

---

## Core Principle

Insight does not come from what leaders believe **or** what teams experience.

It comes from the **delta** between the two.

The system is designed to make that delta legible.

---

## Delta Unit Structure

Each delta is expressed as a three-part unit:

1. **Perceived Reality** (Lead Signal)
2. **Lived Reality** (Aggregate Signal)
3. **Material Implication** (Why It Matters)

No delta may be recorded without all three.

---

## 1. Perceived Reality (Lead Signal)

Captured during lead role-definition and executive intake.

This reflects:

* What the lead believes is constrained
* What the lead believes is working
* What the lead believes teams are or are not worried about

**Canonical phrasing (internal only):**

> Leadership believes that ________ is the primary constraint, and that ________ is largely under control.

Constraints:

* Written in neutral language
* No judgment
* No future speculation

---

## 2. Lived Reality (Aggregate Signal)

Derived from cross-role intakes, normalized and de-identified.

This reflects:

* Repeated friction patterns
* Workarounds teams rely on
* Delays or rework that feel "normal" at the operator level

**Canonical phrasing (internal only):**

> Across roles, evidence indicates that ________ is absorbing disproportionate time or attention, while ________ is rarely mentioned as a concern.

Constraints:

* Must be supported by multiple independent signals
* No single-role dominance
* No attribution

---

## 3. Material Implication (Why It Matters)

This is the executive-relevant insight.

It explains:

* What decision is being distorted or delayed
* Where scale introduces risk
* Why dashboards or systems do not surface this

**Canonical phrasing (internal only):**

> This delta matters because it affects ________, particularly as the organization scales or attempts to introduce automation or AI.

Constraints:

* No recommendations
* No solutions
* No language of fault

---

## Delta Validity Rules

A delta is considered **valid** only if:

* The perceived reality is clearly articulated
* The lived reality is evidenced across roles
* The implication connects directly to scale, risk, or speed

If any of these are missing, the delta is discarded.

---

## Output Routing

* **Roadmap:** Deltas are *collapsed* into execution-neutral constraints
* **Executive Brief:** Deltas are preserved as contrasts, abstracted and anonymized

No delta appears in both forms simultaneously.

---

## AG Enforcement Notes

When implemented:

* AG must label deltas explicitly
* AG may not infer perceived reality unless stated by the lead
* AG may not generate implications beyond evidence

This frame exists to discipline insight, not embellish it.

---

## Status

Delta Contrast Frame is canonical.

It governs:

* Intake analysis
* Executive synthesis
* Signal bifurcation logic

No UI or workflow implementation has commenced.

---

*End of Delta Contrast Frame*
---
