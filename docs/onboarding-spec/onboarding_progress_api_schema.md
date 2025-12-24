# Strategic AI Roadmaps – Onboarding Progress API Schema

This schema is designed to support the **owner onboarding flow** and **gamified progress system** we defined. It tracks:

- Per-tenant onboarding state
- Step completion & metadata
- Points, badges, and percent progress
- Next action & UX hints for the dashboard

You can adapt this to REST or GraphQL – the shapes below are JSON-centric.

---
## 1. Core Concepts

### 1.1 Steps (Canonical List)

We’ll track onboarding using a fixed, ordered set of steps:

1. `OWNER_INTAKE`
2. `BUSINESS_PROFILE`
3. `INVITE_TEAM`
4. `TEAM_INTAKES`
5. `DISCOVERY_CALL`
6. `DIAGNOSTIC_GENERATED`
7. `ROADMAP_REVIEWED`
8. `TICKETS_MODERATED`
9. `IMPLEMENTATION_DECISION`

Each step has:
- A unique `stepId`
- A display label (for UI)
- A status (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`)
- Point value
- Optional time estimate

### 1.2 Step Status Enum

```ts
export type OnboardingStepStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED';
```

### 1.3 Badge Enum

```ts
export type OnboardingBadgeId =
  | 'FOUNDATION_BUILDER'
  | 'TEAM_ASSEMBLER'
  | 'FULL_TEAM_ACTIVATED'
  | 'DIAGNOSTIC_READY'
  | 'ROADMAP_OWNER'
  | 'IMPLEMENTATION_READY'
  | 'PILOT_CANDIDATE';
```

---
## 2. Data Model (Backend)

You can either:
- Store onboarding state in its own table, or
- Attach it to the `tenants` table as a JSON column.

### 2.1 Suggested Table: `onboarding_states`

```sql
CREATE TABLE onboarding_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Overall progress snapshot
  percent_complete INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  max_points INT NOT NULL DEFAULT 120,

  -- JSON arrays for flexibility/forward-compat
  steps JSONB NOT NULL DEFAULT '[]',   -- OnboardingStep[]
  badges JSONB NOT NULL DEFAULT '[]',  -- OnboardingBadge[]

  -- System audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_states_tenant_id
  ON onboarding_states(tenant_id);
```

### 2.2 TypeScript Interfaces

```ts
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

export interface OnboardingStep {
  stepId: OnboardingStepId;
  label: string;              // e.g. "Owner Intake"
  status: OnboardingStepStatus;
  pointsEarned: number;       // 0..pointsPossible
  pointsPossible: number;     // e.g. 15
  orderIndex: number;         // 1..9
  isRequired: boolean;        // roadmap unlock logic
  estimatedMinutes?: number;  // for UX time estimates
  completedAt?: string;       // ISO timestamp
}

export interface OnboardingBadge {
  badgeId: OnboardingBadgeId;
  label: string;              // e.g. "Foundation Builder"
  description: string;
  awardedAt: string;          // ISO timestamp
}

export interface OnboardingState {
  tenantId: string;
  percentComplete: number;    // 0..100
  totalPoints: number;        // sum of pointsEarned
  maxPoints: number;          // constant (e.g. 120)
  steps: OnboardingStep[];
  badges: OnboardingBadge[];

  // UX helpers
  nextStepId?: OnboardingStepId;
  nextStepLabel?: string;
  nextStepEstimatedMinutes?: number;
}
```

---
## 3. REST API Endpoints

These can all live under `/api/tenants/:tenantId/onboarding`.

### 3.1 GET – Fetch Onboarding State

**Endpoint**  
`GET /api/tenants/:tenantId/onboarding`

**Purpose**  
Return a full snapshot used to render:
- Progress banner
- Checklist card
- Next-step CTA
- Badges

**Response (200 OK)**

```json
{
  "tenantId": "c7e1e404-7a3b-4dce-9d61-4c5b1e533abc",
  "percentComplete": 42,
  "totalPoints": 50,
  "maxPoints": 120,
  "steps": [
    {
      "stepId": "OWNER_INTAKE",
      "label": "Owner Intake",
      "status": "COMPLETED",
      "pointsEarned": 15,
      "pointsPossible": 15,
      "orderIndex": 1,
      "isRequired": true,
      "estimatedMinutes": 15,
      "completedAt": "2025-12-03T18:21:34.000Z"
    },
    {
      "stepId": "BUSINESS_PROFILE",
      "label": "Business Profile",
      "status": "IN_PROGRESS",
      "pointsEarned": 5,
      "pointsPossible": 25,
      "orderIndex": 2,
      "isRequired": true,
      "estimatedMinutes": 5
    }
    // ...remaining steps
  ],
  "badges": [
    {
      "badgeId": "FOUNDATION_BUILDER",
      "label": "Foundation Builder",
      "description": "Completed Owner Intake and Business Profile.",
      "awardedAt": "2025-12-03T18:22:01.000Z"
    }
  ],
  "nextStepId": "BUSINESS_PROFILE",
  "nextStepLabel": "Add your Business Profile",
  "nextStepEstimatedMinutes": 5
}
```

### 3.2 PATCH – Update Step Status

**Endpoint**  
`PATCH /api/tenants/:tenantId/onboarding/steps/:stepId`

**Purpose**  
Update a single step when a key event occurs (e.g., Owner Intake submitted, Roadmap viewed). The server handles:
- Status transitions
- Point calculation
- Recomputing `percentComplete`
- Badge awarding

**Request Body**

Minimal shape – the backend is the source of truth for points and ordering.

```json
{
  "status": "COMPLETED"
}
```

> Optionally you can allow `IN_PROGRESS` and `SKIPPED` here as well.

**Response (200 OK)**

Returns the **updated** `OnboardingState` so the UI can refresh in one shot.

```json
{
  "tenantId": "c7e1e404-7a3b-4dce-9d61-4c5b1e533abc",
  "percentComplete": 55,
  "totalPoints": 65,
  "maxPoints": 120,
  "steps": [
    // updated steps array
  ],
  "badges": [
    // updated badges array
  ],
  "nextStepId": "INVITE_TEAM",
  "nextStepLabel": "Invite your Ops, Sales, and Delivery leads",
  "nextStepEstimatedMinutes": 3
}
```

### 3.3 POST – Recalculate Onboarding State (Admin/System)

**Endpoint**  
`POST /api/tenants/:tenantId/onboarding/recalculate`

**Purpose**  
For internal use when:
- You change step weights/logic
- You add or remove steps
- You want to regenerate onboarding state from system facts

**Request Body**  
Empty or:

```json
{
  "force": true
}
```

**Response (200 OK)**  
Same as `GET` – updated `OnboardingState`.

---
## 4. Backend Logic: Deriving Step Status from System Events

To keep owners from "cheating" steps, step status should be derived from **real events**, not arbitrary clicks.

Examples:

- `OWNER_INTAKE` → `COMPLETED` when Owner Intake form is submitted.
- `BUSINESS_PROFILE` → `COMPLETED` when required tenant fields are filled: `teamHeadcount`, `baselineMonthlyLeads`, `firmSizeTier`, `region`.
- `INVITE_TEAM` → `COMPLETED` when at least one invite email is sent for any of: Ops, Sales, Delivery.
- `TEAM_INTAKES` → `COMPLETED` when all three role-specific intakes have status `COMPLETED`.
- `DISCOVERY_CALL` → `COMPLETED` when a discovery event is scheduled (or marked done) in your system.
- `DIAGNOSTIC_GENERATED` → `COMPLETED` when the Diagnostic Map JSON exists for this tenant.
- `ROADMAP_REVIEWED` → `COMPLETED` when the owner views the Roadmap page and stays long enough/scrolls to bottom.
- `TICKETS_MODERATED` → `COMPLETED` when moderation actions are taken on at least X% of tickets.
- `IMPLEMENTATION_DECISION` → `COMPLETED` when they choose an implementation path or request a pilot.

These events should trigger calls to the `PATCH /steps/:stepId` endpoint or a direct service function that updates onboarding state.

---
## 5. Badge Award Logic (Pseudocode)

You can centralize this in a small service:

```ts
function evaluateBadges(state: OnboardingState): OnboardingBadge[] {
  const now = new Date().toISOString();
  const badges: OnboardingBadge[] = [];

  const step = (id: OnboardingStepId) =>
    state.steps.find(s => s.stepId === id);

  // FOUNDATION_BUILDER – Owner Intake + Business Profile completed
  if (
    step('OWNER_INTAKE')?.status === 'COMPLETED' &&
    step('BUSINESS_PROFILE')?.status === 'COMPLETED'
  ) {
    badges.push({
      badgeId: 'FOUNDATION_BUILDER',
      label: 'Foundation Builder',
      description: 'Completed Owner Intake and Business Profile.',
      awardedAt: now
    });
  }

  // TEAM_ASSEMBLER – Invited at least 2 team members
  // (You’ll need underlying invite counts from another table)

  // FULL_TEAM_ACTIVATED – All team intakes completed
  if (step('TEAM_INTAKES')?.status === 'COMPLETED') {
    badges.push({
      badgeId: 'FULL_TEAM_ACTIVATED',
      label: 'Full Team Activated',
      description: 'All three team roles completed their intakes.',
      awardedAt: now
    });
  }

  // DIAGNOSTIC_READY
  if (step('DIAGNOSTIC_GENERATED')?.status === 'COMPLETED') {
    badges.push({
      badgeId: 'DIAGNOSTIC_READY',
      label: 'Diagnostic Ready',
      description: 'Your diagnostic is fully generated.',
      awardedAt: now
    });
  }

  // ROADMAP_OWNER
  if (step('ROADMAP_REVIEWED')?.status === 'COMPLETED') {
    badges.push({
      badgeId: 'ROADMAP_OWNER',
      label: 'Roadmap Owner',
      description: 'You have reviewed your Strategic AI Roadmap.',
      awardedAt: now
    });
  }

  // IMPLEMENTATION_READY
  if (step('TICKETS_MODERATED')?.status === 'COMPLETED') {
    badges.push({
      badgeId: 'IMPLEMENTATION_READY',
      label: 'Implementation Ready',
      description: 'Your initiatives are approved and prioritized.',
      awardedAt: now
    });
  }

  // PILOT_CANDIDATE
  if (step('IMPLEMENTATION_DECISION')?.status === 'COMPLETED') {
    badges.push({
      badgeId: 'PILOT_CANDIDATE',
      label: 'Pilot Candidate',
      description: 'You are ready to move from planning to execution.',
      awardedAt: now
    });
  }

  return badges;
}
```

Your update flow on step change:

1. Load current `OnboardingState`.
2. Update the specific step.
3. Recalculate `totalPoints` and `percentComplete`.
4. Merge in any **new** badges from `evaluateBadges()`.
5. Compute `nextStepId` based on the next required or recommended step.
6. Persist and return updated state.

---
## 6. Next: Frontend Integration

For the React layer, you can assume the `GET` response maps directly into:
- `<ProgressBanner state={onboardingState} />`
- `<OnboardingChecklist steps={onboardingState.steps} />`
- `<NextActionCard state={onboardingState} />`

Those components only need:
- `percentComplete`
- `steps[]` with `status`
- `nextStepLabel` + `nextStepEstimatedMinutes`
- `badges[]` for optional profile/badges UI.

This schema keeps the **business logic server-side** while giving the frontend a simple, predictable contract.

