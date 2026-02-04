EXECUTION-TICKET: EXEC-PDF-IDEMPOTENT-DELIVER-002

Title:
Make Download Executive Brief Idempotent Under Ephemeral /tmp (Regenerate If Missing)

Status:
APPROVED

Objective:
Ensure “Download PDF” works reliably in production even when:
- PDFs are stored in /tmp (ephemeral)
- The file is missing by the time download is requested
Behavior: if file is missing, regenerate PDF on demand.

Scope (Fail-Closed):
- ONLY affects download handler behavior for executive brief PDF
- NO formatting changes
- NO storage redesign
- NO new dependencies

Files In Scope (Explicit):
1) backend/src/controllers/executiveBrief.controller.ts

Dependencies/Calls In Scope:
- renderPrivateLeadershipBriefToPDF (existing renderer)
- filesystem existence check (fs.access / existsSync)

Implementation Requirements (Surgical):
- In downloadExecutiveBrief handler:
  1) Determine expected filePath (current mechanism)
  2) If file exists: stream/return as currently implemented
  3) If file missing:
     - Call renderPrivateLeadershipBriefToPDF (deterministic, using stored brief/snapshot)
     - Return generated PDF bytes directly OR write to /tmp then stream
  4) Never store /var/task paths in DB as “persisted truth”
