-- Seed Roberta's leadership team with EXACT intake form fields
-- Hayes Real Estate Group - Southampton, NY

DO $$ 
DECLARE
  roberta_id UUID;
  michael_id UUID;
  sarah_id UUID;
  jasmine_id UUID;
BEGIN
  -- Get Roberta's ID
  SELECT id INTO roberta_id FROM users WHERE email = 'roberta@hayesrealestate.com';

  -- Create Michael Chen (Operations Lead)
  INSERT INTO users (id, email, password_hash, name, role, owner_id)
  VALUES (
    gen_random_uuid(),
    'michael.chen@hayesrealestate.com',
    '$2a$10$CoIZ7V7GGHWkbY3dpO7zNO8mEplDwXYaON4dwqwCiDkglpXPC1BOi', -- password123
    'Michael Chen',
    'ops',
    roberta_id
  )
  RETURNING id INTO michael_id;

  -- Create Sarah Mitchell (Sales Lead)
  INSERT INTO users (id, email, password_hash, name, role, owner_id)
  VALUES (
    gen_random_uuid(),
    'sarah.mitchell@hayesrealestate.com',
    '$2a$10$CoIZ7V7GGHWkbY3dpO7zNO8mEplDwXYaON4dwqwCiDkglpXPC1BOi', -- password123
    'Sarah Mitchell',
    'sales',
    roberta_id
  )
  RETURNING id INTO sarah_id;

  -- Create Jasmine Rivera (Delivery Lead)
  INSERT INTO users (id, email, password_hash, name, role, owner_id)
  VALUES (
    gen_random_uuid(),
    'jasmine.rivera@hayesrealestate.com',
    '$2a$10$CoIZ7V7GGHWkbY3dpO7zNO8mEplDwXYaON4dwqwCiDkglpXPC1BOi', -- password123
    'Jasmine Rivera',
    'delivery',
    roberta_id
  )
  RETURNING id INTO jasmine_id;

  -- Michael's Ops Intake (EXACT field names from OpsIntake.tsx)
  INSERT INTO intakes (id, user_id, role, answers, created_at, owner_id)
  VALUES (
    gen_random_uuid(),
    michael_id,
    'ops',
    jsonb_build_object(
      'current_systems', 'We use a mix of Excel spreadsheets, Google Sheets, and a basic Zillow CRM. Agent coordination happens mostly via text messages and weekly meetings. Property listings are managed in MLS with manual data entry.',
      'tech_stack', 'Zillow Premier Agent (basic tier), Google Workspace (Drive, Sheets, Gmail), MLS integration, DocuSign for contracts, QuickBooks for accounting, basic website with IDX feed.',
      'automation_level', 'basic',
      'pain_points', 'Biggest pain is lead follow-up tracking - we lose track of warm leads when agents get busy with closings. Data entry is duplicated across systems. No centralized way to see pipeline status across all agents. Weekly reporting takes 3-4 hours of manual consolidation.',
      'data_quality', 'Data quality is inconsistent. Each agent has their own system for tracking leads and follow-ups. Historical data is scattered across old spreadsheets. We do not have a single source of truth for client interactions or property interest.',
      'integration_challenges', 'MLS data does not flow into our CRM automatically. We manually copy listing data. DocuSign signatures do not update our deal tracking. QuickBooks is completely separate - commission tracking requires manual reconciliation every month.'
    ),
    NOW() - INTERVAL '2 days',
    roberta_id
  );

  -- Sarah's Sales Intake (EXACT field names from SalesIntake.tsx)
  INSERT INTO intakes (id, user_id, role, answers, created_at, owner_id)
  VALUES (
    gen_random_uuid(),
    sarah_id,
    'sales',
    jsonb_build_object(
      'sales_process', 'Leads come from Zillow, referrals, open houses, and past clients. Initial contact within 24 hours, then follow-up sequence (day 3, day 7, day 14). Property tours scheduled via phone/text. Offer negotiation handled by listing/buyer agent with Roberta reviewing big deals. Average 45-60 day close cycle.',
      'lead_generation', 'Primary: Zillow leads (paid), referrals from past clients (~40% of business), open houses, local networking. Secondary: Instagram posts, occasional Facebook ads. Zillow converts at ~8%, referrals at ~35%. We do not track which open houses generate actual closings.',
      'crm_tools', 'Zillow CRM (basic features only), Excel spreadsheets per agent, Google Calendar for showings, Gmail for all communication. No automated follow-up sequences. Roberta uses a master spreadsheet to track active deals.',
      'conversion_challenges', 'Biggest challenge: consistent follow-up when agents are in back-to-back showings. Leads from Zillow go cold if not contacted within 2 hours. Warm referrals sometimes get lost in the shuffle during busy season (May-August). No visibility into why deals fall through - we just know they did.',
      'customer_insights', 'We gather feedback informally via phone calls post-close and Google reviews. No structured survey process. We wish we had data on: why buyers chose us vs competitors, which property features drive offers, ideal timing for re-engagement with past clients, and lead response time impact on conversion.',
      'automation_opportunities', 'Immediate need: automated lead routing and follow-up reminders. Dream: AI-powered lead qualification, predictive analytics on which leads are hot, automated showing scheduling, post-close nurture campaigns for referrals and repeat business.'
    ),
    NOW() - INTERVAL '1 day',
    roberta_id
  );

  -- Jasmine's Delivery Intake (EXACT field names from DeliveryIntake.tsx)
  INSERT INTO intakes (id, user_id, role, answers, created_at, owner_id)
  VALUES (
    gen_random_uuid(),
    jasmine_id,
    'delivery',
    jsonb_build_object(
      'delivery_process', 'Client onboarding: initial consultation, buyer/seller agreement signing, set expectations doc. For buyers: pre-approval verification, property search (MLS + off-market), showings, offer negotiation, contract to close coordination (inspections, appraisals, title). For sellers: property prep consultation, staging recommendations, listing photos, go-live, showings, offers, contract to close.',
      'project_management', 'Google Calendar for showing schedules, shared Google Sheets for deal tracking, text messages for urgent updates, weekly team meetings for pipeline review. DocuSign for contracts. No formal project management software - everything is tracked in Roberta master spreadsheet.',
      'team_size', '5 agents (including Roberta), 1 part-time transaction coordinator (me), 1 office admin. Agents handle own deals end-to-end. I coordinate paperwork, inspection scheduling, title/escrow communication for deals in contract.',
      'bottlenecks', 'Main bottleneck: handoff between agents and transaction coordination - I often do not know a deal went under contract until 2-3 days later. Inspection scheduling is manual phone tag with vendors. Document collection from buyers (tax returns, bank statements) takes multiple follow-ups. Closing delays happen when title issues surface late.',
      'quality_metrics', 'We track: days on market (target <30 for our price range), list-to-sale price ratio (target 97%+), days from contract to close (target 35-40). Post-close: Google review score (current 4.7), referral rate (informal - about 40%). We do not formally track client satisfaction during the process.',
      'client_feedback', 'Feedback gathered via post-close phone call from Roberta and Google review requests. Common praise: responsiveness, market knowledge, negotiation skills. Common complaints: communication gaps during contract period (waiting for updates on inspection, appraisal), confusion about next steps, delays in document collection.'
    ),
    NOW() - INTERVAL '1 hour',
    roberta_id
  );

END $$;
