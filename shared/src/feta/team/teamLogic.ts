/**
 * FE-TA Team Logic Engine
 * Deterministic rules for team synthesis, alignment detection, and contradiction analysis
 */

import { getBucketTag, getBucketLabel, BucketTag } from './buckets';
import { getTeamTemplate } from './teamTemplates';

export type RoleId = 'owner' | 'sales' | 'ops' | 'delivery';
export type AxisId = 'Q1' | 'Q2' | 'Q3';
export type AlignmentLevel = 'HIGH' | 'MED' | 'LOW';
export type Confidence = 'HIGH' | 'MED' | 'LOW';
export type Verdict = 'ALIGNED' | 'MISALIGNED';

export interface RoleAnswers {
    Q1?: string;
    Q2?: string;
    Q3?: string;
}

export interface RoleEvidence {
    Q1?: string;
    Q2?: string;
    Q3?: string;
}

export interface TeamSessionData {
    teamSessionId: string;
    roleAnswers: Record<RoleId, RoleAnswers>;
    roleEvidence: Record<RoleId, RoleEvidence>;
}

export interface AxisComparison {
    axis: AxisId;
    label: string;
    owner: { choiceId: string; choiceLabel: string; confidence: Confidence; bucket: BucketTag | null };
    sales: { choiceId: string; choiceLabel: string; confidence: Confidence; bucket: BucketTag | null };
    ops: { choiceId: string; choiceLabel: string; confidence: Confidence; bucket: BucketTag | null };
    delivery: { choiceId: string; choiceLabel: string; confidence: Confidence; bucket: BucketTag | null };
    verdict: Verdict;
    note: string;
}


export interface Contradiction {
    axis: AxisId;
    pair: [RoleId, RoleId];
    description: string;
    recommendedProbe: string;
}

export interface TeamSynthesis {
    headline: string;
    summary: string;
    alignmentLevel: AlignmentLevel;
    topSignals: string[];
    primaryConstraint: string;
    whyThisCompounds: string[];
    firstMoves: Array<{ action: string; why: string; owner: string; time: string }>;
    risks: string[];
    evidence: Array<{ role: RoleId; step: AxisId; quote: string }>;
}

export interface TeamOutput {
    team: TeamSynthesis;
    comparison: {
        matrix: AxisComparison[];
        contradictions: Contradiction[];
    };
}

const AXIS_LABELS: Record<AxisId, string> = {
    Q1: 'Where execution breaks first',
    Q2: 'What causes compounding drag',
    Q3: 'Where ownership is missing',
};

const AXIS_WEIGHTS: Record<AxisId, number> = {
    Q1: 3,
    Q2: 2,
    Q3: 1,
};

/**
 * Compute confidence based on evidence presence
 */
function computeConfidence(evidence?: string): Confidence {
    if (!evidence || evidence.trim().length === 0) return 'LOW';
    if (evidence.trim().length >= 20) return 'HIGH';
    return 'MED';
}

/**
 * Compute alignment verdict for a single axis
 */
function computeAxisVerdict(buckets: (BucketTag | null)[]): Verdict {
    const validBuckets = buckets.filter((b): b is BucketTag => b !== null);
    if (validBuckets.length === 0) return 'MISALIGNED';

    // Count occurrences
    const counts = new Map<BucketTag, number>();
    validBuckets.forEach(b => counts.set(b, (counts.get(b) || 0) + 1));

    // If any bucket appears 3+ times, it's aligned
    const maxCount = Math.max(...Array.from(counts.values()));
    return maxCount >= 3 ? 'ALIGNED' : 'MISALIGNED';
}

/**
 * Compute team-level alignment score
 */
function computeAlignmentLevel(matrix: AxisComparison[]): AlignmentLevel {
    const alignedCount = matrix.filter(m => m.verdict === 'ALIGNED').length;
    if (alignedCount >= 2) return 'HIGH';
    if (alignedCount === 1) return 'MED';
    return 'LOW';
}

/**
 * Select primary constraint from bucket frequency
 */
function selectPrimaryConstraint(
    roleAnswers: Record<RoleId, RoleAnswers>
): BucketTag | null {
    const bucketScores = new Map<BucketTag, number>();

    const roles: RoleId[] = ['owner', 'sales', 'ops', 'delivery'];
    const axes: AxisId[] = ['Q1', 'Q2', 'Q3'];

    roles.forEach(role => {
        axes.forEach(axis => {
            const answerId = roleAnswers[role]?.[axis];
            if (!answerId) return;

            const bucket = getBucketTag(role, answerId);
            if (!bucket) return;

            const weight = AXIS_WEIGHTS[axis];
            bucketScores.set(bucket, (bucketScores.get(bucket) || 0) + weight);
        });
    });

    if (bucketScores.size === 0) return null;

    // Return bucket with highest weighted score
    let maxBucket: BucketTag | null = null;
    let maxScore = 0;

    bucketScores.forEach((score, bucket) => {
        if (score > maxScore) {
            maxScore = score;
            maxBucket = bucket;
        }
    });

    return maxBucket;
}

/**
 * Generate comparison matrix
 */
export function generateComparisonMatrix(
    teamData: TeamSessionData,
    taxonomies: Record<RoleId, any>
): AxisComparison[] {
    const axes: AxisId[] = ['Q1', 'Q2', 'Q3'];
    const roles: RoleId[] = ['owner', 'sales', 'ops', 'delivery'];

    return axes.map(axis => {
        const roleData = roles.map(role => {
            const answerId = teamData.roleAnswers[role]?.[axis] || '';
            const evidence = teamData.roleEvidence[role]?.[axis];
            const bucket = answerId ? getBucketTag(role, answerId) : null;

            // Get choice label from taxonomy
            const taxonomy = taxonomies[role];
            const question = taxonomy?.[axis];
            const option = question?.options?.find((o: any) => o.id === answerId);
            const choiceLabel = option?.label || answerId;

            return {
                role,
                choiceId: answerId,
                choiceLabel,
                confidence: computeConfidence(evidence),
                bucket,
            };
        });

        const buckets = roleData.map(r => r.bucket);
        const verdict = computeAxisVerdict(buckets);

        // Generate note based on verdict
        const note = verdict === 'ALIGNED'
            ? `Team shows consensus on ${AXIS_LABELS[axis].toLowerCase()}`
            : `Misalignment detected — each role sees different breakpoints`;

        return {
            axis,
            label: AXIS_LABELS[axis],
            owner: roleData[0],
            sales: roleData[1],
            ops: roleData[2],
            delivery: roleData[3],
            verdict,
            note,
        };
    });
}

/**
 * Detect contradictions between roles
 */
export function detectContradictions(
    matrix: AxisComparison[]
): Contradiction[] {
    const contradictions: Contradiction[] = [];

    // Rule-based contradiction detection
    matrix.forEach(axis => {
        const { owner, sales, ops, delivery } = axis;

        // Sales blames speed, Ops blames tools
        if (sales.bucket === 'RESPONSE_LAG' && ops.bucket === 'TOOL_SPRAWL') {
            contradictions.push({
                axis: axis.axis,
                pair: ['sales', 'ops'],
                description: 'Sales sees speed issues; Ops sees tool fragmentation',
                recommendedProbe: 'Is the real bottleneck response automation or stack consolidation?',
            });
        }

        // Founder sees chaos, Delivery sees handoffs
        if (owner.bucket === 'REACTIVE_CHAOS' && delivery.bucket === 'HANDOFF_BREAK') {
            contradictions.push({
                axis: axis.axis,
                pair: ['owner', 'delivery'],
                description: 'Founder perceives operational chaos; Delivery identifies handoff failures',
                recommendedProbe: 'Are handoff failures causing the chaos, or hiding beneath it?',
            });
        }

        // Owner bottleneck + followup stall
        if (owner.bucket === 'OWNER_BOTTLENECK' && sales.bucket === 'FOLLOWUP_STALL') {
            contradictions.push({
                axis: axis.axis,
                pair: ['owner', 'sales'],
                description: 'Revenue loss tied to founder approval latency',
                recommendedProbe: 'Which decisions can be delegated without risk?',
            });
        }

        // Manual work disagreement
        if (ops.bucket === 'MANUAL_WORK' && delivery.bucket !== 'MANUAL_WORK' && delivery.bucket !== null) {
            contradictions.push({
                axis: axis.axis,
                pair: ['ops', 'delivery'],
                description: 'Ops sees manual processes as primary drag; Delivery identifies different root cause',
                recommendedProbe: 'Is manual work the constraint or a symptom?',
            });
        }
    });

    return contradictions;
}

/**
 * Extract evidence quotes
 */
export function extractEvidence(
    roleEvidence: Record<RoleId, RoleEvidence>
): Array<{ role: RoleId; step: AxisId; quote: string }> {
    const evidence: Array<{ role: RoleId; step: AxisId; quote: string }> = [];
    const roles: RoleId[] = ['owner', 'sales', 'ops', 'delivery'];
    const axes: AxisId[] = ['Q1', 'Q2', 'Q3'];

    // Prefer one quote per role, prioritize Q1 > Q2 > Q3
    roles.forEach(role => {
        for (const axis of axes) {
            const quote = roleEvidence[role]?.[axis];
            if (quote && quote.trim().length > 0) {
                evidence.push({ role, step: axis, quote: quote.trim() });
                return; // One quote per role max
            }
        }
    });

    return evidence.slice(0, 4); // Max 4 quotes
}

/**
 * Main team synthesis computation
 */
export function computeTeamSynthesis(
    teamData: TeamSessionData,
    taxonomies: Record<RoleId, any>
): TeamOutput {
    // Generate comparison matrix
    const matrix = generateComparisonMatrix(teamData, taxonomies);

    // Compute alignment level
    const alignmentLevel = computeAlignmentLevel(matrix);

    // Select primary constraint
    const primaryBucket = selectPrimaryConstraint(teamData.roleAnswers);
    const primaryConstraint = primaryBucket ? getBucketLabel(primaryBucket) : 'Systemic Fragmentation';

    // Get template for this constraint + alignment
    const { template, summary } = getTeamTemplate(primaryConstraint, alignmentLevel);

    // Detect contradictions
    const contradictions = detectContradictions(matrix);

    // Extract evidence
    const evidence = extractEvidence(teamData.roleEvidence);

    // Build team synthesis from template
    const team: TeamSynthesis = {
        headline: template.headline,
        summary,
        alignmentLevel,
        topSignals: template.topSignals,
        primaryConstraint,
        whyThisCompounds: template.whyThisCompounds,
        firstMoves: template.firstMoves,
        risks: template.risks,
        evidence,
    };

    return {
        team,
        comparison: {
            matrix,
            contradictions,
        },
    };
}
