# EPIC: Roadmap OS — Database as Canonical Source of Truth
Version: FINAL
Status: Approved by Tony
Scope: Replace legacy file-based roadmap model with DB-first operating system

---

# Architectural Contract (MANDATORY)
- Roadmap content MUST live in `roadmap_sections`.
- Files (`storage/...`) and `tenant_documents` are **exports only**, NOT canonical content.
- All roadmap generation logic writes directly into `roadmap_sections`.
- All viewers (Owner + SA) read from `roadmap_sections`.
- No code anywhere is allowed to read roadmap content from disk.

---

# RA-1 — Backend: getOrCreateRoadmapForTenant
**Owner:** backend  
**Summary:** Create or fetch roadmap root record for a tenant.  
**Acceptance Criteria:**
- Function: `getOrCreateRoadmapForTenant(tenantId: string): Promise<Roadmap>`
- Lookup tenant + `ownerId`
- Find roadmap by ownerId
- If missing:
  - Create roadmap: `{ ownerId, status='draft', pilotStage=null }`
- Return roadmap instance
**Notes:** Must NOT create duplicates.

---

# RA-2 — Backend: Rewrite Roadmap Generator to Write to DB (Not Files)
**Owner:** backend  
**Summary:** All section content must be inserted/updated in `roadmap_sections`.  
**Acceptance Criteria:**
- Remove all code that writes roadmap .md files during generation
- Remove all "roadmap" `tenant_documents` creation during generation
- For each generated section (0–8):
  ```ts
  upsertRoadmapSection({
    roadmapId,
    sectionNumber,
    sectionName,
    contentMarkdown,
    status: existing?.status ?? 'planned',
    lastUpdatedAt: now(),
    wordCount,
  })
  ```
- Generation MUST complete without requiring filesystem writes
**Notes:** PDF and markdown exports become optional separate operations.

---

# RA-3 — Backend: upsertRoadmapSection Service
**Owner:** backend  
**Summary:** Clean DB upsert for each roadmap section.  
**Acceptance Criteria:**
- Create service: `upsertRoadmapSection(payload)`
- Match on: `(roadmapId, sectionNumber)`
- If existing:
  - Update: `contentMarkdown`, `wordCount`, `lastUpdatedAt`, `sectionName`
  - Preserve `status`
- If new:
  - Insert with `status='planned'`
- Validate:
  - `sectionNumber` ∈ [0…8]
  - `sectionName` matches canonical map

---

# RA-4 — Backfill Script for Existing Tenants
**Owner:** backend  
**Summary:** One-time migration from legacy file-based roadmap documents.  
**Acceptance Criteria:**
- Script: `/scripts/backfill_section_os_from_existing_files.ts`
- For each tenant with legacy roadmap files:
  - Read .md files (TEMPORARY)
  - Write into `roadmap_sections` via RA-3
- After execution:
  - ALL tenants have a complete roadmap_sections set
  - Legacy readers must not be used after migration

---

# RA-5 — Owner Frontend: Roadmap Viewer Uses OS Only
**Owner:** frontend  
**Summary:** Owner "Open Roadmap" page must read ONLY from `roadmap_sections`.  
**Acceptance Criteria:**
- Create endpoint: `GET /api/roadmap/:tenantId/sections`
- Returns array of:
  ```json
  {
    sectionNumber,
    sectionName,
    status,
    lastUpdatedAt,
    wordCount,
    contentMarkdown
  }
  ```
- Owner roadmap viewer:
  - MUST NOT read files or tenant_documents for roadmap content  
  - MUST render from DB results only  
**Notes:** This moves entire viewer onto the OS layer.

---

# RA-6 — SuperAdmin: Roadmap OS Panel (New UI Card)
**Owner:** frontend  
**Summary:** Add detailed OS view in SuperAdminFirmDetailPage.  
**Acceptance Criteria:**
- Backend endpoint:  
  `GET /api/superadmin/firms/:tenantId/roadmap-os`
- Returns: roadmap root + all `roadmap_sections`
- New card: "Roadmap OS"
  - Roadmap ID
  - Roadmap status
  - Table of sections:
    - `#`, `Name`, `Status`, `Last Updated`, `Word Count`
    - "View Markdown" (modal)
- MUST NOT read from tenant_documents for roadmap content.

---

# RA-7 — Export Layer (Optional, Downstream Only)
**Owner:** backend  
**Summary:** Markdown/PDF exports generated FROM OS, not the other way around.  
**Acceptance Criteria:**
- MARKDOWN EXPORT:
  - Endpoint: `POST /api/superadmin/firms/:tenantId/export/markdown`
  - Generate .md files from `roadmap_sections`
  - Write to disk only as export
  - Insert `tenant_documents` rows with `category='roadmap_export'`
- PDF EXPORT:
  - Same pattern
- IMPORTANT:
  - Exports must NEVER be re-ingested as canonical content.

---

# Completion Criteria for Entire EPIC
- Roadmap generation uses DB as source of truth.
- All roadmap readers use DB as source of truth.
- Filesystem used ONLY for exports.
- Legacy file-based logic fully removed or disabled.
- Hayes roadmap and all future firms operate entirely in the OS layer.
