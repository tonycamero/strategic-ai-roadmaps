import { NarrativeBlock } from '../../types.ts';
import { ConstraintType } from '../../taxonomy.ts';

export const C3_VisibilityCollapse: NarrativeBlock = {
    id: 'C3_VisibilityCollapse',
    category: 'Constraint',
    appliesWhen: {
        constraint: [ConstraintType.VISIBILITY_COLLAPSE]
    },
    priority: 10,
    content: {
        headline: 'Visibility Collapse',
        body: 'Leadership cannot see reality in time to act. Data is delayed, partial, or anecdotal, forcing decisions to be made on gut feel rather than empirical signal.',
        implications: [
            'KPIs lag outcomes, making them autopsies rather than instruments.',
            'Revenue leaks remain invisible until they are irreversible.'
        ]
    }
};
