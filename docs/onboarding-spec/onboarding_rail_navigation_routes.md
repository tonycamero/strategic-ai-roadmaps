# Strategic AI Roadmaps – Onboarding Rail Navigation Routes

This canvas defines **exact routes and deep links** for each onboarding step, so the Onboarding Rail can reliably send users to the right place in the app.

Assumptions:

- You’re using standard React Router / Next.js-style routing (adjust to your stack as needed).
- `tenantId` is resolved from auth/session; we don’t expose it in the URL for onboarding.
- Some routes may already exist (Dashboard, Roadmap, etc.); we’re aligning step navigation to them.

---

## 1. Canonical Mapping: Step → Route

We map each `OnboardingStepId` to a **primary route** and optionally a **secondary hash/anchor** if the step lands in a specific section of a page.

```ts
// onboardingRoutes.ts
export type OnboardingStepId =
  | 'OWNER_INTAKE'
  | 'BUSINESS_PROFILE'
  | 'INVITE_TEAM'
  | 'TEAM_INTAKES'
  | 'DISCOVERY_CALL'
  | 'DIAGNOSTIC_GENERATED'
  | 'ROADMAP_REVIEWED'
  | 'TICKETS_MODERATED'
  | 'IMPLEMENTATION_DECISION';

interface OnboardingRouteConfig {
  path: string;          // base path
  hash?: string;         // optional #anchor
  label: string;         // used in UI if needed
  description?: string;  // tooltip/ARIA
}

export const ONBOARDING_ROUTES: Record<OnboardingStepId, OnboardingRouteConfig> = {
  OWNER_INTAKE: {
    path: '/onboarding/owner',
    label: 'Owner Intake',
    description: '12-question owner intake form'
  },
  BUSINESS_PROFILE: {
    path: '/onboarding/profile',
    label: 'Business Profile',
    description: 'Team size, baseline leads, and firm size settings'
  },
  INVITE_TEAM: {
    path: '/team/invites',
    label: 'Invite Team',
    description: 'Send invites to Ops, Sales, and Delivery leads'
  },
  TEAM_INTAKES: {
    path: '/team/intakes',
    label: 'Team Intakes',
    description: 'Track and manage Ops/Sales/Delivery intakes'
  },
  DISCOVERY_CALL: {
    path: '/onboarding/discovery',
    label: 'Discovery Call',
    description: 'Book or manage your roadmap discovery session'
  },
  DIAGNOSTIC_GENERATED: {
    path: '/diagnostic',
    label: 'Business Diagnostic',
    description: 'Review the diagnostic map based on intakes'
  },
  ROADMAP_REVIEWED: {
    path: '/roadmap',
    label: 'Strategic AI Roadmap',
    description: 'View your roadmap sections and ROI projections'
  },
  TICKETS_MODERATED: {
    path: '/roadmap/tickets',
    label: 'Roadmap Tickets',
    description: 'Approve, defer, or discard roadmap initiatives'
  },
  IMPLEMENTATION_DECISION: {
    path: '/implementation',
    label: 'Implementation Path',
    description: 'Choose how you want to implement your roadmap'
  }
};

export function getRouteForStep(stepId: OnboardingStepId): string {
  const cfg = ONBOARDING_ROUTES[stepId];
  if (!cfg) return '/dashboard';
  return cfg.hash ? `${cfg.path}#${cfg.hash}` : cfg.path;
}
```

---

## 2. Route Details by Step

### 2.1 `OWNER_INTAKE` → `/onboarding/owner`

**Purpose:**

- Dedicated page for the 12-question owner intake.

**UX:**

- Full-width form, progress at top (e.g., 1/12, 2/12).
- Save/submit button at bottom.

If you prefer embedding this inside the existing dashboard instead of a separate page, you can:

- Keep route `/dashboard#owner-intake`
- Scroll to the Owner Intake card on mount.

But for clarity and depth, a dedicated `/onboarding/owner` route is recommended.

---

### 2.2 `BUSINESS_PROFILE` → `/onboarding/profile`

**Purpose:**

- Capture tenant metadata:
  - `teamHeadcount`
  - `baselineMonthlyLeads`
  - `firmSizeTier`
  - `region`

**UX Options:**

1. Standalone onboarding page with a compact form.
2. Or a section on the dashboard (like your existing ROI Insights card) with deep link: `/dashboard#business-profile`.

Recommended: use `/onboarding/profile` so onboarding feels like a guided flow.

---

### 2.3 `INVITE_TEAM` → `/team/invites`

**Purpose:**

- Manage invites for Ops, Sales, Delivery leads.

**Page contents:**

- Table or cards for each role:
  - Role name (Ops / Sales / Delivery)
  - Email input + send button
  - Status: Not invited / Invited / Accepted

**Ties to Leadership Team Status card:**

- The existing "Leadership Team Status" dashboard card can link here via `Manage Invites → /team/invites`.

---

### 2.4 `TEAM_INTAKES` → `/team/intakes`

**Purpose:**

- Show completion status of each role’s intake.

**Page contents:**

- For each role:
  - Name of lead (if known)
  - Intake status: Not started, In progress, Completed
  - Last updated timestamp
  - "View responses" or "Resend link" actions

This page is more owner-facing; the team members themselves will access their intake via unique invite links.

---

### 2.5 `DISCOVERY_CALL` → `/onboarding/discovery`

**Purpose:**

- Book/manage the 45-min discovery call (cohort-only or optional).

**Variants:**

- If using Calendly or similar:
  - Embed calendar widget
  - Show "Call scheduled" summary when done

If a discovery call is **not** part of some tenants’ flow, this route can show:

- "Your cohort operates asynchronously – we’ll review your inputs and send your roadmap when it’s ready."

The Onboarding Rail should still navigate here, but the page content adapts based on cohort configuration.

---

### 2.6 `DIAGNOSTIC_GENERATED` → `/diagnostic`

**Purpose:**

- Owner views the Diagnostic Map created from intake data.

**Page contents:**

- Cards or sections for:
  - Pain clusters
  - Workflow bottlenecks
  - Systems fragmentation
  - AI opportunity zones
  - Readiness score

**Onboarding tie-in:**

- Even if the diagnostic has been auto-generated in the background, this page is where the owner *understands* it.

---

### 2.7 `ROADMAP_REVIEWED` → `/roadmap`

**Purpose:**

- View the full Strategic AI Roadmap.

**Page contents:**

- Tabs or sections:
  - Executive summary
  - Diagnostic summary
  - Architecture / systems
  - Implementation phases
  - ROI estimates

On the backend, viewing this page triggers:

- `markStep('ROADMAP_REVIEWED', 'COMPLETED')` when a valid roadmap exists.

---

### 2.8 `TICKETS_MODERATED` → `/roadmap/tickets`

**Purpose:**

- Owner reviews, approves, defers, or discards roadmap initiatives.

**Page contents:**

- Kanban or table of tickets grouped by status:
  - Recommended
  - Approved
  - Deferred
  - Discarded

Onboarding logic (backend):

- When X% of tickets have a decision (approve/defer/discard), mark the step as completed.

---

### 2.9 `IMPLEMENTATION_DECISION` → `/implementation`

**Purpose:**

- Owner chooses how to move forward with their roadmap.

**Page contents:**

- Three primary options:
  - **Do It Internally** – use roadmap with existing team/partners.
  - **Hybrid Support** – we handle critical pieces, they handle the rest.
  - **Done-For-You** – fully managed implementation.

**Interaction:**

- Selecting an option saves the decision + optionally triggers downstream flows (proposal, call, etc.).
- On save, backend calls `markStep('IMPLEMENTATION_DECISION', 'COMPLETED')`.

---

## 3. Navigation Helper Usage in Components

### 3.1 Using `getRouteForStep` in the Rail

**In **``**:**

```tsx
const { state } = useOnboarding();
const navigate = useNavigate(); // or Next.js router

if (!state?.nextStepId) return null;

const handleClick = () => {
  const href = getRouteForStep(state.nextStepId!);
  navigate(href);
};
```

**In **``**:**

```tsx
const handleClick = () => {
  const href = getRouteForStep(step.stepId);
  navigate(href);
};
```

---

## 4. Deep Link Integration with Existing Dashboard Cards

To keep the experience coherent, you can also link FROM dashboard cards into the same routes:

- **Roadmap Status card**

  - "Complete workflow steps" → `/onboarding/owner` OR first incomplete step
  - When roadmap is ready: "View Roadmap" → `/roadmap`

- **Leadership Team Status card**

  - "Manage Invites →" → `/team/invites`

- **ROI Insights card**

  - "Enter Numbers" → `/onboarding/profile` (or dedicated ROI route)

This ensures:

- Onboarding Rail and dashboard cards share the same navigation model.
- There’s no confusion between “card flows” and “onboarding flows.”

---

## 5. Future Enhancements

Later, you can:

- Add query params to preserve context, e.g.:
  - `/roadmap?t=onboarding` → pre-expand guidance banners
- Support `redirectTo` param for post-login deep links:
  - `/login?redirect=/onboarding/owner`
- Track page-level onboarding analytics by step (time spent, drop-off).

For now, the above route map is enough for Warp + frontend to wire a clean, predictable onboarding navigation experience.

