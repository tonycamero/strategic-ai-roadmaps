# Narrative V2 Strict: Invariants & Engineering Contract

**Version**: 2.0 (Strict)
**Frozen**: Jan 30, 2026
**Owner**: Antigravity

## 1. Purpose
The V2 Strict engine is a **fail-closed**, deterministic narrative synthesizer designed to produce investor-grade diagnostic outputs without human intervention. It trades "creative variety" for **structural reliability**.

## 2. Protected Vocabulary & Data Contract
Inputs must map to specific output structures. All fields below are GUARANTEED to exist if synthesis succeeds.

### 2.1 Fingerprint (The "Soul" of the Narrative)
- `fingerprint.dominantTheme`: MUST be one of {`Operational Stabilization`, `Efficiency & Optimization`, `Growth & Scaling`, `Risk Mitigation`}.
- `fingerprint.opsSubtype`: REQUIRED if dominantTheme is `Operational Stabilization`. Values: `Service Ops` | `Logistics Ops` | `Agency Ops` | `Sales Ops` | `Field Ops`.
- `fingerprint.topKeywords`: Top 10 extracted keywords. MUST NOT contain stopwords. Top 5 MUST be domain-bearing (len >= 4 or Allowlist).
- `fingerprint.maturityScore`: Integer 0-100.
- `fingerprint.maturityBreakdown`: Array of 4 signals.
  - `weight` sum MUST equal 100.
  - `score` weighted average MUST equal `maturityScore`.

### 2.2 Evidence ( The "Why")
- `priorityFindings`: Array of 2 critical issues.
  - `label`: MUST NOT contain typos (especially "Bottlebeck").
  - `why`: MUST contain a verbatim substring (6+ words) from source quotes.
  - `evidenceIds`: MUST link to at least 1 valid source.

## 3. Fail-Closed Rules (Zero Tolerance)
The engine halts (throws Error) if:
1.  **Insufficient Signal**: < 3 keywords link to the dominant theme.
2.  **Insufficient Evidence**: < 2 items for Constraints or Goals.
3.  **Template Detection**: Normalized Hash (`<TENANT> + <KW>`) collides with another tenant in the batch.
4.  **Typo Lock**: Forbidden tokens (`Bottlebeck`, `Folowup`) appear in JSON output.
5.  **Subtype Ambiguity**: `Operational Stabilization` theme without a valid `opsSubtype`.

## 4. Golden Tenants (Acceptance Criteria)
These three tenants MUST produce distinct, valid narratives:
1.  **Cascade Climate Solutions** (Service Ops): Signals `dispatch`, `call`, `schedule`.
2.  **Northshore Logistics** (Logistics Ops): Signals `visibility`, `ownership`, `load`.
3.  **Prairie Peak Marketing** (Agency Ops): Signals `project`, `client`, `deliverable`.

## 5. Versioning
- **Breaking Changes**: Any change to `fingerprint` structure, fail-closed thresholds, or Golden Tenant IDs requires a V3 bump.
- **Non-Breaking**: Adding new dictionary words, refining weights (within tolerance), updating stopword lists.
