# META-TICKET v2: Executive Brief Forensic Autopsy Pack (EXEC-BRIEF-FORENSIC-AUTOPSY-015)

## OBJECTIVE
Produce an auditable, file-cited forensic packet of the Executive Brief synthesis pipeline that:
- Proves exactly where “consultant/diagnostic voice” is produced
- Proves exactly where signal is lost (rejections, routing, fallbacks)
- Enables manual review by opening files and verifying claims line-by-line
This ticket is diagnostic-only. No product changes, no narrative tuning, no template rewriting.

## SCOPE IN

### A) STATIC CODE AUTOPSY (VERIFIABLE)
1. **File Inventory**: Complete table of all involved files.
2. **Call Graph**: ASCII diagram of execution flow including branches.
3. **Template String Catalog**: `rg -n` and `sed -n` excerpts for all templates.
4. **Language Origin Matrix**: Provenance citations for each section's text.

### B) FIXTURE-REPLAY FORENSICS (NON-LLM)
Using existing fixtures: `fixture_minimal_valid`, `fixture_typical_valid`, `fixture_high_variance_valid`.
1. Run pipeline in deterministic mode.
2. Emit **Stage Count Table** (vectors -> facts -> patterns -> assertions -> selected).
3. Emit **Rejection Ledger** (counts + examples with cited logic).
4. Emit **Section Routing Ledger** (assertion IDs -> bucket with cited logic).

### C) NEGATIVE CONFIRMATION (PROVEN)
Ripgrep proofs of absence for: `executiveNarrativeRewrite`, `executiveVoiceTransform`, etc.

### D) “CONSULTANT SPEAK” PROVENANCE PACK
Table of offending phrases mapped to exact source code locations.

## DELIVERABLES
1. `docs/forensics/EXEC-BRIEF-FORENSIC-AUTOPSY-015.md`
2. Helper script: `backend/src/__tests__/executiveBriefSynthesis/forensics/replay_diagnostics.ts`
3. "How to reproduce" section.

## COMMANDS
- `rg -n` for citations
- `sed -n` for excerpts
- Script execution for replay tables

## CONSTRAINTS
- Zero side effects.
- No code changes to synthesis logic.
- Pure forensic observation.
