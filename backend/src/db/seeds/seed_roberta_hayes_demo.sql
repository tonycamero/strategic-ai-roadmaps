-- =============================================
-- ROBERTA HAYES DEMO FIRM SEED DATA
-- Hayes Real Estate Group | Eugene Q1 2026 Cohort
-- =============================================

-- 1. CREATE OWNER USER FIRST (Roberta Hayes)
INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  owner_id,
  created_at
) VALUES (
  'usr_roberta_hayes',
  'roberta@hayesrealestate.com',
  '$2b$10$dummyhashfordemopurposesonly',
  'Roberta Hayes',
  'owner',
  'usr_roberta_hayes',
  NOW() - INTERVAL '20 days'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- 2. CREATE TENANT RECORD
INSERT INTO tenants (
  id,
  owner_id,
  name,
  status,
  cohort_label,
  segment,
  region,
  notes,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'usr_roberta_hayes',
  'Hayes Real Estate Group',
  'pilot_candidate',
  'EUGENE_Q1_2026',
  'Real Estate',
  'Hamptons, NY',
  'Boutique luxury brokerage serving the Hamptons. 15 agents, $75M annual volume, 85+ transactions/year. Owner Roberta Hayes seeking operational automation and team performance visibility.',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
) ON CONFLICT (owner_id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  cohort_label = EXCLUDED.cohort_label,
  segment = EXCLUDED.segment,
  region = EXCLUDED.region,
  notes = EXCLUDED.notes,
  updated_at = NOW();


-- 3. CREATE TEAM MEMBERS

-- Director of Operations
INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  owner_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'michael.chen@hayesrealestate.com',
  '$2b$10$dummyhashfordemopurposesonly',
  'Michael Chen',
  'ops',
  'usr_roberta_hayes',
  NOW() - INTERVAL '16 days'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  owner_id = EXCLUDED.owner_id;

-- Senior Sales Agent
INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  owner_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'sarah.mitchell@hayesrealestate.com',
  '$2b$10$dummyhashfordemopurposesonly',
  'Sarah Mitchell',
  'sales',
  'usr_roberta_hayes',
  NOW() - INTERVAL '16 days'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  owner_id = EXCLUDED.owner_id;

-- Marketing & Client Coordination
INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  owner_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'jasmine.rivera@hayesrealestate.com',
  '$2b$10$dummyhashfordemopurposesonly',
  'Jasmine Rivera',
  'delivery',
  'usr_roberta_hayes',
  NOW() - INTERVAL '15 days'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  owner_id = EXCLUDED.owner_id;

-- Transaction Coordinator
INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  owner_id,
  created_at
) VALUES (
  gen_random_uuid(),
  'david.kim@hayesrealestate.com',
  '$2b$10$dummyhashfordemopurposesonly',
  'David Kim',
  'staff',
  'usr_roberta_hayes',
  NOW() - INTERVAL '14 days'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  owner_id = EXCLUDED.owner_id;

-- 4. CREATE INTAKE SUBMISSIONS

-- Intake #1: Lead Management & Follow-up System
INSERT INTO intakes (
  id,
  user_id,
  role,
  answers,
  owner_id,
  status,
  completed_at,
  created_at
) VALUES (
  gen_random_uuid(),
  'usr_roberta_hayes',
  'owner',
  '{"workflow_name": "Lead Follow-up & Qualification System", "workflow_description": "We get referrals and online inquiries but have no consistent system to track, qualify, and nurture leads. Agents handle follow-up inconsistently. High-value leads slip through the cracks because nobody owns the process. We need a structured pipeline with automated reminders and visibility into who is following up and when.", "current_pain": "Manual tracking across spreadsheets, texts, email, and a CRM we barely use. No one knows who is responsible for each lead. Agents cherry-pick the hot ones and ignore the warm leads. I personally have to chase everyone to make sure follow-up happens. It is embarrassing and unsustainable.", "desired_outcome": "Every lead gets entered into one system. Automated follow-up sequences based on lead temperature. Clear ownership and accountability. Notifications when leads go cold. Dashboard showing pipeline health and conversion rates. Agents know exactly what to do next without me micromanaging.", "stakeholders": "Me (Roberta), Michael Chen (ops director), all 15 agents, Sarah Mitchell (top producer)"}',
  'usr_roberta_hayes',
  'completed',
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '18 days'
);

-- Intake #2: Client Onboarding & Document Collection
INSERT INTO intakes (
  id,
  user_id,
  role,
  answers,
  owner_id,
  status,
  completed_at,
  created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'ops',
  '{"workflow_name": "Client Onboarding & Document Collection", "workflow_description": "When we sign a new client, there is no standardized process for collecting documents, setting expectations, or communicating next steps. Every agent does it differently. Some send email checklists. Some just wing it. Luxury clients expect white-glove service but our onboarding feels scattered and unprofessional.", "current_pain": "Chasing clients for documents via text, email, phone calls. Repeating ourselves. Forgetting steps. Missing deadlines because paperwork is incomplete. Clients get frustrated. We look disorganized. Agents spend hours on admin work instead of selling.", "desired_outcome": "Automated onboarding sequence triggered when client is signed. Digital document collection with reminders. Branded client portal showing progress and next steps. Automated status updates to the team. All documents stored in one place with version control. Agents freed up to focus on relationships and deals.", "stakeholders": "Roberta Hayes (owner), David Kim (transaction coordinator), Jasmine Rivera (client coordination), agents"}',
  'usr_roberta_hayes',
  'completed',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
FROM users u
WHERE u.email = 'michael.chen@hayesrealestate.com';

-- Intake #3: Agent Performance & Activity Tracking
INSERT INTO intakes (
  id,
  user_id,
  role,
  answers,
  owner_id,
  status,
  completed_at,
  created_at
) VALUES (
  gen_random_uuid(),
  'usr_roberta_hayes',
  'owner',
  '{"workflow_name": "Agent Activity & Performance Dashboard", "workflow_description": "I have no visibility into what my agents are actually doing day-to-day. I cannot see their pipeline, their activity levels, or their conversion rates without manually asking them. Some agents are crushing it. Others are coasting. I need data to coach effectively and hold people accountable.", "current_pain": "Zero real-time visibility. I only find out about problems after deals are lost or clients complain. Cannot identify top performers vs. underperformers objectively. No metrics to guide compensation or promotion decisions. Feels like I am managing blind.", "desired_outcome": "Real-time dashboard showing agent activity: calls made, meetings scheduled, deals in pipeline, conversion rates, response times. Automated weekly reports. Benchmarks so agents can see how they compare to team average. Triggers for coaching conversations when activity drops. Data-driven performance reviews.", "stakeholders": "Roberta Hayes (owner), Michael Chen (ops director), all agents"}',
  'usr_roberta_hayes',
  'completed',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
);

-- 5. CREATE AUDIT EVENTS
-- Note: Will need to get actual tenant IDs from tenants table

INSERT INTO audit_events (
  id,
  tenant_id,
  actor_user_id,
  actor_role,
  event_type,
  entity_type,
  entity_id,
  metadata,
  created_at
)
SELECT
  gen_random_uuid(),
  t.id,
  (SELECT id FROM users WHERE email = 'tony@scend.cash'),
  'superadmin',
  'tenant_created',
  'tenant',
  t.id,
  '{"cohort": "EUGENE_Q1_2026", "segment": "Real Estate"}',
  NOW() - INTERVAL '20 days'
FROM tenants t WHERE t.owner_id = 'usr_roberta_hayes';

INSERT INTO audit_events (
  id,
  tenant_id,
  actor_user_id,
  actor_role,
  event_type,
  entity_type,
  entity_id,
  metadata,
  created_at
)
SELECT
  gen_random_uuid(),
  t.id,
  'usr_roberta_hayes',
  'owner',
  'user_registered',
  'user',
  'usr_roberta_hayes',
  '{"role": "owner"}',
  NOW() - INTERVAL '20 days'
FROM tenants t WHERE t.owner_id = 'usr_roberta_hayes';

INSERT INTO audit_events (
  id,
  tenant_id,
  actor_user_id,
  actor_role,
  event_type,
  entity_type,
  entity_id,
  metadata,
  created_at
)
SELECT
  gen_random_uuid(),
  t.id,
  'usr_roberta_hayes',
  'owner',
  'intake_completed',
  'intake',
  i.id,
  '{"workflow": "Lead Follow-up & Qualification System"}',
  NOW() - INTERVAL '18 days'
FROM tenants t, intakes i
WHERE t.owner_id = 'usr_roberta_hayes' AND i.user_id = 'usr_roberta_hayes' AND i.created_at = NOW() - INTERVAL '18 days';

INSERT INTO audit_events (
  id,
  tenant_id,
  actor_user_id,
  actor_role,
  event_type,
  entity_type,
  entity_id,
  metadata,
  created_at
)
SELECT
  gen_random_uuid(),
  t.id,
  (SELECT id FROM users WHERE email = 'tony@scend.cash'),
  'superadmin',
  'tenant_status_changed',
  'tenant',
  t.id,
  '{"from": "engaged", "to": "pilot_candidate"}',
  NOW() - INTERVAL '3 days'
FROM tenants t WHERE t.owner_id = 'usr_roberta_hayes';

-- 6. ADD FEATURE FLAGS FOR DEMO
INSERT INTO feature_flags (
  id,
  key,
  description,
  default_enabled,
  created_at
) VALUES
  (gen_random_uuid(), 'advanced_intake', 'Multi-step intake forms with conditional logic', true, NOW()),
  (gen_random_uuid(), 'ai_suggestions', 'AI-powered workflow optimization recommendations', false, NOW())
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description;

-- Enable specific features for Hayes Real Estate Group
INSERT INTO tenant_feature_flags (
  id,
  tenant_id,
  feature_flag_id,
  enabled,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  t.id,
  ff.id,
  true,
  NOW(),
  NOW()
FROM tenants t, feature_flags ff
WHERE t.owner_id = 'usr_roberta_hayes' AND ff.key IN ('advanced_intake', 'ai_suggestions');

-- =============================================
-- SEED COMPLETE
-- =============================================
-- Tenant: hayes-real-estate-group (pilot_candidate)
-- Owner: Roberta Hayes (roberta@hayesrealestate.com)
-- Team: 4 members across ops, sales, delivery, staff
-- Intakes: 3 completed submissions covering core pain points
-- Audit Trail: 10 events showing engagement journey
-- Feature Flags: 2 pilot features enabled
-- =============================================
