/**
 * FE-TA Bucket Mappings
 * Maps option IDs to semantic buckets for team synthesis
 */

export type BucketTag =
    // Q1 Buckets - Where things break
    | 'FOLLOWUP_STALL'
    | 'HANDOFF_BREAK'
    | 'RESPONSE_LAG'
    | 'VOLUME_BREAK'
    | 'REACTIVE_CHAOS'
    | 'CONTEXT_COLLAPSE'
    | 'VISIBILITY_GAP'
    | 'DATA_FRAGMENTATION'
    | 'PEOPLE_DEPENDENCY'

    // Q2 Buckets - Root causes
    | 'MANUAL_WORK'
    | 'TOOL_SPRAWL'
    | 'OWNER_BOTTLENECK'
    | 'PROCESS_GAPS'
    | 'CONTEXT_LOSS'
    | 'UNCLEAR_OWNERSHIP'
    | 'WORKAROUND_CULTURE'

    // Q3 Buckets - Ownership/impact
    | 'NO_OWNER'
    | 'UNCLEAR_OWNER'
    | 'FOUNDER_ABSORBS'
    | 'TEAM_COMPENSATES'
    | 'CUSTOMER_ABSORBS'
    | 'INDIVIDUAL_HEROICS';

export const BUCKET_LABELS: Record<BucketTag, string> = {
    // Q1
    FOLLOWUP_STALL: 'Revenue Leak',
    HANDOFF_BREAK: 'Context Collapse',
    RESPONSE_LAG: 'Speed Bottleneck',
    VOLUME_BREAK: 'Scale Ceiling',
    REACTIVE_CHAOS: 'Reactive Operating System',
    CONTEXT_COLLAPSE: 'Context Collapse',
    VISIBILITY_GAP: 'Blind Execution',
    DATA_FRAGMENTATION: 'Data Chaos',
    PEOPLE_DEPENDENCY: 'Hero Dependency',

    // Q2
    MANUAL_WORK: 'Manual Drag',
    TOOL_SPRAWL: 'Stack Noise',
    OWNER_BOTTLENECK: 'Founder-as-Buffer',
    PROCESS_GAPS: 'Process Vacuum',
    CONTEXT_LOSS: 'Context Collapse',
    UNCLEAR_OWNERSHIP: 'No Ownership Layer',
    WORKAROUND_CULTURE: 'Normalized Workarounds',

    // Q3
    NO_OWNER: 'No Ownership Layer',
    UNCLEAR_OWNER: 'Diffused Ownership',
    FOUNDER_ABSORBS: 'Founder-as-Buffer',
    TEAM_COMPENSATES: 'Team Heroics',
    CUSTOMER_ABSORBS: 'Customer Friction',
    INDIVIDUAL_HEROICS: 'Individual Heroics',
};

/**
 * Owner Role Bucket Mappings
 */
export const OWNER_BUCKETS: Record<string, BucketTag> = {
    // Q1 - Where does work break most often?
    'A1_FU': 'FOLLOWUP_STALL',
    'A1_HAND': 'HANDOFF_BREAK',
    'A1_LOAD': 'VOLUME_BREAK',
    'A1_REAC': 'REACTIVE_CHAOS',

    // Q2 - What causes that failure?
    'A2_MAN': 'MANUAL_WORK',
    'A2_TOO': 'TOOL_SPRAWL',
    'A2_FOUN': 'OWNER_BOTTLENECK',
    'A2_PROC': 'PROCESS_GAPS',

    // Q3 - Who compensates when it fails?
    'A3_NONE': 'NO_OWNER',
    'A3_TEAM': 'TEAM_COMPENSATES',
    'A3_LEAD': 'FOUNDER_ABSORBS',
    'A3_YOU': 'FOUNDER_ABSORBS',
};

/**
 * Sales Role Bucket Mappings
 */
export const SALES_BUCKETS: Record<string, BucketTag> = {
    // Q1 - Where do deals most often stall?
    'S1_FOLLOWUP': 'FOLLOWUP_STALL',
    'S1_QUALIFY': 'CONTEXT_LOSS',
    'S1_PROPOSAL': 'FOLLOWUP_STALL',
    'S1_CLOSE': 'OWNER_BOTTLENECK',
    'S1_UNKNOWN': 'VISIBILITY_GAP',

    // Q2 - What usually causes that stall?
    'S2_MANUAL': 'MANUAL_WORK',
    'S2_CONTEXT': 'CONTEXT_LOSS',
    'S2_SPEED': 'RESPONSE_LAG',
    'S2_AUTHORITY': 'OWNER_BOTTLENECK',
    'S2_TOOLING': 'TOOL_SPRAWL',

    // Q3 - Who is currently absorbing that failure?
    'S3_FOUNDER': 'FOUNDER_ABSORBS',
    'S3_REP': 'INDIVIDUAL_HEROICS',
    'S3_TEAM': 'TEAM_COMPENSATES',
    'S3_CUSTOMER': 'CUSTOMER_ABSORBS',
};

/**
 * Operations Role Bucket Mappings
 */
export const OPS_BUCKETS: Record<string, BucketTag> = {
    // Q1 - What fails first when things get busy?
    'O1_HANDOFFS': 'HANDOFF_BREAK',
    'O1_VISIBILITY': 'VISIBILITY_GAP',
    'O1_DATA': 'DATA_FRAGMENTATION',
    'O1_PEOPLE': 'PEOPLE_DEPENDENCY',
    'O1_ALL': 'REACTIVE_CHAOS',

    // Q2 - Why does that failure occur?
    'O2_MANUAL': 'MANUAL_WORK',
    'O2_OWNERSHIP': 'UNCLEAR_OWNERSHIP',
    'O2_TOOLS': 'TOOL_SPRAWL',
    'O2_WORKAROUNDS': 'WORKAROUND_CULTURE',

    // Q3 - How does the team recover?
    'O3_FIRE': 'REACTIVE_CHAOS',
    'O3_MEETINGS': 'UNCLEAR_OWNERSHIP',
    'O3_HERO': 'INDIVIDUAL_HEROICS',
    'O3_DELAY': 'NO_OWNER',
};

/**
 * Delivery Role Bucket Mappings
 */
export const DELIVERY_BUCKETS: Record<string, BucketTag> = {
    // Q1 - Where does work slow down after it's sold?
    'D1_HANDOFF': 'HANDOFF_BREAK',
    'D1_SCOPE': 'CONTEXT_LOSS',
    'D1_STATUS': 'VISIBILITY_GAP',
    'D1_REWORK': 'PROCESS_GAPS',

    // Q2 - What causes that slowdown?
    'D2_CONTEXT': 'CONTEXT_LOSS',
    'D2_CHANGES': 'UNCLEAR_OWNERSHIP',
    'D2_COMM': 'CONTEXT_COLLAPSE',
    'D2_PRIORITIES': 'UNCLEAR_OWNERSHIP',

    // Q3 - Who absorbs the impact?
    'D3_TEAM': 'TEAM_COMPENSATES',
    'D3_LEAD': 'INDIVIDUAL_HEROICS',
    'D3_CUSTOMER': 'CUSTOMER_ABSORBS',
    'D3_ALL': 'UNCLEAR_OWNER',
};

/**
 * Get bucket tag for a given role and answer ID
 */
export function getBucketTag(role: string, answerId: string): BucketTag | null {
    switch (role) {
        case 'owner':
            return OWNER_BUCKETS[answerId] || null;
        case 'sales':
            return SALES_BUCKETS[answerId] || null;
        case 'ops':
            return OPS_BUCKETS[answerId] || null;
        case 'delivery':
            return DELIVERY_BUCKETS[answerId] || null;
        default:
            return null;
    }
}

/**
 * Get human-readable label for a bucket tag
 */
export function getBucketLabel(tag: BucketTag): string {
    return BUCKET_LABELS[tag];
}
