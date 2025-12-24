import { NarrativeBlock } from '../../types';
import { ConstraintType } from '../../taxonomy';

export const CQ_Enforcement: NarrativeBlock = {
    id: 'CQ_Enforcement',
    category: 'DecisionSpine',
    appliesWhen: { constraint: [ConstraintType.ENFORCEMENT_FAILURE] },
    priority: 15,
    content: {
        headline: 'Your Revenue Is Uninsurable',
        body: 'When execution depends on memory and willpower, outcomes become probabilistic. Forecasts lose credibility because compliance cannot be enforced at scale. This converts predictable revenue into variance-heavy exposure.\n\nFrom a board perspective, this is not an execution issue — it is a **risk management failure**.\n\n**Verdict:** A company that cannot enforce its own standards cannot guarantee its own revenue.',
        implications: [
            'Revenue predictability collapses',
            'SLAs cannot be guaranteed',
            'The business cannot be underwritten cleanly by capital or acquirers'
        ]
    }
};

export const CQ_Ownership: NarrativeBlock = {
    id: 'CQ_Ownership',
    category: 'DecisionSpine',
    appliesWhen: { constraint: [ConstraintType.OWNERSHIP_AMBIGUITY] },
    priority: 15,
    content: {
        headline: 'You Are Paying a Velocity Tax on Every Decision',
        body: 'When work has no single accountable owner, decisions fragment into discussions. Resolution slows, escalation increases, and momentum decays invisibly across the organization.\n\nThis is not a culture issue — it is a **throughput limiter**.\n\n**Verdict:** Ambiguity does not feel expensive — until speed becomes the deciding factor.',
        implications: [
            'Cycle times lengthen without appearing on dashboards',
            'High-value initiatives stall in handoff limbo',
            'Competitors with clearer ownership outpace execution'
        ]
    }
};

export const CQ_Visibility: NarrativeBlock = {
    id: 'CQ_Visibility',
    category: 'DecisionSpine',
    appliesWhen: { constraint: [ConstraintType.VISIBILITY_COLLAPSE] },
    priority: 15,
    content: {
        headline: 'You Discover Revenue Problems After They’re Unfixable',
        body: 'Lagging indicators turn leadership into forensic analysts instead of operators. By the time a miss is visible, the corrective window has already closed.\n\nThis creates a false sense of control while erosion compounds silently.\n\n**Verdict:** Late visibility converts solvable problems into permanent losses.',
        implications: [
            'Missed revenue cannot be recovered',
            'Forecast confidence disconnects from reality',
            'Strategic decisions are made on outdated truth'
        ]
    }
};

export const CQ_Fragmentation: NarrativeBlock = {
    id: 'CQ_Fragmentation',
    category: 'DecisionSpine',
    appliesWhen: { constraint: [ConstraintType.SYSTEM_FRAGMENTATION] },
    priority: 15,
    content: {
        headline: 'Every Unit of Growth Increases Friction, Not Output',
        body: 'Fragmented systems impose a hidden coordination tax on every transaction. Manual bridges scale linearly with volume, while errors scale exponentially.\n\nThis is not inefficiency — it is **negative operating leverage**.\n\n**Verdict:** A fragmented system makes scaling mathematically hostile.',
        implications: [
            'Headcount grows faster than revenue',
            'Margins compress as volume increases',
            'Operational complexity becomes the growth ceiling'
        ]
    }
};

export const CQ_Capacity: NarrativeBlock = {
    id: 'CQ_Capacity',
    category: 'DecisionSpine',
    appliesWhen: { constraint: [ConstraintType.CAPACITY_SATURATION] },
    priority: 15,
    content: {
        headline: 'Your Burn Rate Is Human Energy',
        body: 'When baseline performance requires heroics, the organization is already operating in deficit. Effort replaces capacity, masking the absence of elasticity.\n\nThis is not hustle — it is **energy debt**.\n\n**Verdict:** You are consuming future capacity to survive the present.',
        implications: [
            'Output plateaus despite increased effort',
            'Error rates spike under demand',
            'Attrition becomes a certainty, not a risk'
        ]
    }
};

export const CQ_Bottleneck: NarrativeBlock = {
    id: 'CQ_Bottleneck',
    category: 'DecisionSpine',
    appliesWhen: { constraint: [ConstraintType.DECISION_BOTTLENECK] },
    priority: 15,
    content: {
        headline: 'The Business Cannot Operate Without You',
        body: 'When authority concentrates at the top, speed collapses everywhere else. Decisions queue behind availability, freezing execution whenever leadership attention shifts.\n\nThis converts leadership into infrastructure — and infrastructure does not scale.\n\n**Verdict:** A business that depends on you cannot outgrow you.',
        implications: [
            'Execution speed capped by one calendar',
            'Delegation fails despite talent investment',
            'Exit, sale, or succession becomes structurally impossible'
        ]
    }
};
