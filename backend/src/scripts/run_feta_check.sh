#!/bin/bash
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
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
# Run end-to-end reveal verification
node verify_reveal.js
