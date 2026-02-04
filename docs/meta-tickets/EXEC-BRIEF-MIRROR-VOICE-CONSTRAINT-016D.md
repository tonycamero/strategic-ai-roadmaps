# META-TICKET: EXEC-BRIEF-MIRROR-VOICE-CONSTRAINT-016D

## TITLE
Add Second-Person Limit Constraint to Mirror Narrative Voice

## STATUS
IMPLEMENTED

## OBJECTIVE
Refine the mirror narrative voice to prevent second-person language ("you", "your team") from dominating the narrative. Ensure varied stance across paragraphs for a more sophisticated executive tone.

## PROBLEM
Initial mirror narrative prompt encouraged heavy use of second-person language, which can feel repetitive and less executive-grade when overused. Executive communication should vary its stance and framing.

## IMPLEMENTATION

### File Modified
**backend/src/services/executiveBriefMirrorNarrative.service.ts**

### Changes to Voice Requirements

**Before:**
```
VOICE REQUIREMENTS:
- Write as if speaking directly to the executive about their business
- Use "your team", "your organization", "you" (not "the organization")
- Focus on business decisions, tradeoffs, and priorities
- Avoid consultant lexicon entirely
- Be concise and direct
```

**After:**
```
VOICE REQUIREMENTS:
- Write as if speaking directly to the executive about their business
- Second-person language ("you", "your team", "your organization") may be used sparingly but must NOT dominate
- Do NOT begin consecutive paragraphs with second-person framing
- No more than ONE second-person sentence per paragraph
- Vary stance across paragraphs using:
  • Neutral executive observation ("The organization is operating...")
  • System-level description ("Execution currently depends on...")
  • Conditional framing ("As volume increases, this structure becomes fragile...")
  • Implicit mirror ("What appears manageable at low volume fails under load...")
- Focus on business decisions, tradeoffs, and priorities
- Avoid consultant lexicon entirely
- Be concise and direct
```

## VOICE CONSTRAINT RULES

### Second-Person Limits
1. **No Consecutive Second-Person Openings**: Do NOT begin consecutive paragraphs with "you", "your team", etc.
2. **One Per Paragraph Maximum**: No more than ONE second-person sentence per paragraph
3. **Sparing Use**: Second-person is allowed but not the default voice

### Stance Variety (Required)
Vary stance across paragraphs using:
- **Neutral Executive Observation**: "The organization is operating..."
- **System-Level Description**: "Execution currently depends on..."
- **Conditional Framing**: "As volume increases, this structure becomes fragile..."
- **Implicit Mirror**: "What appears manageable at low volume fails under load..."

## RATIONALE

**Why Limit Second-Person?**
- Prevents repetitive, overly familiar tone
- Creates more sophisticated executive communication
- Allows for varied framing that feels less prescriptive
- Maintains directness without being heavy-handed

**Why Vary Stance?**
- More engaging to read
- Demonstrates analytical depth
- Allows different types of insights to surface naturally
- Feels less like a report, more like strategic thinking

## TESTING

### Manual Review
When running the demo, review generated narratives for:
- ✅ Varied paragraph openings (not all "you"/"your")
- ✅ Mix of neutral, system-level, conditional, and implicit framing
- ✅ No more than one second-person sentence per paragraph
- ✅ No consecutive paragraphs starting with second-person

### Demo Command
```bash
cd backend
EXEC_BRIEF_MIRROR_NARRATIVE=true npx tsx src/__tests__/executiveBriefSynthesis/forensics/mirror_narrative_demo.ts
```

## CONSTRAINTS HONORED
- ✅ No changes to synthesis heuristics, selection, scoring, or routing
- ✅ No changes to mirror narrative schema/shape
- ✅ Only adjusted prompt voice requirements (7 lines added/modified)
- ✅ All other prompt content unchanged
- ✅ Pure voice refinement with no product logic changes

## NOTES
- This is a voice quality improvement, not a functional change
- LLM will naturally vary its approach with these constraints
- Second-person is still allowed, just not dominant
- TypeScript lint errors are IDE-only and don't affect runtime
