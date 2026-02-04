# Executive Brief Semantic Contract

**Status:** CANONICAL INVARIANT
**Source of Truth:** `frontend/src/superadmin/components/ExecutiveBriefModal.tsx`
**Enforcement Level:** STRICT

This document codifies the semantic boundaries and intent of the Executive Brief artifact. It is derived directly from the user-facing contract presented in the SuperAdmin UI.

---

## 1. Purpose
The Executive Brief is a **pre-diagnostic interpretive artifact**.

Its primary functions are:
- **Alignment:** Surfacing where leadership perspectives converge, diverge, or reveal hidden system stress.
- **Reflection:** capturing "unfiltered operational perspectives" vs lived operational reality.
- **Substrate:** Serving as the "factual substrate" from which diagnosis and roadmap will later be derived.

It is **NOT** a decision-making tool on its own. It is a "mirror" held up to the leadership team before any strategic recommendations are made.

## 2. Allowed Cognitive Operations
The generation process for the Executive Brief is strictly limited to:

- **Interpretive Compression:** Summarizing intake responses into coherent themes without judging them.
- **Neutral Reframing:** describing "how different roles experience constraints, friction, and risk" without assigning blame or root cause.
- **Grouping:** Organizing perceived constraints into logical clusters (e.g., "Constraint Landscape", "Blind Spot Risks").
- **Divergence Surfacing:** explicitly highlighting where roles disagree (e.g., "Leadership Perception vs Operational Reality").

## 3. Prohibited Operations
The following are strictly **FORBIDDEN** in the Executive Brief:

- ❌ **Diagnostic Synthesis:** No "identifying root operational bottlenecks" (that happens *after* using these inputs).
- ❌ **Root-Cause Declaration:** Do not state *why* a problem exists, only that it is *experienced*.
- ❌ **Prioritization:** No ranking of issues. All lived experiences are valid data points at this stage.
- ❌ **Prescriptive Recommendations:** No solutions, no "shoulds", no "musts".
- ❌ **Leverage Identification:** Do not identify opportunities for AI or automation yet.

*As stated in UI: "No synthesis, prioritization, or reframing has been applied yet."*

## 4. Relationship to Diagnostic
There is a **hard semantic boundary** between the Brief and the Diagnostic:

| Feature | Executive Brief | Diagnostic |
| :--- | :--- | :--- |
| **Nature** | Interpretive / Reflective | Analytical / Judgmental |
| **Input** | Raw Intake Responses | Executive Brief + System Patterns |
| **Output** | "What we heard" | "What it means" |
| **Authority** | Low (Mirroring) | High (Expert Opinion) |
| **Causality** | Forbidden | Required |

The Executive Brief **ends** exactly where the Diagnostic **begins**. The Diagnostic is the *first* artifact allowed to assert causality, priority, and solution fit.

## 5. Evidence Handling Rules
- **Paraphrasing:** Quotes and inputs may be interpretively compressed or paraphrased for clarity and neutrality.
- **Verbatim Evidence:** Avoid long raw dumps. Verbatim evidence belongs in the specific Evidence Appendix or potentially the Diagnostic support.
- **Voice:** The language should feel *recognizable* to the tenant ("Yes, that sounds like us") rather than *forensic* ("Exhibit A shows...").

## 6. Audience & Tone
- **Primary Audience:** Tenant Lead / Executive Sponsor.
- **Tone:** Reflective, non-accusatory, insight-oriented, objective.
- **Goal:** **Cognitive Alignment.** The user should read this and feel "understood" so they trust the subsequent diagnosis.

## 7. Non-Goals
To prevent scope creep, the Executive Brief is explicitly **NOT**:

- ❌ **An Investor Deck:** It exposes internal friction and is likely unsuitable for external fundraising without context.
- ❌ **A Diagnostic Report:** It lacks the root-cause analysis and expert judgment of a diagnostic.
- ❌ **A Roadmap:** It contains no timeline, features, or implementation steps.
- ❌ **An Indictment:** It describes *experience*, not *failure*.

---

*Any modification to this contract requires a simultaneous update to `frontend/src/superadmin/components/ExecutiveBriefModal.tsx` to ensure the UI promise matches the system behavior.*
