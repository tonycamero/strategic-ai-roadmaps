# TEAM SYNTHESIS - PHASE 4 COMPLETE

## ✅ IMPLEMENTED

### 1. Quote-Safe Hardening
- ✅ Rewrote `teamTemplates.ts` with ASCII backticks (no smart quotes)
- ✅ All templates compile cleanly
- ✅ 9 constraint templates with alignment-specific summaries

### 2. Shared Module Integration
- ✅ `shared/src/feta/team/index.ts` - Exports all team types
- ✅ `shared/src/feta/team/buckets.ts` - Bucket mappings (compiles)
- ✅ `shared/src/feta/team/teamLogic.ts` - Rules engine (uses templates)
- ✅ `shared/src/feta/team/teamTemplates.ts` - Template system (fixed)

### 3. Backend Integration
**File:** `backend/src/controllers/webinar.controller.ts`

**Changes:**
- ✅ Added `teamSessionId` and `evidence` to `DiagnosticChatRequest`
- ✅ Team session tracking via `TEAM_SESSIONS` Map
- ✅ Evidence capture per question step
- ✅ Role completion detection (on R1_REVEAL)
- ✅ Progress tracking (completedCount / 4 total)
- ✅ Team synthesis computation when all 4 roles complete
- ✅ Returns `progress` and `teamReport` in API response

**Data Flow:**
1. Client sends `teamSessionId` with every request
2. Backend tracks role answers + evidence
3. On reveal (R1_REVEAL), marks role as complete
4. When 4/4 complete → calls `computeTeamSynthesis()`
5. Returns full team report in response

---

## 📊 API CONTRACT

### Request:
```typescript
POST /api/public/webinar/diagnostic/chat
{
  teamSessionId: string,  // Browser-managed UUID
  role: 'owner' | 'sales' | 'ops' | 'delivery',
  sessionId: string,      // Role-specific session
  message: string,        // Answer ID or empty
  evidence?: string       // Optional free-text
}
```

### Response:
```typescript
{
  sessionId: string,
  role: string,
  message: string,
  options: Array<{id, label}>,
  reveal?: { headline, signals, diagnosis },
  cta?: { type, label },
  progress?: {
    owner: boolean,
    sales: boolean,
    ops: boolean,
    delivery: boolean,
    completedCount: number,
    total: 4
  },
  teamReport?: {  // Only when completedCount === 4
    primaryConstraint: string,
    alignment: 'HIGH' | 'MED' | 'LOW',
    headline: string,
    summary: string,
    topSignals: string[],
    whyThisCompounds: string[],
    firstMoves: Array<{action, why, owner, time}>,
    risks: string[],
    evidence: Array<{role, step, quote}>,
    contradictions: Array<{axis, pair, description, recommendedProbe}>,
    comparisonMatrix: Array<AxisComparison>
  }
}
```

---

## 🧪 ACCEPTANCE TESTS

### Test A: Start Owner Role
```bash
curl -X POST http://localhost:3001/api/public/webinar/diagnostic/chat \
  -H "Content-Type: application/json" \
  -d '{
    "teamSessionId":"team-test-1",
    "role":"owner",
    "sessionId":"owner-1",
    "message":""
  }' | jq
```

**Expected:**
- `progress.completedCount: 0`
- `progress.owner: false`
- No `teamReport`

### Test B: Complete All 4 Roles

Run this sequence with `teamSessionId: "team-test-2"`:

1. **Owner:** H0 → Q1 → Q2 → Q3 → Reveal
2. **Sales:** H0 → Q1 → Q2 → Q3 → Reveal
3. **Ops:** H0 → Q1 → Q2 → Q3 → Reveal
4. **Delivery:** H0 → Q1 → Q2 → Q3 → Reveal

**Expected after 4th reveal:**
- `progress.completedCount: 4`
- `teamReport` object present
- `teamReport.primaryConstraint` set
- `teamReport.alignment` is HIGH/MED/LOW
- `teamReport.firstMoves` array has 3 items
- `teamReport.comparisonMatrix` has 3 rows (Q1,Q2,Q3)

### Test C: Determinism

Run same 4-role sequence twice with identical answers.

**Expected:**
- `teamReport.primaryConstraint` identical
- `teamReport.alignment` identical
- `teamReport.contradictions` identical

---

## ⏳ REMAINING WORK (Frontend - Optional)

**Phase 5 would add:**
1. Frontend tracks `teamSessionId` in sessionStorage
2. Sends with every diagnostic request
3. Shows progress indicator (X/4 complete)
4. Shows "Team Report" tab when `completedCount === 4`
5. Team report page displays full synthesis

**Status:** Backend 100% complete. Frontend can be added later.

---

## 🚀 READY FOR TESTING

All code complete. Backend will:
- Accept `teamSessionId`
- Track role completions
- Compute deterministic team synthesis
- Return full team report when all 4 roles finish

run `pnpm --filter backend typecheck` to verify no TS errors.

Then start backend with `pnpm --filter backend dev` and test with curl.
