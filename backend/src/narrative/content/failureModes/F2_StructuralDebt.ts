import { NarrativeBlock } from '../../types';
import { FailureModeType } from '../../taxonomy';

export const F2_StructuralDebt: NarrativeBlock = {
    id: 'F2_StructuralDebt',
    category: 'FailureMode',
    appliesWhen: {
        failureMode: [FailureModeType.STRUCTURAL_DEBT]
    },
    priority: 20,
    content: {
        headline: 'Failure Mode: Structural Debt',
        body: 'The organization has calcified this constraint into its tooling. Shadow workflows, one-off automations, and custom spreadsheets have been built to route around the breakage rather than fix it.',
        implications: [
            'Complexity increases superlinearly with scale.',
            'Onboarding new talent requires learning the workarounds, not just the role.'
        ]
    }
};
