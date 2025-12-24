# Strategic AI Roadmaps – Onboarding Rail

## React Component Layout (High-Fidelity, Upper-Left Rail)

This canvas defines the **component tree, props, and data flow** for the Onboarding Rail in React + Tailwind.

Assumptions:

- App uses React + TypeScript
- Tailwind CSS enabled
- Onboarding API returns `OnboardingState` as defined in the API Schema canvas
- Layout shell wraps all authenticated pages

---

## 1. High-Level Component Tree

```txt
<AppShell>
  <PrimaryTopNav />
  <div class="flex">
    <OnboardingRail />
    <MainContent />
  </div>
</AppShell>
```

Inside **\<OnboardingRail />**:

```txt
<OnboardingRail>
  <RailHeader>
    <ProgressRing />
    <RailTitle />
    <CollapseButton />
  </RailHeader>

  <NextActionCard />

  <StepList>
    <StepItem /> x N
  </StepList>

  <BadgesStrip />
</OnboardingRail>

<RewardOverlay /> (portal at app root)
```

`OnboardingRail` consumes `OnboardingState` from context and is responsible for overall layout + theming.

---

## 2. AppShell & Context

### 2.1 Onboarding Context

**File:** `src/context/onboardingContext.tsx`

- Fetches onboarding state from `/api/tenants/:tenantId/onboarding`
- Provides:
  - `state: OnboardingState | null`
  - `refresh: () => Promise<void>`
  - `previousStateRef` (for reward comparison)

```ts
interface OnboardingContextValue {
  state: OnboardingState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

### 2.2 AppShell

**File:** `src/components/layout/AppShell.tsx`

Responsibilities:

- Wrap all authenticated routes
- Provide OnboardingContext
- Render `OnboardingRail` + body

```tsx
export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useOnboarding();

  return (
    <div className="min-h-screen bg-sar-night text-sar-text flex flex-col">
      <PrimaryTopNav />
      <div className="flex flex-1">
        <OnboardingRail />
        <main className="flex-1 px-8 py-6">
          {children}
        </main>
      </div>
      <RewardOverlay />
    </div>
  );
};
```

*(Tailwind tokens like **`bg-sar-night`** assume your existing design system.)*

---

## 3. OnboardingRail Component

**File:** `src/components/onboarding/OnboardingRail.tsx`

Props: none (consumes context).

Responsibilities:

- Layout & background
- Collapsed / expanded state
- Conditional rendering based on loading/error

State:

- `collapsed: boolean` (local `useState`, persisted in `localStorage`)

Layout:

- Expanded: `w-[280px]`
- Collapsed: `w-12`

Key Tailwind classes:

- `bg-sar-panel/70 border-r border-sar-border flex flex-col`.

Render logic (pseudocode):

```tsx
if (!state) { /* skeleton */ }

return (
  <aside className={clsx(
    'h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300 flex flex-col',
    collapsed ? 'w-12' : 'w-[280px]'
  )}>
    <RailHeader
      collapsed={collapsed}
      onToggle={() => setCollapsed(!collapsed)}
    />

    {!collapsed && (
      <>
        <NextActionCard state={state} />
        <StepList steps={state.steps} nextStepId={state.nextStepId} />
        <BadgesStrip badges={state.badges} />
      </>
    )}
  </aside>
);
```

---

## 4. RailHeader, ProgressRing, CollapseButton

### 4.1 RailHeader

**File:** `src/components/onboarding/RailHeader.tsx`

Props:

- `collapsed: boolean`
- `onToggle: () => void`

Layout:

- Flex row, align center
- When expanded: ProgressRing + titles + CollapseButton
- When collapsed: only ProgressRing + icon

### 4.2 ProgressRing

**File:** `src/components/onboarding/ProgressRing.tsx`

Props:

- `percent: number`
- `size?: number` (default 56)
- `strokeWidth?: number` (default 6)

Uses SVG circle with Tailwind-friendly styles; animation handled via Framer Motion (see animation spec canvas).

### 4.3 CollapseButton

**File:** `src/components/onboarding/CollapseButton.tsx`

Props:

- `collapsed: boolean`
- `onToggle: () => void`

Renders a small icon-only button with a chevron rotating based on `collapsed`.

Tailwind:

- `inline-flex items-center justify-center rounded-full h-7 w-7 bg-sar-chip hover:bg-sar-chip/80 text-sar-muted`.

---

## 5. NextActionCard

**File:** `src/components/onboarding/NextActionCard.tsx`

Props:

- `state: OnboardingState`

Behavior:

- Only renders if `state.nextStepId` exists.
- Shows:
  - Label: "Next Step"
  - `nextStepLabel`
  - `nextStepEstimatedMinutes` (if present)
  - CTA: "Continue"

CTA click:

- Calls `navigateToOnboardingStep(state.nextStepId)` using a shared helper that maps `stepId` → route.

Tailwind:

- Card-style: `mt-4 p-4 rounded-2xl bg-gradient-to-br from-sar-panel to-sar-panelBright shadow-lg`.

---

## 6. StepList and StepItem

### 6.1 StepList

**File:** `src/components/onboarding/StepList.tsx`

Props:

- `steps: OnboardingStep[]`
- `nextStepId?: OnboardingStepId`

Behavior:

- Sort steps by `orderIndex`
- Map to `StepItem`

### 6.2 StepItem

Props:

- `step: OnboardingStep`
- `isNext: boolean`
- `onClick: (stepId: OnboardingStepId) => void`

Visual states:

- **Not started:** dim text, hollow circle icon
- **In progress:** accent border, dot in circle
- **Completed:** checkmark, subtle green/blue accent

Tailwind:

- Base: `flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors`.
- Hover: `hover:bg-sar-panel/80`.
- Active/next: `border border-sar-accent/60 bg-sar-panel/80`.

Status pill:

- `text-[11px] px-2 py-0.5 rounded-full bg-sar-chip text-sar-muted`.

Click handler uses `navigateToOnboardingStep(step.stepId)`.

---

## 7. BadgesStrip

**File:** `src/components/onboarding/BadgesStrip.tsx`

Props:

- `badges: OnboardingBadge[]`

Behavior:

- Show at most 3 badges inline (e.g., most recent or highest-priority).
- Each badge as a small pill with icon + label.

Tailwind:

- Container: `mt-auto pt-4 border-t border-sar-border/60 flex flex-wrap gap-2`.
- Badge: `inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sar-chip/70 text-[11px] text-sar-muted`.

---

## 8. RewardOverlay

**File:** `src/components/onboarding/RewardOverlay.tsx`

Props:

- None (uses context + internal diffing)

Behavior:

- Listens for changes between `previousState` and `currentState`:
  - New step `COMPLETED`
  - New badges
- Triggers transient overlays/animations (see animation spec canvas) – confetti, badge modal, toast.

Rendered via portal at the end of `AppShell`, absolutely positioned over content but aligned visually to the Onboarding Rail.

---

## 9. Route Mapping Helper

**File:** `src/utils/onboardingRoutes.ts`

Exports:

```ts
export function getRouteForStep(stepId: OnboardingStepId): string {
  switch (stepId) {
    case 'OWNER_INTAKE':
      return '/onboarding/owner-intake';
    case 'BUSINESS_PROFILE':
      return '/onboarding/business-profile';
    case 'INVITE_TEAM':
      return '/team/invites';
    case 'TEAM_INTAKES':
      return '/team/intakes';
    case 'DISCOVERY_CALL':
      return '/onboarding/discovery-call';
    case 'DIAGNOSTIC_GENERATED':
      return '/diagnostic';
    case 'ROADMAP_REVIEWED':
      return '/roadmap';
    case 'TICKETS_MODERATED':
      return '/roadmap/tickets';
    case 'IMPLEMENTATION_DECISION':
      return '/implementation';
    default:
      return '/dashboard';
  }
}
```

Used by `NextActionCard` and `StepItem` click handlers.

---

## 10. Styling Notes

- Use your existing color tokens for backgrounds and accents to keep the rail visually unified with cards.
- Use subtle borders and glows rather than full-blown gradients everywhere – keep the rail slightly darker than the main content to avoid stealing focus.
- Ensure the rail is `sticky` relative to the viewport: `sticky top-[64px]` (or whatever your navbar height is), so it scrolls independently from content.

This layout is ready to be wired into the existing app shell and hooked to the Onboarding API + event system.

