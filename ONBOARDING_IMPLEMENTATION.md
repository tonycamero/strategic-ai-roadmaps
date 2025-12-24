# Strategic AI Roadmaps - Gamified Onboarding Implementation

## Overview

This document details the complete backend implementation of the gamified onboarding progress tracking system. The system tracks owner onboarding through 9 key steps, awards badges, and provides real-time progress updates to the frontend.

## Implementation Status: ✅ CORE COMPLETE

**Completed Components:**
- ✅ Type definitions (`backend/src/types/onboarding.ts`)
- ✅ Database schema (`backend/src/db/schema.ts` - `onboarding_states` table)
- ✅ OnboardingProgressService (`backend/src/services/onboardingProgress.service.ts`)
- ✅ Onboarding controller (`backend/src/controllers/onboarding.controller.ts`)
- ✅ Onboarding routes (`backend/src/routes/onboarding.routes.ts`)
- ✅ Owner Intake hook
- ✅ Team Invites hook
- ✅ Team Intakes completion hook
- ✅ Diagnostic Generated hook
- ✅ Roadmap Reviewed hook

**Remaining Implementation (Future Phases):**
- ⏳ Business Profile completion hook
- ⏳ Discovery Call scheduled hook
- ⏳ Tickets Moderated hook
- ⏳ Implementation Decision hook
- ⏳ Database migration

---

## Architecture

### State Machine Flow

```
NOT_STARTED → IN_PROGRESS → COMPLETED
                     ↓
                  SKIPPED
```

### 9 Onboarding Steps

| Step ID | Label | Required | Points | Est. Minutes |
|---------|-------|----------|--------|--------------|
| OWNER_INTAKE | Owner Intake | ✅ Yes | 15 | 15 |
| BUSINESS_PROFILE | Business Profile | ✅ Yes | 25 | 5 |
| INVITE_TEAM | Invite Team | ❌ No | 5 | 3 |
| TEAM_INTAKES | Team Intakes | ❌ No | 15 | 10 |
| DISCOVERY_CALL | Discovery Call | ❌ No | 10 | 1 |
| DIAGNOSTIC_GENERATED | Diagnostic Generated | ✅ Yes | 15 | 0 |
| ROADMAP_REVIEWED | Roadmap Reviewed | ❌ No | 10 | 5 |
| TICKETS_MODERATED | Tickets Moderated | ❌ No | 10 | 10 |
| IMPLEMENTATION_DECISION | Implementation Decision | ❌ No | 10 | 3 |

**Total possible points:** 120

### Badge System

| Badge ID | Label | Award Criteria |
|----------|-------|----------------|
| FOUNDATION_BUILDER | Foundation Builder | Complete Owner Intake + Business Profile |
| TEAM_ASSEMBLER | Team Assembler | Send at least 1 team invite |
| FULL_TEAM_ACTIVATED | Full Team Activated | All 3 team intakes complete (ops, sales, delivery) |
| DIAGNOSTIC_READY | Diagnostic Ready | Diagnostic generated |
| ROADMAP_OWNER | Roadmap Owner | Roadmap viewed |
| IMPLEMENTATION_READY | Implementation Ready | Tickets moderated |
| PILOT_CANDIDATE | Pilot Candidate | Implementation decision made |

---

## API Endpoints

### GET /api/tenants/:tenantId/onboarding

**Description:** Fetch current onboarding state for a tenant

**Auth:** Required (owner or superadmin)

**Response:**
```json
{
  "tenantId": "uuid",
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
    }
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

### PATCH /api/tenants/:tenantId/onboarding/steps/:stepId

**Description:** Update a specific step status (manual testing/admin)

**Auth:** Required (owner or superadmin)

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

**Response:** Updated `OnboardingState` (same schema as GET)

---

## Event Hooks Implementation

### ✅ Hook 1: Owner Intake Completion

**Location:** `backend/src/controllers/intake.controller.ts` (line 52-73)

**Trigger:** When `role === 'owner'` intake is submitted

**Implementation:**
```typescript
if (role === 'owner') {
  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, req.user.ownerId))
      .limit(1);
    
    if (tenant) {
      await onboardingProgressService.markStep(
        tenant.id,
        'OWNER_INTAKE',
        'COMPLETED'
      );
    }
  } catch (error) {
    console.error('Failed to update onboarding progress:', error);
  }
}
```

### ✅ Hook 2: Team Invites Sent

**Location:** `backend/src/controllers/invite.controller.ts` (line 78-95)

**Trigger:** When first team invite is created

**Implementation:**
```typescript
try {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, req.user.userId))
    .limit(1);
  
  if (tenant) {
    await onboardingProgressService.markStep(
      tenant.id,
      'INVITE_TEAM',
      'COMPLETED'
    );
  }
} catch (error) {
  console.error('Failed to update onboarding progress:', error);
}
```

### ✅ Hook 3: Team Intakes Complete

**Location:** `backend/src/controllers/intake.controller.ts` (line 75-106)

**Trigger:** When a team member (ops, sales, delivery) submits intake - checks if all 3 are complete

**Implementation:**
```typescript
if (['ops', 'sales', 'delivery'].includes(role)) {
  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.ownerId, req.user.ownerId))
      .limit(1);
    
    if (tenant) {
      const allIntakes = await db
        .select()
        .from(intakes)
        .where(eq(intakes.ownerId, req.user.ownerId));
      
      const hasOps = allIntakes.some(i => i.role === 'ops');
      const hasSales = allIntakes.some(i => i.role === 'sales');
      const hasDelivery = allIntakes.some(i => i.role === 'delivery');
      
      if (hasOps && hasSales && hasDelivery) {
        await onboardingProgressService.markStep(
          tenant.id,
          'TEAM_INTAKES',
          'COMPLETED'
        );
      }
    }
  } catch (error) {
    console.error('Failed to update team intakes onboarding progress:', error);
  }
}
```

### ✅ Hook 4: Diagnostic Generated

**Location:** `backend/src/services/diagnosticIngestion.service.ts` (line 287-297)

**Trigger:** At end of `ingestDiagnostic()` function - after tickets and roadmap are generated

**Implementation:**
```typescript
try {
  await onboardingProgressService.markStep(
    diagnosticMap.tenantId,
    'DIAGNOSTIC_GENERATED',
    'COMPLETED'
  );
  console.log('[Diagnostic Ingestion] ✅ Updated onboarding progress');
} catch (err) {
  console.error('[Diagnostic Ingestion] Failed to update onboarding progress:', err);
}
```

### ✅ Hook 5: Roadmap Reviewed

**Location:** `backend/src/controllers/roadmap.controller.ts` (line 107-118)

**Trigger:** When owner fetches roadmap sections for the first time

**Implementation:**
```typescript
if (tenant && user.role === 'owner') {
  try {
    await onboardingProgressService.markStep(
      tenant.id,
      'ROADMAP_REVIEWED',
      'COMPLETED'
    );
  } catch (err) {
    console.error('[Roadmap] Failed to update onboarding progress:', err);
  }
}
```

---

## Remaining Hooks (To Be Implemented)

### ⏳ Hook 6: Business Profile Complete

**Required fields to check:**
- `tenant.teamHeadcount` (not null)
- `tenant.baselineMonthlyLeads` (not null)
- `tenant.firmSizeTier` (not null)
- `tenant.region` (not null)

**Suggested location:** `backend/src/controllers/superadmin.controller.ts` in `updateFirmStatus()` endpoint (line ~37)

**Pseudocode:**
```typescript
// After updating tenant
if (tenant.teamHeadcount && tenant.baselineMonthlyLeads && 
    tenant.firmSizeTier && tenant.region) {
  await onboardingProgressService.markStep(
    tenantId,
    'BUSINESS_PROFILE',
    'COMPLETED'
  );
}
```

### ⏳ Hook 7: Discovery Call Scheduled

**Suggested implementation:**
- Option A: Add field `tenant.discoveryCallScheduledAt` and mark complete when set
- Option B: Integrate with calendar webhook if using scheduling tool
- Option C: Manual SuperAdmin action marks step complete

**Suggested location:** Tenant update endpoint or webhook handler

### ⏳ Hook 8: Tickets Moderated

**Trigger:** When X% of tickets have moderation actions (APPROVE/DEFER/DISCARD/COMMENT)

**Suggested threshold:** 70% of tickets moderated

**Suggested location:** `backend/src/controllers/ticketModeration.controller.ts` or `backend/src/services/ticketModeration.service.ts`

**Pseudocode:**
```typescript
async function checkTicketsModerated(tenantId: string) {
  const stats = await ticketsService.getModerationStats(tenantId);
  const percentModerated = stats.total === 0
    ? 0
    : (stats.moderated / stats.total) * 100;
  
  if (percentModerated >= 70) {
    await onboardingProgressService.markStep(
      tenantId,
      'TICKETS_MODERATED',
      'COMPLETED'
    );
  }
}
```

### ⏳ Hook 9: Implementation Decision

**Trigger:** When owner chooses implementation path (INTERNAL | HYBRID | DONE_FOR_YOU)

**Suggested implementation:** Create new endpoint `POST /api/tenants/:tenantId/implementation-decision`

**Pseudocode:**
```typescript
router.post('/tenants/:tenantId/implementation-decision', async (req, res) => {
  const { tenantId } = req.params;
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

## Database Migration

### Required Migration

**File:** `backend/drizzle/migrations/XXXX_add_onboarding_states.sql`

```sql
CREATE TABLE onboarding_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Overall progress snapshot
  percent_complete INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  max_points INT NOT NULL DEFAULT 120,
  
  -- JSON arrays for steps and badges
  steps JSONB NOT NULL DEFAULT '[]',
  badges JSONB NOT NULL DEFAULT '[]',
  
  -- System audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_states_tenant_id ON onboarding_states(tenant_id);
```

### Running Migration

```bash
cd backend
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg
```

---

## Testing Guide

### 1. Manual Testing Flow

**Prerequisites:**
1. Run migration to create `onboarding_states` table
2. Start backend server: `cd backend && pnpm dev`
3. Have a registered owner account

**Test Sequence:**

```bash
# Step 1: Get initial onboarding state (should be all NOT_STARTED)
curl -H "Authorization: Bearer <owner_token>" \
  http://localhost:3001/api/tenants/<tenant_id>/onboarding

# Step 2: Submit Owner Intake
curl -X POST -H "Authorization: Bearer <owner_token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"owner","answers":{...}}' \
  http://localhost:3001/api/intake/submit

# Step 3: Check onboarding state again (OWNER_INTAKE should be COMPLETED)
curl -H "Authorization: Bearer <owner_token>" \
  http://localhost:3001/api/tenants/<tenant_id>/onboarding

# Step 4: Send team invite
curl -X POST -H "Authorization: Bearer <owner_token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"ops@test.com","role":"ops"}' \
  http://localhost:3001/api/invites

# Step 5: Check state (INVITE_TEAM should be COMPLETED)
curl -H "Authorization: Bearer <owner_token>" \
  http://localhost:3001/api/tenants/<tenant_id>/onboarding
```

### 2. Manual Step Override (Testing/Admin)

```bash
# Manually mark a step complete (requires owner or superadmin auth)
curl -X PATCH -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"COMPLETED"}' \
  http://localhost:3001/api/tenants/<tenant_id>/onboarding/steps/BUSINESS_PROFILE
```

### 3. Automated Test Script

Create `backend/src/scripts/test_onboarding.ts`:

```typescript
import { onboardingProgressService } from '../services/onboardingProgress.service';

async function testOnboardingFlow() {
  const testTenantId = 'your-test-tenant-id';
  
  console.log('1. Get initial state...');
  let state = await onboardingProgressService.getState(testTenantId);
  console.log('Initial progress:', state.percentComplete);
  
  console.log('2. Mark Owner Intake complete...');
  state = await onboardingProgressService.markStep(
    testTenantId,
    'OWNER_INTAKE',
    'COMPLETED'
  );
  console.log('Progress after Owner Intake:', state.percentComplete);
  console.log('Points:', state.totalPoints, '/', state.maxPoints);
  
  console.log('3. Mark Business Profile complete...');
  state = await onboardingProgressService.markStep(
    testTenantId,
    'BUSINESS_PROFILE',
    'COMPLETED'
  );
  console.log('Progress after Business Profile:', state.percentComplete);
  console.log('Badges earned:', state.badges.map(b => b.label));
  
  console.log('4. Mark all required steps...');
  await onboardingProgressService.markStep(testTenantId, 'DIAGNOSTIC_GENERATED', 'COMPLETED');
  
  state = await onboardingProgressService.getState(testTenantId);
  console.log('Final state:', {
    percentComplete: state.percentComplete,
    totalPoints: state.totalPoints,
    badges: state.badges.length,
    nextStep: state.nextStepLabel
  });
}

testOnboardingFlow().catch(console.error);
```

Run: `tsx backend/src/scripts/test_onboarding.ts`

---

## Frontend Integration

### Fetching Onboarding State

```typescript
// frontend/src/lib/api.ts
export async function getOnboardingState(tenantId: string): Promise<OnboardingState> {
  const response = await fetch(`${API_URL}/api/tenants/${tenantId}/onboarding`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });
  return response.json();
}
```

### Dashboard Components

**1. Progress Banner**
```tsx
<div className="bg-slate-800 p-4 rounded-lg">
  <h3>Onboarding Progress: {state.percentComplete}% Complete</h3>
  <div className="w-full bg-slate-700 h-2 rounded-full">
    <div 
      className="bg-blue-500 h-2 rounded-full transition-all"
      style={{ width: `${state.percentComplete}%` }}
    />
  </div>
  {state.nextStepLabel && (
    <p className="mt-2 text-sm">Next: {state.nextStepLabel} ({state.nextStepEstimatedMinutes} min)</p>
  )}
</div>
```

**2. Checklist Card**
```tsx
<div className="space-y-2">
  {state.steps.map(step => (
    <div key={step.stepId} className="flex items-center gap-2">
      {step.status === 'COMPLETED' ? '✅' : '⭕'}
      <span>{step.label}</span>
      <span className="text-sm text-slate-400">
        {step.pointsEarned}/{step.pointsPossible} pts
      </span>
    </div>
  ))}
</div>
```

**3. Badges Display**
```tsx
<div className="flex gap-2">
  {state.badges.map(badge => (
    <div key={badge.badgeId} className="badge" title={badge.description}>
      🏆 {badge.label}
    </div>
  ))}
</div>
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Completion Rate by Step**
   - What % of owners complete each step?
   - Where do owners drop off?

2. **Time to Completion**
   - Average time between steps
   - Total time to 100% onboarding

3. **Badge Distribution**
   - Which badges are most/least earned?

4. **Correlation with Activation**
   - Does onboarding completion correlate with pilot conversion?

### Logging

All onboarding service calls log to console. Consider adding structured logging:

```typescript
console.log({
  event: 'onboarding_step_completed',
  tenantId,
  stepId,
  totalProgress: state.percentComplete,
  timestamp: new Date().toISOString()
});
```

---

## Production Deployment Checklist

- [ ] Run database migration in production
- [ ] Test onboarding flow in staging
- [ ] Backfill existing tenants (create initial onboarding states)
- [ ] Monitor error rates for onboarding hook failures
- [ ] Add Sentry/logging for onboarding events
- [ ] Update frontend to consume onboarding API
- [ ] Create analytics dashboard for onboarding metrics
- [ ] Document SuperAdmin manual override procedures

---

## Future Enhancements

1. **Retroactive Badge Awards**: When user completes Business Profile after already completing Owner Intake, check and award FOUNDATION_BUILDER badge

2. **Step Dependencies**: Enforce that certain steps can't be marked complete until prerequisites are done (e.g., can't mark ROADMAP_REVIEWED until DIAGNOSTIC_GENERATED is done)

3. **Onboarding Reminders**: Email/notification when owner is stuck on a step for >X days

4. **A/B Testing**: Different point values, different badge copy, different step order

5. **Leaderboard**: (If cohort-based) Show top owners by onboarding completion

6. **Achievement Animations**: Frontend animations when badges are earned

---

## Support & Troubleshooting

### Common Issues

**Problem:** Onboarding state not updating after event
- Check backend logs for errors in onboarding hooks
- Verify tenant ID is correct in database
- Confirm event hook is actually being triggered
- Test with manual override: `PATCH /api/tenants/:id/onboarding/steps/:stepId`

**Problem:** Frontend shows 0% progress for new owner
- Expected behavior - initial state is all NOT_STARTED
- Progress will update as owner completes steps

**Problem:** Badge not awarded despite completing criteria
- Check `applyBadges()` logic in `OnboardingProgressService`
- Verify step statuses are exactly 'COMPLETED' (case-sensitive)
- Force recalculation with manual step update

---

## Contact & Maintenance

**Created:** December 2025  
**Last Updated:** December 2025  
**Maintainer:** Tony Camero (@tonycamero)  
**Status:** ✅ Core Implementation Complete
