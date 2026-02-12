import { NarrativeBlock } from '../../types.ts';
import { TimingType, SeverityType } from '../../taxonomy.ts';

export const SIT_ActiveBreach: NarrativeBlock = {
    id: 'SIT_ActiveBreach',
    category: 'DecisionSpine', // Mapping to valid union member
    appliesWhen: {
        timing: [TimingType.NOW],
        severity: [SeverityType.HIGH]
    },
    priority: 0,
    content: {
        headline: 'The System Is Already Failing',
        body: 'This is not an early warning. The constraint has already breached containment and is actively extracting cost from the business. Revenue, capacity, or trust is being lost in real time.\n\nStability is compromised. Any sense of control is retrospective.\n\n**Board Interpretation:** You are no longer deciding *whether* to act — only *how much damage you are willing to absorb before acting*.'
    }
};

export const SIT_ImminentFailure: NarrativeBlock = {
    id: 'SIT_ImminentFailure',
    category: 'DecisionSpine',
    appliesWhen: {
        timing: [TimingType.NEXT],
        severity: [SeverityType.MEDIUM, SeverityType.HIGH]
    },
    priority: 0,
    content: {
        headline: 'The Next Growth Phase Will Break the System',
        body: 'The current operating model is surviving only because volume has not yet crossed its stress threshold. The next push — more leads, more clients, more hires — will expose the constraint violently.\n\nGrowth will not compound. It will destabilize.\n\n**Board Interpretation:** Action now preserves leverage. Delay guarantees crisis during expansion.'
    }
};

export const SIT_HiddenDebt: NarrativeBlock = {
    id: 'SIT_HiddenDebt',
    category: 'DecisionSpine',
    appliesWhen: {
        timing: [TimingType.NOW],
        severity: [SeverityType.MEDIUM]
    },
    priority: 0,
    content: {
        headline: 'Performance Is Being Subsidized by People',
        body: 'Output appears stable because individuals are compensating manually. This masks the constraint but increases fragility. The system is functioning on borrowed energy and untracked effort.\n\nThe bill has not arrived yet — but it is accruing.\n\n**Board Interpretation:** What looks like “holding it together” is actually deferred failure.'
    }
};

export const SIT_StructuralRisk: NarrativeBlock = {
    id: 'SIT_StructuralRisk',
    category: 'DecisionSpine',
    appliesWhen: {
        timing: [TimingType.LATER],
        severity: [SeverityType.HIGH]
    },
    priority: 0,
    content: {
        headline: 'This Is a Guaranteed Future Failure',
        body: 'The constraint is not currently dominant, but it is structurally embedded. When conditions change — scale, complexity, personnel — it will surface as the primary limiter.\n\nThis is not hypothetical. It is scheduled.\n\n**Board Interpretation:** You can pay the cost in design now, or in disruption later.'
    }
};

export const SIT_MonitoringZone: NarrativeBlock = {
    id: 'SIT_MonitoringZone',
    category: 'DecisionSpine',
    appliesWhen: {
        timing: [TimingType.LATER],
        severity: [SeverityType.LOW, SeverityType.MEDIUM]
    },
    priority: 0,
    content: {
        headline: 'The System Is Stable — But Not Safe',
        body: 'Current performance is not under threat, but the underlying constraint exists. Left unaddressed, it will activate as the organization evolves.\n\nThis is the window where intervention is cheapest and least disruptive.\n\n**Board Interpretation:** This is the last moment where inaction is a rational choice.'
    }
};
