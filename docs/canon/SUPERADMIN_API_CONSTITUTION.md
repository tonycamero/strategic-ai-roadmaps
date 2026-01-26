# SuperAdmin API Constitution

**Status:** CANONICAL
**Authority:** META-SUPERADMIN-API-CONSTITUTION-001
**Last Updated:** 2026-01-24

---

## 1. Inventory & Classification

The following methods are referenced by the SuperAdmin frontend. This table defines their canonical status.

| API Method (Frontend Reference) | Domain | Status | Notes |
| :--- | :--- | :--- | :--- |
| `getFirmDetail` | Firm | ✅ Canon | Exists in api.ts |
| `getFirmDetailV2` | Firm | ✅ Canon | Exists in api.ts |
| `getIntakeVectors` | Intake | 🟡 Drift | Missing from api.ts |
| `createIntakeVector` | Intake | 🟡 Drift | Missing from api.ts |
| `sendIntakeVectorInvite` | Intake | 🟡 Drift | Missing from api.ts |
| `getSnapshot` | Implementation | ✅ Canon | Exists in api.ts |
| `lockIntake` | Intake | 🟡 Drift | Missing (Use `closeIntakeWindow`?) |
| `closeIntakeWindow` | Intake | ✅ Canon | Exists in api.ts |
| `getTruthProbe` | Diagnostic | 🟡 Drift | Missing from api.ts |
| `generateSop01` | Diagnostic | 🟡 Drift | Missing from api.ts |
| `generateDiagnostics` | Diagnostic | 🟡 Drift | Missing from api.ts |
| `generateTickets` | Moderator | 🟡 Drift | Missing from api.ts |
| `activateTicketModeration` | Moderator | 🟡 Drift | Missing from api.ts |
| `getDiagnosticTickets` | Moderator | ✅ Canon | Exists in api.ts |
| `getTicketModerationStatus` | Moderator | ✅ Canon | Exists in api.ts |
| `approveTickets` | Moderator | ⚠️ Mismatch | Signature mismatch (Object vs Args) |
| `rejectTickets` | Moderator | ⚠️ Mismatch | Signature mismatch (Object vs Args) |
| `lockDiagnostic` | Diagnostic | 🟡 Drift | Missing from api.ts |
| `publishDiagnostic` | Diagnostic | 🟡 Drift | Missing from api.ts |
| `ingestDiscoveryNotes` | Discovery | 🟡 Drift | Missing (Use `saveDiscoveryNotes`?) |
| `getDiscoveryNotes` | Discovery | ✅ Canon | Exists in api.ts |
| `saveDiscoveryNotes` | Discovery | ✅ Canon | Exists in api.ts |
| `assembleRoadmap` | Roadmap | 🟡 Drift | Missing from api.ts |
| `generateFinalRoadmap` | Roadmap | ✅ Canon | Exists in api.ts (Scope mismatch?) |
| `getExecutiveBrief` | Brief | 🟡 Drift | Missing from api.ts |
| `getDiagnosticArtifacts` | Diagnostic | 🟡 Drift | Missing from api.ts |
| `getAgentSession` | Agent | 🟡 Drift | Missing from api.ts |
| `sendAgentMessage` | Agent | 🟡 Drift | Missing from api.ts |
| `resetAgentSession` | Agent | 🟡 Drift | Missing from api.ts |
| `getProposedFindings` | Synthesis | 🟡 Drift | Missing from api.ts |
| `generateAssistedProposals` | Synthesis | 🟡 Drift | Missing from api.ts |
| `declareCanonicalFindings` | Synthesis | 🟡 Drift | Missing from api.ts |
| `previewReadinessBatch` | Command | 🟡 Drift | Missing from api.ts |
| `executeReadinessBatch` | Command | 🟡 Drift | Missing from api.ts |

---

## 2. Canonical Contract Definition

The following interface is the **Single Source of Truth** for the `superadminApi` object. All methods below must be implemented in `api.ts`.

```typescript
export interface SuperAdminApiContract {

  // --- FIRM & TENANT ---
  getFirmDetail(tenantId: string): Promise<FirmDetailResponse>;
  getFirmDetailV2(tenantId: string): Promise<FirmDetailResponseV2>;
  updateTenant(tenantId: string, updates: Partial<SuperAdminTenantDetail['tenant']>): Promise<{ tenant: SuperAdminTenantDetail['tenant'] }>;

  // --- INTAKE & VECTORS ---
  // Returns robust vector data for the intake stakeholders
  getIntakeVectors(tenantId: string): Promise<{ vectors: IntakeRoleDefinition[] }>;
  createIntakeVector(tenantId: string, role: Partial<IntakeRoleDefinition>): Promise<{ vector: IntakeRoleDefinition }>;
  sendIntakeVectorInvite(roleId: string): Promise<{ vector: IntakeRoleDefinition }>;
  
  // Intake Lifecycle
  closeIntakeWindow(tenantId: string): Promise<{ ok: boolean }>;
  lockIntake(tenantId: string): Promise<{ ok: boolean }>; // Helper/Alias for closeIntakeWindow?

  // --- IMPLEMENTATION ---
  getSnapshot(tenantId: string): Promise<{ data: SnapshotData }>;

  // --- DIAGNOSTIC ORCHESTRATION ---
  // The 'Truth Probe' aggregates discovery/diagnostic state
  getTruthProbe(tenantId: string): Promise<TruthProbeData>;
  
  // Generation triggers
  generateSop01(tenantId: string): Promise<{ ok: boolean; jobIds: string[] }>;
  generateDiagnostics(tenantId: string): Promise<{ ok: boolean }>;
  
  // Artifact Management
  getDiscoveryNotes(tenantId: string): Promise<{ notes: string; updatedAt: string | null }>;
  saveDiscoveryNotes(tenantId: string, notes: string): Promise<{ ok: boolean }>;
  ingestDiscoveryNotes(tenantId: string, notes: CanonicalDiscoveryNotes): Promise<{ ok: boolean }>; // Structured ingest
  
  getExecutiveBrief(tenantId: string): Promise<{ brief: ExecutiveBriefData }>;
  
  // Diagnostic Lifecycle
  getDiagnosticArtifacts(diagnosticId: string): Promise<{ diagnostic: any; outputs: any }>;
  lockDiagnostic(tenantId: string, diagnosticId: string): Promise<{ ok: boolean }>;
  publishDiagnostic(tenantId: string, diagnosticId: string): Promise<{ ok: boolean }>;

  // --- MODERATION & TICKETS ---
  generateTickets(tenantId: string, diagnosticId: string): Promise<{ ok: boolean; count: number }>;
  activateTicketModeration(tenantId: string): Promise<{ ok: boolean }>;
  
  getDiagnosticTickets(tenantId: string, diagnosticId: string): Promise<{ tickets: any[]; status: any }>;
  getTicketModerationStatus(tenantId: string, diagnosticId: string): Promise<ModerationStatusResponse>;
  
  approveTickets(params: { tenantId: string; diagnosticId: string; ticketIds: string[]; adminNotes?: string }): Promise<{ updated: number }>;
  rejectTickets(params: { tenantId: string; diagnosticId: string; ticketIds: string[]; adminNotes?: string }): Promise<{ updated: number }>;

  // --- ROADMAP ASSEMBLY ---
  assembleRoadmap(tenantId: string): Promise<{ ok: boolean; roadmapId?: string }>;
  generateFinalRoadmap(tenantId: string): Promise<{ ok: boolean }>; // Legacy/Alias?

  // --- AGENT / SYNTHESIS (Experimental) ---
  getAgentSession(tenantId: string, contextVersion: string): Promise<AgentSession>;
  sendAgentMessage(tenantId: string, sessionId: string, message: string): Promise<AgentResponse>;
  resetAgentSession(tenantId: string, sessionId: string): Promise<void>;
  
  getProposedFindings(tenantId: string): Promise<FindingsPayload>;
  generateAssistedProposals(tenantId: string): Promise<FindingsPayload>;
  declareCanonicalFindings(tenantId: string, findings: any): Promise<{ ok: boolean }>;

  // --- COMMAND CENTER ---
  getCommandCenterTenants(filters?: any): Promise<{ tenants: any[]; total: number }>;
  previewFinalizeBatch(tenantIds: string[]): Promise<BatchPreviewResult>;
  executeFinalizeBatch(params: { tenantIds: string[]; override?: boolean }): Promise<BatchExecutionResult>;
}
```

---

## 3. Authority Notes

### Review & Verification
- All "Drift" methods currently cause runtime errors if called, or are mocked locally.
- **Next Action**: Implement the missing methods in `api.ts`.
- **Constraint**: If a method is not backed by a real backend endpoint yet, it must throw a clear `NOT_IMPLEMENTED` error rather than fail silently.

### Signature Enforcement
- The `approveTickets` and `rejectTickets` methods in `api.ts` use a single object parameter. The usage in `TicketModerationPanel.tsx` uses three arguments.
- **Decision**: The single-object parameter pattern (DTO) is CANONICAL. The usage site must be refactored to match the contract.

---

**End of Constitution**
