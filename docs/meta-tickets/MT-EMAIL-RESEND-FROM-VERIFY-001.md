# META-TICKET v2
ID: MT-EMAIL-RESEND-FROM-VERIFY-001
TITLE: Prove current FROM_EMAIL wiring + patch to verified sender (hello@mail.strategicai.app)
OWNER: AG
PRIORITY: P0
SCOPE: backend/src/services/email.service.ts (+ any directly referenced config file it imports, if applicable). No refactors. No dependency changes.

## CONTEXT
- Resend API now works ONLY when From is: StrategicAI <hello@mail.strategicai.app>
- Current platform invite send fails intermittently / shows Resend 403 when From uses strategicai.app root domain.
- We will NOT “assume” how FROM_EMAIL is wired. AG must PROVE current wiring with exact code + env usage, then patch surgically.

## HARD REQUIREMENTS
- First produce PROOF (code excerpts + runtime evidence).
- Then apply minimal change to guarantee verified sender is used by default.
- Must trim whitespace on env-derived sender.
- Must preserve existing env var name(s) if already in use.
- Output must include exact file diffs and exact commands executed.

## PHASE A — PROOF (NO CHANGES YET)
1) Show full sender configuration block:
   - Command:
     sed -n '1,120p' backend/src/services/email.service.ts
   - Expected: include definition of FROM_EMAIL and construction of fromHeader and any env var names.

2) Identify all references to FROM_EMAIL/EMAIL_FROM/RESEND in backend:
   - Commands:
     rg -n "FROM_EMAIL|EMAIL_FROM|RESEND_API_KEY|hello@|mail\.strategicai\.app|strategicai\.app" backend/src -S
   - Expected: list every file + line where sender domain might be set/overridden.

3) Prove what Netlify/runtime is actually using (in code):
   - Find where env is loaded / validated:
     rg -n "process\.env\.FROM_EMAIL|process\.env\.EMAIL_FROM|dotenv|loadEnv|ENV" backend/src -S
   - Provide excerpt(s) showing whether trimming/defaulting exists.

4) Prove Resend payload currently built by platform code:
   - Locate Resend send call:
     rg -n "resend\.emails\.send|api\.resend\.com|Authorization: Bearer|new Resend" backend/src -S
   - Paste the function or callsite showing it passes `fromHeader`.

**STOP CONDITION (PHASE A)**
- If sender is hardcoded to hello@strategicai.app or defaulted to root domain, document it and proceed to Phase B.
- If sender already supports env override, prove what env var name is used and whether whitespace is handled. Then proceed to Phase B.

## PHASE B — MINIMAL PATCH (AFTER PROOF)
Goal: default to verified sender + trim whitespace, without breaking existing configs.

Patch rules:
- Use DEFAULT_FROM = "hello@mail.strategicai.app"
- Determine existing env var precedence based on Phase A proof.
- Apply this exact pattern (adjust env var names ONLY if Phase A proves different):
  ```typescript
  const DEFAULT_FROM = "hello@mail.strategicai.app";
  const FROM_EMAIL = (process.env.FROM_EMAIL ?? process.env.EMAIL_FROM ?? DEFAULT_FROM).trim();
  const fromHeader = `StrategicAI <${FROM_EMAIL}>`;
  ```

Implementation steps:
1) Apply edit to backend/src/services/email.service.ts only (unless Phase A proves a different single source file owns sender config).
2) Add no new dependencies.
3) Keep existing exported function signatures unchanged.

## PHASE C — VERIFICATION
1) Local Resend auth smoke test (do not leak key in logs):
   - Provide command template only; do NOT print secrets:
     curl -i https://api.resend.com/emails \
       -H "Authorization: Bearer $RESEND_API_KEY" \
       -H "Content-Type: application/json" \
       -d '{"from":"StrategicAI <hello@mail.strategicai.app>","to":["tony@strategicai.app"],"subject":"Mail domain test","html":"<p>test</p>"}'
   - Expected: HTTP 200 with id.

2) Platform-level proof:
   - Trigger one invite send in the app (or via internal endpoint if exists).
   - Capture Resend dashboard event for that message OR backend log line showing payload `from` is now hello@mail.strategicai.app.

## DELIVERABLES
- Phase A proof excerpts (file+line snippets).
- Minimal diff for backend/src/services/email.service.ts.
- Verification evidence (status code + id OR Resend event id).
- Short “what changed” bullet list.

## NOTES
- Quota is small; we only need 1–3 sends to validate.
- Do not touch CORS, routing, or templates in this ticket unless Phase A proves sender is embedded in template.
