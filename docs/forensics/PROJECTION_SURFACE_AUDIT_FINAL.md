# Forensic Audit: Full Projection Surface for Stage 6 Authority
**Status:** COMPLETE
**Target Ticket:** META-TICKET-PROJECTION-COMPLETE-SURFACE-001
**Authority:** SCEND CANON 001

## 1. Full Type Definition (`TenantLifecycleView`)
File: `backend/src/services/tenantStateAggregation.service.ts`

```typescript
export interface TenantLifecycleView {
    identity: {
        tenantId: string
        tenantName: string
        ownerUserId?: string | null
        status: string
    }

    lifecycle: {
        intakeWindowState: "OPEN" | "CLOSED"
        intakeVersion: number
        currentPhase: string
    }

    governance: {
        executiveBriefStatus: "NONE" | "DRAFT" | "APPROVED" | "DELIVERED"
        governanceLocked: boolean
        approvedAt?: string
        approvedBy?: string
        deliveredAt?: string
        deliveredTo?: string
    }

    workflow: {
        intakesComplete: boolean
        rolesCompleted: string[]
        completedIntakeCount: number
        hasOwnerIntake: boolean
        vectorCount: number
        sop01Complete: boolean
        discoveryComplete: boolean
        findingsComplete: boolean
        roadmapComplete: boolean
        hasOutstandingClarifications: boolean
        hasPendingCoachingFeedback: boolean
        discoveryIngested: boolean
    }

    tickets: {
        total: number
        pending: number
        approved: number
        rejected: number
    }

    artifacts: {
        hasExecutiveBrief: boolean
        diagnostic: {
            exists: boolean
            status?: 'generated' | 'locked' | 'published'
        }
        hasRoadmap: boolean
        hasCanonicalFindings: boolean
    }

    operator: {
        confirmedSufficiency: boolean
        confirmedSufficiencyAt?: string | null
    }

    analytics: {
        frictionMap: {
            totalTickets: number;
            rejectedTickets: number;
            manualWorkflowsIdentified: number;
            strategicMisalignmentScore: number;
            highPriorityBottlenecks: number;
        };
        capacityROI: {
            projectedHoursSavedWeekly: number;
            speedToValue: 'LOW' | 'MEDIUM' | 'HIGH';
        };
    }

    derived: {
        canLockIntake: boolean
        canGenerateDiagnostic: boolean
        canLockDiagnostic: boolean
        canPublishDiagnostic: boolean
        canIngestDiscoveryNotes: boolean
        canGenerateTickets: boolean
        canAssembleRoadmap: boolean
        canReopenIntake: boolean
        synthesis: {
            ready: boolean
        }
        blockingReasons: string[]
    }

    capabilities: {
        lockIntake: { allowed: boolean; reasons: string[] }
        generateDiagnostic: { allowed: boolean; reasons: string[] }
        generateSynthesis: { allowed: boolean; reasons: string[] }
        lockDiagnostic: { allowed: boolean; reasons: string[] }
        publishDiagnostic: { allowed: boolean; reasons: string[] }
        ingestDiscoveryNotes: { allowed: boolean; reasons: string[] }
        generateTickets: { allowed: boolean; reasons: string[] }
        assembleRoadmap: { allowed: boolean; reasons: string[] }
        declareCanonicalFindings: { allowed: boolean; reasons: string[] }
    }

    meta: {
        projectionVersion: string
        computedAt: string
    }
}
```

## 2. Artifact Surfaces
| Artifact Class | Origin (Table/File) | Projection Field | Shape | Type |
| :--- | :--- | :--- | :--- | :--- |
| **Owner Vectors** | `intake_vectors` | `workflow.vectorCount` | number | Pass-through count |
| **Executive Brief** | `executive_briefs` | `governance.executiveBriefStatus` | string enum | Pass-through status |
| **Diagnostic** | `diagnostics` | `artifacts.diagnostic` | `{ exists: boolean, status?: string }` | Pass-through status |
| **Canon Findings** | `tenantDocuments` (cat: `findings_canonical`) | `artifacts.hasCanonicalFindings` | boolean | Presence check |
| **Roadmap** | `roadmaps` | `artifacts.hasRoadmap` | boolean | Presence check |

## 3. Assisted Synthesis Surface
- **Proposed Findings:** **GHOSTED**. Not present in projection or database schema beyond ephemeral agent context.
- **Accepted Findings:** Not distinct from Canonical Findings.
- **Finding IDs/Counts:** **NOT EXPOSED**. Only boolean presence is projected.
- **Readiness to Declare:** Yes, exposed via `capabilities.declareCanonicalFindings`.

## 4. Ticket Surface
- **`tickets_draft` (Stage 6):** **GHOSTED**. The projection only reads from `sop_tickets` (legacy table).
- **Moderation Sessions:** **GHOSTED**. No session state or ID is projected.
- **Accepted Ticket IDs:** **NOT EXPOSED**. Only counts of approved/rejected are projected.
- **Roadmap-Ready:** Yes, `capabilities.assembleRoadmap` (requires `pending == 0`).

## 5. Scope & Scale Constraints
- **Ticket Count Limits:** **MISSING**. Projection does not enforce or expose any "envelope" bounds.
- **Complexity/Scale:** `teamHeadcount` and `firmSizeTier` (from `tenants` table) are **NOT** utilized in the projection to constrain capabilities.
- **Namespace/Adapter:** **MISSING**.

## 6. Canon Violations (Non-Projection Reads)
- **`superadmin.controller.ts`**:
  - `activateTicketModeration` reads `tenantDocuments` directly for findings.
  - Reads `tenants` directly for firm metadata.
- **`roadmapAssembly.service.ts`**:
  - Reads `firmBaselineIntake` directly (Line 77).
- **`ticketModeration.service.ts`**:
  - Reads `ticketsDraft` and `ticketModerationSessions` directly (Line 40, 52).

---
**Audit Complete.** Structural truth extracted.
