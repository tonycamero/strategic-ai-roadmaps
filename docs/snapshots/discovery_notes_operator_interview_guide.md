# Discovery Notes Operator Interview Guide

**Purpose:** Fill in STEP 6 — OPERATOR REALITY CHECK placeholders  
**Target:** Tony (Primary Operator)  
**Time Required:** 15-20 minutes  
**Output:** Update `docs/snapshots/discovery_notes_existing.md` § 12

---

## Interview Questions

### 1. Decision Points Driven by Discovery Notes

**Q1.1:** When you're on a discovery call, what specific information do you capture that helps you decide which inventory items to recommend?

**Q1.2:** How do you decide whether something is "core" vs "recommended" vs "advanced"?

**Q1.3:** What factors determine whether a ticket goes in Sprint 1 (30d), Sprint 2 (60d), or Sprint 3 (90d)?

**Q1.4:** When do you explicitly reject an SOP-01 recommendation? What triggers that decision?

**Q1.5:** What tenant-specific constraints (budget, tech debt, team readiness) do you track during the call?

---

### 2. What Would Feel "Wrong" If Removed

**Q2.1:** If you couldn't access your discovery notes 2 weeks after a call, what would you lose?

**Q2.2:** Have you ever had to re-derive a synthesis because notes were lost? What was painful about it?

**Q2.3:** What happens if you generate tickets that don't match what you agreed on during the discovery call?

**Q2.4:** When stakeholders ask "why did we choose this system?", where do you look for the answer?

---

### 3. Non-Obvious Heuristics (Operator Intuition)

**Q3.1:** What verbal cues during a call signal that a tenant is/isn't ready for a particular system?

**Q3.2:** Are there systems that you always implement together, even if they're not formally linked in the schema?

**Q3.3:** What political/stakeholder constraints affect how you sequence tickets?

**Q3.4:** How do you gauge team bandwidth during a call? What signals tell you to dial back ambition?

---

### 4. Current Workarounds (What You Do Today)

**Q4.1:** Where do you actually take notes during a discovery call? (Google Docs, Notion, paper, etc.)

**Q4.2:** After the call, how do you translate those notes into a structured format?

**Q4.3:** Do you send confirmation emails to tenants after the call? What do you include?

**Q4.4:** When do you coordinate with the SA team on edge cases? What triggers that?

---

### 5. Must-Preserve Behaviors

**Q5.1:** How important is it that you can override SOP-01 recommendations? Give an example.

**Q5.2:** Do you need space for qualitative/freeform notes, or is structured data enough?

**Q5.3:** How often do you update a synthesis after the initial save? What triggers updates?

**Q5.4:** How collaborative is the discovery process? Do tenants co-create the synthesis with you?

---

### 6. Candidates for Hardening (Operator Pain Points)

**Q6.1:** When selecting inventory items, is it hard to find specific systems in the canonical library?

**Q6.2:** Is there ambiguity about what makes something "core" vs "recommended"? Would a rubric help?

**Q6.3:** Do you have visibility into typical ticket load per sprint? Would that help with capacity planning?

**Q6.4:** Can you easily see which tickets depend on others? Would a dependency visualization help?

---

### 7. Things NOT to Automate Yet

**Q7.1:** Should tier assignment (core/recommended/advanced) be algorithmic, or does it require your judgment?

**Q7.2:** Can exclusion decisions be rule-based, or are they too context-dependent?

**Q7.3:** Can sprint sequencing be automated, or does it depend on tenant-specific constraints?

**Q7.4:** Should synthesis approval be automated, or must it remain human-in-the-loop?

---

### 8. Typical Discovery Call Flow (As-Practiced)

**Q8.1:** Walk me through a typical discovery call from start to finish. What's the agenda?

**Q8.2:** How much time do you spend on each section? (pain points, opportunities, prioritization, timeline)

**Q8.3:** After the call, what's your post-call synthesis process? Step by step.

**Q8.4:** How do you validate that your inventory selections match the canonical library?

---

### 9. What Makes a "Good" vs "Bad" Discovery Synthesis

**Q9.1:** What does a "good" discovery synthesis look like? What are the hallmarks?

**Q9.2:** What makes a synthesis "bad"? What red flags do you look for?

**Q9.3:** How do you know when a synthesis is "complete" and ready for ticket generation?

---

## Output Format

After the interview, update `docs/snapshots/discovery_notes_existing.md` § 12 by replacing the `[ ]` checkboxes with `[x]` and filling in concrete examples.

**Example:**

**Before:**
```markdown
- [ ] **Inventory Selection Rationale:** Why specific systems were chosen over alternatives
```

**After:**
```markdown
- [x] **Inventory Selection Rationale:** 
  - Example: "Chose Lead Response Automation over Full CRM Migration because tenant has 3-person team and needs quick wins. Full migration would take 6+ months and require dedicated IT resource they don't have."
  - Heuristic: If team < 5 people, prioritize automation over platform replacement.
```

---

**End of Interview Guide**
