# Narrative V2 → Renderer Contract

**Version**: 1.0
**Enforced By**: `run_narrative_assembly.ts` (JSON Gen) & `render_deck.ts` (PDF Gen)

## 1. File Paths
- **Narrative JSON Input**: `docs/narrative-renders/<runId>/<TenantName>/narrative.json`
- **PDF Output**: `docs/narrative-renders/<runId>/<TenantName>/narrative.pdf`

## 2. Rendering Requirements

### 2.1 Section Mapping
The PDF MUST render the following sections based on `narrative.json` data:

| Section | JSON Source | Strictness |
|---|---|---|
| **Header** | `meta.tenantName`, `meta.generatedAt` | Required |
| **Exec Summary** | `executiveSummary` | Required (No truncation) |
| **Findings** | `priorityFindings[]` | Show All (Max 3) |
| **Core Tensions** | `coreTensions[]` | Show All |
| **Risks** | `impliedRisks[]` | Show All |
| **Leverage** | `leveragePoints[]` | Show All |
| **Fingerprint** | `fingerprint` | Required (Visual Panel) |
| **Appendix** | `evidence` | Quotes must be verbatim |

### 2.2 Evidence Rendering Rule
1.  **Do Not Paraphrase**: Use the `quote` field exactly as provided.
2.  **Attribution**: Display `${role} (Source: ${sourceId})` below every quote.
3.  **Grouping**: Group by Constraints, Goals, Friction.

### 2.3 Visual Logic (Fingerprint)
- Display `dominantTheme` as the primary header.
- If `opsSubtype` exists, display it as a "Sector Tag" (e.g., `[ Logistics Ops ]`).
- Display `maturityScore` as a large integer.
- Render `maturityBreakdown` as a table or bar chart:
  - Label: `category`
  - Value: `score`

## 3. QA Gating (Pre-Render)
The renderer wrapper script MUST run these checks on the JSON before invoking the PDF engine:
1.  **Typo Scan**: `Bottlebeck` Check.
2.  **Hygiene Check**: `topKeywords` length >= 5.
3.  **Subtype Check**: If Theme == Operational Stabilization, `opsSubtype` must be defined.

**Action on Failure**: Abort rendering for that tenant. Log error "QA_GATE_FAILED".
