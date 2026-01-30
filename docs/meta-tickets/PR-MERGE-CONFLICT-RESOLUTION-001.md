EXECUTION TICKET: PR-MERGE-CONFLICT-RESOLUTION-001
Repo: strategic-ai-roadmaps
Branch: integrate/develop-onto-origin-main
Goal: Resolve merge conflicts against main, push updated branch, and merge PR.

Scope:
- Resolve conflicts ONLY. No feature changes.
- Preserve current working behavior as seen locally.
- Prefer "ours" (feature branch) when conflicts relate to new functionality (brief delivery, intake vectors).
- Prefer "theirs" (main) only when conflicts are in unrelated scaffolding or configs that are known-good on main.
- After resolution: run minimal sanity checks (typecheck/build if feasible), push, and merge.

Steps:
1) Checkout branch:
   - git fetch origin
   - git checkout integrate/develop-onto-origin-main
   - git pull --rebase origin integrate/develop-onto-origin-main

2) Rebase onto main (preferred) OR merge main:
   Option A (preferred): git rebase origin/main
   Option B: git merge origin/main

3) Resolve conflicts listed in PR UI:
   - .gitignore
   - backend/src/controllers/diagnosticReturn.controller.ts
   - backend/src/controllers/executiveBrief.controller.ts
   - backend/src/controllers/intakeVector.controller.ts
   - backend/src/controllers/superadmin.controller.ts
   - backend/src/routes/superadmin.routes.ts
   - backend/src/services/diagnosticIngestion.service.ts
   - backend/src/services/email.service.ts
   - backend/src/services/executiveBriefDelivery.ts
   - backend/src/services/gate.service.ts
   - backend/src/services/roadmapProgress.service.ts
   - backend/src/services/sopPersistence.ts
   - backend/verification_output.txt
   - frontend/src/App.tsx
   - frontend/src/components/TicketModeration.tsx
   - frontend/src/components/onboarding/StakeholderModal.tsx
   - frontend/src/pages/BaselineIntakePage.tsx
   - frontend/src/pages/TeamIntakesReview.tsx
   - frontend/src/pages/team/TeamMemberDashboard.tsx
   - frontend/src/pages/tenant/DiscoveryReviewPage.tsx
   - frontend/src/superadmin/api.ts
   - frontend/src/superadmin/components/AssistedSynthesisAgentConsole.tsx
   - frontend/src/superadmin/components/AssistedSynthesisModal.tsx
   - frontend/src/superadmin/components/BaselineSummaryPanel.tsx
   - frontend/src/superadmin/components/BriefCompletionCard.tsx

4) Conflict resolution rules:
   - For new files/functions related to Exec Brief delivery + intake vectors: keep branch version.
   - For any “Zone.Identifier” deletion artifacts: keep deletions.
   - Remove/ignore backend/verification_output.txt if it’s a generated artifact; add to .gitignore if necessary.
   - Ensure superadmin routes still expose generate-diagnostics endpoint (if main has it, preserve).

5) After conflict resolution:
   - git add -A
   - git rebase --continue OR git commit (if merge)
   - Ensure working tree clean

6) Sanity checks (fast):
   - pnpm -r typecheck (if available) OR
   - pnpm -r build (if feasible) OR
   - at minimum: backend starts, frontend starts

7) Push:
   - git push (if rebase, use: git push --force-with-lease)

8) Merge PR in GitHub UI:
   - Use "Squash and merge"
   - Title: “Onboarding delivery + exec brief delivery + intake vectors”
   - Confirm main is updated.

Acceptance:
- PR shows “Able to merge” and merges successfully.
- main branch contains all intended changes.
- No unresolved conflict markers remain anywhere.
