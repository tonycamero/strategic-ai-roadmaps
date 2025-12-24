import { NarrativeBlock } from '../../types';
import { ConstraintType } from '../../taxonomy';

export const C4_SystemFragmentation: NarrativeBlock = {
    id: 'C4_SystemFragmentation',
    category: 'Constraint',
    appliesWhen: {
        constraint: [ConstraintType.SYSTEM_FRAGMENTATION]
    },
    priority: 10,
    content: {
        headline: 'System Fragmentation',
        body: 'Tools exist but do not form a coherent system. Manual bridges, shadow workflows, and duplicate data entry create a hidden tax on every unit of work.',
        implications: [
            'The source of truth is fragmented across multiple owners.',
            'Scale amplifies the friction rather than the throughput.'
        ]
    }
};
