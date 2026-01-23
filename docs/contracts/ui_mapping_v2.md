# SUPERADMIN & TENANT UI MAPPING (v2)

## SUPERADMIN PANEL (EXECUTION SURFACE)

### Left Rail: Execution Pipeline
The left rail must strictly follow the canonical lifecycle sequence.

#### 1. Intake
- [ ] **Badge**: `OPEN` | `GATHERED` | `LOCKED 🔒`
- [ ] **Logic**: 
  - Show "GATHERED" when `windowClosed=true` but `lockedAt=null`.
  - Show "LOCKED" when `lockedAt!=null`.

#### 2. Executive Brief
- [ ] **Badge**: `DRAFT` | `GENERATED` | `REVIEWED`
- [ ] **Primary Action**: "Review Brief" (Opens Modal)
- [ ] **Secondary Action**: "Mark Consultation Complete" (Visible if `generated`, sets `reviewed=true`)

#### 3. Intake Finalization (Explicit Step)
- [ ] **Condition**: Visible only when `windowClosed=true`
- [ ] **Action**: "Lock Intakes" (Button)
- [ ] **Warning**: "Freezes intake data for downstream artifacts."
- [ ] **State Side-Effect**: Sets `intakeLockedAt = now()`

#### 4. Diagnostics
- [ ] **Badge**: `NOT GENERATED` | `GENERATED` | `LOCKED` | `PUBLISHED`
- [ ] **Condition**: "Generate" button DISABLED until `intakeLockedAt != null`.
- [ ] **Tooltip**: "Intakes must be locked before generating diagnostics."
- [ ] **Actions**:
  - `Generate` -> `Review` -> `Lock` -> `Publish`

#### 5. Discovery Call
- [ ] **Badge**: `DRAFT` | `INGESTED`
- [ ] **Condition**: ENABLED only if `diagnosticStatus == 'published'`.
- [ ] **Action**: "Ingest Discovery Notes" (Modal/Input)
- [ ] **Note**: "Additive only. Does not invalidate diagnostics."

#### 6. Ticket Moderation
- [ ] **Badge**: `PENDING` | `APPROVED`
- [ ] **Condition**: ENABLED only if `discoveryNotesStatus == 'ingested'`.
- [ ] **Actions**:
  - "Generate SOP Tickets" (First run)
  - "Moderate Tickets" (Table view)

#### 7. Roadmap Assembly
- [ ] **Badge**: `LOCKED` | `READY` | `DELIVERED`
- [ ] **Condition**: ENABLED only if `allTicketsApproved == true`.
- [ ] **Action**: "Assemble Roadmap"

---

## TENANT PORTAL (LEAD VIEW)

### Visibility Rules
The Tenant Portal is strictly a "Read Only" view of **Published** artifacts.

#### 1. Diagnostics Tab
- [ ] **Condition**: Show only if `diagnosticStatus == 'published'`.
- [ ] **Data Source**: Must pull strictly from the `published` snapshot version.
- [ ] **Fallback**: If not published, show "Analysis in Progress" placeholder.

#### 2. Roadmap Tab
- [ ] **Condition**: Show only if `roadmapStatus == 'delivered'`.
- [ ] **Data Source**: Pulls finalized Roadmap PDF / Link.

#### 3. HIDDEN (NEVER SHOW)
- [ ] Executive Brief
- [ ] Discovery Notes (Raw)
- [ ] Internal Ticket Comments
- [ ] Draft States

---

## IMPLEMENTATION CHECKLIST

- [ ] Update `SuperAdminFirmDetail` to use new `TenantLifecycleState` derivation.
- [ ] Add explicit "Lock Intake" button to `IntakeCard`.
- [ ] Disable "Generate Diagnostics" until intake lock is present.
- [ ] Add "Publish" step to Diagnostics workflow.
- [ ] Add "Discovery Notes" ingestion form (new component).
- [ ] Gate SOP Generation behind Discovery Notes.
