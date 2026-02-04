/**
 * THE CALL Operator Spec (Ticket 021)
 * Enforces owner, timebox, artifact, and success signal in the decisive final block.
 */

export interface CallSpecSummary {
    pass: boolean;
    patched: boolean;
    llmFix: boolean;
    count: number;
}

const DEFAULT_OWNERS = ['GM', 'Owner', 'Operations Lead', 'Shift Supervisor'];
const TIMEBOXES = ['by next Friday', 'over the next 10 days', 'in the next two weeks', 'by the end of the month'];
const ARTIFACTS: Record<string, string[]> = {
    OPERATING_REALITY: ['single-page SOP', 'weekly scoreboard', 'shift handoff log'],
    CONSTRAINT_LANDSCAPE: ['allocation sheet', 'inventory count script', 'labor model'],
    BLIND_SPOT_RISKS: ['risk mitigation checklist', 'escalation tree', 'safety log'],
    ALIGNMENT_SIGNALS: ['meeting rhythm doc', 'alignment scorecard', 'priority list']
};
const SUCCESS_SIGNALS = [
    'we verify 100% completion in the log',
    'errors drop below the weekly threshold',
    'the team confirms they have the info they need',
    "we don't see the same issue in the next cycle"
];

export function enforceCallSpec(
    sections: Record<string, any>,
    summary: CallSpecSummary,
    sectionIndex: number = 0
): void {
    Object.keys(sections).forEach((key, idx) => {
        if (key === 'EXEC_SUMMARY') return;
        const section = sections[key];
        const theCall = section.theCall || '';

        const hasOwner = /\b(owner|gm|lead|supervisor|operator|manager|ops|staff|team)\b/i.test(theCall);
        const hasTimebox = /\b(friday|days|weeks|month|by|next|end of)\b/i.test(theCall);
        const hasArtifact = /\b(sop|sheet|scoreboard|log|checklist|tree|doc|list|script|model)\b/i.test(theCall);
        const hasSuccess = /know it worked|target:|we verify|we confirm|below threshold/i.test(theCall);

        if (!hasOwner || !hasTimebox || !hasArtifact || !hasSuccess) {
            summary.count++;
            summary.patched = true;

            // Deterministic patching
            let patch = '';
            if (!hasOwner) patch += `The ${DEFAULT_OWNERS[idx % DEFAULT_OWNERS.length]} will own this move. `;
            if (!hasTimebox) patch += `We'll complete it ${TIMEBOXES[idx % TIMEBOXES.length]}. `;
            if (!hasArtifact) {
                const artifacts = ARTIFACTS[key] || ['operational update'];
                patch += `The output will be a ${artifacts[idx % artifacts.length]}. `;
            }
            if (!hasSuccess) patch += `Target: ${SUCCESS_SIGNALS[idx % SUCCESS_SIGNALS.length]}. `;

            section.theCall = theCall.trim() + (theCall.endsWith('.') ? ' ' : '. ') + patch.trim();
        }
    });

    summary.pass = true;
}
