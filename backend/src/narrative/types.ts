import {
    ConstraintType,
    FailureModeType,
    TimingType,
    RoleType,
    SeverityType,
    OutcomeType
} from './taxonomy';

export interface NarrativeConditions {
    constraint: ConstraintType;
    failureMode: FailureModeType;
    gaps: {
        enforcement: boolean;
        visibility: boolean;
    };
    timing: TimingType;
    severity: SeverityType;
    outcome: OutcomeType;
}

export interface NarrativeSelector {
    constraint?: ConstraintType[];
    failureMode?: FailureModeType[];
    gapScale?: {
        enforcement?: boolean;
        visibility?: boolean
    };
    timing?: TimingType[];
    role?: RoleType[];
    severity?: SeverityType[];
    outcome?: OutcomeType[];
}

// Used in NarrativeBlock - Canonical Categories
export type NarrativeCategory =
    | 'Spine'
    | 'Constraint'
    | 'FailureMode'
    | 'Gap'
    | 'Timing'
    | 'Severity'
    | 'Outcome'
    | 'Role'
    | 'DecisionSpine'
    | 'Closing';

export interface NarrativeConditions {
    constraint: ConstraintType;
    failureMode: FailureModeType;
    gaps: {
        enforcement: boolean;
        visibility: boolean;
    };
    timing: TimingType;
    severity: SeverityType;
    outcome: OutcomeType;
}

export type RubricConditions = NarrativeSelector;

export interface NarrativeContent {
    headline: string;
    body: string;
    implications?: string[];
}

export interface NarrativeBlock {
    id: string;
    category: NarrativeCategory;
    content: NarrativeContent;
    appliesWhen: NarrativeSelector; // Strict object, no function
    priority: number;
    meta?: {
        tags?: string[];
        notes?: string;
        purpose?: string;
        rubric?: any;
        severity?: string;
    };
}

export interface AssembledNarrative {
    // Decision Spine (Phase 6) - [DS1, DS2, DS3]
    decisionSpine: NarrativeBlock[];

    overview: NarrativeBlock;
    constraint: NarrativeBlock;
    failureMode: NarrativeBlock;
    gaps: NarrativeBlock[];           // [G1,G2] always present (or empty array if not applicable, but safe to iterate)
    timing: NarrativeBlock;
    severity: NarrativeBlock;
    outcome: NarrativeBlock;
    roleSections: {
        owner?: NarrativeBlock[];
        sales?: NarrativeBlock[];
        ops?: NarrativeBlock[];
        delivery?: NarrativeBlock[];
    };
    closing: NarrativeBlock;
    selectedIds: string[];            // Ordered IDs for determinism verification
}
