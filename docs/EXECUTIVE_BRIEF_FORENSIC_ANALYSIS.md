# Executive Brief Pipeline Forensic Analysis

**Date:** 2026-02-02
**Scope:** Executive Brief Synthesis Pipeline
**Mode:** Static Code Autopsy

---

### 1. FILE INVENTORY TABLE

| File Path | Functions | Called By | Calls Into | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `executeSynthesisPipeline` | External API Controllers | `extractFacts`, `extractPatterns`, `synthesizeAssertions`, `getValidationBreakdown`, `selectTopAssertions`, `assembleSections`, `createHash` | Core pipeline orchestration & execution |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `extractFacts` | `executeSynthesisPipeline` | `generateDeterministicId` | Deterministic extraction of raw intake data into immutable fact objects |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `extractPatterns` | `executeSynthesisPipeline` | `generateDeterministicId` | Grouping facts by type and recurrence into Patterns |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `synthesizeAssertions` | `executeSynthesisPipeline` | `generateDeterministicId`, `computeContrastScore` | Converting Patterns to Assertions using strict templates |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `computeContrastScore` | `synthesizeAssertions`, `assembleSections` | N/A | Heuristic scoring of pattern/assertion tension |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `generateElaboration` | `assembleSections` | N/A | Template-based expansion of high-signal assertions into 3 paragraphs |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `assembleSections` | `executeSynthesisPipeline` | `validateAssertions`, `generateElaboration` | Organizing assertions into final sections with fallbacks and metadata |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `getValidationBreakdown` | `executeSynthesisPipeline`, `selectTopAssertions` | N/A | Non-throwing validation check for diagnostic counting |
| `backend/src/services/executiveBriefSynthesis.service.ts` | `generateDeterministicId` | `extractFacts`, `extractPatterns`, `synthesizeAssertions` | `createHash` | SHA-256 ID generation |
| `backend/src/services/executiveBriefAssertionExpansion.service.ts` | `proposeCandidates` | `executeSynthesisPipeline` | OpenAI API | Mode 2 Fallback: LLM-based assertion generation |
| `backend/src/types/executiveBrief.ts` | N/A (Interfaces) | `executiveBriefSynthesis.service.ts` | N/A | Type Definitions |

### 2. EXECUTION CALL GRAPH (ASCII)

```
executeSynthesisPipeline
 ├─ extractFacts
 │   └─ generateDeterministicId
 ├─ extractPatterns
 │   └─ generateDeterministicId
 ├─ synthesizeAssertions (Track A)
 │   ├─ computeContrastScore
 │   └─ generateDeterministicId
 ├─ getValidationBreakdown (Initial Check)
 ├─ [IF validAssertions < TARGET_ASSERTION_COUNT && ExpansionEnabled]
 │   └─ ExecutiveBriefAssertionExpansionService.proposeCandidates (Track B - LLM)
 │       └─ OpenAI API
 ├─ selectTopAssertions
 │   ├─ getValidationBreakdown (Filter)
 │   └─ computeDeterministicScore (Sort)
 │       └─ [Sort: Confidence DESC -> Contrast DESC -> ID ASC]
 ├─ assembleSections
 │   ├─ validateAssertions (Fail-Closed Check)
 │   ├─ filterSection (Route by Primary/Secondary Key)
 │   ├─ getSectionContent (Iterate Sections: REALITY, LANDSCAPE, RISKS, ALIGNMENT)
 │   │   ├─ [IF assertions.length == 0]
 │   │   │   └─ Inject FALLBACK string (Interpretive)
 │   │   └─ [ELSE] 
 │   │       └─ Loop Sorted Assertions
 │   │           ├─ [IF Confidence >= 0.7 && Contrast >= 0.45]
 │   │           │   └─ generateElaboration (Template Expansion)
 │   │           └─ [ELSE]
 │   │               └─ Simple concatenation (Assertion + Implication)
 │   ├─ Strategic Summary Construction (Template)
 │   └─ Metadata Population (Coverage, Contrast, Elaboration)
 └─ emit ExecutiveBriefSynthesis
```

### 3. TEMPLATE STRING CATALOG

| File | Line | Template | Variables |
| :--- | :--- | :--- | :--- |
| `executiveBriefSynthesis.service.ts` | 417 | `"Structural constraints limit execution capacity across ${pattern.roles_observed.length} organizational roles."` | `pattern.roles_observed.length` |
| `executiveBriefSynthesis.service.ts` | 418 | `"Execution velocity constrained by structural factors. Resource allocation requires systematic review."` | None |
| `executiveBriefSynthesis.service.ts` | 419 | `"Process dependencies and resource allocation patterns"` | None |
| `executiveBriefSynthesis.service.ts` | 424 | `"Risk exposure identified across ${pattern.roles_observed.length} operational domains with ${pattern.recurrence_level} recurrence."` | `pattern.roles_observed.length`, `pattern.recurrence_level` |
| `executiveBriefSynthesis.service.ts` | 425 | `"Unmitigated risks accumulate execution debt. Immediate attention required to prevent cascading failures."` | None |
| `executiveBriefSynthesis.service.ts` | 426 | `"Operational blind spots and risk accumulation patterns"` | None |
| `executiveBriefSynthesis.service.ts` | 431 | `"Alignment signals detected across ${pattern.roles_observed.length} roles with ${pattern.recurrence_level} consistency."` | `pattern.roles_observed.length`, `pattern.recurrence_level` |
| `executiveBriefSynthesis.service.ts` | 432 | `"Cross-functional alignment enables coordinated execution. Leverage point for strategic initiatives."` | None |
| `executiveBriefSynthesis.service.ts` | 433 | `"Communication patterns and shared understanding indicators"` | None |
| `executiveBriefSynthesis.service.ts` | 438 | `"Operating context defined by ${pattern.roles_observed.length} organizational perspectives."` | `pattern.roles_observed.length` |
| `executiveBriefSynthesis.service.ts` | 439 | `"Contextual understanding shapes execution strategy. Foundation for informed decision-making."` | None |
| `executiveBriefSynthesis.service.ts` | 440 | `"Organizational structure and operational environment"` | None |
| `executiveBriefSynthesis.service.ts` | 324 | `"${assertion.assertion} ${assertion.implication}"` | `assertion.assertion`, `assertion.implication` |
| `executiveBriefSynthesis.service.ts` | 337 | `"This dynamic is actively observed within ${roles} workflows. Operational manifestations include: ${evidenceList}."` | `roles`, `evidenceList` |
| `executiveBriefSynthesis.service.ts` | 342 | `"This creates execution drag through ${constraint}, contributing to resource inefficiency and coordination overhead."` | `constraint` |
| `executiveBriefSynthesis.service.ts` | 600 | `"Current operating signals indicate a normalized execution environment characterized by routine workflows. No acute friction points have surfaced to the level of executive visibility."` | None |
| `executiveBriefSynthesis.service.ts` | 601 | `"The execution environment demonstrates structural stability. Existing constraints appear managed within local capacity limits rather than acting as systemic blockers."` | None |
| `executiveBriefSynthesis.service.ts` | 602 | `"Systemic risk exposure remains latent. No critical escalation patterns currently threaten the strategic baseline."` | None |
| `executiveBriefSynthesis.service.ts` | 603 | `"Cross-functional execution is proceeding through distributed coordination. Shared strategic intent is implicit in operational routines."` | None |
| `executiveBriefSynthesis.service.ts` | 654 | `"Strategic analysis based on ${assertions.length} core executive signals."` | `assertions.length` |
| `executiveBriefSynthesis.service.ts` | 656 | `"High-confidence signals confirm clear strategic direction. ${crossRoleCount > 0 ? 'Cross-functional alignment is visible.' : 'Leadership consensus is forming.'}"` | `crossRoleCount` |
| `executiveBriefSynthesis.service.ts` | 658 | `"Executive landscape defined by distributed operational patterns. Synthesis points to implied stability with localized optimization opportunities."` | None |

### 4. LANGUAGE ORIGIN MATRIX

| Section | Source Function | Template-Based? | LLM-Based? | Derived? |
| :--- | :--- | :--- | :--- | :--- |
| **Executive Summary** | `assembleSections` | YES | NO | YES (Count analysis) |
| **Operating Reality** (Core) | `synthesizeAssertions` | YES | NO | NO |
| **Operating Reality** (Elaboration) | `generateElaboration` | YES | NO | NO |
| **Operating Reality** (Fallback) | `assembleSections` | YES (Hard string) | NO | NO |
| **Constraint Landscape** (Core) | `synthesizeAssertions` | YES | NO | NO |
| **Constraint Landscape** (Elaboration) | `generateElaboration` | YES | NO | NO |
| **Constraint Landscape** (Fallback) | `assembleSections` | YES (Hard string) | NO | NO |
| **Blind Spot Risks** (Core) | `synthesizeAssertions` | YES | NO | NO |
| **Blind Spot Risks** (Elaboration) | `generateElaboration` | YES | NO | NO |
| **Blind Spot Risks** (Fallback) | `assembleSections` | YES (Hard string) | NO | NO |
| **Alignment Signals** (Core) | `synthesizeAssertions` | YES | NO | NO |
| **Alignment Signals** (Elaboration) | `generateElaboration` | YES | NO | NO |
| **Alignment Signals** (Fallback) | `assembleSections` | YES (Hard string) | NO | NO |

### 5. TENANT DIVERGENCE ANALYSIS

| Tenant Archetype | Branch Execution | Evaluated Condition | Result |
| :--- | :--- | :--- | :--- |
| **Shakey’s (Low/Messy Signal)** | Track A (Synthesize) -> `isEligible`=False -> Fallback (Partial) | `assertions.length > 0` (True) AND `confidence < 0.7` (True) | Output uses generic Track A templates ("Risk exposure identified..."). **No Elaboration**. Low confidence prevents Assertive Summary. |
| **Prairie Peak (High Signal)** | Track A -> `isEligible`=True -> Elaboration | `confidence >= 0.7` (True) AND `contrast >= 0.45` (True) | Output uses Elaborated Templates ("This dynamic is actively observed..."). High confidence triggers Assertive Summary. |
| **Cascade (Unstable/Oscillating)** | Track A (Insufficient) -> Track B (Failed/Partial) -> Mix | `assertions.length < 3` (True) THEN `expansionAssertions.length > 0` | Output mixes Track A templates with whatever structure Track B returned (if any). If Track B fails, throws `INSUFFICIENT_SIGNAL`. |

### 6. NEGATIVE CONFIRMATION LIST

*   **executiveNarrativeRewrite**: No function named executiveNarrativeRewrite simple exists anywhere in the repository.
*   **executiveVoiceTransform**: No function named executiveVoiceTransform exists anywhere in the repository.
*   **businessImplicationSynthesis**: No function named businessImplicationSynthesis exists anywhere in the repository.
*   **multi-assertion narrative stitching**: No logic exists to stitch multiple assertions into a cohesive narrative; they are concatenated with `\n\n`.

### 7. FINAL OUTPUT FORMAT

Based on the code, executive-level narrative transformation does **not** occur.
