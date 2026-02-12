import { NarrativeBlock } from '../../types.ts';
import { SeverityType } from '../../taxonomy.ts';

export const SEV_LOW: NarrativeBlock = {
    id: 'SEV_LOW',
    category: 'Severity',
    appliesWhen: { severity: [SeverityType.LOW] },
    priority: 35,
    content: {
        headline: 'Severity: Low',
        body: 'Single-role compensation detected. The friction is localized and has not yet cascaded to affect total system throughput or revenue integrity.',
        implications: ['Monitor for escalation.', 'Reinforce local standards to prevent drift.']
    }
};

export const SEV_MEDIUM: NarrativeBlock = {
    id: 'SEV_MEDIUM',
    category: 'Severity',
    appliesWhen: { severity: [SeverityType.MEDIUM] },
    priority: 35,
    content: {
        headline: 'Severity: Medium',
        body: 'Multi-role compensation detected. The constraint is causing friction across handoffs, slowing velocity and requiring increasing management intervention to maintain output.',
        implications: ['Efficiency is degrading.', 'Management load is increasing superlinearly.']
    }
};

export const SEV_HIGH: NarrativeBlock = {
    id: 'SEV_HIGH',
    category: 'Severity',
    appliesWhen: { severity: [SeverityType.HIGH] },
    priority: 35,
    content: {
        headline: 'Severity: High',
        body: 'Cross-role failure detected. The constraint has breached containment, causing direct damage to revenue, client trust, or fundamental capacity.',
        implications: ['System stability is compromised.', 'The current operating model is insolvent.']
    }
};
