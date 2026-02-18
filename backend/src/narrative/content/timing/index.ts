import { NarrativeBlock } from '../../types';
import { TimingType } from '../../taxonomy';

export const T1_NOW: NarrativeBlock = {
    id: 'T1_NOW',
    category: 'Timing',
    appliesWhen: { timing: [TimingType.NOW] },
    priority: 30,
    content: {
        headline: 'Timing Assessment: NOW',
        body: 'This constraint is active and currently extracting a tax on execution. The cost is not theoretical; it is visible in lost revenue, wasted cycles, or missed commitments.',
        implications: ['The window to fix this proactively has closed.', 'Immediate remediation is required to stop the bleeding.']
    }
};

export const T2_NEXT: NarrativeBlock = {
    id: 'T2_NEXT',
    category: 'Timing',
    appliesWhen: { timing: [TimingType.NEXT] },
    priority: 30,
    content: {
        headline: 'Timing Assessment: NEXT',
        body: 'This constraint is currently contained but will break at the next inflection point of scale. The current system cannot support the next tier of volume or complexity.',
        implications: ['Action now buys leverage later.', 'Waiting ensures a crisis during the next growth phase.']
    }
};

export const T3_LATER: NarrativeBlock = {
    id: 'T3_LATER',
    category: 'Timing',
    appliesWhen: { timing: [TimingType.LATER] },
    priority: 30,
    content: {
        headline: 'Timing Assessment: LATER',
        body: 'This is a dormant constraint. While structurally present, it is not yet the primary limiter. Monitoring is required, but immediate intervention would be premature optimization.',
        implications: ['Preserve focus for higher-priority constraints.', 'Re-evaluate when team size increases by 50%.']
    }
};
