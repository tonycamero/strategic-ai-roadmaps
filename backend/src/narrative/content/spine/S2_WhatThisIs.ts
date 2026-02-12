import { NarrativeBlock } from '../../types.ts';

export const S2_WhatThisIs: NarrativeBlock = {
    id: 'S2_WhatThisIs',
    category: 'Spine',
    appliesWhen: {}, // Always applies (Cover/Intro)
    priority: 2,
    content: {
        headline: 'What This Is',
        body: 'A diagnostic, not a roadmap. It identifies where execution breaks under stress.',
    }
};
