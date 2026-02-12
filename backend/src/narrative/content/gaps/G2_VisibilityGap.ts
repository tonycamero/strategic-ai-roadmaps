import { NarrativeBlock } from '../../types.ts';

export const G2_VisibilityGap: NarrativeBlock = {
    id: 'G2_VisibilityGap',
    category: 'Gap',
    appliesWhen: {
        gapScale: { visibility: true }
    },
    priority: 25,
    content: {
        headline: 'System Gaps: Visibility',
        body: 'The system has a Visibility Gap. Critical signals are lagging rather than leading, meaning damage to revenue or reputation happens before leadership can see it.',
        implications: [
            'Decisions are reactive autopsies instead of proactive maneuvers.',
            'Confidence in the forecast separates from reality.'
        ]
    }
};
