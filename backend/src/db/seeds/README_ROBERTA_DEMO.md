# Roberta Hayes Demo Firm

## Overview
This seed data creates a complete demo firm showcasing the Strategic AI Roadmaps platform with realistic client data based on the Roberta Hayes avatar.

## What's Created

### Tenant
- **Name:** Hayes Real Estate Group
- **Status:** qualified (ready for pilot_candidate promotion)
- **Cohort:** EUGENE_Q1_2026
- **Segment:** Real Estate
- **Region:** Hamptons, NY
- **Notes:** Boutique luxury brokerage serving the Hamptons. 15 agents, $75M annual volume, 85+ transactions/year.

### Team (5 users)
1. **Roberta Hayes** (roberta@hayesrealestate.com) - Owner
2. **Michael Chen** (michael.chen@hayesrealestate.com) - Operations Director
3. **Sarah Mitchell** (sarah.mitchell@hayesrealestate.com) - Senior Sales Agent
4. **Jasmine Rivera** (jasmine.rivera@hayesrealestate.com) - Marketing & Client Coordination
5. **David Kim** (david.kim@hayesrealestate.com) - Transaction Coordinator

### Intake Submissions (3 completed)
1. **Lead Follow-up & Qualification System**
   - Submitted by: Roberta Hayes
   - Pain: Manual tracking, inconsistent agent follow-up, leads slipping through cracks
   - Desired: Automated pipeline with reminders, clear ownership, conversion dashboards

2. **Client Onboarding & Document Collection**
   - Submitted by: Michael Chen
   - Pain: No standardized process, chasing documents, unprofessional client experience
   - Desired: Automated onboarding, digital document collection, branded portal

3. **Agent Activity & Performance Dashboard**
   - Submitted by: Roberta Hayes
   - Pain: Zero visibility into agent activity, can't identify top vs. bottom performers
   - Desired: Real-time activity tracking, automated reports, coaching triggers

### Audit Trail
- Tenant creation by SuperAdmin (20 days ago)
- User registration (20 days ago)
- Status update to pilot_candidate (3 days ago)

### Feature Flags
- `advanced_intake` - Enabled
- `ai_suggestions` - Enabled

## Usage

### Run the seed:
```bash
cd backend
source .env
psql "$DATABASE_URL" -f src/db/seeds/seed_roberta_hayes_final.sql
```

### View in SuperAdmin Dashboard:
1. Navigate to `/superadmin/cohorts/eugene-q1-2026`
2. Look for "Hayes Real Estate Group" in the **Qualified** column
3. Click the card to see org chart and intake details
4. Readiness score: 50+ (3 intakes completed)

### Demo Flow
1. Show the org chart: Owner + 4 team members with role-based color coding
2. Review intake submissions showing real pain points from real estate brokers
3. Discuss how Roberta's story maps to discovery call → pilot → implementation
4. Use as example when onboarding similar Real Estate/Professional Services firms

## Avatar Documentation
See `/ROBERTA_HAYES_AVATAR.md` for complete persona, discovery call transcript, pain points, and marketing materials.

## Password (Demo Only)
All users have dummy password hash. In production, they would complete invitation flow to set real passwords.

## Cleanup (if needed)
```sql
DELETE FROM tenant_feature_flags WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com'));
DELETE FROM audit_events WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com'));
DELETE FROM intakes WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com');
DELETE FROM tenants WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com');
DELETE FROM users WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com');
DELETE FROM users WHERE email = 'roberta@hayesrealestate.com';
```
