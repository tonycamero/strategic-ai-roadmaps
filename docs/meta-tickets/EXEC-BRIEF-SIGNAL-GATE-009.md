# META-TICKET: EXEC-BRIEF-SIGNAL-GATE-009

## Executive Brief Signal Gate Hardening (Minimum 4 Distinct Signals)

**STATUS:** READY
**TYPE:** EXECUTION
**PRIORITY:** HIGH
**SCOPE:** CONTROLLED LOGIC ADJUSTMENT (SIGNAL GATING ONLY)

---

## OBJECTIVE

Increase Executive Brief regeneration rigor by requiring **a minimum of 4 distinct, substantive executive signals** before assertion synthesis proceeds — without diluting signal quality, altering synthesis heuristics, or changing output structure.

This change resolves false-negative regen blocks where sufficient intake data exists but signal triangulation is undercounted.

---

## RATIONALE

Current behavior:

* Regen blocks at **< 3 signals**
* This is too permissive conceptually *and* too fragile operationally

New standard:

> **4 distinct executive signals = minimum threshold for confident executive synthesis**

This aligns with executive reasoning norms:

* 1–2 = anecdotal
* 3 = plausible
* **4 = compelling / decision-grade**

---

## ABSOLUTE CONSTRAINTS (NON-NEGOTIABLE)

* ❌ Do NOT change assertion synthesis rules
* ❌ Do NOT loosen evidence requirements
* ❌ Do NOT change section caps or word limits
* ❌ Do NOT alter PDF renderer or layout
* ❌ Do NOT introduce probabilistic or random logic
* ❌ Do NOT change governance semantics (approval supremacy intact)
* ✅ Preserve determinism fully

---

## SCOPE (IN)

### A) Raise Signal Gate Threshold

Update signal gate logic in Executive Brief regeneration:

```ts
minRequiredSignals = 4
```

Replace all references to:

```ts
minRequired: 3
```

With:

```ts
minRequired: 4
```

Applies to:

* Forced regeneration
* Regen-on-miss
* Delivery-enforced regeneration

---

### B) Signal Qualification Rules (COUNTING SAFETY)

A signal **counts toward the minimum** only if:

* Unique `pattern_id`
* Meets existing confidence threshold
* Derived from **distinct evidence clusters**
* Not a semantic duplicate of another signal

⚠️ No new heuristics allowed — reuse existing normalization + dedupe logic.

---

### C) Error Semantics (Operator-Readable)

On failure, throw:

```ts
new SynthesisError(
  'Insufficient executive signal to regenerate Executive Brief',
  'INSUFFICIENT_SIGNAL',
  'SIGNAL_VALIDATION',
  {
    signalCount: <number>,
    minRequired: 4,
    recommendation: 'Collect additional stakeholder or operational signals'
  }
)
```

HTTP status:

* **422 Unprocessable Entity**

Payload must remain compatible with:

* `briefErrorParser`
* Inline non-blocking UI banner

---

### D) Logging (MANDATORY)

Log format must include:

```
[ExecutiveBriefSignalGate]
tenantId=<id>
briefId=<id|none>
action=<regen|download_regen|deliver_regen>
result=<pass|fail>
signalCount=<n>
minRequired=4
```

---

## SCOPE (OUT)

* ❌ Assertion count changes
* ❌ Signal strength scoring (future work)
* ❌ UI redesign
* ❌ Diagnostic pipeline changes
* ❌ Any new LLM prompting

---

## TESTING REQUIREMENTS

Add or update tests to assert:

1. Regen fails at **3 signals**
2. Regen succeeds at **4 signals**
3. Determinism preserved (no ordering drift)
4. Error payload includes:

   * `signalCount`
   * `minRequired: 4`
   * stable error code

All existing **30/30 tests must remain passing**.

---

## DEFINITION OF DONE

* Signal gate requires **≥ 4 distinct signals**
* No synthesis or assertion rules changed
* Regen failure produces structured 422 error
* UI shows inline error without blocking page
* Logs clearly indicate signal gate failure
* Ticket persisted verbatim

---

## TICKET PERSISTENCE (MANDATORY)

Persist to:

```
docs/meta-tickets/EXEC-BRIEF-SIGNAL-GATE-009.md
```

Execution is invalid if not persisted.

---

## FUTURE (EXPLICITLY DEFERRED)

* Signal confidence aggregation
* Compression ratio scoring
* Diagnostic readiness coupling

These are **out of scope** for 009.

---
