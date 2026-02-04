# Invariant Validation Queries

## Run Metadata
- **Timestamp**: 2026-01-30T07:59:00Z
- **Environment**: Local / WSL
- **Tooling**: grep, view_file, psql

## Static Analysis (Grep Patterns)

### 1. Intake Closure in Executive Brief Approval
Used to verify A1 (Decoupling).
```bash
grep -n "intakeWindowState" backend/src/controllers/executiveBrief.controller.ts
```

### 2. Intake Gate Logic
Used to verify A3 (Input Acceptance).
```bash
grep -nC 5 "intakeWindowState === 'CLOSED'" backend/src/controllers/intake.controller.ts
```

### 3. Diagnostic Gating
Used to verify D1, D3, B3 (Blocking & Sufficiency).
```bash
grep -n "export async function canGenerateDiagnostics" backend/src/services/gate.service.ts
```

### 4. UI Visibility Logic
Used to verify F2 (Visibility ≠ Authority).
```bash
grep -nE "BriefCompleteCard|DiagnosticCompleteCard" frontend/src/superadmin/pages/SuperAdminControlPlaneFirmDetailPage.tsx
```

## Data Analysis (SQL)

### 1. Tenant Readiness Check
Used to find Golden Tenant IDs and check current states.
```sql
SELECT id, name, intake_window_state, intake_closed_at 
FROM tenants 
WHERE name IN (
  'Cascade Climate Solutions', 
  'Northshore Logistics Solutions', 
  'Prairie Peak Marketing'
);
```

### 2. Schema Verification
Used to check for missing columns (B2, D3).
```sql
\d intakes
\d tenants
```
