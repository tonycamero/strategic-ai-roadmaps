# Dashboard V5 — Owner Command Center Refactor

Transform the dashboard from "status board" to "executive command center" organized around Roberta's actual workflow.

---

## Ticket 1 — Command Strip Header (30 min)

Create `frontend/src/components/dashboard/CommandStrip.tsx`

**Structure:**
- Left: "Strategic AI Roadmaps" + subtext "Cohort: Eugene Q1 2026 • Hayes Real Estate Group"
- Middle: Phase pill ("Phase: Roadmap Review") + tiny progress indicator ("Step 3 of 5")
- Right: Primary CTA ("Schedule Call"), "Open Roadmap" button, user menu/logout

**Styling:**
- Full-width sticky header
- `bg-slate-950/90 border-b border-slate-800 backdrop-blur-sm`
- Height: ~64px, compact and professional
- Phase pill: `bg-blue-900/40 text-blue-300 border border-blue-700 rounded-full px-3 py-1 text-xs`

**Props:**
```ts
{
  firmName: string;
  cohort: string;
  currentPhase: 'onboarding' | 'roadmap_review' | 'pilot_design' | 'implementation';
  step: number;
  totalSteps: number;
  onScheduleCall: () => void;
  onOpenRoadmap: () => void;
  onLogout: () => void;
}
```

---

## Ticket 2 — Next Action Card (45 min)

Create `frontend/src/components/dashboard/NextActionCard.tsx`

**Design:**
- Title: "This Week's Focus"
- 3 bullet points max (dynamic based on current phase)
- Single action button: "View step-by-step plan"
- Prominent placement, accent border on left (`border-l-4 border-blue-500`)

**Styling:**
- `bg-slate-900/40 border border-slate-800 rounded-xl p-6`
- Bullets use `→` instead of dots
- Action button: `bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg`

**Props:**
```ts
{
  phase: string;
  actions: Array<{ id: string; text: string; }>;
  onViewPlan: () => void;
}
```

**Logic:**
- Dynamically generate 3 actions based on current phase:
  - Onboarding: "Invite remaining leaders", "Review intake submissions", "Prepare for roadmap review"
  - Roadmap Review: "Schedule walkthrough call", "Review key findings", "Identify pilot systems"
  - Pilot Design: "Finalize system selection", "Scope implementation timeline", "Set KPIs"

---

## Ticket 3 — Compact Phase Timeline (30 min)

Create `frontend/src/components/dashboard/PhaseTimeline.tsx`

**Design:**
- Horizontal stepper (4 steps only)
- Steps: Leadership Intakes → Roadmap Draft → Roadmap Review → Pilot Selection
- Current step highlighted with blue accent
- Past steps: checkmark icon
- Future steps: muted gray

**Styling:**
- Thin horizontal bar with connecting line
- Height: ~60px
- Step indicators: 32px circles with icon/number
- Labels below circles in `text-xs text-slate-400`

**Props:**
```ts
{
  currentStep: 1 | 2 | 3 | 4;
}
```

---

## Ticket 4 — Leadership Status Table (45 min)

Create `frontend/src/components/dashboard/LeadershipStatusTable.tsx`

Replace 3 giant role cards with compact table:

**Columns:**
| Role | Person | Invite | Intake | Actions |
|------|--------|--------|--------|---------|

**Styling:**
- `bg-slate-900/40 border border-slate-800 rounded-xl`
- Zebra striping: `odd:bg-slate-900/20`
- Status icons: ✓ (green) or ○ (gray) instead of badge text
- Row height: ~48px (tight)

**Actions:**
- Kebab menu per row (⋮) → "View intake", "Resend invite", "Edit"
- Table footer: "Manage Invites" link

**Props:**
```ts
{
  leaders: Array<{
    role: 'ops' | 'sales' | 'delivery';
    name?: string;
    email?: string;
    inviteAccepted: boolean;
    intakeComplete: boolean;
  }>;
  onViewIntake: (role: string) => void;
  onManageInvites: () => void;
}
```

---

## Ticket 5 — Roadmap Status Card (20 min)

Create `frontend/src/components/dashboard/RoadmapStatusCard.tsx`

**Design:**
- Title: "Roadmap Status"
- 3 lines:
  - Status: Draft Ready / Under Review / Finalized (pill badge)
  - Last Updated: {date}
  - Next Milestone: {text}
- Button: "Open Roadmap" (secondary style)

**Styling:**
- `bg-slate-900/40 border border-slate-800 rounded-xl p-5`
- Status pill: same as phase pill (blue/green based on status)
- Compact: ~140px height

**Props:**
```ts
{
  status: 'draft' | 'review' | 'finalized';
  lastUpdated: Date;
  nextMilestone: string;
  onOpenRoadmap: () => void;
}
```

---

## Ticket 6 — Key Findings Compact (20 min)

Create `frontend/src/components/dashboard/KeyFindingsPreview.tsx`

**Design:**
- Title: "Key Findings"
- 3 bullets (Ops / Sales / Delivery)
- No emojis, use simple outline icons (optional)
- Each bullet: max 100 chars

**Styling:**
- `bg-slate-900/40 border border-slate-800 rounded-xl p-5`
- Bullets: `border-l-2 border-blue-500 pl-3 text-sm text-slate-300`
- Height: ~160px

**Props:**
```ts
{
  findings: Array<{ domain: string; text: string; }>;
}
```

---

## Ticket 7 — Documents Section Refinement (30 min)

Update existing documents section:

**Changes:**
- Add category filter chips: `All | Roadmap | SOPs | Diagnostics`
- Sort: Roadmap docs first, then by date
- Reduce vertical padding (p-4 instead of p-6)
- Tighter row spacing

**Filter chips:**
- `bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700`
- Active: `bg-blue-900/40 text-blue-300 border-blue-700`

---

## Ticket 8 — DashboardV5 Assembly (45 min)

Create `frontend/src/pages/owner/DashboardV5.tsx`

**Layout Structure:**

```
┌─────────────────────────────────────────────┐
│ CommandStrip (Band 1)                       │
├─────────────────────┬───────────────────────┤
│ Left Column         │ Right Column          │
│ - NextActionCard    │ - LeadershipTable     │
│ - PhaseTimeline     │ - RoadmapStatusCard   │
│ - (AI prompt chip)  │ - KeyFindingsPreview  │
├─────────────────────┴───────────────────────┤
│ Band 3 (Full Width)                         │
│ - Documents (filtered)                      │
│ - Support (compact, single card)            │
└─────────────────────────────────────────────┘
```

**Grid:**
- Band 2: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- Left column: `space-y-6`
- Right column: `space-y-6`
- Band 3: `space-y-6 mt-8`

**Remove:**
- Welcome banner (content moves to CommandStrip)
- Separate "Need Help?" card (merge into small support footer)
- Animated badges (bounce, shake classes)
- All emojis in structural UI

---

## Ticket 9 — Mobile Responsiveness (30 min)

Ensure all new components work on mobile:

**CommandStrip:**
- Stack vertically on mobile (<640px)
- Phase pill moves under title
- Buttons collapse to icon-only

**Leadership Table:**
- Switch to card view on mobile
- Each row becomes a stacked card

**Two-column grid:**
- Becomes single column on mobile
- Left content first, then right content

---

## Success Criteria

✅ Dashboard feels like a command center, not a status board
✅ Clear hierarchy: What to do → Status/Context → Resources
✅ No emojis in primary UI elements
✅ One obvious next action always visible
✅ Leadership status compressed to table (3 cards → 1 table)
✅ Phase progression clear at a glance
✅ Mobile responsive
✅ All interactions functional (buttons, filters, modals)

---

## Timeline

Total: ~5 hours (spread across 9 tickets)

- Ticket 1: 30 min
- Ticket 2: 45 min
- Ticket 3: 30 min
- Ticket 4: 45 min
- Ticket 5: 20 min
- Ticket 6: 20 min
- Ticket 7: 30 min
- Ticket 8: 45 min
- Ticket 9: 30 min

---

## Execution Notes

- Build components in order (1-7), then assemble (8), then refine (9)
- Test each component in Storybook/isolation before assembly
- Use existing DashboardV4 as reference for data fetching logic
- Keep all business logic identical, only change layout + styling
