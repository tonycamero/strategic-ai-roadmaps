-- =============================================
-- HAYES REAL ESTATE - SOP-01 OUTPUTS
-- Seeds document records for Roberta Hayes' tenant
-- Note: Files must be manually uploaded or placed in uploads/ directory
-- =============================================

-- Insert SOP-01 Output documents for Hayes Real Estate
INSERT INTO tenant_documents (
  tenant_id,
  owner_id,
  filename,
  original_filename,
  file_path,
  file_size,
  mime_type,
  category,
  title,
  description,
  sop_number,
  output_number,
  uploaded_by,
  is_public,
  created_at,
  updated_at
)
SELECT
  t.id as tenant_id,
  t.owner_id,
  'hayes-sop01-output1.pdf' as filename,
  'SOP-01 Output 1 - Strategic Overview.pdf' as original_filename,
  'hayes-sop01-output1.pdf' as file_path,
  0 as file_size, -- Will be updated when actual file is uploaded
  'application/pdf' as mime_type,
  'sop_output' as category,
  'Strategic Business Overview' as title,
  'Comprehensive analysis of Hayes Real Estate Group operations, priorities, and pain points based on owner and team intake data.' as description,
  'SOP-01' as sop_number,
  'Output-1' as output_number,
  (SELECT id FROM users WHERE email = 'tony@scend.cash') as uploaded_by,
  true as is_public,
  NOW() - INTERVAL '2 days' as created_at,
  NOW() - INTERVAL '2 days' as updated_at
FROM tenants t
WHERE t.owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com')
ON CONFLICT DO NOTHING;

INSERT INTO tenant_documents (
  tenant_id,
  owner_id,
  filename,
  original_filename,
  file_path,
  file_size,
  mime_type,
  category,
  title,
  description,
  sop_number,
  output_number,
  uploaded_by,
  is_public,
  created_at,
  updated_at
)
SELECT
  t.id as tenant_id,
  t.owner_id,
  'hayes-sop01-output2.pdf' as filename,
  'SOP-01 Output 2 - Workflow Analysis.pdf' as original_filename,
  'hayes-sop01-output2.pdf' as file_path,
  0 as file_size,
  'application/pdf' as mime_type,
  'sop_output' as category,
  'Workflow & Process Analysis' as title,
  'Detailed breakdown of current workflows, bottlenecks, and process inefficiencies across sales, ops, and delivery teams.' as description,
  'SOP-01' as sop_number,
  'Output-2' as output_number,
  (SELECT id FROM users WHERE email = 'tony@scend.cash') as uploaded_by,
  true as is_public,
  NOW() - INTERVAL '2 days' as created_at,
  NOW() - INTERVAL '2 days' as updated_at
FROM tenants t
WHERE t.owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com')
ON CONFLICT DO NOTHING;

INSERT INTO tenant_documents (
  tenant_id,
  owner_id,
  filename,
  original_filename,
  file_path,
  file_size,
  mime_type,
  category,
  title,
  description,
  sop_number,
  output_number,
  uploaded_by,
  is_public,
  created_at,
  updated_at
)
SELECT
  t.id as tenant_id,
  t.owner_id,
  'hayes-sop01-output3.pdf' as filename,
  'SOP-01 Output 3 - AI Opportunity Map.pdf' as original_filename,
  'hayes-sop01-output3.pdf' as file_path,
  0 as file_size,
  'application/pdf' as mime_type,
  'sop_output' as category,
  'AI Automation Opportunities' as title,
  'Prioritized list of AI/automation opportunities with impact analysis and implementation recommendations.' as description,
  'SOP-01' as sop_number,
  'Output-3' as output_number,
  (SELECT id FROM users WHERE email = 'tony@scend.cash') as uploaded_by,
  true as is_public,
  NOW() - INTERVAL '2 days' as created_at,
  NOW() - INTERVAL '2 days' as updated_at
FROM tenants t
WHERE t.owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com')
ON CONFLICT DO NOTHING;

INSERT INTO tenant_documents (
  tenant_id,
  owner_id,
  filename,
  original_filename,
  file_path,
  file_size,
  mime_type,
  category,
  title,
  description,
  sop_number,
  output_number,
  uploaded_by,
  is_public,
  created_at,
  updated_at
)
SELECT
  t.id as tenant_id,
  t.owner_id,
  'hayes-sop01-output4.pdf' as filename,
  'SOP-01 Output 4 - Discovery Call Prep.pdf' as original_filename,
  'hayes-sop01-output4.pdf' as file_path,
  0 as file_size,
  'application/pdf' as mime_type,
  'sop_output' as category,
  'Discovery Call Preparation Guide' as title,
  'Curated questions, talking points, and strategic insights for the discovery call with Roberta Hayes.' as description,
  'SOP-01' as sop_number,
  'Output-4' as output_number,
  (SELECT id FROM users WHERE email = 'tony@scend.cash') as uploaded_by,
  true as is_public,
  NOW() - INTERVAL '2 days' as created_at,
  NOW() - INTERVAL '2 days' as updated_at
FROM tenants t
WHERE t.owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com')
ON CONFLICT DO NOTHING;

-- Verification
SELECT '=== HAYES REAL ESTATE SOP-01 OUTPUTS SEEDED ===' as status;
SELECT 
  title,
  sop_number,
  output_number,
  original_filename,
  category,
  created_at
FROM tenant_documents
WHERE tenant_id = (SELECT id FROM tenants WHERE owner_id = (SELECT id FROM users WHERE email = 'roberta@hayesrealestate.com'))
ORDER BY output_number;
