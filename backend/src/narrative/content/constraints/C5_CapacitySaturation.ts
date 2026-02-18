import { NarrativeBlock } from '../../types';
import { ConstraintType } from '../../taxonomy';

export const C5_CapacitySaturation: NarrativeBlock = {
    id: 'C5_CapacitySaturation',
    category: 'Constraint',
    appliesWhen: {
        constraint: [ConstraintType.CAPACITY_SATURATION]
    },
    priority: 10,
    content: {
        headline: 'Capacity Saturation',
        body: 'The organization is at or beyond sustainable load. Heroics are normalized to meet baseline expectations, and errors spike whenever volume increases, indicating a system with zero elasticity.',
        implications: [
            'Throughput is flat despite increased effort.',
            'Burnout is structural, not a temporary condition.'
        ]
    }
};
