EXECUTION-TICKET: EXEC-FE-DOWNLOAD-VERIFY-002

Title:
Verify Download PDF works (SA Execution)

Status:
APPROVED

Objective:
Prove the fix works in the environment you care about.

Steps:
- Open modal → click Download → confirm Network request appears
- Confirm:
  Status 200
  content-type: application/pdf
  file downloads/opens
