# Strategic AI Roadmaps – Onboarding Event Hooks Wiring

This canvas shows **how to wire the onboarding progress system into the existing backend flow**, using event hooks from:

- Owner Intake
- Tenant/Business Profile updates
- Team Intakes
- Discovery Call
- Diagnostic generation
- Roadmap view
- Ticket moderation
- Implementation decision

Assumptions (align with your current stack):
- Node/TypeScript backend (Express or Nest-ish)
- Existing routes/services for intakes, diagnostics, roadmaps, tickets
- `tenantId` is available on all relevant requests (auth context or route param)

Use this as a blueprint to drop into your actual repo and adapt file paths/naming.

---
## 1. Central Onboarding Service

Create a dedicated service that owns onboarding updates and encapsulates all logic.

**File:** `backend/src/services/onboardingProgress.service.ts`

```ts
// onboardingProgress.service.ts
import { db } from '../db';
import type {
  OnboardingState,
  OnboardingStepId,
  OnboardingStepStatus,
  OnboardingBadge
} from '../types/onboarding';

export class OnboardingProgressService {
  async getState(tenantId: string): Promise<OnboardingState> {
    const row = await db.query.onboardingStates.findFirst({
      where: (tbl, { eq }) => eq(tbl.tenantId, tenantId)
    });

    if (!row) {
      return this.createInitialState(tenantId);
    }

    return row.state as OnboardingState; // assuming JSONB column `state`
  }

  private async saveState(tenantId: string, state: OnboardingState) {
    await db
      .insert(db.schema.onboardingStates)
      .values({ tenantId, state })
      .onConflictDoUpdate({
        target: db.schema.onboardingStates.tenantId,
        set: { state }
      });
  }

  private createInitialState(tenantId: string): OnboardingState {
    const steps: OnboardingState['steps'] = [
      {
        stepId: 'OWNER_INTAKE',
        label: 'Owner Intake',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 15,
        orderIndex: 1,
        isRequired: true,
        estimatedMinutes: 15
      },
      {
        stepId: 'BUSINESS_PROFILE',
        label: 'Business Profile',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 25,
        orderIndex: 2,
        isRequired: true,
        estimatedMinutes: 5
      },
      {
        stepId: 'INVITE_TEAM',
        label: 'Invite Team',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 5,
        orderIndex: 3,
        isRequired: false,
        estimatedMinutes: 3
      },
      {
        stepId: 'TEAM_INTAKES',
        label: 'Team Intakes',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 15,
        orderIndex: 4,
        isRequired: false,
        estimatedMinutes: 10
      },
      {
        stepId: 'DISCOVERY_CALL',
        label: 'Discovery Call',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 10,
        orderIndex: 5,
        isRequired: false,
        estimatedMinutes: 1
      },
      {
        stepId: 'DIAGNOSTIC_GENERATED',
        label: 'Diagnostic Generated',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 15,
        orderIndex: 6,
        isRequired: true,
        estimatedMinutes: 0
      },
      {
        stepId: 'ROADMAP_REVIEWED',
        label: 'Roadmap Reviewed',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 10,
        orderIndex: 7,
        isRequired: false,
        estimatedMinutes: 5
      },
      {
        stepId: 'TICKETS_MODERATED',
        label: 'Tickets Moderated',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 10,
        orderIndex: 8,
        isRequired: false,
        estimatedMinutes: 10
      },
      {
        stepId: 'IMPLEMENTATION_DECISION',
        label: 'Implementation Decision',
        status: 'NOT_STARTED',
        pointsEarned: 0,
        pointsPossible: 10,
        orderIndex: 9,
        isRequired: false,
        estimatedMinutes: 3
      }
    ];

    return this.recalculateState({
      tenantId,
      steps,
      badges: [],
      percentComplete: 0,
      totalPoints: 0,
      maxPoints: steps.reduce((sum, s) => sum + s.pointsPossible, 0)
    });
  }

  async markStep(
    tenantId: string,
    stepId: OnboardingStepId,
    status: OnboardingStepStatus
  ): Promise<OnboardingState> {
    const current = await this.getState(tenantId);
    const now = new Date().toISOString();

    const steps = current.steps.map(step => {
      if (step.stepId !== stepId) return step;

      const updated = { ...step, status };

      if (status === 'COMPLETED') {
        updated.pointsEarned = updated.pointsPossible;
        if (!updated.completedAt) {
          updated.completedAt = now;
        }
      }

      if (status === 'NOT_STARTED') {
        updated.pointsEarned = 0;
        delete updated.completedAt;
      }

      return updated;
    });

    let nextState = this.recalculateState({
      ...current,
      steps
    });

    nextState = this.applyBadges(nextState);
    nextState = this.setNextStep(nextState);

    await this.saveState(tenantId, nextState);
    return nextState;
  }

  private recalculateState(state: OnboardingState): OnboardingState {
    const totalPoints = state.steps.reduce(
      (sum, step) => sum + (step.pointsEarned || 0),
      0
    );
    const maxPoints = state.maxPoints;

    const percentComplete = maxPoints === 0
      ? 0
      : Math.round((totalPoints / maxPoints) * 100);

    return {
      ...state,
      totalPoints,
      percentComplete
    };
  }

  private applyBadges(state: OnboardingState): OnboardingState {
    const now = new Date().toISOString();
    const badges: OnboardingBadge[] = [...state.badges];

    const hasBadge = (id: OnboardingBadgeId) =>
      badges.some(b => b.badgeId === id);

    const step = (id: OnboardingStepId) =>
      state.steps.find(s => s.stepId === id);

    // FOUNDATION_BUILDER
    if (
      step('OWNER_INTAKE')?.status === 'COMPLETED' &&
      step('BUSINESS_PROFILE')?.status === 'COMPLETED' &&
      !hasBadge('FOUNDATION_BUILDER')
    ) {
      badges.push({
        badgeId: 'FOUNDATION_BUILDER',
        label: 'Foundation Builder',
        description: 'Completed Owner Intake and Business Profile.',
        awardedAt: now
      });
    }

    // FULL_TEAM_ACTIVATED
    if (
      step('TEAM_INTAKES')?.status === 'COMPLETED' &&
      !hasBadge('FULL_TEAM_ACTIVATED')
    ) {
      badges.push({
        badgeId: 'FULL_TEAM_ACTIVATED',
        label: 'Full Team Activated',
        description: 'All three team roles completed their intakes.',
        awardedAt: now
      });
    }

    // DIAGNOSTIC_READY
    if (
      step('DIAGNOSTIC_GENERATED')?.status === 'COMPLETED' &&
      !hasBadge('DIAGNOSTIC_READY')
    ) {
      badges.push({
        badgeId: 'DIAGNOSTIC_READY',
        label: 'Diagnostic Ready',
        description: 'Your diagnostic is fully generated.',
        awardedAt: now
      });
    }

    // ROADMAP_OWNER
    if (
      step('ROADMAP_REVIEWED')?.status === 'COMPLETED' &&
      !hasBadge('ROADMAP_OWNER')
    ) {
      badges.push({
        badgeId: 'ROADMAP_OWNER',
        label: 'Roadmap Owner',
        description: 'You have reviewed your Strategic AI Roadmap.',
        awardedAt: now
      });
    }

    // IMPLEMENTATION_READY
    if (
      step('TICKETS_MODERATED')?.status === 'COMPLETED' &&
      !hasBadge('IMPLEMENTATION_READY')
    ) {
      badges.push({
        badgeId: 'IMPLEMENTATION_READY',
        label: 'Implementation Ready',
        description: 'Your initiatives are approved and prioritized.',
        awardedAt: now
      });
    }

    // PILOT_CANDIDATE
    if (
      step('IMPLEMENTATION_DECISION')?.status === 'COMPLETED' &&
      !hasBadge('PILOT_CANDIDATE')
    ) {
      badges.push({
        badgeId: 'PILOT_CANDIDATE',
        label: 'Pilot Candidate',
        description: 'You are ready to move from planning to execution.',
        awardedAt: now
      });
    }

    return {
      ...state,
      badges
    };
  }

  private setNextStep(state: OnboardingState): OnboardingState {
    // Strategy: prioritize required steps first, then optional, by orderIndex
    const remainingRequired = state.steps
      .filter(s => s.isRequired && s.status !== 'COMPLETED')
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const remainingOptional = state.steps
      .filter(s => !s.isRequired && s.status !== 'COMPLETED')
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const next = remainingRequired[0] || remainingOptional[0];

    if (!next) {
      return {
        ...state,
        nextStepId: undefined,
        nextStepLabel: undefined,
        nextStepEstimatedMinutes: undefined
      };
    }

    return {
      ...state,
      nextStepId: next.stepId,
      nextStepLabel: next.label,
      nextStepEstimatedMinutes: next.estimatedMinutes
    };
  }
}

export const onboardingProgressService = new OnboardingProgressService();
```

---
## 2. Event Hooks by Feature Area

Below are **concrete hook points** you can wire into existing controllers/services.

### 2.1 Owner Intake Submission

**Existing route (example):**
- `POST /api/intakes/owner`

**File (example):** `backend/src/routes/intakes/ownerIntake.route.ts`

After successfully saving Owner Intake data, call:

```ts
import { onboardingProgressService } from '../../services/onboardingProgress.service';

router.post('/intakes/owner', async (req, res) => {
  const tenantId = req.context.tenantId; // however you resolve this
  const payload = req.body;

  // 1) Save the intake as you already do
  await ownerIntakeService.saveOwnerIntake({ tenantId, payload });

  // 2) Mark onboarding step as completed
  await onboardingProgressService.markStep(
    tenantId,
    'OWNER_INTAKE',
    'COMPLETED'
  );

  res.status(201).json({ ok: true });
});
```

### 2.2 Business Profile / Tenant Metadata

**Existing route (example):**
- `PATCH /api/tenants/:tenantId/profile`

After updating tenant with required fields, verify they’re present and then mark step complete.

```ts
router.patch('/tenants/:tenantId/profile', async (req, res) => {
  const tenantId = req.params.tenantId;
  const updates = req.body;

  // 1) Update tenant
  const tenant = await tenantsService.updateTenant(tenantId, updates);

  // 2) Check if required fields are now present
  const hasRequired =
    tenant.teamHeadcount &&
    tenant.baselineMonthlyLeads &&
    tenant.firmSizeTier &&
    tenant.region;

  if (hasRequired) {
    await onboardingProgressService.markStep(
      tenantId,
      'BUSINESS_PROFILE',
      'COMPLETED'
    );
  }

  res.json({ ok: true, tenant });
});
```

### 2.3 Team Invites Sent

**Existing route (example):**
- `POST /api/tenants/:tenantId/team-invites`

Hook once **at least one** invite is sent. If you want a higher bar, adjust the condition.

```ts
router.post('/tenants/:tenantId/team-invites', async (req, res) => {
  const tenantId = req.params.tenantId;
  const { invites } = req.body; // [{ email, role }, ...]

  await inviteService.sendInvites(tenantId, invites);

  if (invites && invites.length > 0) {
    await onboardingProgressService.markStep(
      tenantId,
      'INVITE_TEAM',
      'COMPLETED'
    );
  }

  res.json({ ok: true });
});
```

### 2.4 Team Intakes Completed

Each team intake likely has its own route, e.g.:
- `POST /api/intakes/ops`
- `POST /api/intakes/sales`
- `POST /api/intakes/delivery`

You want to:
1. Save that intake as usual.
2. Check if **all three** roles now have completed intakes.
3. If yes, mark `TEAM_INTAKES` as `COMPLETED`.

```ts
async function checkTeamIntakesCompletion(tenantId: string) {
  const [ops, sales, delivery] = await Promise.all([
    teamIntakeService.hasCompletedIntake(tenantId, 'ops'),
    teamIntakeService.hasCompletedIntake(tenantId, 'sales'),
    teamIntakeService.hasCompletedIntake(tenantId, 'delivery')
  ]);

  if (ops && sales && delivery) {
    await onboardingProgressService.markStep(
      tenantId,
      'TEAM_INTAKES',
      'COMPLETED'
    );
  }
}

// Example: Ops intake
router.post('/intakes/ops', async (req, res) => {
  const tenantId = req.context.tenantId;
  const payload = req.body;

  await teamIntakeService.saveOpsIntake({ tenantId, payload });
  await checkTeamIntakesCompletion(tenantId);

  res.status(201).json({ ok: true });
});
```

### 2.5 Discovery Call Scheduled

If you’re using a scheduler integration, you probably receive a webhook or store a `discoveryCallAt` field on the tenant.

Hook either in:
- Scheduler webhook handler, or
- Tenant update when `discoveryCallAt` is set.

```ts
router.post('/webhooks/scheduler', async (req, res) => {
  const { tenantId, eventType } = req.body;

  if (eventType === 'DISCOVERY_CALL_BOOKED') {
    await onboardingProgressService.markStep(
      tenantId,
      'DISCOVERY_CALL',
      'COMPLETED'
    );
  }

  res.json({ ok: true });
});
```

### 2.6 Diagnostic Generated

This should fire when your SOP-01 pipeline finishes generating the Diagnostic Map JSON for the tenant.

Wherever you call the diagnostic generator:

```ts
async function generateDiagnosticForTenant(tenantId: string) {
  const inputs = await intakeService.getNormalizedInputs(tenantId);
  const diagnostic = await diagnosticService.buildDiagnostic(inputs);

  await diagnosticService.saveDiagnostic(tenantId, diagnostic);

  // Onboarding hook
  await onboardingProgressService.markStep(
    tenantId,
    'DIAGNOSTIC_GENERATED',
    'COMPLETED'
  );
}
```

### 2.7 Roadmap Reviewed

This is a **view event**, so it’s usually triggered in the Roadmap controller.

**Route (example):**
- `GET /api/tenants/:tenantId/roadmap`

Keep it simple: mark as completed the first time they successfully fetch the roadmap. If you want stricter rules (scroll depth, time on page), you can move this to a **frontend event** that calls a dedicated endpoint.

```ts
router.get('/tenants/:tenantId/roadmap', async (req, res) => {
  const tenantId = req.params.tenantId;

  const roadmap = await roadmapService.getRoadmapForTenant(tenantId);

  if (roadmap) {
    await onboardingProgressService.markStep(
      tenantId,
      'ROADMAP_REVIEWED',
      'COMPLETED'
    );
  }

  res.json({ roadmap });
});
```

### 2.8 Tickets Moderated

When the owner approves/defers/discards tickets, you can:

- Track moderation events per ticket, and
- Once X% of tickets in the roadmap have a decision, mark step complete.

```ts
async function checkTicketsModerated(tenantId: string) {
  const stats = await ticketsService.getModerationStats(tenantId);
  const percentModerated = stats.total === 0
    ? 0
    : (stats.moderated / stats.total) * 100;

  if (percentModerated >= 70) { // threshold configurable
    await onboardingProgressService.markStep(
      tenantId,
      'TICKETS_MODERATED',
      'COMPLETED'
    );
  }
}

router.post('/tenants/:tenantId/tickets/:ticketId/moderate', async (req, res) => {
  const tenantId = req.params.tenantId;
  const ticketId = req.params.ticketId;
  const { action } = req.body; // APPROVE | DEFER | DISCARD | COMMENT

  await ticketsService.moderateTicket({ tenantId, ticketId, action });
  await checkTicketsModerated(tenantId);

  res.json({ ok: true });
});
```

### 2.9 Implementation Decision

Once the owner chooses how they want to implement (self-implement, hybrid, done-for-you), trigger the final step.

**Route (example):**
- `POST /api/tenants/:tenantId/implementation-decision`

```ts
router.post('/tenants/:tenantId/implementation-decision', async (req, res) => {
  const tenantId = req.params.tenantId;
  const { mode } = req.body; // INTERNAL | HYBRID | DONE_FOR_YOU

  await implementationService.saveDecision({ tenantId, mode });

  await onboardingProgressService.markStep(
    tenantId,
    'IMPLEMENTATION_DECISION',
    'COMPLETED'
  );

  res.json({ ok: true });
});
```

---
## 3. Fetching State for the Dashboard

In your dashboard controller, you’ll want a dedicated endpoint that returns the full onboarding snapshot used by the React UI.

**Route:**
- `GET /api/tenants/:tenantId/onboarding`

```ts
router.get('/tenants/:tenantId/onboarding', async (req, res) => {
  const tenantId = req.params.tenantId;
  const state = await onboardingProgressService.getState(tenantId);

  res.json({ state });
});
```

Your React app can then call this endpoint to render:
- Progress banner
- Checklist
- Next action card
- Badges

---
## 4. Safety & Idempotency

- All `markStep` calls are **idempotent** – calling `COMPLETED` twice just recomputes state, no harm.
- You can safely call these hooks from multiple places (e.g., saving tenant profile from different UIs).
- To prevent regressions, only allow transitions **forward** (e.g., NOT_STARTED → IN_PROGRESS → COMPLETED). If needed, gate `NOT_STARTED` and `SKIPPED` to admin tools only.

Add a simple guard in `markStep` if you want strictly monotonic progression:

```ts
const canPromote = (current: OnboardingStepStatus, next: OnboardingStepStatus) => {
  const order = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
  return order.indexOf(next) >= order.indexOf(current);
};
```

Then apply it before updating status.

---
## 5. Next Moves

- Tie this into your **existing Drizzle schema** (`onboarding_states` JSONB or similar).
- Wire real `tenantId` resolution (from auth/session).
- Add logging for each step transition for debugging and analytics.
- Optionally emit events for analytics (Segment, PostHog, etc.).

Once these hooks are live, the onboarding progress bar and gamified flow will stay perfectly in sync with **real actions** owners take in the app.

