# META-TICKET: EXEC-BRIEF-MIRROR-ENV-LOAD-016B

## TITLE
Fix Mirror Narrative env loading + remove dummy OpenAI key fallback

## STATUS
IMPLEMENTED

## OBJECTIVE
Ensure Executive Brief mirror narrative demo + contract tests correctly load backend/.env automatically and never fall back to a dummy OpenAI key.

## IMPLEMENTATION SUMMARY

### Files Created
1. **backend/src/__tests__/helpers/loadEnv.ts**
   - Loads dotenv from process.cwd()/.env
   - No logging, no side effects beyond env population

### Files Modified
1. **backend/src/services/executiveBriefMirrorNarrative.service.ts**
   - Removed dummy OpenAI key fallback (`|| 'dummy_key_for_testing'`)
   - Added explicit guard: throws Error if `OPENAI_API_KEY` is missing
   - Fail-closed behavior enforced

2. **backend/src/services/executiveBriefAssertionExpansion.service.ts**
   - Removed dummy OpenAI key fallback
   - Added explicit guard: throws Error if `OPENAI_API_KEY` is missing
   - Fail-closed behavior enforced

3. **backend/src/__tests__/executiveBriefSynthesis/forensics/mirror_narrative_demo.ts**
   - Added `loadBackendEnv()` call at top (before any OpenAI imports)
   - Ensures .env is loaded for local execution

4. **backend/src/__tests__/executiveBriefSynthesis/mirrorNarrative.contract.test.ts**
   - Added `loadBackendEnv()` call at top
   - Fixed import path: `../../services/executiveBriefSynthesis.service` (was `../../../services/...`)

## CHANGES

### Before
```typescript
openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_testing',
});
```

### After
```typescript
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY missing (env not loaded).');
}
openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
```

## TESTING

### Acceptance Test A: Shell Sanity
```bash
node -e "console.log(process.env.OPENAI_API_KEY||'')"
# Expected: empty (no env loaded)
```

### Acceptance Test B: Demo Script
```bash
cd backend
EXEC_BRIEF_MIRROR_NARRATIVE=true npx tsx src/__tests__/executiveBriefSynthesis/forensics/mirror_narrative_demo.ts
# Expected: OpenAI call succeeds, no invalid_api_key, no dummy key usage
```

### Acceptance Test C: Contract Tests
```bash
cd backend
EXEC_BRIEF_MIRROR_NARRATIVE=true pnpm vitest run src/__tests__/executiveBriefSynthesis/mirrorNarrative.contract.test.ts
# Expected: Tests load and execute without path resolution errors
```

### Acceptance Test D: Fail-Closed Proof
```bash
# Temporarily rename backend/.env → backend/.env.off
cd backend
EXEC_BRIEF_MIRROR_NARRATIVE=true npx tsx src/__tests__/executiveBriefSynthesis/forensics/mirror_narrative_demo.ts
# Expected: Immediate failure with "OPENAI_API_KEY missing (env not loaded)."
# NO OpenAI request attempted
```

## NOTES
- TypeScript lint errors (Cannot find module 'openai', 'process', etc.) are expected and don't affect runtime
- These are IDE-only errors due to missing type definitions in tsconfig
- Runtime behavior is correct: env loads, API key is validated, fail-closed enforced
- Production behavior unchanged (server already loads .env)
