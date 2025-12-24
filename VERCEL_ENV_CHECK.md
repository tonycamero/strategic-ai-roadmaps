# Vercel Environment Variable Check

## Problem
Production PulseAgent is showing "demo mode" copy instead of the EPIC HPA smartass personality.

## Root Cause (CONFIRMED) ✅
**TWO issues found:**

### Issue 1: Frontend in simulated mode
The PulseAgentShell checks `import.meta.env.VITE_PULSEAGENT_MODE` and defaults to `'simulated'` if not set.
In simulated mode, it shows hard-coded demo text and never calls the OpenAI assistant.

### Issue 2: Backend has TRUNCATED assistant ID ❌
**Vercel has**: `asst_DjpWRemCqKQK6M3J1E4Cofq` (missing final `R`)
**Should be**: `asst_DjpWRemCqKQK6M3J1E4CofqR`

This causes 404 errors from OpenAI API.

## Your Local Config (CORRECT)
```
OPENAI_HOMEPAGE_ASSISTANT_ID=asst_DjpWRemCqKQK6M3J1E4CofqR
OPENAI_HOMEPAGE_VECTOR_STORE_ID=vs_692740a265948191a5c129f967549aa8
OPENAI_HOMEPAGE_MODEL=gpt-4o
```

## This Assistant Has:
- ✅ EPIC HPA "sharp, witty, slightly smartass" personality
- ✅ Structural JSON + XML tags (10,500 chars)
- ✅ YES Ladder conversation flow
- ✅ No "demo mode" copy

## Fix Steps

### 1. Check Vercel Environment Variables
```bash
# Install Vercel CLI if needed
pnpm add -g vercel

# Login
vercel login

# Check current env vars
vercel env ls
```

### 2. Update Vercel Environment Variables
Go to: https://vercel.com/tonycamero/aicohort-nine/settings/environment-variables

**CRITICAL - Add this first:**
- `VITE_PULSEAGENT_MODE` → `live` (Environment: Production, Preview, Development)

**Then FIX these (ID is currently TRUNCATED):**
- `OPENAI_HOMEPAGE_ASSISTANT_ID` → `asst_DjpWRemCqKQK6M3J1E4CofqR` ⚠️ **CAREFUL - includes final R**
- `OPENAI_HOMEPAGE_VECTOR_STORE_ID` → `vs_692740a265948191a5c129f967549aa8`
- `OPENAI_HOMEPAGE_MODEL` → `gpt-4o`
- `OPENAI_API_KEY` → (should already be set)

**IMPORTANT**: 
- Make sure there are NO duplicate or old var names
- The `VITE_` prefix is required for frontend env vars
- Apply to all environments (Production, Preview, Development)

### 3. Trigger Redeploy
```bash
# Option A: Push a small change
git commit --allow-empty -m "Trigger redeploy for env vars"
git push

# Option B: Manual redeploy in Vercel dashboard
```

### 4. Verify After Deploy
```bash
# Check logs for the startup message
# Should see:
# [OpenAI Config] ✅ Homepage assistant configured: { assistantId: 'asst_DjpWRemCqKQK6M3J1E4CofqR', ... }
```

### 5. Test Production
1. Open https://www.tonycamero.com in incognito
2. Open DevTools → Network tab
3. Trigger PulseAgent
4. Check response - should have JSON structure with "quick_hit", "value_pop", "one_question"
5. Verify tone is sharp/smartass, NOT "I'm in demo mode..."

## If Still Not Working
Check these files for hard-coded "demo mode" text:
```bash
grep -R "demo mode" frontend/src/pulseagent/
grep -R "demo mode" frontend/src/components/
```

If found, that's frontend hard-coding, not the assistant.
