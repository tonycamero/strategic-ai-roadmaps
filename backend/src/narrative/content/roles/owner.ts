import { NarrativeBlock } from '../../types.ts';
import { RolePatternType } from '../../taxonomy.ts';

export const O1_Heroics: NarrativeBlock = {
    id: 'O1_Heroics',
    category: 'Role',
    appliesWhen: { role: ['owner'] }, // Specific pattern key: O1
    // rubric: { rolePattern: RolePatternType.HEROICS } - future
    priority: 50,
    content: {
        headline: 'Owner Pattern: Personal Heroics',
        body: 'You are absorbing system failures instead of enforcing structure. When the process breaks, you step in to fix it manually, teaching the team that escalation is the solution to friction.',
        implications: [
            'Tell: "I just need to dive in and fix this myself so we can move on."',
            'Throughput is capped by your personal cognitive load.'
        ]
    }
};

export const O2_DecisionHoarding: NarrativeBlock = {
    id: 'O2_DecisionHoarding',
    category: 'Role',
    appliesWhen: { role: ['owner'] },
    priority: 50,
    content: {
        headline: 'Owner Pattern: Decision Hoarding',
        body: 'You have become the Chief Bottleneck Officer. Because standards are ambiguous, you require approval on decisions that should be autonomous, freezing velocity whenever you are unavailable.',
        implications: [
            'Tell: "Don\'t send that until I\'ve had a chance to look at it."',
            'Teams wait for permission rather than executing against criteria.'
        ]
    }
};

export const O3_PriorityThrash: NarrativeBlock = {
    id: 'O3_PriorityThrash',
    category: 'Role',
    appliesWhen: { role: ['owner'] },
    priority: 50,
    content: {
        headline: 'Owner Pattern: Priority Thrash',
        body: 'You change direction faster than the system can turn. By reacting to the latest signal without a structural filter, you create a "stop-start" energy that exhausts delivery teams.',
        implications: [
            'Tell: "Forget what I said yesterday; this new thing is the priority."',
            'Momentum is destroyed by constant context switching.'
        ]
    }
};

export const O4_VisionNoMechanism: NarrativeBlock = {
    id: 'O4_VisionNoMechanism',
    category: 'Role',
    appliesWhen: { role: ['owner'] },
    priority: 50,
    content: {
        headline: 'Owner Pattern: Vision Without Mechanism',
        body: 'You set ambitious goals without the machinery to hit them. The gap between your expectations and reality creates a culture of disappointment rather than high performance.',
        implications: [
            'Tell: "Why is nobody executing on the vision I laid out?"',
            'Goals are treated as wishes rather than engineering targets.'
        ]
    }
};
