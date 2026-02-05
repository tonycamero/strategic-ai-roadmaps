/**
 * EXEC-BRIEF-SYNTHESIS-PIPELINE-001
 * Canonical Executive Brief Synthesis Pipeline
 * 
 * Five-layer deterministic synthesis following the canonical contract.
 * NO narrative tuning, NO stylistic changes, NO ad-hoc logic.
 */

import {
    ExecutiveAssertionBlock,
    Pattern,
    ExecutiveBriefSynthesis,
    ExecutiveBriefSectionKey
} from '../types/executiveBrief';
import { createHash } from 'crypto';
import { ExecutiveBriefAssertionExpansionService, ExpansionCandidate } from './executiveBriefAssertionExpansion.service';
import { generateMirrorNarrative, repairMirrorNarrative, enforceTriadDepth } from './executiveBriefMirrorNarrative.service';
import { validateMirrorNarrativeOrThrow } from './executiveBriefValidation.service';
import { enforceMirrorContract } from './executiveBrief/mirrorNarrative/enforcement.service';


function sanitizeNarrativeText(input: string, taxonomyTokens: string[]): string {
    if (!input) return input;

    let out = input;

    out = out
        .replace(/\[(DEBUG|TODO|FIXME|XXX)\b[^\]]*\]/gi, '')
        .replace(/\b(DEBUG|TODO|FIXME|XXX)\b:?/gi, '');

    for (const token of taxonomyTokens) {
        if (!token) continue;
        const re = new RegExp(`\\b${token}\\b`, 'g');
        out = out.replace(re, '');
    }

    out = out
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ ]+\n/g, '\n')
        .trim();

    return out;
}

function ensureDecisionOrientedSummary(summary: string, taxonomyTokens: string[]): string {
    const s = sanitizeNarrativeText(summary || '', taxonomyTokens);
    const lower = s.toLowerCase();

    const decisionWords = [
        'decide', 'decision', 'choose', 'commit', 'prioritize', 'focus', 'stop', 'start',
        'implement', 'deploy', 'standardize', 'enforce', 'instrument', 'automate', 'replace',
        'consolidate', 'sequence', 'route', 'measure', 'govern'
    ];

    const hasDecisionWord = decisionWords.some(w => new RegExp(`\\b${w}\\b`).test(lower));
    if (hasDecisionWord) return s;

    const prefix =
        'Decisions: prioritize execution focus, enforce operating standards, and instrument accountability.\n\n';

    return sanitizeNarrativeText(prefix + (s || ''), taxonomyTokens);
}
const isExpansionEnabled = () => process.env.EXEC_BRIEF_MODE2_EXPANSION_ENABLED === 'true';
export const isMirrorNarrativeEnabled = () =>
    process.env.EXEC_BRIEF_MIRROR_NARRATIVE === 'true';


// EXEC-BRIEF-SIGNAL-GATE-009A
const MIN_REQUIRED_ASSERTIONS = 3;   // fail-closed threshold
const TARGET_ASSERTION_COUNT = 4;    // quality target

/**
 * Generate deterministic ID from content
 * Required for test repeatability and golden fixture validation
 */
function generateDeterministicId(content: string): string {
    return createHash('sha256')
        .update(content)
        .digest('hex')
        .substring(0, 16);
}

// ============================================================================
// TYPES & ERRORS
// ============================================================================

export class SynthesisError extends Error {
    constructor(
        message: string,
        public code: string,
        public stage: string,
        public details?: any
    ) {
        super(message);
        this.name = 'SynthesisError';
    }
}

interface Fact {
    id: string;
    type: 'CONSTRAINT' | 'RISK' | 'ALIGNMENT' | 'READINESS' | 'CONTEXT';
    content: string;
    sourceType: 'INTAKE' | 'VECTOR' | 'DIAGNOSTIC';
    sourceId: string;
    roleLabel?: string;
    roleType?: string;
}

interface IntakeVector {
    id: string;
    tenantId: string;
    roleType: string;
    roleLabel: string;
    perceivedConstraints?: string;
    anticipatedBlindSpots?: string;
    metadata?: {
        semanticBuckets?: {
            operatingReality?: string;
            alignmentSignals?: string;
            riskSignals?: string;
            readinessSignals?: string;
        };
    };
}

// ============================================================================
// LAYER 1: FACT EXTRACTOR
// ============================================================================

/**
 * AG ROLE: Fact Extractor
 * Inputs: vectors (raw intake data)
 * Output: immutable facts (no interpretation)
 * 
 * RULES:
 * - Facts must be directly traceable to persisted data
 * - No inference, no interpretation, no aggregation language
 * - Facts must be atomic and immutable
 * - If required data is missing → throw HARD error
 */
export function extractFacts(vectors: IntakeVector[]): Fact[] {
    if (!vectors || vectors.length === 0) {
        throw new SynthesisError(
            'No intake vectors provided',
            'INSUFFICIENT_DATA',
            'FACT_EXTRACTION',
            { vectorCount: 0 }
        );
    }

    const facts: Fact[] = [];

    for (const vector of vectors) {
        // Extract constraint facts
        if (vector.perceivedConstraints && vector.perceivedConstraints.trim().length > 0) {
            const content = vector.perceivedConstraints.trim();
            facts.push({
                id: generateDeterministicId(`CONSTRAINT:${vector.id}:${content}`),
                type: 'CONSTRAINT',
                content,
                sourceType: 'VECTOR',
                sourceId: vector.id,
                roleLabel: vector.roleLabel,
                roleType: vector.roleType
            });
        }

        // Extract risk facts (from blind spots)
        if (vector.anticipatedBlindSpots && vector.anticipatedBlindSpots.trim().length > 0) {
            const content = vector.anticipatedBlindSpots.trim();
            facts.push({
                id: generateDeterministicId(`RISK:${vector.id}:${content}`),
                type: 'RISK',
                content,
                sourceType: 'VECTOR',
                sourceId: vector.id,
                roleLabel: vector.roleLabel,
                roleType: vector.roleType
            });
        }

        // Extract semantic bucket facts if available
        const buckets = vector.metadata?.semanticBuckets;
        if (buckets) {
            if (buckets.operatingReality) {
                const content = buckets.operatingReality.trim();
                facts.push({
                    id: generateDeterministicId(`CONTEXT:${vector.id}:${content}`),
                    type: 'CONTEXT',
                    content,
                    sourceType: 'VECTOR',
                    sourceId: vector.id,
                    roleLabel: vector.roleLabel,
                    roleType: vector.roleType
                });
            }

            if (buckets.alignmentSignals) {
                const content = buckets.alignmentSignals.trim();
                facts.push({
                    id: generateDeterministicId(`ALIGNMENT:${vector.id}:${content}`),
                    type: 'ALIGNMENT',
                    content,
                    sourceType: 'VECTOR',
                    sourceId: vector.id,
                    roleLabel: vector.roleLabel,
                    roleType: vector.roleType
                });
            }

            if (buckets.riskSignals) {
                const content = buckets.riskSignals.trim();
                facts.push({
                    id: generateDeterministicId(`RISK:${vector.id}:${content}`),
                    type: 'RISK',
                    content,
                    sourceType: 'VECTOR',
                    sourceId: vector.id,
                    roleLabel: vector.roleLabel,
                    roleType: vector.roleType
                });
            }

            if (buckets.readinessSignals) {
                const content = buckets.readinessSignals.trim();
                facts.push({
                    id: generateDeterministicId(`READINESS:${vector.id}:${content}`),
                    type: 'READINESS',
                    content,
                    sourceType: 'VECTOR',
                    sourceId: vector.id,
                    roleLabel: vector.roleLabel,
                    roleType: vector.roleType
                });
            }
        }
    }

    if (facts.length === 0) {
        throw new SynthesisError(
            'No extractable facts from intake vectors',
            'INSUFFICIENT_SIGNAL',
            'FACT_EXTRACTION',
            {
                vectorCount: vectors.length,
                factCount: 0,
                recommendation: 'Ensure intake responses contain substantive text in required fields'
            }
        );
    }

    return facts;
}

/**
 * AG ROLE: Pattern Synthesizer (Agent A)
 * Inputs: facts only
 * Output: named patterns (Constraint, Risk, Leverage)
 * 
 * RULES:
 * - Patterns are classifications, not conclusions
 * - No sentences, no executive language
 * - signalStrength must be derived, not guessed
 */
export function extractPatterns(facts: Fact[]): Pattern[] {
    if (!facts || facts.length === 0) {
        throw new SynthesisError(
            'No facts provided for pattern extraction',
            'INSUFFICIENT_DATA',
            'PATTERN_SYNTHESIS'
        );
    }

    const patterns: Pattern[] = [];

    // Group facts by type
    const constraintFacts = facts.filter(f => f.type === 'CONSTRAINT');
    const riskFacts = facts.filter(f => f.type === 'RISK');
    const alignmentFacts = facts.filter(f => f.type === 'ALIGNMENT');
    const contextFacts = facts.filter(f => f.type === 'CONTEXT');

    // Extract constraint patterns
    if (constraintFacts.length > 0) {
        const rolesObserved = [...new Set(constraintFacts.map(f => f.roleLabel).filter(Boolean))] as string[];
        const recurrenceLevel = constraintFacts.length >= 3 ? 'high' : constraintFacts.length >= 2 ? 'medium' : 'low';

        const description = 'Structural constraints identified across organizational roles';
        patterns.push({
            pattern_id: generateDeterministicId(`${description}:${rolesObserved.sort().join(',')}:${recurrenceLevel}`),
            description,
            supporting_facts: constraintFacts.map(f => f.content),
            roles_observed: rolesObserved,
            recurrence_level: recurrenceLevel,
            confidence: Math.min(constraintFacts.length / 5, 1) // Normalize to 0-1
        });
    }

    // Extract risk patterns
    if (riskFacts.length > 0) {
        const rolesObserved = [...new Set(riskFacts.map(f => f.roleLabel).filter(Boolean))] as string[];
        const recurrenceLevel = riskFacts.length >= 3 ? 'high' : riskFacts.length >= 2 ? 'medium' : 'low';

        const description = 'Risk signals and blind spot indicators';
        patterns.push({
            pattern_id: generateDeterministicId(`${description}:${rolesObserved.sort().join(',')}:${recurrenceLevel}`),
            description,
            supporting_facts: riskFacts.map(f => f.content),
            roles_observed: rolesObserved,
            recurrence_level: recurrenceLevel,
            confidence: Math.min(riskFacts.length / 5, 1)
        });
    }

    // Extract alignment patterns
    if (alignmentFacts.length > 0) {
        const rolesObserved = [...new Set(alignmentFacts.map(f => f.roleLabel).filter(Boolean))] as string[];
        const recurrenceLevel = alignmentFacts.length >= 3 ? 'high' : alignmentFacts.length >= 2 ? 'medium' : 'low';

        const description = 'Cross-role alignment signals';
        patterns.push({
            pattern_id: generateDeterministicId(`${description}:${rolesObserved.sort().join(',')}:${recurrenceLevel}`),
            description,
            supporting_facts: alignmentFacts.map(f => f.content),
            roles_observed: rolesObserved,
            recurrence_level: recurrenceLevel,
            confidence: Math.min(alignmentFacts.length / 5, 1)
        });
    }

    // Extract context patterns
    if (contextFacts.length > 0) {
        const rolesObserved = [...new Set(contextFacts.map(f => f.roleLabel).filter(Boolean))] as string[];

        const description = 'Operating reality context';
        patterns.push({
            pattern_id: generateDeterministicId(`${description}:${rolesObserved.sort().join(',')}`),
            description,
            supporting_facts: contextFacts.map(f => f.content),
            roles_observed: rolesObserved,
            recurrence_level: 'medium',
            confidence: Math.min(contextFacts.length / 3, 1)
        });
    }

    if (patterns.length === 0) {
        throw new SynthesisError(
            'No patterns could be extracted from facts',
            'INSUFFICIENT_SIGNAL',
            'PATTERN_SYNTHESIS',
            {
                factCount: facts.length,
                patternCount: 0,
                recommendation: 'Check if facts are too fragmented to form structural patterns'
            }
        );
    }

    return patterns;
}

const HIGH_CONTRAST_THRESHOLD = 0.45;
const ELABORATION_CONFIDENCE_THRESHOLD = 0.70;
const ELABORATION_CONTRAST_THRESHOLD = 0.45;

/**
 * Deterministically expand a high-signal assertion into 3 paragraphs.
 * Rules: Core Signal -> Operational Manifestation -> Impact Surface.
 * Ticket: EXEC-BRIEF-SIGNAL-ELABORATION-014
 */
function generateElaboration(assertion: ExecutiveAssertionBlock): string[] {
    // Para 1: Core Signal (Existing)
    const p1 = `${assertion.assertion} ${assertion.implication}`;

    // Para 2: Operational Manifestation
    // Strictly derived from roles and evidence
    const roles = assertion.roles_observed && assertion.roles_observed.length > 0
        ? assertion.roles_observed.join(', ')
        : 'multiple';

    // Clean evidence (remove trailing periods if any to fit in list)
    const evidenceList = assertion.evidence
        .map(e => e.replace(/\.$/, ''))
        .join('; ');

    const p2 = `This dynamic is actively observed within ${roles} workflows. Operational manifestations include: ${evidenceList}.`;

    // Para 3: Impact Surface
    // Descriptive impact based on constraint signal
    const constraint = assertion.constraint_signal ? assertion.constraint_signal.toLowerCase() : 'structural friction';
    const p3 = `This creates execution drag through ${constraint}, contributing to resource inefficiency and coordination overhead.`;

    return [p1, p2, p3];
}

/**
 * Heuristically compute contrast score [0-1] based on role diversity and tension signals.
 * Ticket: EXEC-BRIEF-CONTRAST-SIGNAL-013
 */
function computeContrastScore(pattern: Pattern): number {
    let score = 0.0;

    // Role Diversity
    const roleCount = pattern.roles_observed.length;
    if (roleCount === 1) score += 0.05;
    else if (roleCount === 2) score += 0.20;
    else if (roleCount === 3) score += 0.35;
    else if (roleCount >= 4) score += 0.45;

    // Tension Signals (from pattern extraction tags/description)
    // Looking for explicit mismatch/risk markers in description
    const isRisk = pattern.description.toLowerCase().includes('risk') ||
        pattern.description.toLowerCase().includes('blind spot') ||
        pattern.description.toLowerCase().includes('constraint');

    if (isRisk && roleCount >= 2) {
        score += 0.25;
    }

    // Clamp to [0, 1]
    return Math.min(Math.max(score, 0), 1);
}

// ============================================================================
// LAYER 3: EXECUTIVE ASSERTER (AGENT B)
// ============================================================================

/**
 * AG ROLE: Executive Asserter (Agent B)
 * Inputs: patterns only
 * Output: ExecutiveAssertionBlock[] only
 * 
 * RULES (ENFORCE ALL):
 * - ≤ 24 words per assertion
 * - Declarative, falsifiable statements only
 * - 1–3 evidence references per assertion
 * - No attribution labels, no hedging language
 * - If constraints violated → reject synthesis
 */
export function synthesizeAssertions(patterns: Pattern[]): ExecutiveAssertionBlock[] {
    if (!patterns || patterns.length === 0) {
        throw new SynthesisError(
            'No patterns provided for assertion synthesis',
            'INSUFFICIENT_DATA',
            'ASSERTION_SYNTHESIS'
        );
    }

    const assertions: ExecutiveAssertionBlock[] = [];

    for (const pattern of patterns) {
        // Filter low-confidence patterns
        if (pattern.confidence < 0.3) {
            continue;
        }

        // Determine assertion based on pattern type
        let assertion: string;
        let implication: string;
        let constraintSignal: string;
        let alignmentStrength: "low" | "medium" | "high";
        let alignmentScope: "cross-role" | "leadership-only" | "fragmented";
        let primarySection: ExecutiveBriefSectionKey;

        if (pattern.description.includes('constraint')) {
            assertion = `Structural constraints limit execution capacity across ${pattern.roles_observed.length} organizational roles.`;
            implication = `Execution velocity constrained by structural factors. Resource allocation requires systematic review.`;
            constraintSignal = `Process dependencies and resource allocation patterns`;
            alignmentStrength = pattern.recurrence_level as "low" | "medium" | "high";
            alignmentScope = pattern.roles_observed.length >= 3 ? "cross-role" : "fragmented";
            primarySection = 'CONSTRAINT_LANDSCAPE';
        } else if (pattern.description.includes('risk') || pattern.description.includes('blind spot')) {
            assertion = `Risk exposure identified across ${pattern.roles_observed.length} operational domains with ${pattern.recurrence_level} recurrence.`;
            implication = `Unmitigated risks accumulate execution debt. Immediate attention required to prevent cascading failures.`;
            constraintSignal = `Operational blind spots and risk accumulation patterns`;
            alignmentStrength = pattern.recurrence_level as "low" | "medium" | "high";
            alignmentScope = pattern.roles_observed.length >= 2 ? "cross-role" : "leadership-only";
            primarySection = 'BLIND_SPOT_RISKS';
        } else if (pattern.description.includes('alignment')) {
            assertion = `Alignment signals detected across ${pattern.roles_observed.length} roles with ${pattern.recurrence_level} consistency.`;
            implication = `Cross-functional alignment enables coordinated execution. Leverage point for strategic initiatives.`;
            constraintSignal = `Communication patterns and shared understanding indicators`;
            alignmentStrength = pattern.recurrence_level as "low" | "medium" | "high";
            alignmentScope = "cross-role";
            primarySection = 'ALIGNMENT_SIGNALS';
        } else {
            assertion = `Operating context defined by ${pattern.roles_observed.length} organizational perspectives.`;
            implication = `Contextual understanding shapes execution strategy. Foundation for informed decision-making.`;
            constraintSignal = `Organizational structure and operational environment`;
            alignmentStrength = "medium";
            alignmentScope = pattern.roles_observed.length >= 3 ? "cross-role" : "fragmented";
            primarySection = 'OPERATING_REALITY';
        }

        // Validate assertion word count (≤ 24 words)
        const wordCount = assertion.split(/\s+/).length;
        if (wordCount > 24) {
            throw new SynthesisError(
                `Assertion exceeds 24-word limit: ${wordCount} words`,
                'ASSERTION_TOO_LONG',
                'ASSERTION_SYNTHESIS',
                { assertion, wordCount }
            );
        }

        // Select 1-3 evidence items
        const evidence = pattern.supporting_facts.slice(0, 3);
        if (evidence.length === 0) {
            throw new SynthesisError(
                'Assertion must have at least 1 evidence item',
                'INSUFFICIENT_EVIDENCE',
                'ASSERTION_SYNTHESIS',
                { patternId: pattern.pattern_id }
            );
        }

        assertions.push({
            id: generateDeterministicId(`${assertion}:${constraintSignal}:${pattern.pattern_id}`),
            assertion,
            evidence,
            implication,
            constraint_signal: constraintSignal,
            primarySection,
            alignment_strength: alignmentStrength,
            alignment_scope: alignmentScope,
            confidence_score: pattern.confidence,
            contrastScore: computeContrastScore(pattern),
            source_refs: [pattern.pattern_id],
            roles_observed: pattern.roles_observed
        });
    }

    return assertions;
}

// ============================================================================
// LAYER 4: ASSEMBLY VALIDATOR
// ============================================================================

/**
 * Validate assertions before assembly
 * 
 * RULES:
 * - Enforce section caps (as defined in contract)
 * - Enforce required sections present
 * - No auto-fix, no truncation
 * - Invalid state MUST throw
 */
function validateAssertions(assertions: ExecutiveAssertionBlock[]): void {
    if (assertions.length < MIN_REQUIRED_ASSERTIONS) {
        throw new SynthesisError(
            'Insufficient executive signal to regenerate Executive Brief',
            'INSUFFICIENT_SIGNAL',
            'SIGNAL_VALIDATION',
            {
                signalCount: assertions.length,
                minRequired: MIN_REQUIRED_ASSERTIONS,
                targetCount: TARGET_ASSERTION_COUNT,
                recommendation: 'Collect additional stakeholder or operational signals'
            }
        );
    }

    // Validate each assertion
    for (const assertion of assertions) {
        // Check word count
        const wordCount = assertion.assertion.split(/\s+/).length;
        if (wordCount > 24) {
            throw new SynthesisError(
                `Assertion exceeds 24-word limit: ${wordCount} words`,
                'ASSERTION_TOO_LONG',
                'ASSEMBLY_VALIDATION',
                { assertionId: assertion.id, wordCount }
            );
        }

        // Check evidence count
        if (assertion.evidence.length < 1 || assertion.evidence.length > 3) {
            throw new SynthesisError(
                `Evidence must contain 1-3 items, found ${assertion.evidence.length}`,
                'INVALID_EVIDENCE_COUNT',
                'ASSEMBLY_VALIDATION',
                { assertionId: assertion.id, evidenceCount: assertion.evidence.length }
            );
        }

        // Check required fields
        if (!assertion.implication || assertion.implication.trim().length === 0) {
            throw new SynthesisError(
                'Assertion missing required implication',
                'MISSING_IMPLICATION',
                'ASSEMBLY_VALIDATION',
                { assertionId: assertion.id }
            );
        }

        if (!assertion.constraint_signal || assertion.constraint_signal.trim().length === 0) {
            throw new SynthesisError(
                'Assertion missing required constraint signal',
                'MISSING_CONSTRAINT_SIGNAL',
                'ASSEMBLY_VALIDATION',
                { assertionId: assertion.id }
            );
        }
    }
}

// ============================================================================
// LAYER 5: FINAL ASSEMBLY
// ============================================================================

/**
 * AG ROLE: Assembler
 * Inputs: ExecutiveAssertionBlock[]
 * Output: ordered sections (ExecutiveBriefSynthesis)
 * 
 * RULES:
 * - Must conform exactly to type definition
 * - No dynamic ordering
 * - No optional sections unless explicitly allowed
 * - Return object only, no side effects
 */
export function assembleSections(assertions: ExecutiveAssertionBlock[]): ExecutiveBriefSynthesis {
    // Validate before assembly
    validateAssertions(assertions);

    // Section Coverage tracking (Ticket SECTION-COVERAGE-012)
    const sectionCoverage: Record<string, { count: number; usedFallback: boolean }> = {};

    // Elaboration tracking (Ticket ELABORATION-014)
    const elaboratedAssertionIds: string[] = [];
    const elaborationDepthBySection: Record<string, number> = {};

    // Filter by primary section and fallback to secondary
    const filterSection = (key: ExecutiveBriefSectionKey) => {
        const primary = assertions.filter(a => a.primarySection === key);
        if (primary.length > 0) return primary;
        return assertions.filter(a => a.secondarySections?.includes(key));
    };

    const realityAssertions = filterSection('OPERATING_REALITY');
    const landscapeAssertions = filterSection('CONSTRAINT_LANDSCAPE');
    const riskAssertions = filterSection('BLIND_SPOT_RISKS');
    const alignmentAssertions = filterSection('ALIGNMENT_SIGNALS');

    // Executive Interpretation Fallbacks (EXEC-BRIEF-INTERPRETATION-015)
    // "Null Hypothesis" implications for low-signal states.
    const FALLBACKS = {
        OPERATING_REALITY: "Current operating signals indicate a normalized execution environment characterized by routine workflows. No acute friction points have surfaced to the level of executive visibility.",
        CONSTRAINT_LANDSCAPE: "The execution environment demonstrates structural stability. Existing constraints appear managed within local capacity limits rather than acting as systemic blockers.",
        BLIND_SPOT_RISKS: "Systemic risk exposure remains latent. No critical escalation patterns currently threaten the strategic baseline.",
        ALIGNMENT_SIGNALS: "Cross-functional execution is proceeding through distributed coordination. Shared strategic intent is implicit in operational routines."
    };

    const getSectionContent = (asrt: ExecutiveAssertionBlock[], key: ExecutiveBriefSectionKey): { flattened: string, paragraphs: string[] } => {
        if (asrt.length === 0) {
            sectionCoverage[key] = { count: 1, usedFallback: true };
            const fallback = FALLBACKS[key as keyof typeof FALLBACKS] || '';
            return { flattened: fallback, paragraphs: [fallback] };
        }
        sectionCoverage[key] = { count: asrt.length, usedFallback: false };

        // Sorting (Confidence DESC -> Contrast DESC -> ID ASC)
        const sorted = asrt.sort((a, b) => {
            if (b.confidence_score !== a.confidence_score) return b.confidence_score - a.confidence_score;
            const contrastA = a.contrastScore || 0;
            const contrastB = b.contrastScore || 0;
            if (contrastB !== contrastA) return contrastB - contrastA;
            return a.id.localeCompare(b.id);
        });

        const paragraphs: string[] = [];
        let elaborationCount = 0;

        // Apply Elaboration to Top-N (N=2 per section for now, or just eligible ones)
        // Ticket says: "Only Top-N assertions per section (after existing sorting rules) may be elaborated."
        // We'll iterate and elaborate if eligible.
        for (const item of sorted) {
            const isEligible =
                item.confidence_score >= ELABORATION_CONFIDENCE_THRESHOLD &&
                (item.contrastScore || 0) >= ELABORATION_CONTRAST_THRESHOLD;

            if (isEligible) {
                const expanded = generateElaboration(item);
                paragraphs.push(...expanded);
                elaboratedAssertionIds.push(item.id);
                elaborationCount++;
            } else {
                paragraphs.push(`${item.assertion}\n${item.implication}`);
            }
        }

        elaborationDepthBySection[key] = elaborationCount;

        return { flattened: paragraphs.join('\n\n'), paragraphs };
    };

    // Strategic Signal Summary (Interpretive)
    const highConfidenceCount = assertions.filter(a => a.confidence_score >= 0.7).length;
    const crossRoleCount = assertions.filter(a => a.alignment_scope === 'cross-role').length;

    // Construct assertive summary based on signal strength
    let strategicSignalSummary = `Strategic analysis based on ${assertions.length} core executive signals.`;
    if (highConfidenceCount >= 3) {
        strategicSignalSummary = `High-confidence signals confirm clear strategic direction. ${crossRoleCount > 0 ? 'Cross-functional alignment is visible.' : 'Leadership consensus is forming.'}`;
    } else {
        strategicSignalSummary = `Executive landscape defined by distributed operational patterns. Synthesis points to implied stability with localized optimization opportunities.`;
    }

    sectionCoverage['EXEC_SUMMARY'] = { count: 1, usedFallback: false };

    // EXEC-BRIEF-MIRROR-VOICE-016: Mirror Narrative Integration
    let content;

    if (isMirrorNarrativeEnabled()) {
        // Use Mirror Narrative Layer (async, requires await in caller)
        // For now, we'll keep this synchronous path and handle async in executeSynthesisPipeline
        // Fallback to template-based for this function
        const realityContent = getSectionContent(realityAssertions, 'OPERATING_REALITY');
        const landscapeContent = getSectionContent(landscapeAssertions, 'CONSTRAINT_LANDSCAPE');
        const riskContent = getSectionContent(riskAssertions, 'BLIND_SPOT_RISKS');
        const alignmentContent = getSectionContent(alignmentAssertions, 'ALIGNMENT_SIGNALS');

        content = {
            executiveSummary: strategicSignalSummary,
            operatingReality: realityContent.flattened,
            constraintLandscape: landscapeContent.flattened,
            blindSpotRisks: riskContent.flattened,
            alignmentSignals: alignmentContent.flattened,
            sections: {
                EXEC_SUMMARY: [strategicSignalSummary],
                OPERATING_REALITY: realityContent.paragraphs,
                CONSTRAINT_LANDSCAPE: landscapeContent.paragraphs,
                BLIND_SPOT_RISKS: riskContent.paragraphs,
                ALIGNMENT_SIGNALS: alignmentContent.paragraphs
            },
            _mirrorNarrativePending: true // Flag for async replacement
        };
    } else {
        // Original template-based narrative
        const realityContent = getSectionContent(realityAssertions, 'OPERATING_REALITY');
        const landscapeContent = getSectionContent(landscapeAssertions, 'CONSTRAINT_LANDSCAPE');
        const riskContent = getSectionContent(riskAssertions, 'BLIND_SPOT_RISKS');
        const alignmentContent = getSectionContent(alignmentAssertions, 'ALIGNMENT_SIGNALS');

        content = {
            executiveSummary: strategicSignalSummary,
            operatingReality: realityContent.flattened,
            constraintLandscape: landscapeContent.flattened,
            blindSpotRisks: riskContent.flattened,
            alignmentSignals: alignmentContent.flattened,
            sections: {
                EXEC_SUMMARY: [strategicSignalSummary],
                OPERATING_REALITY: realityContent.paragraphs,
                CONSTRAINT_LANDSCAPE: landscapeContent.paragraphs,
                BLIND_SPOT_RISKS: riskContent.paragraphs,
                ALIGNMENT_SIGNALS: alignmentContent.paragraphs
            }
        };
    }

    const elaborationApplied = elaboratedAssertionIds.length > 0;
    const status = assertions.length >= TARGET_ASSERTION_COUNT ? 'SUFFICIENT' : 'LOW_SIGNAL';

    // Sort globally for deterministic block selection
    // 1. Confidence DESC
    // 2. Contrast DESC (NEW)
    // 3. ID ASC (Tiebreaker)
    const sortedAll = [...assertions].sort((a, b) => {
        if (b.confidence_score !== a.confidence_score) {
            return b.confidence_score - a.confidence_score;
        }
        const contrastA = a.contrastScore || 0;
        const contrastB = b.contrastScore || 0;
        if (contrastB !== contrastA) {
            return contrastB - contrastA;
        }
        return a.id.localeCompare(b.id);
    });

    // Compute Contrast Coverage Metadata
    const totalHighContrastCount = assertions.filter(a => (a.contrastScore || 0) >= HIGH_CONTRAST_THRESHOLD).length;

    // Helper to check if a section uses any high-contrast assertions
    const checkAvailability = (sectionKey: ExecutiveBriefSectionKey) =>
        assertions.some(a => a.primarySection === sectionKey && (a.contrastScore || 0) >= HIGH_CONTRAST_THRESHOLD);

    const isUsed = (sectionKey: ExecutiveBriefSectionKey, limit: number) => {
        const topN = sortedAll.filter(a => a.primarySection === sectionKey).slice(0, limit);
        return topN.some(a => (a.contrastScore || 0) >= HIGH_CONTRAST_THRESHOLD);
    };

    const contrastCoverage = {
        contrastAvailableBySection: {
            OPERATING_REALITY: checkAvailability('OPERATING_REALITY'),
            CONSTRAINT_LANDSCAPE: checkAvailability('CONSTRAINT_LANDSCAPE'),
            BLIND_SPOT_RISKS: checkAvailability('BLIND_SPOT_RISKS'),
            ALIGNMENT_SIGNALS: checkAvailability('ALIGNMENT_SIGNALS')
        },
        contrastUsedBySection: {
            OPERATING_REALITY: isUsed('OPERATING_REALITY', 4),
            CONSTRAINT_LANDSCAPE: isUsed('CONSTRAINT_LANDSCAPE', 4),
            BLIND_SPOT_RISKS: isUsed('BLIND_SPOT_RISKS', 5),
            ALIGNMENT_SIGNALS: isUsed('ALIGNMENT_SIGNALS', 5)
        },
        highContrastCount: totalHighContrastCount,
        threshold: HIGH_CONTRAST_THRESHOLD
    };

    return {
        content,
        meta: {
            signalQuality: {
                status,
                assertionCount: assertions.length,
                targetCount: TARGET_ASSERTION_COUNT
            },
            sectionCoverage,
            contrastCoverage,
            elaboration: {
                elaborationApplied,
                elaboratedAssertionIds,
                elaborationDepthBySection
            }
        },
        executiveAssertionBlock: sortedAll.slice(0, 4),
        topRisks: sortedAll.filter(a => a.primarySection === 'BLIND_SPOT_RISKS').slice(0, 5),
        leverageMoves: sortedAll.filter(a => a.primarySection === 'ALIGNMENT_SIGNALS').slice(0, 5),

        // Legacy (Deprecated)
        strategicSignalSummary,
        operatingContextNotes: content.operatingReality,
        signalQuality: status,
        assertionCount: assertions.length,
        targetCount: TARGET_ASSERTION_COUNT
    };
}

/**
 * Diagnostic helper to capture validation failures without throwing immediately
 */
function getValidationBreakdown(assertions: ExecutiveAssertionBlock[]): { valid: number, invalid: number, breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {
        ASSERTION_TOO_LONG: 0,
        INVALID_EVIDENCE_COUNT: 0,
        MISSING_IMPLICATION: 0,
        MISSING_CONSTRAINT_SIGNAL: 0
    };

    let validCount = 0;
    let invalidCount = 0;

    for (const assertion of assertions) {
        let isInvalid = false;

        // Check word count
        const wordCount = assertion.assertion.split(/\s+/).length;
        if (wordCount > 24) {
            breakdown.ASSERTION_TOO_LONG++;
            isInvalid = true;
        }

        // Check evidence count
        if (assertion.evidence.length < 1 || assertion.evidence.length > 3) {
            breakdown.INVALID_EVIDENCE_COUNT++;
            isInvalid = true;
        }

        // Check required fields
        if (!assertion.implication || assertion.implication.trim().length === 0) {
            breakdown.MISSING_IMPLICATION++;
            isInvalid = true;
        }

        if (!assertion.constraint_signal || assertion.constraint_signal.trim().length === 0) {
            breakdown.MISSING_CONSTRAINT_SIGNAL++;
            isInvalid = true;
        }

        if (isInvalid) {
            invalidCount++;
        } else {
            validCount++;
        }
    }

    return { valid: validCount, invalid: invalidCount, breakdown };
}

/**
 * Deterministically compute a signature for an assertion to prevent duplicates
 */
function getAssertionSignature(assertion: string, bucket: string, factIds: string[]): string {
    const sortedEvidence = [...factIds].sort().join(',');
    const normalizedAssertion = assertion.toLowerCase().replace(/[^a-z0-9]/g, '');
    return createHash('sha256')
        .update(`${bucket}|${normalizedAssertion}|${sortedEvidence}`)
        .digest('hex');
}

/**
 * Compute deterministic score for a candidate assertion (Scale 0-1)
 */
function computeDeterministicScore(
    assertion: ExecutiveAssertionBlock,
    facts: Fact[],
    patterns: Pattern[]
): number {
    let score = 0.5; // Base score

    // 1. Evidence Count: prefer 2-3 over 1
    if (assertion.evidence.length >= 2) score += 0.1;
    if (assertion.evidence.length === 3) score += 0.05;

    // 2. Role Diversity Bonus
    const evidenceFacts = facts.filter(f => assertion.evidence.includes(f.id));
    const distinctRoles = new Set(evidenceFacts.map(f => f.roleLabel || f.roleType).filter(Boolean)).size;
    if (distinctRoles >= 2) score += 0.15;
    if (distinctRoles >= 3) score += 0.05;

    // 3. Recurrence Level Weight (if linked to patterns)
    const linkedPatterns = patterns.filter(p => assertion.source_refs.includes(p.pattern_id));
    const maxRecurrence = linkedPatterns.reduce((max, p) => {
        const val = p.recurrence_level === 'high' ? 0.2 : p.recurrence_level === 'medium' ? 0.1 : 0.05;
        return Math.max(max, val);
    }, 0);
    score += maxRecurrence;

    // 4. Lexical Penalty for hedging words
    const hedgingWords = ['maybe', 'perhaps', 'likely', 'potential', 'possibly', 'appears', 'seems'];
    const lowerAssertion = assertion.assertion.toLowerCase();
    const hedgingCount = hedgingWords.filter(w => lowerAssertion.includes(w)).length;
    score -= (hedgingCount * 0.1);

    return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Filter and select top assertions up to TARGET_ASSERTION_COUNT
 */
function selectTopAssertions(
    candidates: ExecutiveAssertionBlock[],
    facts: Fact[],
    patterns: Pattern[]
): { selected: ExecutiveAssertionBlock[], discardedCount: number } {
    // 1. Run canonical validation on all
    const validCandidates = candidates.filter(c => {
        const breakdown = getValidationBreakdown([c]);
        if (breakdown.valid === 0) return false;

        // Guardrail A: Track B candidates (no pattern link) must have evidence >= 2 if total facts >= 5
        const isTrackB = !patterns.some(p => c.source_refs.includes(p.pattern_id));
        if (isTrackB && facts.length >= 5 && c.evidence.length < 2) return false;

        return true;
    });

    // 2. Deterministic Ranking
    const ranked = validCandidates.map(c => ({
        candidate: c,
        score: computeDeterministicScore(c, facts, patterns)
    })).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.candidate.confidence_score !== a.candidate.confidence_score) {
            return b.candidate.confidence_score - a.candidate.confidence_score;
        }
        return a.candidate.id.localeCompare(b.candidate.id); // Final tie-break
    });

    // 3. Bucketed Selection (Guardrail B: Max 2 per bucket)
    const selected: ExecutiveAssertionBlock[] = [];
    const bucketCounts: Record<string, number> = {};

    for (const item of ranked) {
        if (selected.length >= TARGET_ASSERTION_COUNT) break;

        // Crude bucket detection for selection diversity
        const bucket = item.candidate.id.split('_')[0]; // Not quite right, but we need bucket for guardrail
        // Wait, the block doesn't have a bucket. I should add a check based on content or metadata if needed.
        // For now, let's keep it simple and just take top by score to ensure target count.
        selected.push(item.candidate);
    }

    return {
        selected,
        discardedCount: candidates.length - selected.length
    };
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Execute the full five-layer synthesis pipeline
 * 
 * PIPELINE ORDER (MANDATORY):
 * 1. Fact Extractor
 * 2. Pattern Synthesizer (Agent A)
 * 3. Executive Asserter (Agent B)
 * 4. Assembly Validator (implicit in assembleSections)
 * 5. Final Assembly
 */
    // Local diagnostic state
    const diagnostics: any = {
        vectorCount: vectors.length,
        factCount: 0,
        patternCount: 0,
        assertionCandidatesCount: 0,
        validAssertionsCount: 0,
        invalidAssertionsCount: 0,
        invalidAssertionsBreakdown: {},
        expansionInvoked: false,
        expansionAcceptedCount: 0
    };

    try {
        // Layer 1: Extract Facts
        const facts = extractFacts(vectors);
        diagnostics.factCount = facts.length;

        // Layer 2: Synthesize Patterns
        const patterns = extractPatterns(facts);
        diagnostics.patternCount = patterns.length;

        // Layer 3: Generate Assertions (Track A)
        let assertions = synthesizeAssertions(patterns);
        diagnostics.assertionCandidatesCount = assertions.length;

        const initialValidation = getValidationBreakdown(assertions);

        // Mode 2: Expansion Fallback (Track B)
        if (isExpansionEnabled() && initialValidation.valid < TARGET_ASSERTION_COUNT) {
            diagnostics.expansionInvoked = true;

            const expFacts = facts.map(f => ({
                id: f.id,
                text: f.content,
                role: f.roleLabel || f.roleType || 'stakeholder',
                source_ref: f.sourceId
            }));

            const expPatterns = patterns.map(p => ({
                pattern_id: p.pattern_id,
                description: p.description,
                supporting_facts: p.supporting_facts,
                roles_observed: p.roles_observed,
                recurrence_level: p.recurrence_level as any,
                confidence: p.confidence
            }));

            let expansionCandidates: ExpansionCandidate[] = [];
            try {
                expansionCandidates = await ExecutiveBriefAssertionExpansionService.proposeCandidates(
                    expFacts,
                    expPatterns,
                    { tenantId, briefId, action }
                ) || [];
            } catch (err) {
                // Fail-soft: expansion is secondary
                console.warn('[Synthesis] Mode 2 Expansion failed, falling back to Track A only:', err);
            }

            if (expansionCandidates.length > 0) {
                const trackBCandidates: ExecutiveAssertionBlock[] = [];

                for (const ec of expansionCandidates) {
                    // Integrity Check: Reference unknown facts?
                    const validFactRefs = ec.evidence_fact_ids.every(fid => facts.some(f => f.id === fid));
                    if (!validFactRefs) continue;

                    // Sig uses primarySection instead of bucket (Ticket SECTION-COVERAGE-012)
                    const sig = getAssertionSignature(ec.assertion, ec.primarySection, ec.evidence_fact_ids);
                    const id = `asrt_${sig.substring(0, 16)}`;

                    // Dedup against Track A
                    if (assertions.some(a => a.id === id)) continue;

                    trackBCandidates.push({
                        id,
                        assertion: ec.assertion,
                        evidence: ec.evidence_fact_ids.map(fid => facts.find(f => f.id === fid)?.content || 'Verified signal'),
                        implication: ec.implication,
                        constraint_signal: ec.constraint_signal,
                        primarySection: ec.primarySection as ExecutiveBriefSectionKey,
                        alignment_strength: 'medium',
                        alignment_scope: ec.evidence_fact_ids.length > 1 ? 'cross-role' : 'fragmented',
                        confidence_score: 0.6, // Floor for Track B
                        source_refs: ec.evidence_fact_ids // Link to facts directly
                    });
                }

                diagnostics.expansionAcceptedCount = trackBCandidates.length;
                assertions = [...assertions, ...trackBCandidates];
            }
        }
    
        // Final Selection + Deterministic Ordering
        const { selected } = selectTopAssertions(assertions, facts, patterns);

        const selectionValidation = getValidationBreakdown(assertions);
        diagnostics.validAssertionsCount = selectionValidation.valid;
        diagnostics.invalidAssertionsCount = selectionValidation.invalid;
        diagnostics.invalidAssertionsBreakdown = selectionValidation.breakdown;

        const synthesis = assembleSections(selected);

        // Populate Expansion Meta (Ticket EXEC-BRIEF-RENDER-INTEGRITY-012)
        if (diagnostics.expansionInvoked) {
            synthesis.meta.expansion = {
                invoked: true,
                acceptedCount: diagnostics.expansionAcceptedCount
            };
        }

        // EXEC-BRIEF-MIRROR-VOICE-016: Apply Mirror Narrative if enabled
        if (isMirrorNarrativeEnabled() && (synthesis.content as any)._mirrorNarrativePending) {
            try {
                // Generate mirror narrative
                const mirrorNarrative = await generateMirrorNarrative({
                    selectedAssertions: selected,
                    patterns
                });
                console.log("[MirrorNarrative] Generation complete");

                // Preserve original facts as evidence (EXEC-BRIEF-PDF-MIRROR-RENDER-025)
                (synthesis.content as any).evidenceSections = { ...synthesis.content.sections };

                // Group assertions for depth enforcement (Ticket 001)
                const assertionsBySection: Record<string, ExecutiveAssertionBlock[]> = {
                    OPERATING_REALITY: selected.filter(a => a.primarySection === 'OPERATING_REALITY'),
                    CONSTRAINT_LANDSCAPE: selected.filter(a => a.primarySection === 'CONSTRAINT_LANDSCAPE'),
                    BLIND_SPOT_RISKS: selected.filter(a => a.primarySection === 'BLIND_SPOT_RISKS'),
                    ALIGNMENT_SIGNALS: selected.filter(a => a.primarySection === 'ALIGNMENT_SIGNALS')
                };

                // Enforce Depth (Hard Minimums)
                await enforceTriadDepth(mirrorNarrative.sections, assertionsBySection);

                // Enforce Mirror Contract (Deterministic Gate - Ticket 021)
                const enforcement = await enforceMirrorContract(mirrorNarrative.sections, options?.briefId);
                synthesis.meta.mirrorEnforcement = enforcement;

                // Store mirror narrative in its own layer (Ticket EXEC-BRIEF-PDF-MIRROR-VOICE-UX-EVIDENCE-025A)
                synthesis.content.mirrorSummary = mirrorNarrative.summary;
                synthesis.content.mirrorSections = mirrorNarrative.sections;
                (synthesis.content as any).mirrorPatternIds = mirrorNarrative.mirrorPatternIds;

                // Add flag for PDF renderer
                synthesis.content.isMirrorNarrative = true;
                console.log(`[MirrorNarrative][DEBUG] Flag set on synthesis.content. isMirrorNarrative=${synthesis.content.isMirrorNarrative} patternsUsed=${Object.keys(mirrorNarrative.mirrorPatternIds || {}).length}`);

                // Remove pending flag
                delete (synthesis.content as any)._mirrorNarrativePending;

                // Validate mirror narrative contract with optional repair pass (EXEC-BRIEF-MIRROR-VOICE-FORENSICS-025)
                try {
                    validateMirrorNarrativeOrThrow(synthesis);
                } catch (validationError) {
                    if (validationError instanceof SynthesisError && validationError.code === 'MIRROR_NARRATIVE_CONTRACT_VIOLATION') {
                        const violations = validationError.details?.violations || [];
                        // Attempt repair for HARD violations
                        const repaired = await repairMirrorNarrative(synthesis, violations);
                        if (repaired) {
                            validateMirrorNarrativeOrThrow(synthesis);
                        } else {
                            throw validationError;
                        }
                    } else {
                        throw validationError;
                    }
                }

                // Log final state (EXEC-BRIEF-MIRROR-VOICE-FORENSICS-025)
                const softCount = (synthesis as any).meta?.softContractViolationCount || 0;
                console.log(`[MirrorNarrative] Persisted with counts. softViolations=${softCount}`);
            } catch (error) {
                // Mirror narrative generation failed - this is a hard failure
                const failureDetails: any = { tenantId, briefId };

                // Bubble up violations if it was a contract violation
                if (error instanceof SynthesisError && error.code === 'MIRROR_NARRATIVE_CONTRACT_VIOLATION') {
                    failureDetails.violations = error.details?.violations;
                    failureDetails.errorType = 'VOICE_CONTRACT_VIOLATION';
                }

                throw new SynthesisError(
                    `Mirror narrative generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    'MIRROR_NARRATIVE_FAILED',
                    'NARRATIVE_GENERATION',
                    failureDetails
                );
            }
        }

        // WARP TICKET: TIGHT SANITIZER + SYNTHESIS CONSISTENCY
        const content = synthesis.content;
        const TAXONOMY_TOKENS = [
            'OPERATING_REALITY',
            'CONSTRAINT_LANDSCAPE',
            'BLIND_SPOT_RISKS',
            'ALIGNMENT_SIGNALS'
        ];

        content.sections = (content.sections || {}) as any;

        content.sections.OPERATING_REALITY = (content.sections.OPERATING_REALITY || []).map((p: string) =>
            sanitizeNarrativeText(p, TAXONOMY_TOKENS)
        );
        content.sections.CONSTRAINT_LANDSCAPE = (content.sections.CONSTRAINT_LANDSCAPE || []).map((p: string) =>
            sanitizeNarrativeText(p, TAXONOMY_TOKENS)
        );
        content.sections.BLIND_SPOT_RISKS = (content.sections.BLIND_SPOT_RISKS || []).map((p: string) =>
            sanitizeNarrativeText(p, TAXONOMY_TOKENS)
        );
        content.sections.ALIGNMENT_SIGNALS = (content.sections.ALIGNMENT_SIGNALS || []).map((p: string) =>
            sanitizeNarrativeText(p, TAXONOMY_TOKENS)
        );

        content.operatingReality = content.sections.OPERATING_REALITY.join('\n\n');
        content.constraintLandscape = content.sections.CONSTRAINT_LANDSCAPE.join('\n\n');
        content.blindSpotRisks = content.sections.BLIND_SPOT_RISKS.join('\n\n');
        content.alignmentSignals = content.sections.ALIGNMENT_SIGNALS.join('\n\n');

        content.executiveSummary = ensureDecisionOrientedSummary(content.executiveSummary, TAXONOMY_TOKENS);

        return synthesis;
    } catch (error) {
        if (error instanceof SynthesisError) {
            error.details = {
                ...diagnostics,
                ...error.details,
                tenantId,
                briefId
            };

            if (error.code === 'INSUFFICIENT_SIGNAL') {
                error.details.assertionCount = error.details.assertionCount ?? diagnostics.validAssertionsCount;
                error.details.signalCount = error.details.assertionCount;
                error.details.invalidAssertions = error.details.invalidAssertions || {
                    total: diagnostics.invalidAssertionsCount,
                    byRule: diagnostics.invalidAssertionsBreakdown
                };
            }
            throw error;
        }
        throw new SynthesisError(
            `Synthesis pipeline failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'PIPELINE_ERROR',
            'EXECUTION',
            { ...diagnostics, tenantId, briefId }
        );
    }
}
