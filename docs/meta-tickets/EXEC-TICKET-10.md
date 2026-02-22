EXEC-TICKET-10
Title: Staging Validation + Prod Promotion Gate

Objective:
Verify staging before production promotion.

Checklist:
1. QnA (Pre-roadmap) → thinking_partner bias
2. Post-roadmap → execution_bias
3. No direct OpenAI calls in tenant controllers
4. Schema enforcement rejects malformed output

WSL:

rg -n "chat\.completions\.create" backend/src/controllers

If clean:
Merge staging → release/api via PR only.

Exit Criteria:
- Clean staging
- No architectural bypass
