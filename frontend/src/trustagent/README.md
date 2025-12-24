# PulseAgent Homepage Simulator

## Overview

PulseAgent is a conversational sales experience for the public homepage. It appears as a top-right, always-on bubble that opens an intro modal on first visit and guides visitors through understanding + booking the Strategic AI Roadmap.

## Architecture

### Components

- **`PulseAgentShell.tsx`** - Root component managing all state and UI
  - Mounted in `App.tsx` via `PulseAgentWrapper`
  - Shows only on public pages (`/`, `/cohort`, etc.) when user is not authenticated
  - Uses React portal to avoid clipping

- **`PulseAgentAvatar.tsx`** - Animated avatar with pulse effect
  - Sizes: `small`, `medium`, `large`
  - Lightning bolt icon (Scend logo placeholder)
  - Optional pulse animation

- **`flows.ts`** - Conversation flow engine
  - 4 flows: `intro`, `explain_roadmap`, `fit_check`, `roi_teaser`
  - Each flow is array of `FlowStep` objects with branching logic
  - Auto-advance between steps with configurable delay

- **`visitorContext.ts`** - Visitor data capture
  - Stores team size, CRM, company type, urgency
  - Persisted to `sessionStorage`
  - Used for personalization and booking URL params

- **`analytics.ts`** - Event tracking
  - Fires events to Google Analytics and Facebook Pixel
  - Events: `pulseagent_opened`, `flow_started`, `cta_clicked`, etc.
  - Safe to call even if analytics not installed

- **`config.ts`** - Configuration and feature flags
  - Content: headlines, button labels, copy
  - Flags: `introEnabled`, `showRoiFlow`, `analyticsEnabled`
  - Timing: `introDelay`, `autoAdvanceDelay`
  - Override via env vars: `VITE_PULSEAGENT_INTRO_ENABLED`, `VITE_PULSEAGENT_MODE`

- **`api.ts`** - Backend API wrapper (for future live mode)
  - `trustagentApi.chat()` calls `POST /api/public/trustagent/homepage/chat`
  - Currently returns demo response

### State Flow

1. **First visit:**
   - Check `localStorage.getItem('pulseagent_intro_seen')`
   - If missing: show intro modal after 800ms delay
   - Track `pulseagent_intro_seen` event

2. **Quick pick or "Start chat":**
   - Set `localStorage` to prevent re-showing intro
   - Open panel, start selected flow
   - Track `pulseagent_flow_started` event

3. **Conversation:**
   - User clicks option → add user message → navigate to next step
   - Agent auto-advances through steps with `nextId`
   - Context captured (team size, CRM) stored in `sessionStorage`

4. **CTA click:**
   - `book_call` → Opens mailto with context params
   - `view_sample_roadmap` → Navigate to `/cohort`
   - `view_metrics_demo` → Navigate to `/cohort`
   - Track `pulseagent_cta_clicked` event

5. **Panel close:**
   - Conversation state preserved
   - Can reopen from bubble

## Mode Toggle

Two modes: **simulated** (default) and **live**:

- **Simulated:** Uses predefined flows from `flows.ts`
- **Live:** Calls `trustagentApi.chat()` for freeform input

Set via `VITE_PULSEAGENT_MODE` environment variable:

```bash
# .env.local
VITE_PULSEAGENT_MODE=live
```

## Configuration

### Environment Variables

```bash
# Disable intro modal
VITE_PULSEAGENT_INTRO_ENABLED=false

# Hide ROI flow
VITE_PULSEAGENT_SHOW_ROI=false

# Enable live mode
VITE_PULSEAGENT_MODE=live
```

### Editing Content

All copy lives in `config.ts`:

```typescript
export const config = {
  intro: {
    headline: "Hi, I'm PulseAgent",
    subheadline: "I help you see if...",
    quickPicks: [
      { label: 'What exactly is this Roadmap?', flowId: 'explain_roadmap' },
      // ...
    ],
    primaryCtaLabel: 'Start a quick chat',
    secondaryCtaLabel: 'Maybe later',
  },
  // ...
};
```

### Adding/Editing Flows

Edit `flows.ts`:

```typescript
export const flows: Record<FlowId, FlowStep[]> = {
  my_new_flow: [
    {
      id: 'step-1',
      speaker: 'agent',
      message: 'Your message here',
      options: [
        { id: 'opt-1', label: 'Option 1', nextStepId: 'step-2' },
      ],
    },
    // ...
  ],
};
```

## QA Checklist

### First Visit Behavior

- [ ] Navigate to `/` (homepage)
- [ ] Intro modal appears after ~800ms delay
- [ ] Modal shows avatar, headline, 3 quick-pick buttons, 2 CTAs
- [ ] Click "Maybe later" → modal closes, bubble visible
- [ ] Reload page → intro does NOT appear again
- [ ] Clear `localStorage` → intro appears again

### Returning Visit Behavior

- [ ] Navigate to `/` after intro seen
- [ ] Only bubble visible (no auto-modal)
- [ ] Click bubble → panel opens with suggested prompts

### Flow: Explain Roadmap

- [ ] Click "What is the Roadmap?" quick-pick
- [ ] Panel opens with explanation
- [ ] See 3 options: systems, cost, sample
- [ ] Click "What systems do you typically recommend?"
- [ ] See systems list + "Discuss my systems" CTA
- [ ] Click CTA → mailto opens with subject + params

### Flow: Fit Check

- [ ] Start "Is this right for my firm?" flow
- [ ] Select team size (e.g. "6-15 people")
- [ ] Agent responds positively
- [ ] Answer CRM question (e.g. "Yes, we use HubSpot")
- [ ] Agent says "You're a strong fit"
- [ ] See "Book discovery call" CTA
- [ ] Click CTA → booking flow triggers

### Flow: ROI Teaser

- [ ] Start "Show me ROI examples" flow
- [ ] See lead response time, close rate, ops hours metrics
- [ ] Click "How do you calculate ROI?"
- [ ] See ROI formula + "See detailed metrics" CTA
- [ ] Click CTA → navigate to `/cohort`

### CTAs

- [ ] `book_call` → Opens mailto with context params
- [ ] `view_sample_roadmap` → Navigate to `/cohort`, panel closes
- [ ] `view_metrics_demo` → Navigate to `/cohort`, panel closes

### Freeform Input

- [ ] Type "what is this?" in input
- [ ] Agent responds with generic "demo mode" message
- [ ] See 3 suggested options

### Context Capture

- [ ] Complete fit check flow
- [ ] Open DevTools → Application → Session Storage
- [ ] Check `pulseagent_context` key
- [ ] Should contain `teamSizeBracket`, `currentCrm`, etc.

### Analytics (Development)

- [ ] Open DevTools Console
- [ ] Complete a flow
- [ ] See `[PulseAgent Analytics]` logs for each event:
  - `pulseagent_intro_seen`
  - `pulseagent_opened`
  - `pulseagent_flow_started`
  - `pulseagent_cta_clicked`

### Mobile Responsiveness

- [ ] Open DevTools → Toggle device toolbar → iPhone SE (375px)
- [ ] Bubble visible in top-right (not clipped)
- [ ] Click bubble → panel full-screen
- [ ] Panel header, messages, input all visible
- [ ] Intro modal shows as bottom sheet (not center)
- [ ] All buttons tappable, no horizontal scroll

### Keyboard Accessibility

- [ ] Tab to bubble → press Enter → panel opens
- [ ] ESC closes intro modal
- [ ] ESC closes panel
- [ ] Input auto-focused when panel opens
- [ ] Tab through options in chat
- [ ] Enter sends message

## Analytics Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `pulseagent_opened` | - | Bubble clicked, panel opens |
| `pulseagent_intro_seen` | - | Intro modal appears |
| `pulseagent_flow_started` | `{ flowId }` | Flow begins |
| `pulseagent_flow_completed` | `{ flowId }` | Flow reaches end |
| `pulseagent_cta_clicked` | `{ ctaType }` | CTA button clicked |
| `pulseagent_message_sent` | `{ speaker }` | User sends message |

## Troubleshooting

### Intro modal not appearing

- Check `localStorage` for `pulseagent_intro_seen`
- Check `config.introEnabled` is `true`
- Check you're on a public page (`/`, `/cohort`)
- Check you're not authenticated

### Panel not opening

- Check console for errors
- Check `panelOpen` state in React DevTools
- Check z-index conflicts

### CTAs not working

- Check console for navigation errors
- Check booking URL format in `handleCtaClick()`
- Check router is working (Wouter)

### Analytics not firing

- Check `config.analyticsEnabled` is `true`
- Check `window.gtag` or `window.fbq` exists
- Check DevTools Console for `[PulseAgent Analytics]` logs

## Future Enhancements

- [ ] Full focus trap for intro modal
- [ ] Voice input support
- [ ] Multi-language support
- [ ] A/B testing framework
- [ ] Real-time typing indicators
- [ ] Conversation export (PDF/email)
- [ ] Integration with CRM (capture leads)
