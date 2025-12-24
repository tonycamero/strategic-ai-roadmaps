/**
 * THE NARRATIVE LATTICE TAXONOMY
 * 
 * This file defines the finite state space for the diagnostic.
 * Every diagnostic result must map to a valid combination of these states.
 */

// I. PRIMARY EXECUTION CONSTRAINT (Exactly 1)
export enum ConstraintType {
    ENFORCEMENT_FAILURE = 'ENFORCEMENT_FAILURE',
    OWNERSHIP_AMBIGUITY = 'OWNERSHIP_AMBIGUITY',
    VISIBILITY_COLLAPSE = 'VISIBILITY_COLLAPSE',
    SYSTEM_FRAGMENTATION = 'SYSTEM_FRAGMENTATION',
    CAPACITY_SATURATION = 'CAPACITY_SATURATION',
    DECISION_BOTTLENECK = 'DECISION_BOTTLENECK'
}

// II. FAILURE MODE (Exactly 1)
export enum FailureModeType {
    BEHAVIORAL_COMPENSATION = 'BEHAVIORAL_COMPENSATION', // People work harder
    STRUCTURAL_DEBT = 'STRUCTURAL_DEBT'                 // Brittle workarounds
}

// III. & IV. GAPS (Boolean Flags)
// Not enums, but interface properties in the state.
// enforcementGap: boolean;
// visibilityGap: boolean;

// V. TIMING RISK (Exactly 1)
export enum TimingType {
    NOW = 'NOW',   // Already leaking
    NEXT = 'NEXT', // Will break at inflection
    LATER = 'LATER' // Dormant
}

// VI. ROLE-LEVEL PATTERNS (0-2 per role)
export enum RolePatternType {
    // Owner
    HEROICS = 'HEROICS',
    DECISION_HOARDING = 'DECISION_HOARDING',
    PRIORITY_THRASH = 'PRIORITY_THRASH',
    VISION_WITHOUT_MECHANISM = 'VISION_WITHOUT_MECHANISM',

    // Sales
    MEMORY_BASED_FOLLOWUP = 'MEMORY_BASED_FOLLOWUP',
    AUTHORITY_BYPASS = 'AUTHORITY_BYPASS',
    PIPELINE_GUESSING = 'PIPELINE_GUESSING',
    DISCOUNT_SUBSTITUTE = 'DISCOUNT_SUBSTITUTE',

    // Ops
    MANUAL_RECONCILIATION = 'MANUAL_RECONCILIATION',
    SHADOW_SYSTEMS = 'SHADOW_SYSTEMS',
    FIREFIGHTING = 'FIREFIGHTING',
    PROCESS_DRIFT = 'PROCESS_DRIFT',

    // Delivery
    REWORK_NORMALIZATION = 'REWORK_NORMALIZATION',
    SCOPE_CREEP = 'SCOPE_CREEP',
    QUALITY_DEGRADATION = 'QUALITY_DEGRADATION',
    DEADLINE_COMPRESSION = 'DEADLINE_COMPRESSION'
}

// VII. SEVERITY LEVEL (Derived)
export enum SeverityType {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

// VIII. OUTCOME TRAJECTORY (Derived)
export enum OutcomeType {
    REVENUE_LEAK = 'REVENUE_LEAK',
    SCALING_STALL = 'SCALING_STALL',
    BURNOUT = 'BURNOUT',
    TRUST_EROSION = 'TRUST_EROSION',
    FOUNDER_LOCK_IN = 'FOUNDER_LOCK_IN'
}

export const ROLES = ['owner', 'sales', 'ops', 'delivery'] as const;
export type RoleType = typeof ROLES[number];
