# Tactical Frame & Roadmap Signals - Implementation Summary

**Date:** December 2025  
**Status:** Implemented (Phase 1.5)  
**Goal:** Transform the roadmap coach from "polite helper" to "instrument-panel operator"

---

## What We Built

### Problem

The roadmap coach was too generic and consultanty. It knew the roadmap existed but didn't actively **use diagnostics as an instrument panel** to make concrete calls about what's broken and what to fix first.

### Solution

Added two new services that extract structured signals from roadmap content and diagnostics, then compute a per-query tactical reasoning frame:

1. **Roadmap Signals** (static, in system prompt)
2. **Tactical Frame** (dynamic, per query)

---

## New Services

### 1. `metadataParser.ts`

**Purpose:** Extract structured signals from roadmap sections and diagnostics.

**Signals extracted:**
- **Top Pain Points**: From roadmap content (keywords: "bottleneck", "biggest pain") + diagnostic scores (8+/10)
- **Leverage Plays**: High impact + low/medium effort opportunities
- **Quick Wins**: Explicitly marked in roadmap content
- **Workflow Gaps**: Lacks defined process, inconsistent, manual, ad hoc

**Input:**
```typescript
{
  roadmapSections: RoadmapSection[],
  diagnostics?: { pains, maturity, notes }
}
```

**Output:**
```typescript
{
  topPainPoints: string[],
  leveragePlays: { title, impact, effort, system }[],
  quickWins: string[],
  workflowGaps: string[]
}
```

### 2. `tacticResolver.ts`

**Purpose:** Compute a per-query reasoning frame that anchors the assistant's response.

**Frame components:**
- **Main Constraint**: What's blocking progress (high-pain domain or current view)
- **Primary System**: Which system to focus on
- **Leverage Play**: High-impact opportunity (if available)
- **Micro-Steps**: 2-3 outcome-oriented actions

**Priority logic:**
1. High-pain domain (8+/10) → anchor there
2. User viewing a section → consider as candidate focus
3. Leverage play available → include it
4. Generate micro-steps tailored to the system

**Input:**
```typescript
{
  signals: RoadmapSignals,
  diagnostics?: DiagnosticData,
  currentView?: string // section key
}
```

**Output:**
```typescript
{
  mainConstraint?: string,
  primarySystem?: string,
  leveragePlay?: string,
  microSteps?: string[]
}
```

---

## How It Works

### At Provisioning Time (System Prompt)

**When:** Roadmap is created/updated, assistant is provisioned

**Flow:**
```
roadmapAgentSync.service.ts → syncAgentsForRoadmap()
  ↓
assistantProvisioning.service.ts → provisionAssistantForConfig()
  ↓
agentPromptBuilder.service.ts → buildContextFromConfig({ enableDiagnostics: true })
  ↓ (loads roadmap sections, extracts signals)
metadataParser.ts → deriveRoadmapSignals()
  ↓
agentPromptBuilder.service.ts → buildAgentSystemPrompt()
  ↓ (includes roadmapSignals in Layer 2)
OpenAI Assistants API → updates system prompt
```

**What gets baked into system prompt:**
- Roadmap sections + statuses
- Roadmap signals (pain points, leverage plays, quick wins, workflow gaps)
- Diagnostic summary (if available)

### At Query Time (Tactical Frame)

**When:** User sends a message to assistant

**Flow:**
```
Frontend → POST /api/assistant/query { message, context: { roadmapSection } }
  ↓
assistantAgent.controller.ts
  ↓
assistantQuery.service.ts → queryAssistant()
  ↓ (loads sections + diagnostics)
metadataParser.ts → deriveRoadmapSignals()
  ↓
tacticResolver.ts → resolveTacticalFrame({ signals, diagnostics, currentView })
  ↓ (formats tactical context)
assistantQuery.service.ts → prepends to user message
  ↓
OpenAI Assistants API → processes query with tactical context
```

**What gets injected into user message:**
```
[TACTICAL CONTEXT FOR THIS QUERY]

Top Pain Points:
  - Lead Follow-Up: bottleneck or critical issue described in roadmap.
  - Diagnostics: Follow-Up is high pain (9/10).

Leverage Plays (High Impact):
  - Lead Follow-Up System (low effort)

Suggested Micro-Steps:
  - Map the current workflow for Follow-Up end-to-end.
  - Identify where leads drop off or get stuck in Follow-Up.
  - Define one simple process change to close the biggest gap this week.

[END TACTICAL CONTEXT]

User's actual question...
```

---

## Prompt Changes

### Layer 2 (Business Context) - Enhanced

**Before:**
```
Firm context (high level):
${businessContext}

Roadmap focus (if available):
${roadmapSummary || '(none provided yet)'}

If this context is missing or thin, you must NOT invent firm details. Instead:
- Say what's missing.
- Ask 1–3 sharp follow-up questions to get enough detail to give useful guidance.
```

**After:**
```
You only know what the platform passes to you.

High-level roadmap summary:
${roadmapSummary || '(Roadmap summary not available)'}

Roadmap sections and statuses:
${roadmapSectionsBlock}

Diagnostics summary (pain, maturity, bottlenecks):
${diagnosticSummary}

Parsed roadmap & diagnostic signals:
${roadmapSignals}

For this specific message, your tactical reasoning frame is:
${tacticalFrame}

The tactical frame may provide:
- The current main constraint.
- The most promising leverage play.
- A few candidate micro-steps.

You must:
- Treat the tactical frame and signals as **strong hints** about what matters most right now.
- Prefer using these signals over generic advice.
- Explicitly say when something you're inferring is **not present** in roadmap/diagnostics.

If important context feels missing:
- State what you don't see.
- Ask 1–3 sharp questions before prescribing actions.
```

### Layer 5 (Owner Persona) - Enhanced

**Before:**
```
If persona = owner:
- Treat the user as an owner/founder.
- Focus on prioritization, ROI, tradeoffs, and where to deploy the team's time first.
- Show the cost of inaction when relevant (lost leads, wasted time, owner burnout).
- Help them choose: "If you only do one thing this week, do this."
```

**After:**
```
If persona = owner:
- Treat the user as an owner/founder.
- Focus on prioritization, ROI, tradeoffs, and where to deploy the team's time first.
- Show the cost of inaction when relevant (lost leads, wasted time, owner burnout).
- Help them choose: "If you only do one thing this week, do this."
- You may gently challenge the owner's focus if diagnostics point to a different bottleneck.
- Use roadmap + diagnostics + tactical frame to make concrete calls about what's broken and what to fix first.
```

**Response Pattern - Enhanced:**

**Before:**
```
How you respond (default pattern):
1. Reflect the core issue in one clear sentence.
2. Give a practical operator insight.
3. Propose 1–3 concrete next steps.

You help the user think in terms of **systems**, not one-off hacks.
```

**After:**
```
How you respond (default pattern):
1. Reflect the core issue in **one sharp sentence**.
2. Ground it in **roadmap + diagnostics + tactical frame** ("Here's how this shows up in your data...").
3. Prescribe **1–3 moves** with an implied timeframe ("this week / this month") and which **system / roadmap section** they live in.

You help the user think in terms of **systems**, not one-off hacks.
You use diagnostics as an **instrument panel**: high pain + high ROI + feasible → top of stack.
```

---

## Example: Before vs After

### User Query
"What should I focus on this week?"

### Before (Generic Helper)
```
That's a great question. Based on your roadmap, you have several options:

1. You could work on improving your lead generation system
2. You could focus on streamlining your sales process
3. You could enhance your client onboarding

What feels most urgent to you right now?
```

**Problem:** Generic list, no data grounding, puts decision back on user.

### After (Instrument-Panel Operator)
```
Your diagnostics flag follow-up as a 9/10 pain, and your roadmap calls it out as a low-effort, high-impact fix.

That means leads are coming in but falling through the cracks after first contact.

Here's what to do this week:
1. Map your current follow-up workflow: where do leads come in, who touches them, where do they drop off?
2. Pick one lead source and build a simple 3-touch sequence (day 0, day 3, day 7).
3. Test it for 2 weeks, then expand to other sources.

Start with #1. Want help mapping the flow?
```

**Why this works:**
- **Data-grounded**: "9/10 pain", "low-effort, high-impact"
- **Specific system**: Follow-up
- **Concrete steps**: Testable, outcome-oriented
- **Timeframe**: "this week"
- **Invitation to continue**: "Want help mapping the flow?"

---

## Files Modified

### New Files
- `src/services/roadmapAnalysis/metadataParser.ts` - Extract signals from roadmap + diagnostics
- `src/services/roadmapAnalysis/tacticResolver.ts` - Compute tactical frame per query
- `TACTICAL_FRAME_IMPLEMENTATION.md` - This document

### Modified Files
- `src/services/agentPromptBuilder.service.ts`:
  - Added `diagnosticSummary`, `roadmapSignals`, `tacticalFrame` to `AgentPromptContext`
  - Updated Layer 2 (Business Context) with explicit data enumeration
  - Updated Layer 5 (Owner Persona) with operator mindset + instrument panel language
  - Made `buildContextFromConfig()` async, added `enableDiagnostics` option

- `src/services/assistantQuery.service.ts`:
  - Added imports for roadmap analysis services
  - Added `context` param to `QueryAssistantParams` (for currentView)
  - Added `extractDiagnosticsFromIntake()` helper function
  - Added tactical context computation before query (loads sections + diagnostics, computes signals + frame)
  - Prepends tactical context to user message

- `src/services/assistantProvisioning.service.ts`:
  - Updated `composeInstructions()` to await `buildContextFromConfig()` with `{ enableDiagnostics: true }`

---

## Testing Strategy

### 1. Verify Signal Extraction

**Test roadmap content parsing:**
```typescript
const signals = deriveRoadmapSignals({
  roadmapSections: [
    {
      id: '1',
      sectionKey: 'follow_up',
      sectionName: 'Lead Follow-Up System',
      status: 'planned',
      contentMarkdown: 'This is a bottleneck. Low effort, high impact opportunity.'
    }
  ],
  diagnostics: {
    pains: { 'Follow-Up': 9 },
    maturity: { 'Follow-Up': 2 }
  }
});

// Expected:
// - topPainPoints: ["Lead Follow-Up System: bottleneck...", "Diagnostics: Follow-Up is high pain (9/10)"]
// - leveragePlays: [{ title: "Lead Follow-Up System", effort: "low", ... }]
// - workflowGaps: ["Diagnostics: Follow-Up has low maturity (2/10)"]
```

### 2. Verify Tactical Frame Resolution

**Test priority logic:**
```typescript
const frame = resolveTacticalFrame({
  signals,
  diagnostics: { pains: { 'Follow-Up': 9 } },
  currentView: null
});

// Expected:
// - mainConstraint: "Follow-Up is a high-pain area (9/10)."
// - primarySystem: "Follow-Up"
// - leveragePlay: "Lead Follow-Up System (low effort, high impact)"
// - microSteps: [3 tailored steps]
```

### 3. End-to-End Query Test

**Setup:**
1. Create tenant with roadmap sections containing "bottleneck" language
2. Create intake with `{ followUpPain: 9, followUpMaturity: 2 }`
3. Reprovision assistant

**Test query:**
```bash
POST /api/assistant/query
{
  "message": "What should I focus on this week?",
  "context": { "roadmapSection": "follow_up" }
}
```

**Expected response:**
- References "Follow-Up" as the system
- Cites diagnostic pain score
- Proposes 1-3 concrete actions with timeframe
- No generic advice

### 4. Verify System Prompt

**Dump prompt via OpenAI API:**
```bash
curl https://api.openai.com/v1/assistants/$ASSISTANT_ID \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "OpenAI-Beta: assistants=v2" | jq '.instructions'
```

**Check for:**
- Layer 2 includes "Parsed roadmap & diagnostic signals:"
- Signals text present (if roadmap has extractable content)
- Tactical frame placeholder present

---

## Next Steps (Phase 2)

### 1. Conversation-State-Aware Tactical Frame
- Track what user has discussed in previous messages
- If follow-up was discussed for 3+ messages, either deepen or pivot

### 2. "What Changed?" Hook
- Detect when diagnostics update
- Assistant can say: "Your follow-up pain dropped from 9 to 6. Time to focus on delivery?"

### 3. More Sophisticated Diagnostic Parsing
- Current implementation uses simple key matching (`leadGenPain`, `followUpPain`)
- Enhance to support structured diagnostic schema

### 4. Outcome-Oriented Micro-Steps
- Current steps are generic ("Map the workflow")
- Make them testable: ("Map the workflow **and identify where leads drop off between first contact and booking**")

### 5. Staff/Advisor Persona Variants
- Current enhanced prompt is owner-focused
- Add staff persona (execution-focused, less aggressive on prioritization)
- Add advisor persona (best practices, risk communication)

---

## Success Criteria

**The assistant is now "thinking with the data" if:**

1. ✅ Responses reference specific systems (not "you should improve things")
2. ✅ Responses cite diagnostic scores when available ("9/10 pain")
3. ✅ Responses prioritize based on pain + ROI + feasibility (not just first thing mentioned)
4. ✅ Responses include concrete, testable actions with timeframes
5. ✅ Responses gently challenge misplaced focus ("your roadmap says X, but diagnostics show Y is the bigger drag")

**Test:** Ask "What should I focus on?" — if the answer is grounded in specific data and actionable, you've succeeded.

---

## Rollback Plan

If the tactical frame causes issues:

1. **Disable per-query tactical context:**
   - Comment out tactical context injection in `assistantQuery.service.ts` (lines 172-233)
   - Assistant will still have roadmap signals in system prompt (less dynamic but safer)

2. **Disable diagnostics in system prompt:**
   - Change `buildContextFromConfig(config, firmName, { enableDiagnostics: false })` in provisioning service
   - Reprovision all assistants

3. **Full revert:**
   - Restore `agentPromptBuilder.service.ts` from git history
   - Reprovision all assistants
   - Remove roadmap analysis services

---

## Key Insights

### Why This Works

1. **Tactical frame is per-query, not per-tenant**: Different users viewing different sections get different frames, but all share the same base system prompt.

2. **Signals in system prompt, frame in user message**: Signals are relatively static (roadmap content doesn't change often), but tactical frame is dynamic (depends on current view + recent diagnostics).

3. **Graceful degradation**: If diagnostics aren't available, system still works (just less grounded).

4. **Explicit data boundaries**: Assistant is told exactly what data it has and doesn't have ("I don't see X in the diagnostics").

### Why NOT to Do This

- **Token overhead**: Tactical context adds ~200-500 tokens per query
- **Complexity**: More moving parts = more debugging surface area
- **Diagnostic schema dependency**: Assumes intake structure (currently naive parsing)

**Trade-off:** More accurate, data-grounded responses vs. slightly higher cost + complexity.

---

**End of Document**
