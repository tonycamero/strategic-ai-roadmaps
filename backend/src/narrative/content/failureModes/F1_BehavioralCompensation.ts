import { NarrativeBlock } from '../../types.ts';
import { FailureModeType } from '../../taxonomy.ts';

export const F1_BehavioralCompensation: NarrativeBlock = {
    id: 'F1_BehavioralCompensation',
    category: 'FailureMode',
    appliesWhen: {
        failureMode: [FailureModeType.BEHAVIORAL_COMPENSATION]
    },
    priority: 20,
    content: {
        headline: 'Failure Mode: Behavioral Compensation',
        body: 'The organization masks this constraint through high-effort individual intervention. Manual follow-ups, personal reminders, and heroic overtime are effectively subsidizing the broken process.',
        implications: [
            'Throughput is capped by human stamina.',
            'Staff burnout becomes the primary scaling limit.'
        ]
    }
};
