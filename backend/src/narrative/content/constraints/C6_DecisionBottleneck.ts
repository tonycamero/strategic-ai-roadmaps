import { NarrativeBlock } from '../../types';
import { ConstraintType } from '../../taxonomy';

export const C6_DecisionBottleneck: NarrativeBlock = {
    id: 'C6_DecisionBottleneck',
    category: 'Constraint',
    appliesWhen: {
        constraint: [ConstraintType.DECISION_BOTTLENECK]
    },
    priority: 10,
    content: {
        headline: 'Decision Bottleneck',
        body: 'Progress is gated by too few decision-makers. Teams across the organization are waiting to act because authority has not been effectively delegated or mechanized.',
        implications: [
            'Speed collapses as the organization scales.',
            'The founder becomes the chief obstacle to execution.'
        ]
    }
};
