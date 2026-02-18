import { NarrativeBlock } from '../../types';
import { TimingType, SeverityType, OutcomeType, ConstraintType } from '../../taxonomy';

// DS1: SITUATION (Verdict)
export const DS1_Situation_ActiveConstraint: NarrativeBlock = {
    id: 'DS1_Situation_ActiveConstraint',
    category: 'DecisionSpine',
    priority: 100,
    appliesWhen: { timing: [TimingType.NOW] },
    content: {
        headline: "The Window of Opportunity is Open, But Closing",
        body: "Your organization is currently executing, but efficiency is degrading as complexity scales. The constraint is active—meaning every unit of new growth now costs more energy than the last. You are trading heroics for revenue."
    }
};

export const DS1_Situation_ImpendingStall: NarrativeBlock = {
    id: 'DS1_Situation_ImpendingStall',
    category: 'DecisionSpine',
    priority: 100,
    appliesWhen: { timing: [TimingType.NEXT] }, // Mapped SOON -> NEXT
    content: {
        headline: "Momentum is Masking Structural Fragility",
        body: "Top-line metrics look healthy, but the underlying execution lattice is fracturing. You are winning on talent and effort, but the system itself is not supporting the weight of recent growth. A stall is mathematically inevitable without architectural intervention."
    }
};

export const DS1_Situation_DormantRisk: NarrativeBlock = {
    id: 'DS1_Situation_DormantRisk',
    category: 'DecisionSpine',
    priority: 100,
    appliesWhen: { timing: [TimingType.LATER] },
    content: {
        headline: "You Are Building Technical Debt into Organizational Culture",
        body: "There is no immediate crisis, which is the most dangerous phase. You are currently codifying habits—how decisions are made, how work is transferred—that will become impossible to unwind once velocity increases. You are scaling a constraint."
    }
};

// DS2: CONSEQUENCE (Cost of Inaction)
export const DS2_Consequence_FounderCap: NarrativeBlock = {
    id: 'DS2_Consequence_FounderCap',
    category: 'DecisionSpine',
    priority: 30, // Higher priority than general outcomes
    // Logic: Applies if outcome is Burnout OR Stagnation (Mapped to LOCK_IN)
    appliesWhen: { outcome: [OutcomeType.BURNOUT, OutcomeType.FOUNDER_LOCK_IN] },
    content: {
        headline: "The Business Cannot Outgrow You",
        body: "If this constraint persists, the company’s maximum output will be permanently tethered to your personal available hours. You become the bottleneck for every major decision, turning your own competence into the primary limit on enterprise value."
    }
};

export const DS2_Consequence_InsolvencyRisk: NarrativeBlock = {
    id: 'DS2_Consequence_InsolvencyRisk',
    category: 'DecisionSpine',
    priority: 25,
    appliesWhen: { severity: [SeverityType.HIGH] }, // Mapped CRITICAL -> HIGH
    content: {
        headline: "Structural Collapse is a Valid Probability",
        body: "This is not just inefficiency; it is fragility. A system this tightly coupled cannot absorb shock. If a key leader leaves or the market shifts, the execution layer will seize. You are operating without a structural safety margin."
    }
};

export const DS2_Consequence_RevenueExposure: NarrativeBlock = {
    id: 'DS2_Consequence_RevenueExposure',
    category: 'DecisionSpine',
    priority: 20,
    // Fallback/Generic
    appliesWhen: { outcome: [OutcomeType.REVENUE_LEAK, OutcomeType.SCALING_STALL, OutcomeType.TRUST_EROSION] },
    content: {
        headline: "Your Growth is Subsidizing Your Inefficiency",
        body: "You are currently burning margin to compensate for lack of structure. As you scale, this 'execution tax' compounds. You will end up running a larger business that generates less free cash flow than the one you have today."
    }
};

// DS3: MANDATE (The Choice)
export const DS3_Mandate_StructuralShift: NarrativeBlock = {
    id: 'DS3_Mandate_StructuralShift',
    category: 'DecisionSpine',
    priority: 100,
    appliesWhen: { severity: [SeverityType.HIGH] }, // Mapped CRITICAL -> HIGH
    content: {
        headline: "Intervention Must Be Architectural, Not Behavioral",
        body: "You cannot train your way out of this. You cannot hire your way out of this. The solution requires a fundamental change in how the organization processes reality. We must replace 'asking for updates' with a system that self-reports truth."
    }
};

export const DS3_Mandate_DecisionProtocol: NarrativeBlock = {
    id: 'DS3_Mandate_DecisionProtocol',
    category: 'DecisionSpine',
    priority: 99,
    appliesWhen: { timing: [TimingType.NOW] },
    content: {
        headline: "Stop managing people. Start managing the protocol.",
        body: "The shift is simple but painful: Move from a culture of permission ('Can I do this?') to a culture of protocols ('I have met the criteria, so I am proceeding'). This removes you from the loop while increasing control."
    }
};

export const DS3_Mandate_RoadmapAuthorization: NarrativeBlock = {
    id: 'DS3_Mandate_RoadmapAuthorization',
    category: 'DecisionSpine',
    priority: 10, // Fallback
    appliesWhen: {}, // All/Default
    content: {
        headline: "Authorize the System",
        body: "The diagnostic is complete. The constraint is visible. The cost is calculated. The only remaining decision is whether to tolerate this friction for another quarter, or to authorize the architecture that removes it."
    }
};
