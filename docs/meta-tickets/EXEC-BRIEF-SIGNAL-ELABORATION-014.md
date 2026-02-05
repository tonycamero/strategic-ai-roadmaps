# META-TICKET

## EXEC-BRIEF-SIGNAL-ELABORATION-014

**Status:** PROPOSED
**Priority:** P1 (Quality Escalation, Non-Blocking)
**Supersedes:** None
**Depends On:**

* EXEC-BRIEF-SIGNAL-GATE-009A
* EXEC-BRIEF-SECTION-COVERAGE-012A
* EXEC-BRIEF-CONTRAST-SIGNAL-013

---

## 🎯 Objective

Introduce a **deterministic signal elaboration layer** that expands *high-quality, high-contrast assertions* into **multi-paragraph executive-grade content**, without introducing synthesis, prioritization, or recommendations.

This resolves the current “thin content” outcome while preserving:

* Factual grounding
* Pre-diagnostic posture
* Deterministic behavior
* Contract integrity

---

## 🧠 Core Principle

> **Depth ≠ Synthesis**

Elaboration **amplifies an existing signal**; it does not interpret, rank, solve, or recommend.

---

## 🔐 Guardrails (Hard Constraints)

Elaboration MUST:

* ❌ NOT introduce recommendations
* ❌ NOT introduce prioritization
* ❌ NOT merge multiple assertions
* ❌ NOT reframe the signal strategically
* ❌ NOT cross section boundaries

Elaboration MAY:

* ✅ Expand *one assertion* into multiple factual paragraphs
* ✅ Surface evidence implications already present
* ✅ Describe operational manifestation and impact surfaces
* ✅ Remain strictly descriptive and role-grounded

Fail-closed if any rule is violated.

---

## 🧱 Eligibility Rules

An assertion is eligible for elaboration **only if**:

```ts
assertion.confidenceScore ≥ CONFIDENCE_THRESHOLD
AND
assertion.contrastScore ≥ CONTRAST_THRESHOLD
```

*Defaults (configurable):*

```ts
CONFIDENCE_THRESHOLD = 0.70
CONTRAST_THRESHOLD   = 0.45
```

Only **Top-N assertions per section** (after existing sorting rules) may be elaborated.

---

## 🧩 Elaboration Model (Deterministic)

Each eligible assertion expands into **up to 3 paragraphs**, in fixed order:

### Paragraph 1 — Core Signal (Existing)

* The current assertion + implication
* No modification other than light grammar normalization

### Paragraph 2 — Operational Manifestation

Derived strictly from:

* Evidence set
* Role attribution
* Pattern metadata

Describes:

* How this signal shows up day-to-day
* Where friction or load is experienced
* Which roles encounter it and how

### Paragraph 3 — Impact Surface

Descriptive only. May reference:

* Time leakage
* Execution drag
* Risk accumulation
* Coordination overhead
* Resource inefficiency

❌ No value judgments
❌ No “should” language
❌ No implied solutions

---

## 📦 Data Contract Changes

### Structured Layer (Primary)

```ts
content.sections[SECTION_KEY]: string[]
```

Now supports **multiple paragraphs per assertion**, appended in deterministic order.

### Flattened Layer (Backward Compatible)

```ts
content[sectionKey]: string
```

Generated strictly via:

```ts
sections[sectionKey].join("\n\n")
```

---

## 🧬 Metadata & Observability

Add to `meta.elaboration`:

```ts
{
  elaborationApplied: boolean
  elaboratedAssertionIds: string[]
  elaborationDepthBySection: {
    [SECTION_KEY]: number // paragraph count
  }
}
```

Used for:

* Debugging
* UI transparency (optional banner)
* Determinism verification

---

## 🧪 Testing Requirements

### New Test Suite

```
backend/src/__tests__/executiveBriefSynthesis/elaboration.test.ts
```

Must verify:

* No elaboration below thresholds
* Deterministic paragraph counts
* Paragraph ordering invariance
* No cross-assertion contamination
* No synthesis keywords introduced

### Golden Fixtures

Regenerate:

* `fixture_typical_valid`
* `fixture_high_variance_valid`

Confirm:

* Increased paragraph depth
* Identical content between structured + flattened layers

---

## 🖥️ Frontend Behavior (Non-Blocking)

* No rendering changes required
* Existing modal renders additional paragraphs naturally
* Optional info banner:

  > “Signal elaboration applied to high-contrast inputs”

Banner must **never appear** inside narrative text.

---

## ✅ Success Criteria

* Executive Brief sections display **2–4 paragraphs** when signal quality permits
* No section regresses to empty or placeholder content
* Determinism tests remain stable
* No recommendation language appears anywhere
* Existing governance invariants remain intact

---

## 🧭 Strategic Note (Non-Executable)

This ticket deliberately **stops short of synthesis**.

It creates the factual density required for:

* Future prioritization layers
* Diagnostic framing
* Strategic Roadmap generation

—but does not cross that boundary.
