# META-TICKET: STRIKE-4-FRONTEND-BUILD-CONSTITUTION-ENFORCEMENT

OBJECTIVE
Restore a clean, constitutional frontend build by enforcing tsconfig-aligned React usage, eliminating invalid ApiClient calls, and resolving type drift WITHOUT introducing new capabilities or scope.

CONSTRAINTS (NON-NEGOTIABLE)
- jsx runtime is "react-jsx" — React MUST NOT be imported unless referenced
- noUnusedLocals = true — unused imports/vars are build-breaking
- ApiClient is SOLE API SURFACE — UI may only call declared methods
- NO new ApiClient methods unless explicitly ticketed
- NO UI refactors beyond what is required to compile

EXECUTION PLAN (ORDERED)

STEP 1 — React Import Normalization (Global)
For every TSX file in:
- frontend/src/superadmin/pages/**
- frontend/src/superadmin/components/**

Rules:
- REMOVE `import React from 'react'` if React identifier is unused
- USE named imports ONLY where hooks are used:
  `import { useState, useEffect, useMemo } from 'react'`
- DO NOT introduce default React imports

Deliverable:
- Zero TS6133 errors related to React imports

STEP 2 — ApiClient Call Admissibility Audit
For each TS2339 / TS2353 error referencing ApiClient:

Produce a table:
- file
- line
- called method
- expected args
- ApiClient status: [EXISTS | DOES NOT EXIST]

Rules:
- If method DOES NOT EXIST → REMOVE or GATE UI call
- If args mismatch → FIX callsite to match ApiClient signature
- DO NOT add stub methods

STEP 3 — Type Contract Repairs
For each TS2741 / TS2339 type error:
- Identify missing or extra fields
- Update the LOCAL type definition OR the callsite
- No widening to `any`
- No optionalizing required fields unless backend confirms

STEP 4 — SVG Compliance Fixes
Replace invalid SVG props (e.g. `title=""`) with valid SVG child nodes.

STEP 5 — Proof & Verification
Run in order:
- pnpm exec tsc -p tsconfig.json --pretty false
- pnpm exec vite build

Attach logs:
- strike4_tsc_before.txt
- strike4_tsc_after.txt
- strike4_vite_after.txt

STOP CONDITIONS
- Any temptation to add ApiClient methods
- Any change that alters UI behavior beyond compilation
- Any scope expansion beyond listed errors

END STATE
- Frontend builds clean
- ApiClient remains authoritative
- No React import lint errors
- No invented capabilities
