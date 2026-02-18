import { NarrativeBlock } from '../../types';
import { TimingType, SeverityType } from '../../taxonomy';

// Helper to format the body content
const formatBody = (body: string, mandate: string, reality: string) =>
    `${body}\n\n**Mandate:**\n${mandate}\n\n**Board Reality:**\n${reality}`;

export const MAN_ActionRequired: NarrativeBlock = {
    id: 'MAN_ActionRequired',
    category: 'DecisionSpine',
    appliesWhen: {
        timing: [TimingType.NOW],
        severity: [SeverityType.HIGH]
    },
    priority: 95, // Specific matches beat universal (90)
    content: {
        headline: 'Immediate Intervention Is Required',
        body: formatBody(
            'This is no longer a strategic discussion. The system is actively failing, and continued operation under the current model guarantees further damage.\n\nIncremental fixes will not stabilize execution. Local optimizations will be absorbed and neutralized by the constraint.',
            'Authorize a full execution roadmap immediately, or explicitly accept continued loss as a conscious decision.',
            'Delay is not prudence. It is exposure.'
        )
    }
};

export const MAN_PreemptiveStrike: NarrativeBlock = {
    id: 'MAN_PreemptiveStrike',
    category: 'DecisionSpine',
    appliesWhen: {
        timing: [TimingType.NEXT],
        severity: [SeverityType.MEDIUM, SeverityType.HIGH]
    },
    priority: 95,
    content: {
        headline: 'Act Now or Fail at Scale',
        body: formatBody(
            'The system cannot support the next phase of growth. Waiting for failure will convert a solvable design problem into a reputational and operational crisis.\n\nThis is the last moment where intervention preserves leverage.',
            'Authorize the execution roadmap before initiating growth, or accept that expansion will amplify breakage rather than output.',
            'You are choosing between design-led scale and crisis-led repair.'
        )
    }
};

export const MAN_StructuralDecision: NarrativeBlock = {
    id: 'MAN_StructuralDecision',
    category: 'DecisionSpine',
    appliesWhen: {
        timing: [TimingType.NOW],
        severity: [SeverityType.MEDIUM]
    },
    priority: 95,
    content: {
        headline: 'Choose Structure or Continued Dependence on Heroics',
        body: formatBody(
            'Current performance is being propped up by individuals compensating for systemic failure. This is not sustainable and cannot be scaled or insured.\n\nThe system will not self-correct.',
            'Either formalize and enforce structure now, or accept ongoing dependency on specific people and their tolerance for burnout.',
            'You are deciding whether the business runs on systems or on sacrifice.'
        )
    }
};

export const MAN_DesignOrDisruption: NarrativeBlock = {
    id: 'MAN_DesignOrDisruption',
    category: 'DecisionSpine',
    appliesWhen: {
        timing: [TimingType.LATER],
        severity: [SeverityType.HIGH]
    },
    priority: 95,
    content: {
        headline: 'This Failure Is Scheduled',
        body: formatBody(
            'The constraint is latent, not absent. When triggered, it will dominate execution and force emergency intervention under worse conditions.\n\nThis is a known future failure with a visible design path today.',
            'Authorize proactive system design now, or knowingly defer the cost to a moment of maximum disruption.',
            'The only unknown is timing — not outcome.'
        )
    }
};

export const MAN_GovernanceDecision: NarrativeBlock = {
    id: 'MAN_GovernanceDecision',
    category: 'DecisionSpine',
    appliesWhen: {
        timing: [TimingType.LATER],
        severity: [SeverityType.LOW, SeverityType.MEDIUM]
    },
    priority: 95,
    content: {
        headline: 'Establish Governance While You Can',
        body: formatBody(
            'The system is stable but structurally incomplete. This window allows for deliberate, low-friction intervention before urgency distorts judgment.\n\nIgnoring this phase forfeits the advantage of calm design.',
            'Either authorize a controlled roadmap now or formally accept higher future remediation costs.',
            'This is the cheapest this fix will ever be.'
        )
    }
};

export const MAN_FalseOptionKiller: NarrativeBlock = {
    id: 'MAN_FalseOptionKiller',
    category: 'DecisionSpine',
    // Universal fallback
    appliesWhen: {},
    priority: 90, // Lower priority than specific matches
    content: {
        headline: 'Incremental Fixes Will Not Resolve This',
        body: formatBody(
            'This constraint cannot be solved through better meetings, stronger effort, or isolated tooling changes. Those actions treat symptoms while preserving the underlying failure.\n\nPartial action creates the illusion of progress while extending exposure.',
            'Either commit to a full execution roadmap or explicitly decline structural correction.',
            '“Trying harder” is not a strategy.'
        )
    }
};
