# Base Personality Layer - Verification Guide

## ✅ Implementation Complete

The base personality layer has been successfully wired into all Assistants with:
- **Standardized tone, behavior, and executive-coach persuasion style**
- **First-interaction onboarding instructions**
- **Tenant-specific overrides via `agent_configs` fields**

## Architecture

### Files Created/Modified

1. **`backend/src/config/agentPersonality.ts`** (NEW)
   - `getBasePersonality()` function returning `PersonalityTemplate`
   - Contains: `systemIdentity`, `customInstructions`, `rolePlaybook`
   - Includes onboarding sequence instructions

2. **`backend/src/services/assistantProvisioning.service.ts`** (MODIFIED)
   - Imports `getBasePersonality` instead of `personalityBlock`
   - Refactored `composeInstructions()` to use base personality as default
   - Tenant-specific fields (`businessContext`, `customInstructions`, `rolePlaybook`) override base when present

3. **`backend/src/scripts/test_hayes_onboarding.ts`** (NEW)
   - Utility script to clear Hayes threads for testing

### Instruction Composition Order

```
1. Identity Block (firm name + owner name)
2. System Identity (base or DB override)
3. Persona & Behavior (base personality - ALWAYS present)
4. Firm Context (auto-generated businessContext)
5. Owner Preferences (tenant-specific customInstructions)
6. Role Playbook (base or DB override)
7. Roadmap-Aware Behavior (if roadmap exists)
8. Hard Rules (tenant firewall)
```

## Testing Hayes Assistant

### Step 1: Clear Existing Thread

```bash
cd backend
npx tsx src/scripts/test_hayes_onboarding.ts
```

This will delete Hayes Assistant threads to simulate first-time user interaction.

### Step 2: Test Onboarding Sequence

1. Log in as Hayes owner (Roberta account)
2. Navigate to `/roadmap` and open the chat bubble (or wherever Assistant is accessible)
3. Send first message: **"Hey, who are you and how are you supposed to help me?"**

### Expected Response Structure

The Assistant should deliver a **6-8 sentence onboarding sequence**:

1. ✅ **Warm greeting** using owner's first name
   - Example: "Hey Roberta, great to finally connect with you."

2. ✅ **Role introduction**
   - Who they are (strategic co-commander)
   - Why they're here (implement Strategic AI Roadmap)
   - Strategic purpose (turn plan into reality, focus on leverage)

3. ✅ **Roadmap framing**
   - Mentions the Strategic AI Roadmap exists
   - References key systems or outcomes
   - Positions roadmap as "the spine" of collaboration

4. ✅ **Collaboration model** (3-4 bullets)
   - Diagnosis → prioritization → execution → refinement
   - Ties work back to roadmap phases

5. ✅ **Invitation**
   - "What should we focus on first?"
   - "What are we tackling today?"

### Expected Tone
- Confident but not arrogant
- Warm but not soft
- Forward-looking and momentum-oriented
- Concise (6-8 sentences total)

## Follow-Up Test

After onboarding, send: **"What do you think my top 3 priorities are for the next 30 days?"**

### Expected Response
- ✅ Structured answer (diagnosis → recommendations → steps)
- ✅ References Hayes roadmap sections (e.g., "According to your Strategic AI Roadmap...")
- ✅ Uses Hayes-specific context (firm name, pain points, goals)
- ✅ Provides 3-7 concrete action steps
- ✅ Soft push toward implementation
- ✅ No generic chatbot language

## Personality Characteristics to Verify

### Communication Style
- Direct, concise, plainspoken
- Short sentences and tight paragraphs
- Bullet points preferred
- No fluff, hype, or consultant-speak

### Behavior Patterns
- Understands before acting
- Thinks in structures (lists, frameworks)
- Offers 1-3 powerful options (not 10 weak ones)
- Uses firm/roadmap context when available

### Executive-Coach Layer
- Ties ideas to concrete outcomes
- Highlights cost of inaction (factually)
- Recommends simple next steps
- Positions implementation as natural continuation

### Never Does
- Generic chatbot tone
- Rambling or excessive hedging
- Ignoring roadmap/firm data
- Stalling when concrete recommendation is possible

## Re-Provisioning All Assistants

To apply the base personality to all existing Assistants:

```bash
cd backend
npm run provision:assistants
# or manually:
npx tsx src/scripts/provision_all_assistants.ts
```

## Future Enhancements

Per the ticket, consider creating:
1. Per-tenant "aggressiveness" or "coaching intensity" toggles
2. Owner-facing UI to tweak personality without touching code
3. A/B testing framework for personality variations

## Success Criteria

- ✅ Hayes roadmap Assistant delivers proper onboarding on first message
- ✅ Subsequent messages use roadmap-aware, structured responses
- ✅ Tone matches "senior operator" energy (not junior assistant)
- ✅ All responses tie back to Hayes firm context
- ✅ No tenant isolation breaks
- ✅ Personality persists across thread messages
