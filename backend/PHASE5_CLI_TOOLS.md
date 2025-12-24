# Phase 5 CLI Tools - Implementation Guide

This document outlines the remaining CLI tools needed for pilot readiness. These are **deferred** to when you actually need to export deliverables for Hayes.

---

## P5-4: Roadmap PDF Export CLI

**Command:** `npm run roadmap:export -- --tenant <id> --roadmap <id>`

**What it does:**
1. Fetches all `roadmap_sections` for the given roadmap
2. Compiles them into a single HTML document with:
   - Title page (tenant name, roadmap version, date)
   - Table of contents (clickable sections)
   - All sections in order with proper styling
   - Status badges (✅ Implemented, 🔄 In Progress, 📋 Planned)
3. Converts HTML → PDF using `puppeteer` or `html-pdf-node`
4. Saves to `storage/exports/roadmap_{tenantId}_{roadmapId}.pdf`
5. Inserts into `tenant_documents` with category `roadmap_export`

**Dependencies:**
```bash
cd backend
pnpm add puppeteer html-pdf-node
```

**Stub file location:** `backend/src/scripts/exportRoadmap.ts`

**Sample implementation:**
```typescript
import puppeteer from 'puppeteer';
import { db } from '../db';
import { roadmapSections, tenantDocuments } from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function exportRoadmapPDF(tenantId: string, roadmapId: string) {
  // 1. Fetch sections
  const sections = await db.query.roadmapSections.findMany({
    where: eq(roadmapSections.roadmapId, roadmapId),
    orderBy: [roadmapSections.sectionNumber],
  });

  // 2. Build HTML
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Strategic AI Roadmap</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1e40af; border-bottom: 2px solid #3b82f6; }
        h2 { color: #1e3a8a; margin-top: 30px; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .implemented { background: #d1fae5; color: #065f46; }
        .in_progress { background: #dbeafe; color: #1e40af; }
        .planned { background: #f3f4f6; color: #374151; }
      </style>
    </head>
    <body>
      <h1>Strategic AI Roadmap</h1>
      <p>Tenant: ${tenantId} | Roadmap: ${roadmapId}</p>
      <hr>
      ${sections.map(s => `
        <h2>
          Section ${s.sectionNumber}: ${s.title}
          <span class="status ${s.status}">${s.status}</span>
        </h2>
        <div>${s.contentMarkdown}</div>
      `).join('')}
    </body>
    </html>
  `;

  // 3. Convert to PDF
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfPath = path.join(__dirname, '../../storage/exports', `roadmap_${tenantId}_${roadmapId}.pdf`);
  await page.pdf({ path: pdfPath, format: 'A4' });
  await browser.close();

  // 4. Insert into tenant_documents
  await db.insert(tenantDocuments).values({
    tenantId,
    ownerId: '...', // Get from tenant
    filename: `roadmap_${roadmapId}.pdf`,
    originalFilename: `Strategic_AI_Roadmap_${roadmapId}.pdf`,
    filePath: pdfPath,
    fileSize: fs.statSync(pdfPath).size,
    mimeType: 'application/pdf',
    category: 'roadmap_export',
    title: `Roadmap Export v${roadmapId}`,
    description: 'Auto-generated roadmap PDF',
  });

  console.log(`✅ Roadmap exported to ${pdfPath}`);
}

// CLI entry
const [tenantId, roadmapId] = process.argv.slice(2);
exportRoadmapPDF(tenantId, roadmapId).catch(console.error);
```

---

## P5-5: Ticket Pack Export CLI

**Command:** `npm run tickets:export -- --tenant <id> --pack <id>`

**What it does:**
1. Fetches `ticket_pack` and all `ticket_instances`
2. Groups by sprint (System 1-8)
3. Generates HTML with:
   - Pack overview (total/done/in_progress/blocked)
   - System-by-system breakdown
   - Status indicators
4. Converts to PDF
5. Saves to `storage/exports/tickets_{tenantId}_{packId}.pdf`

**Stub file:** `backend/src/scripts/exportTickets.ts`

---

## P5-6: Pilot Runbook Tools

### 6a. Snapshot Schedule Generator

**Command:** `npm run pilot:snapshot-schedule -- --tenant <id>`

**Output:**
```
📅 Recommended Snapshot Schedule for Hayes Real Estate

Baseline:  2025-11-25 (Today)
30-day:    2025-12-25
60-day:    2026-01-24
90-day:    2026-02-23

Run these commands on the specified dates:
npm run metrics:capture -- --tenant <id> --label baseline
npm run metrics:capture -- --tenant <id> --label 30d
npm run metrics:capture -- --tenant <id> --label 60d
npm run metrics:capture -- --tenant <id> --label 90d
```

### 6b. Pilot Summary Generator

**Command:** `npm run pilot:summary -- --tenant <id>`

**Output:**
```json
{
  "tenant": "Hayes Real Estate",
  "roadmap": {
    "version": "v1.1",
    "sections": 10,
    "pctComplete": 35
  },
  "tickets": {
    "total": 60,
    "done": 21,
    "in_progress": 12,
    "blocked": 2
  },
  "latestSnapshot": {
    "label": "30d",
    "date": "2025-12-25",
    "nps": 45
  },
  "outcome": {
    "status": "on_track",
    "roi": 125000
  }
}
```

### 6c. Pilot Package Generator

**Command:** `npm run pilot:package -- --tenant <id>`

**Creates ZIP:** `storage/packages/hayes_pilot_package_2025-11-25.zip`

**Contents:**
- `roadmap_v1.1.pdf`
- `tickets_sprint1.pdf`
- `snapshots.json`
- `outcome_summary.json`
- `README.txt` (explains each file)

---

## Implementation Priority for Hayes

**Do these first:**
1. ✅ P5-2 Agent Stability (DONE)
2. ✅ P5-8 Logging (DONE)
3. ✅ P5-10 Frontend Fixes (DONE)

**Do before first demo:**
4. P5-4 Roadmap PDF Export (when you have finalized roadmap content)
5. P5-6a Snapshot Schedule (when you're ready to start tracking metrics)

**Do later (nice-to-have):**
6. P5-5 Ticket Pack Export
7. P5-6b/c Summary/Package tools

---

## Quick Win: Manual Export Workaround

Until CLI is implemented, you can manually export using the database:

```bash
# Export roadmap sections to JSON
psql $DATABASE_URL -c "SELECT * FROM roadmap_sections WHERE roadmap_id='...' ORDER BY section_number" -o roadmap_export.json

# Convert to markdown locally
# Use any markdown → PDF converter
```

---

## When to Implement

- **P5-4**: When Hayes roadmap content is finalized and you need a deliverable PDF
- **P5-5**: When you need to share ticket progress reports with Hayes
- **P5-6**: When running metrics tracking for the pilot (30/60/90 days)

Until then, the platform works perfectly without these export features.
