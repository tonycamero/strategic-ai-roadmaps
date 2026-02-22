EXEC-TICKET-05
Title: Preserve SAS (SuperAdmin) as Separate Agent

Objective:
Confirm assistedSynthesisAgent + proposals remain SAS layer.
No orchestration merge.

Actions:
- Document separation in docs/canon/AGENT_SURFACES.md
- Explicitly state: SAS != TCA

No code modifications unless drift found.

Exit Criteria:
- Canon updated
- No architectural ambiguity
