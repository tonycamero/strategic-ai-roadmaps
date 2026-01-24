# META-TICKET: SAR-STAGE6-PARSER-FIX-INV001-REV1
## Stage 6 Inventory Extraction + Fail-Closed 409 + Audit Logs + Tests (NO FALSEY CONTENT)

**Status:** IN_PROGRESS  
**Priority:** P0  
**Owner:** Tony  

### Problem Statement
Stage 6 currently fails because artifact content is being retrieved as "falsey", even when artifacts exist. This indicates a content retrieval/normalization bug (e.g., checking `content` when the data is in `markdown` or `payload.markdown`). Additionally, the current extractor only supports a legacy format and needs an upgrade to handle modern bullet/numbered lists.

### Proposed Solution
1. **Artifact Content Normalization**: Implement `getArtifactRawText` to robustly retrieve text from various possible artifact fields (`content`, `markdown`, `payload.markdown`, etc.).
2. **Parser Upgrade**: Enhance `extractInventoryFromArtifacts` to handle multiple bullet styles, numbered lists, and nested lists with deduplication.
3. **Fail-Closed Guardrail**: Return HTTP 409 `INVENTORY_EMPTY` when extraction yields 0 items, skipping the AI call.
4. **Auditability**: Add structured logs for `contentSource`, `rawLength`, and extraction counts.
5. **Acceptance Tests**: Unit tests for normalizer/parser and integration tests for the Stage 6 route.

### GOVERNANCE.md Compliance
This change satisfies:
- **AG ROLE CONSTRAINT**: Obedience-First Execution.
- **NON-NEGOTIABLE INVARIANTS**: Preventing implicit state advancement.
- **DRIFT PREVENTION CLAUSE**: Halting on conflicting/empty signals.

### Acceptance Criteria
- [ ] `getArtifactRawText` correctly retrieves non-falsey content from all common artifact shapes.
- [ ] `extractInventoryFromArtifacts` handles modern list formats and flattens nested items.
- [ ] HTTP 409 `INVENTORY_EMPTY` returned when zero items are extracted (OpenAI skipped).
- [ ] Server logs show `contentSource`, `rawLength`, and `extractedCount`.
- [ ] Unit tests cover normalization and varied parser formats.
- [ ] Integration tests verify the 409 and 200 paths.

**END META-TICKET**
