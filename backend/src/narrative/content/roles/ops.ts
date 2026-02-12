import { NarrativeBlock } from '../../types.ts';

export const P1_ManualReconcile: NarrativeBlock = {
    id: 'P1_ManualReconcile',
    category: 'Role',
    appliesWhen: { role: ['ops'] },
    priority: 50,
    content: {
        headline: 'Ops Pattern: Manual Reconciliation',
        body: 'You are the human API between incompatible tools. Your value is currently defined by how fast you can copy-paste data between systems that should talk to each other automatically.',
        implications: [
            'Tell: "I spend my Friday mornings cleaning up the data."',
            'The business cannot scale without linearly scaling your hours.'
        ]
    }
};

export const P2_ShadowSystems: NarrativeBlock = {
    id: 'P2_ShadowSystems',
    category: 'Role',
    appliesWhen: { role: ['ops'] },
    priority: 50,
    content: {
        headline: 'Ops Pattern: Shadow Systems',
        body: 'You run the "real" business on a side-sheet. Because the official tools are rigid or broken, you maintain the source of truth in a personal spreadsheet that nobody else can audit.',
        implications: [
            'Tell: "Ignore the dashboard, look at my tracker."',
            'The organization loses its memory if you leave.'
        ]
    }
};

export const P3_Firefighting: NarrativeBlock = {
    id: 'P3_Firefighting',
    category: 'Role',
    appliesWhen: { role: ['ops'] },
    priority: 50,
    content: {
        headline: 'Ops Pattern: Firefighting Mode',
        body: 'You mistake urgency for impact. You are so busy catching dropped balls that you have no capacity to build the net that would catch them for you.',
        implications: [
            'Tell: "It\'s been a crazy week, I haven\'t had time to think."',
            'Strategic projects are permanently deferred for daily crises.'
        ]
    }
};

export const P4_ProcessDrift: NarrativeBlock = {
    id: 'P4_ProcessDrift',
    category: 'Role',
    appliesWhen: { role: ['ops'] },
    priority: 50,
    content: {
        headline: 'Ops Pattern: Process Drift',
        body: 'You own the SOPs, but nobody follows them. You create documentation that is theoretically correct but practically ignored, leading to a widening gap between "how we say we work" and reality.',
        implications: [
            'Tell: "I wrote a process for that last month, why isn\'t it being used?"',
            'Standardization exists on paper only.'
        ]
    }
};
