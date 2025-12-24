# 🚀 Roadmap System — Warp Ticket Pack (Lean V1)

**Goal:** Production-ready roadmap viewer + Assistant integration in ~3 hours.

No schema changes. No over-engineering. Just ship.

---

## 📋 **TICKET 1 — Roadmap API Routes (30 min)**

### Backend: Roadmap Controller & Routes

Create file: `backend/src/controllers/roadmap.controller.ts`

```typescript
// Functions to implement:
// - getRoadmapSections(tenantId) → list all roadmap documents for tenant
// - getRoadmapSection(tenantId, sectionName) → get specific section content
// - uploadRoadmapSection(tenantId, sectionName, content) → store in tenant_documents

// Query tenant_documents where category = 'roadmap' and tenantId matches
// Return: { section: string, title: string, content: string (from filePath) }
```

Create file: `backend/src/routes/roadmap.routes.ts`

```typescript
// Routes:
// GET /api/roadmap/sections → getRoadmapSections (owner + superadmin)
// GET /api/roadmap/sections/:sectionName → getRoadmapSection (owner + superadmin)
// POST /api/roadmap/sections/:sectionName → uploadRoadmapSection (owner + superadmin)
```

Wire in `backend/src/index.ts`:
```typescript
import roadmapRoutes from './routes/roadmap.routes';
app.use('/api/roadmap', roadmapRoutes);
```

**Acceptance:**
- `/api/roadmap/sections` returns empty array (no roadmaps yet)
- Routes are authenticated (owner + superadmin only)

---

## 📋 **TICKET 2 — Roadmap Viewer Component (60 min)**

### Frontend: RoadmapViewer.tsx

Create file: `frontend/src/pages/RoadmapViewer.tsx`

**Requirements:**
- Left sidebar: List of 8 sections + summary (pulled from `/api/roadmap/sections`)
- Right content area: Markdown rendering with syntax highlighting
- Use `react-markdown` for rendering
- Use `remark-gfm` for GitHub-flavored markdown
- Use `rehype-highlight` for code block syntax
- Support Mermaid diagrams (use `mermaid` npm package)
- Dark mode matching dashboard (Tailwind dark: classes)
- Mobile responsive (sidebar collapses to hamburger on mobile)

**Layout:**
```
┌────────────────────────────────────┐
│ Sidebar (w-64)  │ Content (flex-1) │
│                 │                  │
│ • Summary       │ # Section Title  │
│ • Section 1     │                  │
│ • Section 2     │ Markdown content │
│ • Section 3     │ with syntax      │
│ ...             │ highlighting     │
└────────────────────────────────────┘
```

**State Management:**
```typescript
const [sections, setSections] = useState([]);
const [activeSection, setActiveSection] = useState('summary');
const [content, setContent] = useState('');
```

**Acceptance:**
- Sidebar renders section list
- Clicking section loads its content
- Markdown renders with proper styling
- Code blocks have syntax highlighting
- Mobile responsive

---

## 📋 **TICKET 3 — Inline Chat Bubble (45 min)**

### Frontend: Section-Scoped Chat in RoadmapViewer

Modify `frontend/src/pages/RoadmapViewer.tsx`:

Add floating chat bubble (bottom right) that:
- Shows current section context: "Viewing: {sectionName}"
- Sends section context with each message:
  ```typescript
  fetch('/api/assistant/query', {
    body: JSON.stringify({ 
      message: userInput,
      roleType: 'owner',
      context: { roadmapSection: activeSection }
    })
  })
  ```

Update `backend/src/services/assistantQuery.service.ts`:
- If `context.roadmapSection` exists, prepend to message:
  ```typescript
  const contextualMessage = context?.roadmapSection 
    ? `[User is viewing roadmap section: ${context.roadmapSection}]\n\n${message}`
    : message;
  ```

**Acceptance:**
- Chat bubble appears in roadmap viewer
- Messages include section context
- Assistant responds with section-aware answers

---

## 📋 **TICKET 4 — Route Setup (15 min)**

### Frontend: Routing

Add route in `frontend/src/App.tsx`:
```typescript
<Route path="/roadmap" component={RoadmapViewer} />
```

Update Dashboard Roadmap Card button:
```typescript
<Link href="/roadmap">
  <button>View Roadmap</button>
</Link>
```

Add SuperAdmin preview route:
```typescript
<Route path="/superadmin/tenant/:tenantId/roadmap" component={RoadmapViewerWithTenant} />
```

Create `RoadmapViewerWithTenant.tsx`:
- Same as RoadmapViewer but reads `tenantId` from URL params
- Fetches `/api/roadmap/sections?tenantId={tenantId}`

**Acceptance:**
- `/roadmap` route works for logged-in owner
- Dashboard button navigates to roadmap
- SuperAdmin can view any tenant's roadmap via URL

---

## 📋 **TICKET 5 — Hayes Roadmap Scaffold (30 min)**

### Create Hayes Roadmap Files

Create folder: `backend/storage/roadmaps/hayes/`

Create files:
- `summary.md`
- `01-executive-summary.md`
- `02-diagnostic-analysis.md`
- `03-system-architecture.md`
- `04-high-leverage-ai-systems.md`
- `05-implementation-plan.md`
- `06-sop-pack.md`
- `07-metrics-dashboard.md`
- `08-appendix.md`

Each file template:
```markdown
# Section N: Title

## Overview
Brief intro

## Key Points
- Point 1
- Point 2

## Recommendations
What to do next

## Timeline
When to do it
```

**Acceptance:**
- All 9 files exist in Hayes folder
- Files are valid markdown with basic structure

---

## 📋 **TICKET 6 — Roadmap Upload Script (30 min)**

### Backend: Upload Hayes Roadmap to DB

Create script: `backend/src/scripts/upload_hayes_roadmap.ts`

```typescript
// For each .md file in storage/roadmaps/hayes/:
//   - Read file content
//   - Insert into tenant_documents:
//       category: 'roadmap'
//       title: extracted from first heading
//       filePath: relative path to file
//       section: extracted from filename (e.g., '01-executive-summary' → 'executive-summary')
//       tenantId: Hayes tenant ID
```

Run with: `npx tsx src/scripts/upload_hayes_roadmap.ts`

**Acceptance:**
- Script inserts 9 documents into tenant_documents
- Query shows roadmap documents for Hayes tenant

---

## 📋 **TICKET 7 — Assistant Provisioning Enhancement (45 min)**

### Backend: Roadmap-Aware Instructions

Modify `backend/src/services/assistantProvisioning.service.ts`:

In `composeInstructions()`, add after role playbook:

```typescript
// Add roadmap context if roadmap exists
const roadmapDocs = await db.query.tenantDocuments.findMany({
  where: and(
    eq(tenantDocuments.tenantId, config.tenantId),
    eq(tenantDocuments.category, 'roadmap')
  )
});

if (roadmapDocs.length > 0) {
  parts.push(`
Strategic Context:
This firm has a completed Strategic AI Roadmap with ${roadmapDocs.length} sections.

When providing recommendations:
- Anchor guidance in the roadmap's vision and goals
- Reference specific roadmap sections when relevant
- Frame suggestions within the roadmap's implementation timeline
- Use roadmap terminology and system names consistently
  `);
}
```

**Acceptance:**
- Re-provision Hayes Assistant
- Instructions include roadmap context
- Assistant can reference roadmap in answers

---

## 📋 **TICKET 8 — Vector Store Upload (30 min)**

### Backend: Add Roadmap Files to Vector Store

Modify `backend/src/services/assistantProvisioning.service.ts`:

In `ensureVectorStore()`, add roadmap file upload:

```typescript
// After fetching documents, filter roadmap docs separately
const roadmapDocs = docs.filter(d => d.category === 'roadmap');

if (roadmapDocs.length > 0) {
  console.log(`[Provisioning] Found ${roadmapDocs.length} roadmap sections`);
  
  // Upload roadmap files to vector store
  // Note: Implement file upload based on your storage backend
  // For now, log that roadmap docs exist
}
```

**Acceptance:**
- Re-provision updates vector store
- Assistant can retrieve roadmap content via file_search

---

## 📋 **TICKET 9 — Verification Tests (20 min)**

### Test Roadmap System End-to-End

Manual tests:
1. Log in as Hayes owner
2. Click "View Roadmap" button
3. Verify all 9 sections load
4. Click through each section
5. Open chat bubble
6. Ask: "Summarize our roadmap in 5 bullets"
7. Ask: "What systems are we building?"
8. Ask: "What's our 90-day plan?"

Expected: Assistant answers with Hayes-specific roadmap details

Create test script: `backend/src/scripts/test_roadmap_assistant.ts`
- Automate verification queries
- Check responses contain roadmap keywords

**Acceptance:**
- All 9 sections render in viewer
- Chat provides roadmap-aware answers
- SuperAdmin can view Hayes roadmap

---

# ⏱️ **Timeline Summary**

**Total: ~4 hours**

- Ticket 1: 30 min (API routes)
- Ticket 2: 60 min (Viewer UI)
- Ticket 3: 45 min (Chat bubble)
- Ticket 4: 15 min (Routing)
- Ticket 5: 30 min (Hayes scaffold)
- Ticket 6: 30 min (Upload script)
- Ticket 7: 45 min (Provisioning)
- Ticket 8: 30 min (Vector store)
- Ticket 9: 20 min (Testing)

---

# 🎯 **Success Criteria**

✅ Hayes roadmap viewable at `/roadmap`  
✅ All 8 sections + summary render with proper markdown  
✅ Chat bubble provides section-aware answers  
✅ SuperAdmin can view at `/superadmin/tenant/{id}/roadmap`  
✅ Assistant references roadmap in responses  
✅ Mobile responsive  

---

# 🚫 **Out of Scope (Phase 2)**

- PDF export
- Analytics tracking
- Comments/annotations
- Version history
- Custom branding
- Advanced search

---

**Start with Ticket 1. One at a time. Ship by Sunday morning.**
