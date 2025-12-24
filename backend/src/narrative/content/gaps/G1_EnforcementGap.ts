import { NarrativeBlock } from '../../types';

export const G1_EnforcementGap: NarrativeBlock = {
    id: 'G1_EnforcementGap',
    category: 'Gap',
    appliesWhen: {
        gapScale: { enforcement: true }
    },
    priority: 25,
    content: {
        headline: 'System Gaps: Enforcement',
        body: 'The system has an Enforcement Gap. Correct execution currently requires human memory and willpower, meaning standards degrade the moment leadership attention shifts.',
        implications: [
            'Compliance is voluntary rather than structural.',
            'Errors are inevitable as team cognitive load increases.'
        ]
    }
};
