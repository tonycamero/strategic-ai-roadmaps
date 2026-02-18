import { NarrativeBlock } from '../../types';

export const D1_ReworkNorm: NarrativeBlock = {
    id: 'D1_ReworkNorm',
    category: 'Role',
    appliesWhen: { role: ['delivery'] },
    priority: 50,
    content: {
        headline: 'Delivery Pattern: Rework Normalization',
        body: 'You fix upstream errors downstream. Instead of rejecting bad inputs from Sales, you absorb the complexity and fix it during production, hiding the cost of the error from the system.',
        implications: [
            'Tell: "It\'s easier if I just fix it myself."',
            'The cost of delivery includes a "fix-it" tax on every unit.'
        ]
    }
};

export const D2_ScopeCreep: NarrativeBlock = {
    id: 'D2_ScopeCreep',
    category: 'Role',
    appliesWhen: { role: ['delivery'] },
    priority: 50,
    content: {
        headline: 'Delivery Pattern: Scope Creep Absorption',
        body: 'You say yes to maintain relationships. You allow client demands to expand beyond the contract to avoid conflict, effectively giving away margin to buy peace.',
        implications: [
            'Tell: "We\'ll just add that in, it won\'t take long."',
            'Project profitability degrades as timelines extend.'
        ]
    }
};

export const D3_QualityFade: NarrativeBlock = {
    id: 'D3_QualityFade',
    category: 'Role',
    appliesWhen: { role: ['delivery'] },
    priority: 50,
    content: {
        headline: 'Delivery Pattern: Quality Degradation',
        body: 'You trade standards for speed. Under pressure to meet unrealistic timelines, you silently skip QA steps or polish, accumulating technical and brand debt.',
        implications: [
            'Tell: "We have to ship it, we can clean it up later."',
            'Client trust erodes slowly as the "polish" disappears.'
        ]
    }
};

export const D4_DeadlineCompress: NarrativeBlock = {
    id: 'D4_DeadlineCompress',
    category: 'Role',
    appliesWhen: { role: ['delivery'] },
    priority: 50,
    content: {
        headline: 'Delivery Pattern: Deadline Compression',
        body: 'You pay for delays with your weekend. When upstream delays shorten the production window, you accept the compressed timeline instead of flagging the risk.',
        implications: [
            'Tell: "we\'ll pull an all-nighter to get it done."',
            'Sustainable pace is impossible; burnout is guaranteed.'
        ]
    }
};
