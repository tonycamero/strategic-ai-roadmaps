# CR-HARDEN-ROADMAP-GEN-DISCOVERY-GATED-2: Discovery Synthesis Contract

## 1. Overview
The Discovery Call is the authoritative bridge between AI signals (SOP-01) and Execution (Roadmap).
Tickets MUST NEVER be generated directly from SOP-01 output. They must be explicitly selected and shaped by the human operator via the Discovery process.

## 2. Artifact Definition (`DISCOVERY_SYNTHESIS_V1`)
This artifact is stored in `tenant_documents` with category `DISCOVERY_SYNTHESIS_V1`.

**Canonical Structure:**
```typescript
interface DiscoverySynthesis {
  tenantId: string; // UUID
  diagnosticId: string; // UUID or string handle (diag_...)
  
  // High-level system opportunities identified during call
  synthesizedSystems: string[];
  
  // THE CRITICAL GATE: Selected Inventory Items
  // Must be >= 12 items for valid roadmap generation.
  selectedInventory: {
    inventoryId: string;        // Matches canonical Inventory Library ID
    tier: 'core' | 'recommended' | 'advanced';
    sprint: 30 | 60 | 90;       // Execution Phase
    notes?: string;             // Operator rationale
  }[];
  
  // Explicit exclusions (why we DIDN'T pick something recommendation)
  exclusions: string[];
  
  // Human/Operator synthesis notes
  operatorNotes: string;
  
  confidenceLevel: 'high' | 'medium' | 'low';
  
  metadata?: {
    synthesizedAt: string;         // ISO Date
    synthesizedByUserId?: string;  // Operator ID
  }
}
```

## 3. Workflow Gating Rules
The Roadmap Generation API (`POST /api/superadmin/tickets/generate`) enforces the following invariants:

1.  **Existence:** Failure if no `DISCOVERY_SYNTHESIS_V1` artifact exists for the tenant.
2.  **Volume:** Failure if `selectedInventory.length < 12`.
3.  **Integrity:** Failure if `inventoryId` does not map to a valid entry in the Canonical Inventory Library.
4.  **Completeness:** Failure if `tier` or `sprint` are missing for any selection.

## 4. State Transitions
| State | Trigger | Result |
|-------|---------|--------|
| **Diagnostic Generated** | SOP-01 Run | `sop_tickets` count = 0. UI shows "Findings Pending". |
| **Discovery Complete** | Operator Save | `DISCOVERY_SYNTHESIS_V1` saved. Tickets NOT generated yet. |
| **Tickets Generated** | Generate Action | Tickets hydrated from Inventory Library. `sop_tickets` count >= 12. |
| **Roadmap Ready** | Moderation | All tickets approved/rejected. |

## 5. Persistence Behavior
When tickets are generated from Discovery:
- **Primary Key:** `sop_tickets.id` = `randomUUID()` (UUIDv4)
- **Foreign Key:** `sop_tickets.diagnostic_id` = `synthesis.diagnosticId`
- **Content:** Hydrated strictly from the `inventory.json` definition (Gold Master), NOT from the Discovery notes or SOP-01 text.
- **Customization:** Operator notes are appended to `admin_notes` or `roi_notes`, but core implementation steps remain canonical.
