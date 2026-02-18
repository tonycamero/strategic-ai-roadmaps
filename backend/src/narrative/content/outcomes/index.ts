import { NarrativeBlock } from '../../types';
import { OutcomeType } from '../../taxonomy';

export const R1_RevenueLeak: NarrativeBlock = {
    id: 'R1_RevenueLeak',
    category: 'Outcome',
    appliesWhen: { outcome: [OutcomeType.REVENUE_LEAK] },
    priority: 40,
    content: {
        headline: 'Projected Outcome: Revenue Leak',
        body: 'Without intervention, this pattern results in a silent, continuous erosion of revenue. Warm leads cool off, upsells are missed, and LTV degrades due to lack of systematic persistence.',
        implications: ['Growth becomes inexplicably expensive.', 'Conversion rates decay over time.']
    }
};

export const R2_ScalingStall: NarrativeBlock = {
    id: 'R2_ScalingStall',
    category: 'Outcome',
    appliesWhen: { outcome: [OutcomeType.SCALING_STALL] },
    priority: 40,
    content: {
        headline: 'Projected Outcome: Scaling Stall',
        body: 'The system has reached its physical limit. Adding more leads or resources will not increase output; it will only increase noise. Growth will plateau regardless of investment.',
        implications: ['The business hits a hard ceiling.', 'Capital efficiency collapses.']
    }
};

export const R3_Burnout: NarrativeBlock = {
    id: 'R3_Burnout',
    category: 'Outcome',
    appliesWhen: { outcome: [OutcomeType.BURNOUT] },
    priority: 40,
    content: {
        headline: 'Projected Outcome: Team Burnout',
        body: 'The organization is running on debt—specifically, the energy debt of its people. When the "hero mode" subsidy runs out, key talent will churn, causing a sudden capacity collapse.',
        implications: ['Institutional knowledge walks out the door.', 'Replacement costs exceed retention costs.']
    }
};

export const R4_TrustErosion: NarrativeBlock = {
    id: 'R4_TrustErosion',
    category: 'Outcome',
    appliesWhen: { outcome: [OutcomeType.TRUST_EROSION] },
    priority: 40,
    content: {
        headline: 'Projected Outcome: Trust Erosion',
        body: 'Inconsistency is visible to the market. Missed deadlines or dropped context signal to clients that the delivery machine is unreliable, degrading the brand asset permanently.',
        implications: ['Churn spikes unexpectedly.', 'Sales become harder to close due to reputation drag.']
    }
};

export const R5_FounderLockIn: NarrativeBlock = {
    id: 'R5_FounderLockIn',
    category: 'Outcome',
    appliesWhen: { outcome: [OutcomeType.FOUNDER_LOCK_IN] },
    priority: 40,
    content: {
        headline: 'Projected Outcome: Founder Lock-In',
        body: 'The founder remains the only integration point for the company. You cannot exit, you cannot step back, and you cannot sell, because the business is an extension of your mind, not a standalone asset.',
        implications: ['Enterprise value is capped.', 'The business has no liquidity event potential.']
    }
};
