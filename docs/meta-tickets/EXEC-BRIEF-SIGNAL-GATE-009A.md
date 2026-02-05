# META-TICKET: EXEC-BRIEF-SIGNAL-GATE-009A

## Executive Brief Signal Gate — Separate *Minimum Viability* from *Quality Target*

**STATUS:** COMPLETED
**TYPE:** EXECUTION
**PRIORITY:** HIGH
**SCOPE:** IMPLEMENTATION-ONLY (NO HEURISTIC DILUTION)

---

## OBJECTIVE

Increase Executive Brief **signal richness** without making regeneration brittle or blocking operators.

Specifically:

* Preserve the **fail-closed minimum** required to safely generate a Brief
* Introduce a **higher quality target** that the synthesis pipeline *aims* to reach
* Surface “low signal” conditions clearly to operators **without blocking regen, preview, or iteration**

This ensures:

> **More signals is better — but lack of abundance does not dead-end the workflow.**

---

## CORE PRINCIPLE (LOCKED)

> **Minimum required ≠ Desired output**

These are two distinct gates and must never be conflated again.

---

## SPECIFICATION

### A) Signal Thresholds (Explicit Split)

Define two constants in
`backend/src/services/executiveBriefSynthesis.service.ts`

```ts
const MIN_REQUIRED_ASSERTIONS = 3;   // fail-closed threshold
const TARGET_ASSERTION_COUNT = 4;    // quality target
```

Rules:

* **< 3 assertions**
  → FAIL-CLOSED
  → `INSUFFICIENT_SIGNAL`
  → HTTP 422
  → No persistence, render, delivery

* **3 assertions**
  → PASS (LOW_SIGNAL)
  → Brief is generated
  → Marked as low-signal for operator visibility

* **≥ 4 assertions**
  → PASS (SUFFICIENT_SIGNAL)
  → Normal behavior

⚠️ **Do NOT raise `MIN_REQUIRED_ASSERTIONS` above 3**

---

### B) Synthesis Behavior (No Dilution)

* Do **NOT** relax:

  * assertion validity rules
  * evidence requirements
  * deduplication logic
  * confidence thresholds
* The pipeline should:

  * **attempt** to reach `TARGET_ASSERTION_COUNT`
  * **stop early** only if no additional *valid* assertions exist

> Quality must remain strict. We are increasing *aspiration*, not lowering standards.

---

### C) Output Metadata (Required)

Extend the synthesis result (non-persistent OK) with:

```ts
signalQuality: 'SUFFICIENT' | 'LOW_SIGNAL'
assertionCount: number
targetCount: number // always 4
```

This is **observational**, not a governance signal.

---

### D) Error & Status Semantics

#### Fail-Closed Case (< 3)

```json
{
  "error": "INSUFFICIENT_SIGNAL",
  "code": "INSUFFICIENT_SIGNAL",
  "stage": "SIGNAL_VALIDATION",
  "message": "Insufficient signal to generate Executive Brief",
  "assertionCount": 2,
  "minRequired": 3,
  "targetCount": 4,
  "requestId": "…"
}
```

#### Low-Signal Pass (== 3)

* **No error**
* Include `signalQuality: LOW_SIGNAL`
* Controller logs must emit:

```
[ExecutiveBriefSignalGate]
tenantId=…
briefId=…
result=pass_low_signal
assertionCount=3
target=4
```

---

### E) Frontend Behavior (Non-Blocking)

For **LOW_SIGNAL** briefs:

* Show **non-blocking warning banner**:

  > “Brief generated with limited signal (3 of 4 desired). Consider adding more intake signal.”

* Regen, preview, download remain enabled

* Delivery rules unchanged unless explicitly governed elsewhere

No global error. No page lock.

---

### F) Tests (MANDATORY)

Add tests to
`backend/src/__tests__/executiveBriefSynthesis/`

1. **3 assertions**

   * synthesis succeeds
   * `signalQuality === 'LOW_SIGNAL'`
   * no error thrown

2. **4 assertions**

   * synthesis succeeds
   * `signalQuality === 'SUFFICIENT'`

3. **2 assertions**

   * throws `INSUFFICIENT_SIGNAL`
   * 422
   * payload includes `assertionCount`, `minRequired`, `targetCount`

All existing determinism tests must remain passing.

---

## OUT OF SCOPE (LOCKED)

* No changes to assertion heuristics
* No changes to EAB caps or validation rules
* No PDF layout changes
* No governance rule changes
* No auto-padding or speculative assertions

---

## DEFINITION OF DONE

* `MIN_REQUIRED_ASSERTIONS` remains **3**
* `TARGET_ASSERTION_COUNT` set to **4**
* Low-signal briefs generate successfully
* Fail-closed behavior unchanged for <3
* Operator clearly sees signal quality
* Tests prove all three cases (2 / 3 / 4)
* Ticket persisted verbatim

---

## TICKET PERSISTENCE (MANDATORY)

Persist to:

```
docs/meta-tickets/EXEC-BRIEF-SIGNAL-GATE-009A.md
```
