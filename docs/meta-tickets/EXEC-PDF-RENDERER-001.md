---
ID: EXEC-PDF-RENDERER-001
TITLE: Implement Executive Brief PDF Renderer
OWNER: AG
SCOPE: Backend only

OBJECTIVE
Create a production-safe PDF renderer for Executive Briefs.

TASKS
1. Create directory:
   backend/src/services/pdf/

2. Implement renderer using ONE of:
   - pdfkit (preferred for simplicity)
   - puppeteer (acceptable, heavier)

3. Renderer input:
   {
     tenantName,
     cohortLabel,
     executiveSummary,
     constraintLandscape[], // role-attributed paragraphs
     blindSpotRisks[]       // role-attributed paragraphs
     approvedAt
   }

4. Renderer output:
   - Buffer (NOT file system write)
   - Deterministic formatting:
     - Title page
     - Section headers
     - Role attribution bolded
     - No links
     - No tenant UI references

5. Export function:
   renderExecutiveBriefPDF(data): Promise<Buffer>

CONSTRAINTS
- No external network calls
- No tenant routes
- No feature flags here

DONE WHEN
- PDF renders locally with sample data
- Function returns Buffer without throwing
