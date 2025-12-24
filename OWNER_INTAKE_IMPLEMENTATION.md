# Owner Intake Form Implementation

## Overview
Added a lean, high-compression Owner intake form (12 questions, ~15 minutes) that captures strategic business insights from the owner perspective. This form is now part of the onboarding workflow for owners.

## Implementation

### Files Created
- `frontend/src/pages/intake/OwnerIntake.tsx` - Owner intake form component

### Files Modified
- `frontend/src/App.tsx` - Added route `/intake/owner`
- `frontend/src/pages/HomePage.tsx` - Updated routing logic to send owners to intake first

## Form Structure

The form is organized into 4 sections with 12 questions total:

### Section A: Strategic Clarity (3 questions, ~5 min)
1. What are your top 3 priorities for the next 6–12 months?
2. What currently feels most frustrating or limiting about the business?
3. If the business ran "the way it should," what would be different?

### Section B: Team & Workflow Health (3 questions, ~4 min)
4. Where does work get stuck or slow down? (handoffs, waiting, approvals, unclear ownership)
5. Which roles or people are currently overloaded or bottlenecked?
6. What tasks or decisions still fall on you that *shouldn't*?

### Section C: Systems & Communication (3 questions, ~4 min)
7. Which systems (CRM, email, tasks, etc.) does your team struggle to use consistently?
8. Where does communication break down—with clients or internally?
9. What part of your workflow is overly manual or feels like constant firefighting?

### Section D: Growth & Capacity (3 questions, ~3 min)
10. What's your biggest barrier to predictable growth?
11. If lead volume doubled tomorrow, what would break first?
12. Where do you believe AI or automation could most help right now?

## Data Schema

Form data is stored with the following keys:
```typescript
{
  // Section A
  top_priorities: string,
  biggest_frustration: string,
  ideal_state: string,
  
  // Section B
  workflow_stuck: string,
  team_bottlenecks: string,
  owner_bottlenecks: string,
  
  // Section C
  systems_struggles: string,
  communication_breakdown: string,
  manual_firefighting: string,
  
  // Section D
  growth_barriers: string,
  volume_breaking_point: string,
  ai_opportunities: string,
}
```

## Onboarding Flow

### Owner Role
1. Owner logs in → redirected to `/intake/owner`
2. Completes 12-question form (~15 minutes)
3. Submits → redirected to `/dashboard`
4. Can now invite team members and view their intakes

### Team Lead Roles (ops, sales, delivery)
1. Team member accepts invite
2. Logs in → redirected to `/intake/{role}`
3. Completes role-specific form
4. Owner can view from dashboard

## Design Philosophy

This form follows the "high-compression" principle:
- **Broad coverage** - Touches all critical business areas
- **Fast completion** - 15 minutes max, not exhausting
- **High signal** - Every question delivers actionable insight
- **Pain + aspiration** - Captures both current frustrations and ideal states
- **Strategic altitude** - Owner-level view, not tactical details

## Integration with Export

Owner intake data is included in the SuperAdmin export functionality:
- CSV exports include all 12 answer columns
- JSON exports nest answers under `intake.answers`
- Team member data shows if owner has completed intake

## Usage

When a new owner signs up:
1. They must complete the owner intake before accessing dashboard
2. This provides the strategic foundation for the AI roadmap
3. Team member intakes add tactical detail to the owner's strategic view
4. Combined data creates comprehensive business assessment

## Benefits

1. **Captures owner pain** - Real frustrations driving purchase decision
2. **Maps org dysfunction** - Where breakdowns occur
3. **Identifies system gaps** - What's not working
4. **Spots AI opportunities** - Where automation makes sense
5. **Frames discovery** - Provides context for deeper conversations
6. **Enables roadmap** - Foundation for strategic recommendations
