import { NarrativeBlock } from '../../types.ts';
import { ConstraintType } from '../../taxonomy.ts';

export const C1_EnforcementFailure: NarrativeBlock = {
    id: 'C1_EnforcementFailure',
    category: 'Constraint',
    appliesWhen: {
        constraint: [ConstraintType.ENFORCEMENT_FAILURE]
    },
    priority: 10,
    content: {
        headline: 'Enforcement Failure',
        body: 'Decisions exist but are not enforced consistently. SLAs are defined but ignored, making follow-ups optional. Accountability is emotional, not mechanical.',
        implications: [
            'The system relies on human memory to function.',
            'Standards degrade whenever leadership attention shifts.'
        ]
    }
};
