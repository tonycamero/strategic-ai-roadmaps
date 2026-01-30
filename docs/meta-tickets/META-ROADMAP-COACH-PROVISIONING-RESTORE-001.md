# META-TICKET v2
ID: META-ROADMAP-COACH-PROVISIONING-RESTORE-001
OWNER: Tony
AGENT: Antigravity
DATE: 2026-01-23
GOAL:
Restore the Roadmap Coach provisioning pipeline by recovering or reconstructing assistantProvisioning.service.ts (and any related empty stubs) using repo-native sources of truth, with zero API invention and full auditability.

HARD BOUNDARIES:
- Allowed: recover prior implementation via git history; rehydrate from existing specs/docs already in repo; wire back to existing callers; add minimal tests or smoke scripts if already present.
- Forbidden: invent new product behavior, new endpoints, new data contracts, or new “assistant flows” not referenced in repo specs.
- Forbidden: sweeping refactors across roadmapAgentSync or controllers. Keep changes narrowly scoped to restoring the missing services.
- If required info is missing (e.g., unknown env vars, unknown assistant model names, unknown tool schemas): STOP + REPORT with concrete options.

ACCEPTANCE CRITERIA:
A) assistantProvisioning.service.ts is non-stub, exported, and used successfully by roadmapAgentSync.service.ts without runtime “undefined function” errors.
B) Any other empty stubs that are true dependencies (roadmapAssembly.service.ts, sopTicketGenerator.service.ts) are recovered/restored OR explicitly proven unused with evidence.
C) `pnpm -r build` succeeds past the previous failure stage (or failures are strictly “real code” unrelated to provisioning).
D) Provide forensic proof: what commit contained the prior implementation, or what spec sections were used to reconstruct.

DELIVERABLES:
1) Audit evidence:
   - file sizes of suspected stubs (ls -la)
   - list of all empty/near-empty .ts services in the target directory
2) Recovery evidence:
   - git log/show outputs proving where the implementation came from (or proof it never existed)
3) Working proof:
   - call-site compilation success
   - a minimal local invocation path (existing script/test) that triggers provisioning without throwing

EXECUTION PLAN

PHASE 0 — INVENTORY (READ-ONLY)
0.1 Confirm stubs and sizes:
    ls -la backend/src/services | sed -n '1,200p'
    ls -la backend/src/services/assistantProvisioning.service.ts
    ls -la backend/src/services/roadmapAssembly.service.ts
    ls -la backend/src/services/sopTicketGenerator.service.ts
0.2 Find all suspiciously tiny services (<= 50 bytes):
    find backend/src/services -maxdepth 1 -type f -name "*.ts" -size -100c -print

PHASE 1 — RECOVER FROM GIT (PREFERRED)
1.1 Locate last non-stub revision of each file:
    git log --follow -- backend/src/services/assistantProvisioning.service.ts
    git log --follow -- backend/src/services/roadmapAssembly.service.ts
    git log --follow -- backend/src/services/sopTicketGenerator.service.ts
1.2 If history exists, restore exact content from last good commit:
    git show <GOOD_COMMIT>:backend/src/services/assistantProvisioning.service.ts > backend/src/services/assistantProvisioning.service.ts
    (repeat for other services as needed)
1.3 Confirm no conflict markers:
    rg -n "^(<<<<<<<|=======|>>>>>>>)" backend/src/services/assistantProvisioning.service.ts || echo "no markers"

STOP CONDITION:
- If git history shows the file was always stub/empty OR cannot locate a good commit: proceed to PHASE 2 (spec-based reconstruction) with strict constraints.

PHASE 2 — RECONSTRUCT FROM REPO SPECS (ONLY IF NO GOOD COMMIT)
2.1 Locate authoritative spec references:
    rg -n "assistantProvisioning|provisioning|Roadmap Coach|OpenAI Assistant|assistant_id|thread_id|run_id" backend docs -S || true
    rg -n "ROADMAP_AGENT_ARCHITECTURE|Roadmap Coach|Assistant" -S .
2.2 Enumerate callers + required interface:
    rg -n "assistantProvisioning" backend/src -S
    rg -n "roadmapAgentSync" backend/src -S
    (Extract the exact functions used, expected return shapes, and error handling)
2.3 Implement ONLY the minimum surface area demanded by callers + spec:
    - No new features
    - No new persistence fields unless already referenced by schema/types
    - Use existing OpenAI client wrapper if present; otherwise STOP and report missing client module

STOP CONDITION:
- If reconstructing would require guessing env vars, assistant tool schemas, or business flow: STOP and report the exact unknowns + where they should live (env, config, db).

PHASE 3 — VERIFY INTEGRATION
3.1 Typecheck/build:
    pnpm -C backend build (or pnpm -r build if that’s the repo convention)
3.2 Confirm roadmapAgentSync can import and call without runtime failures:
    - run the existing script/job that triggers provisioning (DO NOT create a new CLI unless already present)

PHASE 4 — FORENSIC REPORT
- Where the implementation came from (commit hash or spec path/sections)
- What functions exist in assistantProvisioning.service.ts
- What env vars/config it expects (only if already referenced)
- What was tested and how

END STATE:
Roadmap Coach provisioning is restored and the build progresses without “stub dependency” blockers.
