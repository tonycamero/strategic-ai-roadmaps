# TC-AGENT-EVO-01 (RE-RUN) — ARCHITECTURAL INTERROGATION (READ-ONLY)

MAP TRUST CONSOLE + ROADMAP/AGENT SURFACES (STRUCTURE ONLY)

MODE: FORENSIC / READ-ONLY
Rules:
- Do NOT propose changes.
- Do NOT refactor.
- Do NOT extract full prompt text yet.
- Only produce file paths + brief proven descriptions.
- If unclear: INSUFFICIENT DATA. If missing: NOT FOUND.

TARGET
/home/tonycamero/code/Strategic_AI_Roadmaps

STEP 0 — Confirm root + workspaces
Run and use results:
- cd /home/tonycamero/code/Strategic_AI_Roadmaps
- ls -la
- cat pnpm-workspace.yaml
- ls -la backend frontend shared api || true

STEP 1 — Repo topology (2 levels deep)
- find . -maxdepth 2 -type d -print | sort

STEP 2 — Identify UI entrypoints (Trust Console / Portal / SuperAdmin)
(Do NOT open large files yet; just locate paths)
Run:
- rg -n --hidden -S "Trust Console|TrustConsole|SuperAdmin|ControlPlane|FirmDetail|portal" frontend shared api backend || true
Output requirement: list matching file paths only (no content).

STEP 3 — Identify backend entrypoints (API routes / Netlify functions / Express)
Run:
- rg -n --hidden -S "express\\(|app\\.use\\(|app\\.get\\(|app\\.post\\(|router\\.|HandlerEvent|@netlify/functions|serverless-http" backend api shared || true
Output: file paths only.

STEP 4 — Identify roadmap/brief/narrative synthesis surfaces (where “agent” likely lives)
Run:
- rg -n --hidden -S "executiveBrief|Executive Brief|roadmap|narrative|synthesis|copilot|agent|prompt" backend shared api || true
Output: file paths only.

STEP 5 — Identify “Authority” + “Truth Matrix” production surfaces
Run:
- rg -n --hidden -S "AuthorityService|truth matrix|TruthMatrix|artifact truth|artifact" backend shared api frontend || true
Output: file paths only.

STEP 6 — Data layer discovery (ORM/DB clients/schemas)
Run:
- rg -n --hidden -S "drizzle|prisma|typeorm|knex|pg\\b|postgres|schema|migrations|db\\b" backend shared api || true
Output: file paths only.
