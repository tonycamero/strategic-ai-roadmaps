# META-TICKET: EXEC-BRIEF-MIRROR-JSON-REQ-016C

## TITLE
Fix OpenAI json_object response_format prompt requirement

## STATUS
IMPLEMENTED

## PROBLEM
Mirror narrative demo fails with:
```
400 "'messages' must contain the word 'json' in some form, to use 'response_format' of type 'json_object'."
```

## CAUSE
OpenAI API requires that when using `response_format: { type: "json_object" }`, at least one message must contain the literal word "json". This is a hard API requirement.

## IMPLEMENTATION

### File Modified
**backend/src/services/executiveBriefMirrorNarrative.service.ts**

### Changes
Added explicit JSON instruction to system prompt:

**Before:**
```typescript
return `You are an executive communication specialist. Your task is to transform diagnostic business signals into executive-grade narrative.

VOICE REQUIREMENTS:
...
```

**After:**
```typescript
return `You are an executive communication specialist. Your task is to transform diagnostic business signals into executive-grade narrative.

You must respond with valid JSON only. Return JSON that matches the schema provided below.

VOICE REQUIREMENTS:
...
```

Also updated the output format header from `OUTPUT FORMAT:` to `OUTPUT FORMAT (JSON):` for additional clarity.

## CONSTRAINTS HONORED
- ✅ No changes to synthesis heuristics, selection, scoring, or section routing
- ✅ No changes to mirror narrative schema/shape
- ✅ Only adjusted prompt text (2 lines added)
- ✅ All other prompt content unchanged to avoid behavior drift

## TESTING

### Acceptance Test
```bash
cd backend
EXEC_BRIEF_MIRROR_NARRATIVE=true npx tsx src/__tests__/executiveBriefSynthesis/forensics/mirror_narrative_demo.ts
```

**Expected:**
- ✅ No 400 error about missing "json" in messages
- ✅ OpenAI call succeeds
- ✅ Valid JSON response returned
- ✅ Mirror narrative validation passes

**If it fails after this fix:**
- It must be a different error (schema validation, contract violation, model refusal)
- NOT the API precondition error

## NOTES
- This is a pure API requirement fix
- No product logic changes
- Minimal prompt modification (2 lines)
- TypeScript lint errors are IDE-only and don't affect runtime
