-- Update diagnostic with discovery questions
-- Run this SQL directly in your database

UPDATE diagnostics
SET 
    discovery_questions = jsonb_set(
        COALESCE(discovery_questions, '{}'::jsonb),
        '{questions}',
        (
            SELECT to_jsonb(content)
            FROM tenant_documents
            WHERE tenant_id = diagnostics.tenant_id
            AND sop_number = 'SOP-01'
            AND output_number = 'Output-3'
            LIMIT 1
        ),
        true
    ),
    updated_at = NOW()
WHERE tenant_id = (
    SELECT id FROM tenants WHERE name = 'BrightFocus Marketing' LIMIT 1
);

-- Verify the update
SELECT 
    id,
    tenant_id,
    discovery_questions->>'questions' as questions_preview,
    updated_at
FROM diagnostics
WHERE tenant_id = (
    SELECT id FROM tenants WHERE name = 'BrightFocus Marketing' LIMIT 1
)
ORDER BY created_at DESC
LIMIT 1;
