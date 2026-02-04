# META-TICKET: EXEC-BRIEF-VALIDATION-TYPES-UNIFY-003C
## Unify Executive Brief Contract Types Across Pipeline + Validator (Single Source of Truth)

**STATUS: COMPLETE**
**TYPE: EXECUTION**
**PRIORITY: HIGH**
**SCOPE: IMPLEMENTATION-ONLY (TYPE UNIFICATION + DRIFT PREVENTION)**

### OBJECTIVE
Eliminate type drift by ensuring the Executive Brief validator, synthesis pipeline, and controllers all reference ONE canonical contract definition:
`backend/src/types/executiveBrief.ts`

### ABSOLUTE CONSTRAINTS
- Do NOT change synthesis pipeline heuristics
- Do NOT change any validation rules or thresholds
- Do NOT change PDF renderer styling/layout
- Do NOT change governance semantics (approval / audit events)
- Preserve determinism (no timestamps, no random IDs, stable ordering)
- Tests MUST remain green (30/30)

### SCOPE (IN)

**A) Replace re-declared contract types in:**
`backend/src/services/executiveBriefValidation.service.ts`

Specifically REMOVE local re-definitions of:
- `ExecutiveAssertionBlock`
- `ExecutiveBriefSynthesis`
- `Pattern`
- `ValidationViolation` may remain local if not already defined canonically

And INSTEAD import canonical types from:
`backend/src/types/executiveBrief.ts`

**B) Ensure validator function signatures use canonical types:**
- `validateExecutiveBriefSynthesisOrThrow(synthesis: ExecutiveBriefSynthesis): void`
- `validateExecutiveAssertionBlock(eab: ExecutiveAssertionBlock): void`
- `validatePattern(pattern: Pattern): void`
- `validateStrategicSignalSummary(...)` uses canonical type if present

**C) Reconcile naming mismatches WITHOUT changing the contract:**
- If validator expects fields that differ from canonical names, update validator to match canonical schema
- Do NOT "fix" by duplicating types or adding optional fields
- Fail closed on missing/invalid shapes

**D) Remove duplicate "shadow schema" logic:**
- If validator validates StrategicSignalSummary as string but canonical is structured, validate canonical shape
- Keep violation rules and identifiers stable (rule strings MUST NOT change unless required by canonical schema)

**E) Keep runtime imports in controller/delivery as-is unless required:**
- `executiveBrief.controller.ts` uses dynamic import for validator
- `executiveBriefDelivery.ts` uses dynamic import for validator
- These may remain; type unification is compile-time

### TESTING REQUIREMENTS (MANDATORY)
1. Run determinism suite: `pnpm -C backend run test:brief-determinism` → Must be 30/30 passing
2. Run TypeScript check for backend (if script exists): `pnpm -C backend run typecheck`

### DELIVERABLES
- ✅ Ticket persisted to docs/meta-tickets/
- ✅ executiveBriefValidation.service.ts contains NO local re-declared types
- ✅ Validator imports canonical types from backend/src/types/executiveBrief.ts
- ✅ All validation rules still enforced exactly as before
- ✅ Determinism suite passes 30/30

### IMPLEMENTATION SUMMARY

**Types Removed from Validator:**
- ❌ `ExecutiveAssertionBlock` (removed - now imported from canonical)
- ❌ `ExecutiveBriefSynthesis` (removed - now imported from canonical)
- ❌ `Pattern` (removed - now imported from canonical)
- ✅ `ValidationViolation` (kept - local to validator, not part of contract)

**Canonical Import Added:**
```typescript
import type {
    ExecutiveAssertionBlock,
    ExecutiveBriefSynthesis,
    Pattern
} from '../types/executiveBrief';
```

**Type Alignment:**
- Canonical types use union literals for `alignment_strength` and `alignment_scope`
- Canonical types use union literals for `recurrence_level`
- Validator now enforces canonical contract exactly
- No validation logic changed - only type sources unified

**Test Results:**
```
✓ 30/30 tests passing
  - 5 Repeatability Tests
  - 2 Golden Output Tests
  - 4 Section Caps Enforcement Tests
  - 4 Ordering Stability Tests
  - 5 Fail-Closed Tests
  - 4 Constraint Validation Tests
  - 6 Contract Validation Tests
```

### FILES MODIFIED
- `backend/src/services/executiveBriefValidation.service.ts` (removed duplicate types, added canonical imports)
- `docs/meta-tickets/EXEC-BRIEF-VALIDATION-TYPES-UNIFY-003C.md` (this ticket)

### DEFINITION OF DONE
- ✅ executiveBriefValidation.service.ts contains NO local re-declared ExecutiveBrief contract types
- ✅ Validator imports canonical types from backend/src/types/executiveBrief.ts
- ✅ All validation rules still enforced exactly as before
- ✅ Determinism suite passes 30/30
- ✅ Ticket persisted verbatim

### AUTHORITY
Derives from: EXEC-BRIEF-VALIDATION-KIT-003, EXEC-BRIEF-CANONICAL-CONTRACT-PREEMPT-001

### DEFINITION OF DONE
- executiveBriefValidation.service.ts contains NO local re-declared ExecutiveBrief contract types
- Validator imports canonical types from backend/src/types/executiveBrief.ts
- All validation rules still enforced exactly as before
- Determinism suite passes 30/30
- Ticket persisted verbatim

### AUTHORITY
Derives from: EXEC-BRIEF-VALIDATION-KIT-003, EXEC-BRIEF-CANONICAL-CONTRACT-PREEMPT-001
