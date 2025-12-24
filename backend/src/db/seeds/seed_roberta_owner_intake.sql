-- =============================================
-- ROBERTA HAYES OWNER INTAKE DEMO CONTENT
-- Adds strategic owner-level intake for Roberta Hayes
-- =============================================

-- Delete existing owner intake for Roberta if it exists
DELETE FROM intakes 
WHERE user_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com')
  AND role = 'owner';

-- Insert comprehensive owner intake
INSERT INTO intakes (user_id, role, answers, owner_id, status, completed_at, created_at)
SELECT
  owner.id,
  'owner',
  jsonb_build_object(
    'top_priorities', 'Scale to $100M annual volume without burning out my team. Build repeatable systems so the business does not depend on me personally. Create predictable lead flow and conversion rates we can count on.',
    
    'biggest_frustration', 'Everything bottlenecks through me. Agents come to me for every decision. I am constantly putting out fires instead of working on growth strategy. We have decent volume but it feels chaotic and unsustainable. I know we are leaving money on the table because leads slip through the cracks.',
    
    'ideal_state', 'The business runs smoothly whether I am in the office or not. Agents follow consistent processes. Lead follow-up happens automatically. I can see pipeline health and team performance in real time. My role shifts from firefighter to strategic leader. We close 30% more deals with the same team size.',
    
    'workflow_stuck', 'Lead handoffs from inquiry to agent assignment. Document collection during client onboarding. Agent accountability—nobody tracks activity or follow-up consistently. Listing coordination between agents, transaction coordinator, and marketing.',
    
    'team_bottlenecks', 'Michael (ops director) is drowning in manual admin work. David (transaction coordinator) spends all day chasing documents. Top agents like Sarah are maxed out and cannot take more clients. I personally get pulled into every deal because nothing is documented.',
    
    'owner_bottlenecks', 'Agent coaching and performance management. Approving marketing materials. Resolving client escalations. Deciding which leads to prioritize. Making technology decisions because nobody else understands the tools.',
    
    'systems_struggles', 'We have a CRM (Follow Up Boss) but only 3 out of 15 agents use it properly. Most communication happens via text and email outside the system. Transaction management is a mess of Google Docs and Dropbox folders. Marketing runs through Canva and Instagram with no tracking.',
    
    'communication_breakdown', 'Client follow-up is completely inconsistent. Some agents respond within minutes, others take days. Internal coordination relies on group texts that get buried. Clients often ask me "what is happening with my deal" because agents do not keep them updated. Referral partners complain about slow response times.',
    
    'manual_firefighting', 'Chasing agents for status updates. Manually reviewing every listing before it goes live. Responding to after-hours client emergencies because agents do not handle them. Reconciling commission splits at month-end because our tracking is broken.',
    
    'growth_barriers', 'Cannot scale without adding more agents, but onboarding and training new agents takes months of my time. Lead quality is unpredictable—some months we are flooded, other months it is a desert. No way to measure ROI on marketing spend. Agent turnover is costly and disruptive.',
    
    'volume_breaking_point', 'Lead response time. We already miss inquiries on weekends and evenings. If volume doubled, our transaction coordinator would quit and deals would fall apart. Client service quality would tank because agents are already stretched thin.',
    
    'ai_opportunities', 'Automated lead qualification and routing. AI-powered follow-up sequences that feel personal. Instant answers to common client questions. Automated document collection and status updates. Predictive analytics showing which leads are most likely to close.'
  ),
  owner.id,
  'completed',
  NOW() - INTERVAL '18 days',
  NOW() - INTERVAL '18 days'
FROM users owner 
WHERE owner.email = 'roberta@hayesrealestate.com';

-- Verification
SELECT '=== ROBERTA OWNER INTAKE ADDED ===' as status;
SELECT 
  u.name,
  u.role,
  i.status,
  i.completed_at,
  jsonb_pretty(i.answers) as intake_answers
FROM intakes i
JOIN users u ON i.user_id = u.id
WHERE u.email = 'roberta@hayesrealestate.com'
  AND i.role = 'owner';
