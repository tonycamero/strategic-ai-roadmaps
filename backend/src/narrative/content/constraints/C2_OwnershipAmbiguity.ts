import { NarrativeBlock } from '../../types';
import { ConstraintType } from '../../taxonomy';

export const C2_OwnershipAmbiguity: NarrativeBlock = {
    id: 'C2_OwnershipAmbiguity',
    category: 'Constraint',
    appliesWhen: {
        constraint: [ConstraintType.OWNERSHIP_AMBIGUITY]
    },
    priority: 10,
    content: {
        headline: 'Ownership Ambiguity',
        body: 'Work exists without a single, final owner. Responsibilities are shared to the point of dilution, causing handoffs to fail and problems to recur without resolution.',
        implications: [
            'Momentum decays at every handoff point.',
            'Issues are debated rather than solved.'
        ]
    }
};
