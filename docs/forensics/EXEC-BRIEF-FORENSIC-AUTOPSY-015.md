# EXEC-BRIEF-FORENSIC-AUTOPSY-015: Complete Forensic Analysis

**Date:** 2026-02-02  
**Mode:** Static Code Autopsy + Fixture Replay  
**Objective:** Prove where "consultant/diagnostic voice" originates and where signal is lost.

---

## A) STATIC CODE AUTOPSY

### 1. File Inventory

| File Path | Primary Functions | Purpose |
| :--- | :--- | :--- |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `executeSynthesisPipeline`, `extractFacts`, `extractPatterns`, `synthesizeAssertions`, `assembleSections`, `generateElaboration` | Core synthesis pipeline |
| `backend/src/services/executiveBriefAssertionExpansion.service.ts` | `proposeCandidates` | Mode 2 LLM fallback |
| `backend/src/types/executiveBrief.ts` | Type definitions | Contract enforcement |

### 2. Execution Call Graph

```
executeSynthesisPipeline
 ├─ extractFacts
 │   └─ generateDeterministicId
 ├─ extractPatterns
 │   └─ generateDeterministicId
 ├─ synthesizeAssertions (Track A - TEMPLATE BASED)
 │   ├─ computeContrastScore
 │   └─ generateDeterministicId
 ├─ getValidationBreakdown
 ├─ [IF validAssertions < TARGET && ExpansionEnabled]
 │   └─ proposeCandidates (Track B - LLM)
 ├─ selectTopAssertions
 │   ├─ getValidationBreakdown
 │   └─ computeDeterministicScore
 ├─ assembleSections
 │   ├─ validateAssertions
 │   ├─ filterSection
 │   ├─ getSectionContent
 │   │   ├─ [IF empty] → FALLBACK string
 │   │   └─ [ELSE] → Loop assertions
 │   │       ├─ [IF eligible] → generateElaboration (3 paragraphs)
 │   │       └─ [ELSE] → Simple concat
 │   └─ Strategic Summary (Template)
 └─ emit ExecutiveBriefSynthesis
```

### 3. Template String Catalog (with Citations)

#### A. Core Assertion Templates (synthesizeAssertions)

**Constraint Template:**
```bash
$ rg -n "Structural constraints limit execution capacity" backend/src/services/executiveBriefSynthesis.service.ts
417:            assertion = `Structural constraints limit execution capacity across ${pattern.roles_observed.length} organizational roles.`;
```

**Excerpt:**
```bash
$ sed -n '417,420p' backend/src/services/executiveBriefSynthesis.service.ts
            assertion = `Structural constraints limit execution capacity across ${pattern.roles_observed.length} organizational roles.`;
            implication = `Execution velocity constrained by structural factors. Resource allocation requires systematic review.`;
            constraintSignal = `Process dependencies and resource allocation patterns`;
            alignmentStrength = pattern.recurrence_level as "low" | "medium" | "high";
```

**Risk Template:**
```bash
$ rg -n "Risk exposure identified" backend/src/services/executiveBriefSynthesis.service.ts
424:            assertion = `Risk exposure identified across ${pattern.roles_observed.length} operational domains with ${pattern.recurrence_level} recurrence.`;
```

**Excerpt:**
```bash
$ sed -n '424,426p' backend/src/services/executiveBriefSynthesis.service.ts
            assertion = `Risk exposure identified across ${pattern.roles_observed.length} operational domains with ${pattern.recurrence_level} recurrence.`;
            implication = `Unmitigated risks accumulate execution debt. Immediate attention required to prevent cascading failures.`;
            constraintSignal = `Operational blind spots and risk accumulation patterns`;
```

**Alignment Template:**
```bash
$ rg -n "Alignment signals detected" backend/src/services/executiveBriefSynthesis.service.ts
431:            assertion = `Alignment signals detected across ${pattern.roles_observed.length} roles with ${pattern.recurrence_level} consistency.`;
```

**Excerpt:**
```bash
$ sed -n '431,433p' backend/src/services/executiveBriefSynthesis.service.ts
            assertion = `Alignment signals detected across ${pattern.roles_observed.length} roles with ${pattern.recurrence_level} consistency.`;
            implication = `Cross-functional alignment enables coordinated execution. Leverage point for strategic initiatives.`;
            constraintSignal = `Communication patterns and shared understanding indicators`;
```

#### B. Elaboration Templates (generateElaboration)

**Execution Drag Template:**
```bash
$ rg -n "execution drag" backend/src/services/executiveBriefSynthesis.service.ts
342:    const p3 = `This creates execution drag through ${constraint}, contributing to resource inefficiency and coordination overhead.`;
```

**Excerpt:**
```bash
$ sed -n '337,342p' backend/src/services/executiveBriefSynthesis.service.ts
    const p2 = `This dynamic is actively observed within ${roles} workflows. Operational manifestations include: ${evidenceList}.`;

    // Para 3: Impact Surface
    // Descriptive impact based on constraint signal
    const constraint = assertion.constraint_signal ? assertion.constraint_signal.toLowerCase() : 'structural friction';
    const p3 = `This creates execution drag through ${constraint}, contributing to resource inefficiency and coordination overhead.`;
```

#### C. Fallback Templates (assembleSections)

**Excerpt:**
```bash
$ sed -n '600,604p' backend/src/services/executiveBriefSynthesis.service.ts
        OPERATING_REALITY: "Current operating signals indicate a normalized execution environment characterized by routine workflows. No acute friction points have surfaced to the level of executive visibility.",
        CONSTRAINT_LANDSCAPE: "The execution environment demonstrates structural stability. Existing constraints appear managed within local capacity limits rather than acting as systemic blockers.",
        BLIND_SPOT_RISKS: "Systemic risk exposure remains latent. No critical escalation patterns currently threaten the strategic baseline.",
        ALIGNMENT_SIGNALS: "Cross-functional execution is proceeding through distributed coordination. Shared strategic intent is implicit in operational routines."
```

### 4. Language Origin Matrix

| Section | Source Function | Line | Template-Based | LLM-Based |
| :--- | :--- | :--- | :--- | :--- |
| **Constraint Landscape** (Core) | `synthesizeAssertions` | 417 | YES | NO |
| **Blind Spot Risks** (Core) | `synthesizeAssertions` | 424 | YES | NO |
| **Alignment Signals** (Core) | `synthesizeAssertions` | 431 | YES | NO |
| **All Sections** (Elaboration P3) | `generateElaboration` | 342 | YES | NO |
| **All Sections** (Fallback) | `assembleSections` | 600-603 | YES | NO |

---

## B) FIXTURE-REPLAY FORENSICS

### Stage Count Table

| Fixture | Vectors | Facts | Patterns | Candidates | Valid | Selected | Reality | Landscape | Risks | Alignment |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `fixture_minimal_valid` | 3 | 18 | 4 | 4 | 4 | 4 | 3 | 3 | 3 | 3 |
| `fixture_typical_valid` | 4 | 24 | 4 | 4 | 4 | 4 | 3 | 3 | 3 | 3 |
| `fixture_high_variance_valid` | 6 | 36 | 4 | 4 | 4 | 4 | 3 | 3 | 3 | 3 |

### Rejection Ledger

All fixtures: **0 rejections** (all candidates passed validation).

### Section Routing Ledger

**Routing Logic:** `assembleSections` → `filterSection` (Line 586-590)
- Filters by `primarySection` first, falls back to `secondarySections`.

All fixtures routed assertions to all 4 sections (Reality, Landscape, Risks, Alignment) with elaboration applied (3 paragraphs each).

---

## C) NEGATIVE CONFIRMATION

### Absence of Narrative Transformation Functions

```bash
$ rg -n "executiveNarrativeRewrite|executiveVoiceTransform|businessImplicationSynthesis" backend/src
(no output - exit code 1)
```

**Result:** No functions exist for executive voice transformation.

### Adjacent Terms Search

```bash
$ rg -n "rewrite|reframe|voice|smooth|polish|stitch|weave|narrative" backend/src/services/executiveBriefSynthesis.service.ts | head -20
6: * NO narrative tuning, NO stylistic changes, NO ad-hoc logic.
```

**Result:** Only occurrence is a comment explicitly forbidding narrative tuning.

---

## D) "CONSULTANT SPEAK" PROVENANCE PACK

| Phrase | Template String | File | Line | Function |
| :--- | :--- | :--- | :--- | :--- |
| "execution drag" | `This creates execution drag through ${constraint}...` | `executiveBriefSynthesis.service.ts` | 342 | `generateElaboration` |
| "risk exposure identified" | `Risk exposure identified across ${n} operational domains...` | `executiveBriefSynthesis.service.ts` | 424 | `synthesizeAssertions` |
| "signals detected" | `Alignment signals detected across ${n} roles...` | `executiveBriefSynthesis.service.ts` | 431 | `synthesizeAssertions` |
| "structural constraints" | `Structural constraints limit execution capacity...` | `executiveBriefSynthesis.service.ts` | 417 | `synthesizeAssertions` |
| "operational blind spots" | `Operational blind spots and risk accumulation patterns` | `executiveBriefSynthesis.service.ts` | 426 | `synthesizeAssertions` |
| "leverage point" | `Leverage point for strategic initiatives.` | `executiveBriefSynthesis.service.ts` | 432 | `synthesizeAssertions` |
| "contextual understanding" | `Contextual understanding shapes execution strategy.` | `executiveBriefSynthesis.service.ts` | 439 | `synthesizeAssertions` |
| "resource allocation patterns" | `Process dependencies and resource allocation patterns` | `executiveBriefSynthesis.service.ts` | 419 | `synthesizeAssertions` |

**Detection Rate:** All 8 consultant-speak phrases detected in **100%** of fixtures.

---

## How to Reproduce

### 1. Run Fixture Replay
```bash
cd backend
npx tsx src/__tests__/executiveBriefSynthesis/forensics/replay_diagnostics.ts
```

### 2. Verify Template Citations
```bash
rg -n "execution drag" backend/src/services/executiveBriefSynthesis.service.ts
sed -n '337,342p' backend/src/services/executiveBriefSynthesis.service.ts
```

### 3. Confirm Negative Space
```bash
rg -n "executiveNarrativeRewrite|executiveVoiceTransform" backend/src
# Should return no results (exit code 1)
```

---

## Conclusion

**Diagnostic voice originates from:**
1. Hardcoded templates in `synthesizeAssertions` (Lines 417, 424, 431, 438)
2. Hardcoded elaboration templates in `generateElaboration` (Lines 337, 342)
3. Interpretive fallback strings in `assembleSections` (Lines 600-603)

**No executive narrative transformation layer exists.**
