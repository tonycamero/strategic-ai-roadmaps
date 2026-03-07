# Stage-5 Assisted Synthesis Execution Freeze

Stage-5 Assisted Synthesis is now a completed authority surface. No further architectural or logic changes are permitted in this domain without explicit governance approval.

## Authoritative Invariants

1.  **Proposal Identity**: `sas_proposals.id` is the canonical UUID used for all downstream election and activation logic.
2.  **Election Uniqueness**: `sas_elections.proposal_id` is enforced as `UNIQUE` at the database level.
3.  **Atomic Writes**: All election records are written using `UPSERT` (`ON CONFLICT DO UPDATE`) to ensure a single authoritative record per proposal.
4.  **Retrieval Logic**: `getElectionSummary` returns only the single, latest decision for each unique proposal, eliminating historical drift.
5.  **UI Derivation**: Frontend proposal shading (`accepted`/`rejected`) is derived directly from the backend election state on load.
6.  **Idempotent Declaration**: `declareCanonicalFindings` is idempotent and safe for multi-invocation.

Stage-5 is now a deterministic operator moderation surface.
Transitioning to Stage-6 Authority Activation.
