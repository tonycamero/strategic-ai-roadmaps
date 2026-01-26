# META-TICKET v2
ID: META-FIX-TS-SOP01-OUTPUTS-NAMES-001
TITLE: Fix backend TS build by aligning Sop01Outputs field names + enforce Scope Lock during recovery
TYPE: META
PRIORITY: P0
OWNER: Tony
AGENT: Antigravity (AG)

## MISSION
Restore a green `pnpm -r build` by fixing TypeScript errors caused by mismatched `Sop01Outputs` field names in backend. Do NOT “merge” or “resolve” unrelated work. This is a surgical patch.

## SCOPE LOCK PROTOCOL (HARD RULES)
1) **Immediate Stop on Out-of-Scope Conflicts**:
   - If ANY git operation triggers a conflict in ANY file not explicitly listed in ALLOWED FILES, STOP immediately.
   - Report: file path + conflict markers count + what operation triggered it.
   - Do NOT use `--ours` or `--theirs` on out-of-scope files without explicit authorization.

2) **Explicit Scope Validation** (must be written before any file edit):
   - “TICKET BOUNDARY: Touching [list allowed files I will edit]. Avoiding [everything else].”

3) **Surgical Excision Priority**:
   - If the ticket implies “drop/restore,” treat it as destructive restore from a clean source (origin/main or specified commit), not as a merge to be resolved.
   - If “dropping/restoring” causes conflict, that means the chosen git operation is wrong. STOP and report.

4) **No Opportunistic Refactors**:
   - Do not rename, reformat, or “clean up” unrelated code.
   - Do not change types/contracts unless required to fix compilation for this ticket.

## ALLOWED FILES (ONLY THESE MAY BE MODIFIED)
- `backend/src/controllers/diagnosticRerun.controller.ts`
- `backend/src/controllers/superadmin.controller.ts`
- `backend/src/services/diagnosticIngestion.service.ts`
- `backend/src/services/sop01Persistence.ts`

## FORBIDDEN
- Editing any other file (including shared, frontend, db schema, routes, prompts, utils, etc.)
- Rebases/merges that may touch other files
- Broad “marker cleanup” beyond the files above

## CONTEXT / ROOT CAUSE
`backend/src/services/sop01Engine.ts` defines:
```typescript
export interface Sop01Outputs {
  sop01DiagnosticMarkdown: string;
  sop01AiLeverageMarkdown: string;
  sop01DiscoveryQuestionsMarkdown: string;
  sop01RoadmapSkeletonMarkdown: string;
}
```

Backend code currently references legacy names:
`companyDiagnosticMap`, `aiLeverageMap`, `discoveryCallQuestions`, `roadmapSkeleton`
This causes TS2339 / TS2322 / TS2353 in backend build.

## OBJECTIVE
Update backend call sites to use the canonical `Sop01Outputs` property names above, with minimal changes.

## EXECUTION PLAN (DO NOT DEVIATE)
### Phase 0 — Safety + Proof
A) Ensure repo clean enough to work:
   - `cd ~/code/Strategic_AI_Roadmaps`
   - `rm -f .git/index.lock`
B) Prove no conflict markers exist in the four ALLOWED FILES before edits:
   - `rg -n "<<<<<<<|=======|>>>>>>>" <each allowed file> || true`
   - If markers exist inside ALLOWED FILES: stop and report (do not “resolve” unless instructed).

### Phase 1 — Apply Surgical Patch (minimal edits only)
Make ONLY these mechanical substitutions:

1) `backend/src/controllers/diagnosticRerun.controller.ts`
- `outputs.companyDiagnosticMap` -> `outputs.sop01DiagnosticMarkdown`
- `outputs.roadmapSkeleton` -> `outputs.sop01RoadmapSkeletonMarkdown`

2) `backend/src/controllers/superadmin.controller.ts`
- `outputs.companyDiagnosticMap` -> `outputs.sop01DiagnosticMarkdown`
- `outputs.aiLeverageMap` -> `outputs.sop01AiLeverageMarkdown`
- `outputs.roadmapSkeleton` -> `outputs.sop01RoadmapSkeletonMarkdown`
- `outputs.discoveryCallQuestions` -> `outputs.sop01DiscoveryQuestionsMarkdown`
NOTE: Preserve the object shape currently expected by diagnostics columns. Do not redesign schema. If TS complains about `discoveryQuestions` type later, STOP and report the exact TS error; do not invent types.

3) `backend/src/services/diagnosticIngestion.service.ts`
- When calling `extractInventoryFromArtifacts`, pass `Sop01Outputs`-canonical keys:
  `sop01DiagnosticMarkdown`, `sop01AiLeverageMarkdown`, `sop01RoadmapSkeletonMarkdown`, `sop01DiscoveryQuestionsMarkdown`
- In `extractInventoryFromArtifacts`, read:
  `sop01Content.sop01RoadmapSkeletonMarkdown` (not `roadmapSkeleton`)

4) `backend/src/services/sop01Persistence.ts`
- `requiredKeys` must be:
  `sop01DiagnosticMarkdown`, `sop01AiLeverageMarkdown`, `sop01DiscoveryQuestionsMarkdown`, `sop01RoadmapSkeletonMarkdown`
- artifact content mapping:
  `outputs.sop01DiagnosticMarkdown`
  `outputs.sop01AiLeverageMarkdown`
  `outputs.sop01RoadmapSkeletonMarkdown`
  `outputs.sop01DiscoveryQuestionsMarkdown`
- Do NOT attempt to treat discovery questions as array; canonical is markdown string. If schema expects array and TS flags it, STOP and report.

### Phase 2 — Verification
A) Run backend TS check:
   - `pnpm -C backend exec tsc -p tsconfig.vercel.json --pretty false`
B) If clean, run:
   - `pnpm -r build`

## STOP CONDITIONS (MANDATORY)
- Any git conflict outside ALLOWED FILES
- Any new TS errors not directly related to `Sop01Outputs` field names mismatch
- Any temptation to “fix forward” by editing types/contracts outside ALLOWED FILES

## DELIVERABLE
- A single PR-ready patch (or a clean working tree diff) that makes backend TS compile and allows `pnpm -r build` to proceed past backend.
