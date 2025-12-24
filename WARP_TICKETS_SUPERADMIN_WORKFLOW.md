# EPIC: SuperAdmin Firm Workflow Control Panel (SOP-01 → SOP-03)

**Outcome:**
From the **SuperAdmin Firm Detail** page, an admin can:

* See workflow status: Intakes → SOP-01 → Discovery → Roadmap
* Generate SOP-01 diagnostics
* View/edit Discovery Call notes
* Generate the Roadmap (SOP-03)
* See documents organized by type

No CLI spawning from HTTP. Controllers must use TS services.

---

## SA-1 – Backend: Firm Workflow Status Endpoint

**Goal:**
Expose a single JSON endpoint showing where a firm is in the pipeline.

**Files:**

* `backend/src/routes/superadmin.routes.ts`
* `backend/src/controllers/superadmin.controller.ts` (or equivalent)
* Uses existing `intakes`, `tenantDocuments`, `tenants`, `discoveryCallNotes` tables.

**Implementation:**

1. **Route**

Add to `superadmin.routes.ts` after the firm detail route:

```ts
router.get(
  '/firms/:tenantId/workflow-status',
  superadminController.getFirmWorkflowStatus
);
```

2. **Controller**

Implement `getFirmWorkflowStatus`:

* Input: `tenantId` from `req.params`.

* Queries:

  * `intakes` for this tenant:

    * Determine which roles have **completed** intakes:

      * `rolesCompleted = new Set(intakes.filter(i => i.completedAt).map(i => i.role))`
      * `intakesComplete = ['owner','ops','sales','delivery'].every(role => rolesCompleted.has(role))`
  * `tenantDocuments` for SOP-01:

    * Filter `tenantId`, `sopNumber = 'SOP-01'`
    * `sop01Complete = ['Output-1','Output-2','Output-3','Output-4'].every(out => docs.some(d => d.outputNumber === out))`
  * `discoveryCallNotes`:

    * Latest note by `createdAt` for this tenant
  * `tenants`:

    * Read `discoveryComplete` for this tenant
    * `discoveryComplete = !!discoveryNote && !!tenant.discoveryComplete`
  * `tenantDocuments` for Roadmap:

    * Filter `tenantId`, `category = 'roadmap'`
    * `roadmapComplete = [ 'summary', '01-executive-summary', '02-diagnostic-analysis', '03-system-architecture', '04-high-leverage-systems', '05-implementation-plan', '06-sop-pack', '07-metrics-dashboard', '08-appendix' ].every(section => roadmapDocs.some(d => d.section === section))`

* Response shape (exact):

```jsonc
{
  "intakes": {
    "complete": boolean,
    "rolesCompleted": string[],
    "totalIntakes": number
  },
  "sop01": {
    "complete": boolean,
    "documents": [
      { "id": string, "outputNumber": string }
    ]
  },
  "discovery": {
    "complete": boolean,
    "hasNotes": boolean,
    "lastUpdatedAt": string | null
  },
  "roadmap": {
    "complete": boolean,
    "sectionsCount": number
  }
}
```

**Acceptance Criteria:**

* For a tenant with:

  * 4 completed intakes,
  * all 4 SOP-01 outputs,
  * discovery notes saved + `discoveryComplete = true`,
  * all 9 roadmap documents:
    → all `*.complete` fields must be `true`.
* For a tenant missing any of those, the corresponding `complete` must be `false`.
* 404 if tenant does not exist.

---

## SA-2 – Backend: SOP-01 Generation Endpoint

**Goal:**
Allow SuperAdmin to trigger SOP-01 generation **via services**, not CLI.

**Files:**

* `backend/src/routes/superadmin.routes.ts`
* `backend/src/controllers/superadmin.controller.ts`
* New service helper (if not already present), e.g.
  `backend/src/services/sop01Persistence.ts`

**Implementation:**

1. **Route**

```ts
router.post(
  '/firms/:tenantId/generate-sop01',
  superadminController.generateSop01ForFirm
);
```

2. **Service wrapper (reuse existing logic)**

Implement `persistSop01OutputsForTenant(tenantId, outputs)` reusing the T4 logic currently used by the CLI script:

* Ensure directory: `storage/sop01/<tenantId>/`
* Write:

  * `output1_company_diagnostic_map.md`
  * `output2_ai_leverage_map.md`
  * `output3_discovery_call_questions.md`
  * `output4_roadmap_skeleton.md`
* Upsert `tenant_documents` records with:

  * `category = 'sop_output'`
  * `sopNumber = 'SOP-01'`
  * `outputNumber = 'Output-1'..'Output-4'`
  * `filePath`, `fileSize`, `title`, `description`, `uploadedBy`, etc.

3. **Controller**

```ts
export async function generateSop01ForFirm(req: Request, res: Response) {
  const { tenantId } = req.params;

  // Optional: check tenant exists
  const normalized = await buildNormalizedIntakeContext(tenantId);
  const outputs = await generateSop01Outputs(normalized);
  await persistSop01OutputsForTenant(tenantId, outputs);

  return res.json({ ok: true });
}
```

**Acceptance Criteria:**

* POST to `/api/superadmin/firms/:tenantId/generate-sop01`:

  * Generates/overwrites the 4 SOP-01 markdown files.
  * Upserts 4 `tenant_documents` records.
  * Returns `{ ok: true }` with HTTP 200.
* If intakes are missing, response should be a 4xx with clear error, **or** still generate with many "missing data" flags (define behavior explicitly in code comments).

---

## SA-3 – Backend: Discovery Notes Get/Save Endpoints

**Goal:**
SuperAdmin can fetch and save discovery call notes tied to `discovery_call_notes` + `tenants.discoveryComplete`.

**Files:**

* `backend/src/routes/superadmin.routes.ts`
* `backend/src/controllers/superadmin.controller.ts`
* Uses existing:

  * `saveDiscoveryCallNotes`
  * `getLatestDiscoveryCallNotes`

**Implementation:**

1. **Routes**

```ts
router.get(
  '/firms/:tenantId/discovery-notes',
  superadminController.getDiscoveryNotesForFirm
);

router.post(
  '/firms/:tenantId/discovery-notes',
  superadminController.saveDiscoveryNotesForFirm
);
```

2. **Controllers**

```ts
export async function getDiscoveryNotesForFirm(req: Request, res: Response) {
  const { tenantId } = req.params;
  const note = await getLatestDiscoveryCallNotes(tenantId);

  return res.json({
    notes: note?.notes ?? '',
    updatedAt: note?.updatedAt ?? null,
  });
}

export async function saveDiscoveryNotesForFirm(req: Request, res: Response) {
  const { tenantId } = req.params;
  const { notes } = req.body;

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  await saveDiscoveryCallNotes({
    tenantId,
    ownerId: tenant.ownerId,
    notes,
  });

  return res.json({ ok: true });
}
```

**Acceptance Criteria:**

* GET returns `{ notes: string, updatedAt: string|null }`.
* POST with `{ notes: "..." }`:

  * Upserts a `discovery_call_notes` record.
  * Sets `tenants.discoveryComplete = true`.
  * Returns `{ ok: true }`.
* On invalid tenant, return 404 JSON `{ error: 'Tenant not found' }`.

---

## SA-4 – Backend: Roadmap Generation Endpoint (SOP-03)

**Goal:**
SuperAdmin can generate full Roadmap sections via HTTP.

**Files:**

* `backend/src/routes/superadmin.routes.ts`
* `backend/src/controllers/superadmin.controller.ts`
* New helper: `persistRoadmapSectionsForTenant` (wrap existing script logic)

**Implementation:**

1. **Route**

```ts
router.post(
  '/firms/:tenantId/generate-roadmap',
  superadminController.generateRoadmapForFirm
);
```

2. **Service wrapper**

Implement `persistRoadmapSectionsForTenant(tenantId, sections)` using your updated `generateRoadmapFromIntakes.ts` logic:

* Ensure `storage/roadmaps/<tenantId>/`.
* For each key:

  * `summary`, `01-executive-summary`, ..., `08-appendix`:

    * Write file using the same filename map as the script.
    * Upsert `tenant_documents` record with:

      * `category = 'roadmap'`
      * `section = sectionKey`
      * `filePath`, `fileSize`, `title`, etc.

3. **Controller**

```ts
export async function generateRoadmapForFirm(req: Request, res: Response) {
  const { tenantId } = req.params;

  await assertRoadmapReady(tenantId); // throws if discovery not complete

  const context = await buildRoadmapContext(tenantId);
  const sections = await generateRoadmapSections(context);
  await persistRoadmapSectionsForTenant(tenantId, sections);

  return res.json({ ok: true });
}
```

**Acceptance Criteria:**

* If discovery prereqs are **not** met, endpoint returns 4xx with clear error from `RoadmapPrereqError`.
* If prereqs satisfied:

  * Writes 9 roadmap markdown files.
  * Upserts 9 `tenant_documents` rows.
  * Returns `{ ok: true }`.

---

## SA-5 – Frontend API: superadminApi Extensions

**Goal:**
Expose the new backend endpoints to the front-end.

**File:**

* `frontend/src/superadmin/api.ts`

**Implementation:**

Add functions:

```ts
async function getFirmWorkflowStatus(tenantId: string) { ... }
async function generateSop01(tenantId: string) { ... }
async function getDiscoveryNotes(tenantId: string) { ... }
async function saveDiscoveryNotes(tenantId: string, notes: string) { ... }
async function generateRoadmap(tenantId: string) { ... }
```

All must:

* Read `token` from `localStorage`.
* Set `Authorization: Bearer ${token}` header.
* Throw on non-2xx responses with a helpful message (parse JSON `error` if present).

Export them on `superadminApi`.

**Acceptance Criteria:**

* Each function returns parsed JSON on success.
* Each function throws on non-OK status with a human-readable error.

---

## SA-6 – Frontend: Workflow Card on SuperAdminFirmDetailPage

**Goal:**
Expose status of Intakes → SOP-01 → Discovery → Roadmap plus action buttons.

**File:**

* `frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx`

**Implementation:**

1. **State:**

Add:

```ts
const [workflowStatus, setWorkflowStatus] = useState<any | null>(null);
const [loadingStatus, setLoadingStatus] = useState(false);
const [runningSop01, setRunningSop01] = useState(false);
const [runningRoadmap, setRunningRoadmap] = useState(false);
const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
const [discoveryDraft, setDiscoveryDraft] = useState('');
const [savingDiscovery, setSavingDiscovery] = useState(false);
```

2. **Fetch workflow status:**

Extend `useEffect` to call `fetchWorkflowStatus()` after `getFirmDetail` and `fetchDocuments()`:

```ts
async function fetchWorkflowStatus() {
  if (!params?.tenantId) return;
  setLoadingStatus(true);
  try {
    const status = await superadminApi.getFirmWorkflowStatus(params.tenantId);
    setWorkflowStatus(status);
  } catch (err) {
    console.error('Failed to fetch workflow status', err);
  } finally {
    setLoadingStatus(false);
  }
}
```

3. **Action handlers:**

Implement:

```ts
async function handleGenerateSop01() { ... }
async function openDiscoveryModal() { ... }
async function handleSaveDiscovery() { ... }
async function handleGenerateRoadmap() { ... }
```

As I outlined earlier:

* `handleGenerateSop01`:

  * calls `superadminApi.generateSop01`
  * refreshes documents + workflow status
* `openDiscoveryModal`:

  * preloads existing notes via `getDiscoveryNotes`
* `handleSaveDiscovery`:

  * calls `saveDiscoveryNotes`
  * closes modal, refreshes workflow
* `handleGenerateRoadmap`:

  * calls `generateRoadmap`
  * refreshes documents + workflow status

4. **UI: Workflow Card + StatusRow component**

In the right-hand column (beside Recent Activity), replace the single `Card` with a `space-y-4` block containing:

* `Card title="Workflow"` with status + buttons
* `Card title="Recent Activity"` (existing block moved inside)

Use the StatusRow helper (as in my prior message) to show 4 rows:

* Intakes
* SOP-01 Diagnostics
* Discovery Call
* Roadmap

Buttons:

* "Generate SOP-01 Diagnostic"

  * `disabled` unless `workflowStatus.intakes.complete === true`
* "Edit Discovery Notes"
* "Generate Roadmap"

  * `disabled` unless `workflowStatus.discovery.complete === true`

**Acceptance Criteria:**

* When the page loads, Workflow card shows correct status for a seeded tenant.
* Buttons update status appropriately after calls.
* Error messages from backend surface via existing `setError`.

---

## SA-7 – Frontend: Discovery Notes Modal

**Goal:**
Modal to view/edit discovery notes inline from SuperAdminFirmDetailPage.

**File:**

* `frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx`

**Implementation:**

Add JSX near bottom (next to `IntakeModal` / `DocumentUploadModal`):

* Full-screen overlay `div` with centered card.
* `textarea` bound to `discoveryDraft`.
* Cancel + Save buttons.

Behavior:

* Opening modal calls `openDiscoveryModal` → preloads existing notes.
* "Save" calls `handleSaveDiscovery`.
* Show `Saving…` state while request in flight.

**Acceptance Criteria:**

* Clicking "Edit Discovery Notes" opens modal with pre-populated text if previously saved.
* Editing + Saving persists to backend and updates `workflowStatus.discovery.complete` to true if not already.
* Closing modal without saving does not mutate backend.

---

## SA-8 – Frontend: Document Grouping (Optional Polish)

**Goal:**
Make the Documents card reflect pipeline structure (SOP-01 vs Roadmap vs Other).

**File:**

* `frontend/src/superadmin/pages/SuperAdminFirmDetailPage.tsx` (Documents card)

**Implementation:**

Inside the Documents card, instead of a flat list:

* Create three arrays:

```ts
const sop01Docs = documents.filter((d) => d.sopNumber === 'SOP-01');
const roadmapDocs = documents.filter((d) => d.category === 'roadmap');
const otherDocs = documents.filter((d) => d.sopNumber !== 'SOP-01' && d.category !== 'roadmap');
```

* Render headers only if those arrays have length > 0:

  * "SOP-01 Outputs"
  * "Roadmap Sections"
  * "Other Documents"

Re-use the same document row component.

**Acceptance Criteria:**

* SOP-01 docs appear under "SOP-01 Outputs".
* Roadmap docs appear under "Roadmap Sections".
* Legacy/manual docs appear under "Other Documents".

---

## Execution Order

Execute tickets **SA-1 through SA-7 in sequence**. SA-8 is optional polish once core workflow is working.

If you hand this pack to Warp, there's zero wiggle room:

> "Implement SA-1 through SA-7 exactly as specified. SA-8 is optional polish once the core workflow is working."

That gets you a fully controlled SuperAdmin workflow cockpit wired directly into the pipeline we just built.
