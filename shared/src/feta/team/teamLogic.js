"use strict";
/**
 * FE-TA Team Logic Engine
 * Deterministic rules for team synthesis, alignment detection, and contradiction analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateComparisonMatrix = generateComparisonMatrix;
exports.detectContradictions = detectContradictions;
exports.extractEvidence = extractEvidence;
exports.computeTeamSynthesis = computeTeamSynthesis;
const buckets_1 = require("./buckets");
const teamTemplates_1 = require("./teamTemplates");
const AXIS_LABELS = {
    Q1: 'Where execution breaks first',
    Q2: 'What causes compounding drag',
    Q3: 'Where ownership is missing',
};
const AXIS_WEIGHTS = {
    Q1: 3,
    Q2: 2,
    Q3: 1,
};
/**
 * Compute confidence based on evidence presence
 */
function computeConfidence(evidence) {
    if (!evidence || evidence.trim().length === 0)
        return 'LOW';
    if (evidence.trim().length >= 20)
        return 'HIGH';
    return 'MED';
}
/**
 * Compute alignment verdict for a single axis
 */
function computeAxisVerdict(buckets) {
    const validBuckets = buckets.filter((b) => b !== null);
    if (validBuckets.length === 0)
        return 'MISALIGNED';
    // Count occurrences
    const counts = new Map();
    validBuckets.forEach(b => counts.set(b, (counts.get(b) || 0) + 1));
    // If any bucket appears 3+ times, it's aligned
    const maxCount = Math.max(...Array.from(counts.values()));
    return maxCount >= 3 ? 'ALIGNED' : 'MISALIGNED';
}
/**
 * Compute team-level alignment score
 */
function computeAlignmentLevel(matrix) {
    const alignedCount = matrix.filter(m => m.verdict === 'ALIGNED').length;
    if (alignedCount >= 2)
        return 'HIGH';
    if (alignedCount === 1)
        return 'MED';
    return 'LOW';
}
/**
 * Select primary constraint from bucket frequency
 */
function selectPrimaryConstraint(roleAnswers) {
    const bucketScores = new Map();
    const roles = ['owner', 'sales', 'ops', 'delivery'];
    const axes = ['Q1', 'Q2', 'Q3'];
    roles.forEach(role => {
        axes.forEach(axis => {
            const answerId = roleAnswers[role]?.[axis];
            if (!answerId)
                return;
            const bucket = (0, buckets_1.getBucketTag)(role, answerId);
            if (!bucket)
                return;
            const weight = AXIS_WEIGHTS[axis];
            bucketScores.set(bucket, (bucketScores.get(bucket) || 0) + weight);
        });
    });
    if (bucketScores.size === 0)
        return null;
    // Return bucket with highest weighted score
    let maxBucket = null;
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
function generateComparisonMatrix(teamData, taxonomies) {
    const axes = ['Q1', 'Q2', 'Q3'];
    const roles = ['owner', 'sales', 'ops', 'delivery'];
    return axes.map(axis => {
        const roleData = roles.map(role => {
            const answerId = teamData.roleAnswers[role]?.[axis] || '';
            const evidence = teamData.roleEvidence[role]?.[axis];
            const bucket = answerId ? (0, buckets_1.getBucketTag)(role, answerId) : null;
            // Get choice label from taxonomy
            const taxonomy = taxonomies[role];
            const question = taxonomy?.[axis];
            const option = question?.options?.find((o) => o.id === answerId);
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
function detectContradictions(matrix) {
    const contradictions = [];
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
function extractEvidence(roleEvidence) {
    const evidence = [];
    const roles = ['owner', 'sales', 'ops', 'delivery'];
    const axes = ['Q1', 'Q2', 'Q3'];
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
function computeTeamSynthesis(teamData, taxonomies) {
    // Generate comparison matrix
    const matrix = generateComparisonMatrix(teamData, taxonomies);
    // Compute alignment level
    const alignmentLevel = computeAlignmentLevel(matrix);
    // Select primary constraint
    const primaryBucket = selectPrimaryConstraint(teamData.roleAnswers);
    const primaryConstraint = primaryBucket ? (0, buckets_1.getBucketLabel)(primaryBucket) : 'Systemic Fragmentation';
    // Get template for this constraint + alignment
    const { template, summary } = (0, teamTemplates_1.getTeamTemplate)(primaryConstraint, alignmentLevel);
    // Detect contradictions
    const contradictions = detectContradictions(matrix);
    // Extract evidence
    const evidence = extractEvidence(teamData.roleEvidence);
    // Build team synthesis from template
    const team = {
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
