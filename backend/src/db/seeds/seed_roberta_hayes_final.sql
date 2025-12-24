-- =============================================
-- ROBERTA HAYES DEMO FIRM SEED DATA (FINAL)
-- Hayes Real Estate Group | Eugene Q1 2026 Cohort
-- =============================================

-- Clean up any existing Roberta demo data first
DELETE FROM tenant_feature_flags WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com'));
DELETE FROM audit_events WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com'));
DELETE FROM intakes WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com');
DELETE FROM tenants WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com');
DELETE FROM users WHERE owner_id IN (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com');
DELETE FROM users WHERE email = 'roberta@hayesrealestate.com';

-- 1. CREATE OWNER USER (Roberta Hayes) - Two-step process to handle self-referential FK
DO $$
DECLARE
  roberta_id uuid;
BEGIN
  -- Step 1: Create user with temporary owner_id (will be own id)
  INSERT INTO users (
    email,
    password_hash,
    name,
    role,
    owner_id,
    created_at
  ) VALUES (
    'roberta@hayesrealestate.com',
    '$2b$10$dummyhashfordemopurposesonly',
    'Roberta Hayes',
    'owner',
    (SELECT id FROM users WHERE email = 'tony@scend.cash'), -- Temp reference
    NOW() - INTERVAL '20 days'
  ) RETURNING id INTO roberta_id;
  
  -- Step 2: Update to self-reference
  UPDATE users SET owner_id = roberta_id WHERE id = roberta_id;
  
  RAISE NOTICE 'Created Roberta Hayes with ID: %', roberta_id;
END $$;

-- 2. CREATE TENANT RECORD
INSERT INTO tenants (
  owner_id,
  name,
  cohort_label,
  segment,
  region,
  status,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  'Hayes Real Estate Group',
  'EUGENE_Q1_2026',
  'Real Estate',
  'Hamptons, NY',
  'pilot_candidate',
  'Boutique luxury brokerage serving the Hamptons. 15 agents, $75M annual volume, 85+ transactions/year. Owner Roberta Hayes seeking operational automation and team performance visibility.',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
FROM users WHERE email = 'roberta@hayesrealestate.com';

-- 3. CREATE TEAM MEMBERS

INSERT INTO users (email, password_hash, name, role, owner_id, created_at)
SELECT 
  'michael.chen@hayesrealestate.com',
  '$2b$10$dummyhashfordemopurposesonly',
  'Michael Chen',
  'ops',
  id,
  NOW() - INTERVAL '16 days'
FROM users WHERE email = 'roberta@hayesrealestate.com';

INSERT INTO users (email, password_hash, name, role, owner_id, created_at)
SELECT 
  'sarah.mitchell@hayesrealestate.com',
  '$2b$10$dummyhashfordemopurposesonly',
  'Sarah Mitchell',
  'sales',
  id,
  NOW() - INTERVAL '16 days'
FROM users WHERE email = 'roberta@hayesrealestate.com';

INSERT INTO users (email, password_hash, name, role, owner_id, created_at)
SELECT 
  'jasmine.rivera@hayesrealestate.com',
  '$2b$10$dummyhashfordemopurposesonly',
  'Jasmine Rivera',
  'delivery',
  id,
  NOW() - INTERVAL '15 days'
FROM users WHERE email = 'roberta@hayesrealestate.com';

INSERT INTO users (email, password_hash, name, role, owner_id, created_at)
SELECT 
  'david.kim@hayesrealestate.com',
  '$2b$10$dummyhashfordemopurposesonly',
  'David Kim',
  'staff',
  id,
  NOW() - INTERVAL '14 days'
FROM users WHERE email = 'roberta@hayesrealestate.com';

-- 4. CREATE INTAKE SUBMISSIONS

INSERT INTO intakes (user_id, role, answers, owner_id, status, completed_at, created_at)
SELECT
  owner.id,
  'owner',
  '{"workflow_name": "Lead Follow-up & Qualification System", "workflow_description": "We get referrals and online inquiries but have no consistent system to track, qualify, and nurture leads. Agents handle follow-up inconsistently. High-value leads slip through the cracks because nobody owns the process. We need a structured pipeline with automated reminders and visibility into who is following up and when.", "current_pain": "Manual tracking across spreadsheets, texts, email, and a CRM we barely use. No one knows who is responsible for each lead. Agents cherry-pick the hot ones and ignore the warm leads. I personally have to chase everyone to make sure follow-up happens. It is embarrassing and unsustainable.", "desired_outcome": "Every lead gets entered into one system. Automated follow-up sequences based on lead temperature. Clear ownership and accountability. Notifications when leads go cold. Dashboard showing pipeline health and conversion rates. Agents know exactly what to do next without me micromanaging.", "stakeholders": "Me (Roberta), Michael Chen (ops director), all 15 agents, Sarah Mitchell (top producer)"}',
  owner.id,
  'completed',
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '18 days'
FROM users owner WHERE owner.email = 'roberta@hayesrealestate.com';

INSERT INTO intakes (user_id, role, answers, owner_id, status, completed_at, created_at)
SELECT
  michael.id,
  'ops',
  '{"workflow_name": "Client Onboarding & Document Collection", "workflow_description": "When we sign a new client, there is no standardized process for collecting documents, setting expectations, or communicating next steps. Every agent does it differently. Some send email checklists. Some just wing it. Luxury clients expect white-glove service but our onboarding feels scattered and unprofessional.", "current_pain": "Chasing clients for documents via text, email, phone calls. Repeating ourselves. Forgetting steps. Missing deadlines because paperwork is incomplete. Clients get frustrated. We look disorganized. Agents spend hours on admin work instead of selling.", "desired_outcome": "Automated onboarding sequence triggered when client is signed. Digital document collection with reminders. Branded client portal showing progress and next steps. Automated status updates to the team. All documents stored in one place with version control. Agents freed up to focus on relationships and deals.", "stakeholders": "Roberta Hayes (owner), David Kim (transaction coordinator), Jasmine Rivera (client coordination), agents"}',
  owner.id,
  'completed',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
FROM users michael, users owner
WHERE michael.email = 'michael.chen@hayesrealestate.com'
  AND owner.email = 'roberta@hayesrealestate.com';

INSERT INTO intakes (user_id, role, answers, owner_id, status, completed_at, created_at)
SELECT
  owner.id,
  'owner',
  '{"workflow_name": "Agent Activity & Performance Dashboard", "workflow_description": "I have no visibility into what my agents are actually doing day-to-day. I cannot see their pipeline, their activity levels, or their conversion rates without manually asking them. Some agents are crushing it. Others are coasting. I need data to coach effectively and hold people accountable.", "current_pain": "Zero real-time visibility. I only find out about problems after deals are lost or clients complain. Cannot identify top performers vs. underperformers objectively. No metrics to guide compensation or promotion decisions. Feels like I am managing blind.", "desired_outcome": "Real-time dashboard showing agent activity: calls made, meetings scheduled, deals in pipeline, conversion rates, response times. Automated weekly reports. Benchmarks so agents can see how they compare to team average. Triggers for coaching conversations when activity drops. Data-driven performance reviews.", "stakeholders": "Roberta Hayes (owner), Michael Chen (ops director), all agents"}',
  owner.id,
  'completed',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM users owner WHERE owner.email = 'roberta@hayesrealestate.com';

-- 5. CREATE AUDIT EVENTS

INSERT INTO audit_events (tenant_id, actor_user_id, actor_role, event_type, entity_type, entity_id, metadata, created_at)
SELECT
  t.id,
  (SELECT id FROM users WHERE email = 'tony@scend.cash'),
  'superadmin',
  'tenant_created',
  'tenant',
  t.id,
  '{"cohort": "EUGENE_Q1_2026", "segment": "Real Estate"}',
  NOW() - INTERVAL '20 days'
FROM tenants t
WHERE t.owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com');

INSERT INTO audit_events (tenant_id, actor_user_id, actor_role, event_type, entity_type, entity_id, metadata, created_at)
SELECT
  t.id,
  u.id,
  'owner',
  'user_registered',
  'user',
  u.id,
  '{"role": "owner"}',
  NOW() - INTERVAL '20 days'
FROM users u, tenants t
WHERE u.email = 'roberta@hayesrealestate.com' AND t.owner_id = u.id;

INSERT INTO audit_events (tenant_id, actor_user_id, actor_role, event_type, entity_type, entity_id, metadata, created_at)
SELECT
  t.id,
  (SELECT id FROM users WHERE email = 'tony@scend.cash'),
  'superadmin',
  'tenant_status_changed',
  'tenant',
  t.id,
  '{"from": "engaged", "to": "pilot_candidate"}',
  NOW() - INTERVAL '3 days'
FROM tenants t
WHERE t.owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com');

-- 6. ADD FEATURE FLAGS FOR DEMO

INSERT INTO feature_flags (key, description, default_enabled, created_at) VALUES
  ('advanced_intake', 'Multi-step intake forms with conditional logic', true, NOW()),
  ('ai_suggestions', 'AI-powered workflow optimization recommendations', false, NOW())
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO tenant_feature_flags (tenant_id, feature_flag_id, enabled, created_at, updated_at)
SELECT t.id, ff.id, true, NOW(), NOW()
FROM tenants t, feature_flags ff
WHERE t.owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com')
  AND ff.key IN ('advanced_intake', 'ai_suggestions');

-- =============================================
-- VERIFICATION QUERY
-- =============================================
SELECT '=== ROBERTA HAYES DEMO FIRM CREATED ===' as status;
SELECT 'Tenant' as type, name, status, cohort_label FROM tenants WHERE owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com')
UNION ALL
SELECT 'Team', name, role, email FROM users WHERE email LIKE '%hayesrealestate.com' ORDER BY role
UNION ALL
SELECT 'Intake', answers->>'workflow_name', 'completed', answers->>'current_pain' FROM intakes WHERE owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com');
