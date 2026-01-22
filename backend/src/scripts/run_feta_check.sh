#!/bin/bash
set -euo pipefail

# Always resolve repo root robustly (works in GH Actions and locally)
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "${GITHUB_WORKSPACE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}")"
FILE="$ROOT/frontend/src/trustagent/TrustAgentShell.tsx"

echo "1) Checking for handleSendMessage handlers/timers in TrustAgentShell.tsx:"
grep -nE "setTimeout\(\(\) => handleSendMessage|handleSendMessage\(\)|onKeyDown=.*handleSendMessage|onClick=.*handleSendMessage|type=\"text\"" "$FILE"

echo -e "\n2) Checking for homepage-specific labels/calls in TrustAgentShell.tsx:"
grep -nE "handleQuickPick\(|Suggested prompts|What is the Roadmap\?|Am I a fit\?|Show me ROI" "$FILE"

echo -e "\n3) Checking for isFeta / trustAgentMode gating in TrustAgentShell.tsx:"
grep -nE "trustAgentMode === 'feta'|const isFeta|if \(isFeta\) return" "$FILE"

echo -e "\n--- Backend Status ---"
cd "$ROOT/backend"

# Run canonical compliance guard
npx tsx src/scripts/check_feta_canon_violation.ts

# Run end-to-end reveal verification (supports either JS or TS implementation)
if [[ -f "verify_reveal.js" ]]; then
  node verify_reveal.js
elif [[ -f "src/scripts/verify_reveal.ts" ]]; then
  npx tsx src/scripts/verify_reveal.ts
elif [[ -f "src/scripts/verify_reveal.js" ]]; then
  node src/scripts/verify_reveal.js
else
  echo "ERROR: reveal verification script not found. Expected backend/verify_reveal.js or backend/src/scripts/verify_reveal.ts"
  exit 1
fi
