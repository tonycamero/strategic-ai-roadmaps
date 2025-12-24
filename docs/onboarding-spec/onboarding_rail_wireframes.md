# Strategic AI Roadmaps – Onboarding Rail Wireframes

Low/medium fidelity ASCII + narrative wireframes for the **upper-left Onboarding Rail**, both expanded and collapsed, placed in the context of your existing dashboard.

---
## 1. Page-Level Layout (Expanded Rail)

```txt
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Nav: Strategic AI Roadmaps | Cohort | [Schedule Call] [Roadmap] [Logout] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Onboarding Rail (expanded)     |       Main Dashboard Content               │
│                                 |                                             │
│  ┌───────────────────────────┐  |  ┌───────────────────────────────────────┐ │
│  │  ○  42%                  ⇆│  |  │ Roadmap Status                       │ │
│  │  Your Roadmap Journey      │  |  └───────────────────────────────────────┘ │
│  │  "You’re 3 of 9 steps in" │  |  ┌───────────────────────────────────────┐ │
│  └───────────────────────────┘  |  │ Transformation Metrics                │ │
│  ┌───────────────────────────┐  |  └───────────────────────────────────────┘ │
│  │ Next Step                 │  |  ┌───────────────────────────────────────┐ │
│  │ Add your Business Profile │  |  │ ROI Insights                         │ │
│  │ ~3 minutes                │  |  └───────────────────────────────────────┘ │
│  │ [Continue →]              │  |  ┌───────────────────────────────────────┐ │
│  └───────────────────────────┘  |  │ Leadership Team Status               │ │
│  ┌───────────────────────────┐  |  └───────────────────────────────────────┘ │
│  │ 1. Owner Intake           │  |  ┌───────────────────────────────────────┐ │
│  │    ✔ Completed            │  |  │ Your Documents                       │ │
│  │                           │  |  └───────────────────────────────────────┘ │
│  │ 2. Business Profile       │  |                                             │
│  │    ● In Progress          │  |                                             │
│  │                           │  |                                             │
│  │ 3. Invite Team            │  |                                             │
│  │    ○ Not started          │  |                                             │
│  │  ...                      │  |                                             │
│  └───────────────────────────┘  |                                             │
│  ┌───────────────────────────┐  |                                             │
│  │ Badges:                  │  |                                             │
│  │ [Foundation Builder]     │  |                                             │
│  │ [Diagnostic Ready]       │  |                                             │
│  └───────────────────────────┘  |                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Notes
- The rail is visually distinct, but not overpowering.
- It feels like a “guided path” attached to the app, not a pop-up.
- Main content cards stay exactly where they are; only the left margin changes.

---
## 2. Onboarding Rail – Expanded State (Detail)

```txt
┌─────────────────────────────────────────┐
│ ● 42%                      [⇆]         │
│ Your Roadmap Journey                     │
│ You’ve completed 3 of 9 steps            │
├─────────────────────────────────────────┤
│ Next Step                                │
│ Add your Business Profile                │
│ ~3 minutes                               │
│ [Continue →]                             │
├─────────────────────────────────────────┤
│ 1. Owner Intake                          │
│    ✔ Completed                           │
│                                         │
│ 2. Business Profile                      │
│    ● In Progress                         │
│                                         │
│ 3. Invite Your Team                      │
│    ○ Not started                         │
│                                         │
│ 4. Team Intakes                          │
│    ○ Not started                         │
│                                         │
│ 5. Discovery Call                        │
│    ○ Not started                         │
│                                         │
│ 6. Diagnostic Generated                  │
│    ○ Not started                         │
│                                         │
│ 7. Roadmap Reviewed                      │
│    ○ Not started                         │
│                                         │
│ 8. Tickets Moderated                     │
│    ○ Not started                         │
│                                         │
│ 9. Implementation Decision               │
│    ○ Not started                         │
├─────────────────────────────────────────┤
│ Badges                                  │
│ [Foundation Builder] [Diagnostic Ready] │
└─────────────────────────────────────────┘
```

Legend:
- Circle next to percent: ProgressRing
- `[⇆]`: collapse/expand button
- `✔` = Completed; `●` = In progress; `○` = Not started

Spacing:
- Header
- 1 compact card for Next Step
- Scrollable steps area if needed
- Badges at bottom, pushed with `mt-auto`

---
## 3. Onboarding Rail – Collapsed State

In collapsed mode, the rail becomes a slim column that still shows status at a glance.

```txt
┌─────────┐
│ ○ 42%  ⇆│
│         │
│ ●●●     │  (3/9 small dots indicating steps)
│         │
│ Next:   │
│ Biz Prof│
└─────────┘
```

Alternate (even slimmer):

```txt
┌────┐
│42% │
│ ○  │
│ ⇆  │
└────┘
```

Collapsed behavior:
- Hover shows tooltip: `Onboarding – 42% complete` + `Click to expand`
- Click anywhere on the rail or the chevron to expand it.
- Main dashboard content **does not** resize when toggling; instead, we animate max-width/margins to avoid jarring jumps (see animation canvas).

---
## 4. Reward Overlay – Concept Wireframe

When a step completes, a subtle overlay ties the celebration to the Onboarding Rail without blocking the whole app.

```txt
Top Nav
────────────────────────────────────────────

[ Onboarding Rail ]     [ Main Content ]
┌───────────────────┐   ┌───────────────────────┐
│ ● 55%      [⇆]   │   │                       │
│ Your Roadmap     │   │                       │
│ Journey          │   │                       │
│ ...              │   │                       │
└───────────────────┘   └───────────────────────┘

   🎉 Toast (floating near rail header)
   ┌──────────────────────────────────┐
   │ Step complete                    │
   │ Business Profile saved.          │
   │ Your roadmap can now show ROI.   │
   └──────────────────────────────────┘
```

Light confetti burst is emitted from around the header area for ~1 second.

---
## 5. Desktop vs Smaller Viewports

### Desktop (Primary)
- Rail fully visible on the left.
- Sticky positioning on scroll.

### Tablet / Narrow Desktop
- Option 1: Rail collapses to slim mode by default, user can expand.
- Option 2: Rail becomes a top banner + horizontal progress bar.

### Mobile (Future)
- Rail becomes a full-page "Onboarding" screen accessible via a top icon, not always-visible.

For now, focus on **desktop-first**, where your cohorts will primarily operate.

---
## 6. Visual Emphasis Hierarchy

1. **Next Step Card** – highest contrast accent background + CTA.
2. **ProgressRing** – visible but not neon; acts as anchor.
3. **Step List** – low-contrast text, structured.
4. **Badges** – small and tasteful at the bottom; they’re rewards, not goals.

This hierarchy ensures the Onboarding Rail:
- Guides attention toward the **next action**, not just the checklist.
- Reinforces progress subtly without overpowering the main dashboard.

