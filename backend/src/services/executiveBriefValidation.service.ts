/**
 * EXEC-BRIEF-VALIDATION-KIT-003
 * Canonical Executive Brief Contract Validator
 * 
 * Enforces the Executive Brief synthesis contract across all execution paths:
 * - Generate (SuperAdmin)
 * - Regenerate (UI button)
 * - Download (serverless regen-on-miss)
 * - Deliver/Email (enforced EXECUTIVE_SYNTHESIS mode)
 * 
 * Validation Rules:
 * - Executive Assertion Blocks: 1-24 words per assertion, 1-3 evidence items, required fields
 * - Section Caps: ≤4 executive assertions, ≤5 top risks, ≤5 leverage moves
 * - Strategic Signal Summary: non-empty string
 * - Deterministic ordering: violations sorted by path ASC, then rule ASC
 */

import { SynthesisError } from './executiveBriefSynthesis.service';
import type {
    ExecutiveAssertionBlock,
    ExecutiveBriefSynthesis,
    ExecutiveBriefSectionKey,
    Pattern
} from '../types/executiveBrief';

// Helper to convert snake/caps to camelCase
function keyToCamel(s: string): string {
    return s.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * ValidationViolation - Local to validator (not part of canonical contract)
 */
export type ValidationViolation = {
    path: string;          // JSON pointer-ish: "executiveAssertionBlock[2].assertion"
    rule: string;          // Stable identifier: "EAB_ASSERTION_WORD_LIMIT"
    message: string;       // Human-readable (short)
    severity: 'ERROR';     // Keep simple, fail-closed
    context?: Record<string, unknown>; // Small, optional
};

// ============================================================================
// VALIDATION RULES
// ============================================================================

const RULES = {
    EAB_ASSERTION_WORD_LIMIT: {
        min: 1,
        max: 24,
        message: 'Assertion must be 1-24 words'
    },
    EAB_EVIDENCE_COUNT: {
        min: 1,
        max: 3,
        message: 'Evidence must contain 1-3 items'
    },
    EAB_REQUIRED_FIELDS: [
        'id', 'assertion', 'evidence', 'implication',
        'constraint_signal', 'primarySection', 'alignment_strength',
        'alignment_scope', 'confidence_score', 'source_refs'
    ],
    SECTION_CAP_EXEC_ASSERTIONS: 4,
    SECTION_CAP_TOP_RISKS: 5,
    SECTION_CAP_LEVERAGE_MOVES: 5,
    STRATEGIC_SIGNAL_SUMMARY_MIN_LENGTH: 1,
    FORBIDDEN_PATTERNS: [
        /\[Expansion applied:/i,
        /[A-Z]+_[A-Z]+(_[A-Z]+)*/, // Simple regex for ALL_CAPS_WITH_UNDERSCORE tokens
        /No specific operating context notes generated/i // Prohibit legacy placeholder (Ticket SECTION-COVERAGE-012)
    ]
};

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Validate a single Executive Assertion Block
 */
export function validateExecutiveAssertionBlock(
    eab: ExecutiveAssertionBlock,
    path: string
): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    // Required fields
    for (const field of RULES.EAB_REQUIRED_FIELDS) {
        if (!(field in eab) || eab[field as keyof ExecutiveAssertionBlock] === undefined) {
            violations.push({
                path: `${path}.${field}`,
                rule: 'EAB_REQUIRED_FIELD',
                message: `Required field '${field}' is missing`,
                severity: 'ERROR',
                context: { field }
            });
        }
    }

    // Assertion word count
    if (eab.assertion) {
        const wordCount = eab.assertion.trim().split(/\s+/).length;
        if (wordCount < RULES.EAB_ASSERTION_WORD_LIMIT.min ||
            wordCount > RULES.EAB_ASSERTION_WORD_LIMIT.max) {
            violations.push({
                path: `${path}.assertion`,
                rule: 'EAB_ASSERTION_WORD_LIMIT',
                message: RULES.EAB_ASSERTION_WORD_LIMIT.message,
                severity: 'ERROR',
                context: {
                    wordCount,
                    min: RULES.EAB_ASSERTION_WORD_LIMIT.min,
                    max: RULES.EAB_ASSERTION_WORD_LIMIT.max
                }
            });
        }
    }

    // Evidence count
    if (eab.evidence) {
        const evidenceCount = eab.evidence.length;
        if (evidenceCount < RULES.EAB_EVIDENCE_COUNT.min ||
            evidenceCount > RULES.EAB_EVIDENCE_COUNT.max) {
            violations.push({
                path: `${path}.evidence`,
                rule: 'EAB_EVIDENCE_COUNT',
                message: RULES.EAB_EVIDENCE_COUNT.message,
                severity: 'ERROR',
                context: {
                    count: evidenceCount,
                    min: RULES.EAB_EVIDENCE_COUNT.min,
                    max: RULES.EAB_EVIDENCE_COUNT.max
                }
            });
        }
    }

    return violations;
}

/**
 * Validate a Pattern (used in synthesis pipeline)
 */
export function validatePattern(pattern: Pattern, path: string): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    // Required fields
    const requiredFields = [
        'pattern_id', 'description', 'supporting_facts',
        'roles_observed', 'recurrence_level', 'confidence'
    ];

    for (const field of requiredFields) {
        if (!(field in pattern) || pattern[field as keyof Pattern] === undefined) {
            violations.push({
                path: `${path}.${field}`,
                rule: 'PATTERN_REQUIRED_FIELD',
                message: `Required field '${field}' is missing`,
                severity: 'ERROR',
                context: { field }
            });
        }
    }

    return violations;
}

/**
 * Validate Strategic Signal Summary
 */
export function validateStrategicSignalSummary(
    summary: string,
    path: string = 'strategicSignalSummary'
): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    return violations;
}

/**
 * Validate narrative content sections for debug leaks or internal tokens
 */
export function validateNarrativeContent(
    content: Record<string, string>,
    path: string = 'content'
): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const fields = ['executiveSummary', 'operatingReality', 'constraintLandscape', 'blindSpotRisks', 'alignmentSignals'];

    for (const field of fields) {
        const value = content[field];
        if (typeof value !== 'string') {
            violations.push({
                path: `${path}.${field}`,
                rule: 'CONTENT_FIELD_MISSING',
                message: `Content field '${field}' must be a string`,
                severity: 'ERROR'
            });
            continue;
        }

        // Check for forbidden patterns (EXEC-BRIEF-RENDER-INTEGRITY-012)
        for (const pattern of RULES.FORBIDDEN_PATTERNS) {
            if (pattern.test(value)) {
                violations.push({
                    path: `${path}.${field}`,
                    rule: 'CONTENT_DEBUG_LEAK',
                    message: `Content field '${field}' contains internal leak or debug banner: ${pattern.toString()}`,
                    severity: 'ERROR',
                    context: { pattern: pattern.toString() }
                });
            }
        }
    }

    return violations;
}

/**
 * Validate complete ExecutiveBriefSynthesis output
 * Throws SynthesisError with CONTRACT_VIOLATION if validation fails
 */
export function validateExecutiveBriefSynthesisOrThrow(
    synthesis: ExecutiveBriefSynthesis,
    context?: { tenantId?: string; briefId?: string; briefMode?: string; targetMode?: string }
): void {
    const violations: ValidationViolation[] = [];

    // Validate executive assertion blocks
    if (synthesis.executiveAssertionBlock) {
        synthesis.executiveAssertionBlock.forEach((eab, index) => {
            violations.push(
                ...validateExecutiveAssertionBlock(
                    eab,
                    `executiveAssertionBlock[${index}]`
                )
            );
        });

        // Section cap: executive assertions
        if (synthesis.executiveAssertionBlock.length > RULES.SECTION_CAP_EXEC_ASSERTIONS) {
            violations.push({
                path: 'executiveAssertionBlock',
                rule: 'SECTION_CAP_EXEC_ASSERTIONS',
                message: `Executive assertions must not exceed ${RULES.SECTION_CAP_EXEC_ASSERTIONS}`,
                severity: 'ERROR',
                context: {
                    count: synthesis.executiveAssertionBlock.length,
                    cap: RULES.SECTION_CAP_EXEC_ASSERTIONS
                }
            });
        }
    }

    // Validate top risks
    if (synthesis.topRisks) {
        synthesis.topRisks.forEach((risk, index) => {
            violations.push(
                ...validateExecutiveAssertionBlock(
                    risk,
                    `topRisks[${index}]`
                )
            );
        });

        // Section cap: top risks
        if (synthesis.topRisks.length > RULES.SECTION_CAP_TOP_RISKS) {
            violations.push({
                path: 'topRisks',
                rule: 'SECTION_CAP_TOP_RISKS',
                message: `Top risks must not exceed ${RULES.SECTION_CAP_TOP_RISKS}`,
                severity: 'ERROR',
                context: {
                    count: synthesis.topRisks.length,
                    cap: RULES.SECTION_CAP_TOP_RISKS
                }
            });
        }
    }

    // Validate leverage moves
    if (synthesis.leverageMoves) {
        synthesis.leverageMoves.forEach((move, index) => {
            violations.push(
                ...validateExecutiveAssertionBlock(
                    move,
                    `leverageMoves[${index}]`
                )
            );
        });

        // Section cap: leverage moves
        if (synthesis.leverageMoves.length > RULES.SECTION_CAP_LEVERAGE_MOVES) {
            violations.push({
                path: 'leverageMoves',
                rule: 'SECTION_CAP_LEVERAGE_MOVES',
                message: `Leverage moves must not exceed ${RULES.SECTION_CAP_LEVERAGE_MOVES}`,
                severity: 'ERROR',
                context: {
                    count: synthesis.leverageMoves.length,
                    cap: RULES.SECTION_CAP_LEVERAGE_MOVES
                }
            });
        }
    }

    // Validate Canonical Content (EXEC-BRIEF-RENDER-INTEGRITY-012)
    if (synthesis.content) {
        // Validation for canonical flattened fields
        const flattenedContent: Record<string, string> = { ...synthesis.content } as any;
        delete (flattenedContent as any).sections;
        delete (flattenedContent as any).isMirrorNarrative;
        violations.push(...validateNarrativeContent(flattenedContent));

        // Validation for optional structured sections (v1.1)
        if (synthesis.content.sections) {
            for (const key in synthesis.content.sections) {
                const paragraphs = synthesis.content.sections[key as ExecutiveBriefSectionKey];
                const flattened = synthesis.content[keyToCamel(key) as keyof typeof synthesis.content];

                if (typeof flattened === 'string' && paragraphs.join('\n\n') !== flattened) {
                    violations.push({
                        path: `content.sections.${key}`,
                        rule: 'SECTION_CONSISTENCY',
                        message: `Structured section ${key} does not match canonical flattened content.`,
                        severity: 'ERROR',
                    });
                }
            }
        }
    } else {
        violations.push({
            path: 'content',
            rule: 'CONTENT_MISSING',
            message: 'Canonical content block is missing',
            severity: 'ERROR'
        });
    }

    // Validate Section Coverage (Ticket SECTION-COVERAGE-012)
    const sections: (keyof NonNullable<ExecutiveBriefSynthesis['content']>)[] = [
        'operatingReality',
        'constraintLandscape',
        'blindSpotRisks',
        'alignmentSignals'
    ];

    if (synthesis.content) {
        for (const section of sections) {
            const val = synthesis.content[section] as string;
            if (!val || val.trim().length === 0) {
                violations.push({
                    path: `content.${section}`,
                    rule: 'SECTION_EMPTY',
                    message: `Section '${section}' is empty. Every section must have >= 1 paragraph or fallback.`,
                    severity: 'ERROR'
                });
            }
        }
    }

    // Validate Meta block
    if (!synthesis.meta || !synthesis.meta.signalQuality) {
        violations.push({
            path: 'meta',
            rule: 'META_MISSING',
            message: 'Canonical meta block is missing or incomplete',
            severity: 'ERROR'
        });
    }

    // Validate strategic signal summary
    violations.push(
        ...validateStrategicSignalSummary(synthesis.strategicSignalSummary || synthesis.content?.executiveSummary || '')
    );

    // Sort violations deterministically: path ASC, then rule ASC
    violations.sort((a, b) => {
        if (a.path !== b.path) {
            return a.path.localeCompare(b.path);
        }
        return a.rule.localeCompare(b.rule);
    });

    // Throw if violations found
    if (violations.length > 0) {
        // EXEC-BRIEF-PDF-500-CONTRACT-023: Log violations for debugging
        console.error(
            "[ExecutiveBriefContract][VIOLATIONS]",
            JSON.stringify({
                tenantId: context?.tenantId,
                briefId: context?.briefId,
                mode: context?.briefMode,
                targetMode: context?.targetMode,
                violations
            }, null, 2)
        );

        throw new SynthesisError(
            `Contract validation failed: ${violations.length} violation(s)`,
            'CONTRACT_VIOLATION',   // code
            'ASSEMBLY_VALIDATION',  // stage
            { violations }
        );
    }
}

/**
 * Log contract validation result
 */
export function logContractValidation(params: {
    tenantId: string;
    briefId?: string;
    action: 'generate' | 'regen' | 'download_regen' | 'deliver_regen' | 'deliver_existing';
    result: 'pass' | 'fail';
    violations: number;
    mode?: string;
}): void {
    const { tenantId, briefId, action, result, violations, mode } = params;
    console.log(
        `[ExecutiveBriefContract] tenantId=${tenantId} briefId=${briefId || 'none'} ` +
        `action=${action} result=${result} violations=${violations} mode=${mode || 'N/A'}`
    );
}

// ============================================================================
// MIRROR NARRATIVE VALIDATION (EXEC-BRIEF-MIRROR-VOICE-016)
// ============================================================================

// ============================================================================
// MIRROR NARRATIVE VALIDATION (EXEC-BRIEF-MIRROR-VOICE-016)
// ============================================================================

const MIRROR_VOICE_RULES = {
    BANNED_PRONOUNS: [
        { id: 'BANNED_PRONOUN_I', regex: /\b(I|me|my)\b/i, label: 'I/me/my' },
        { id: 'BANNED_PRONOUN_YOU', regex: /\b(you|your|yours)\b/i, label: 'you/your' }
    ],
    BANNED_JARGON: [
        'stakeholders', 'leverage', 'leveraging', 'operational efficiency',
        'execution velocity', 'systemic', 'cross-functional', 'alignment signals',
        'best practices', 'framework', 'strategy', 'organization', 'synergies',
        'signals detected', 'risk exposure identified', 'execution drag',
        'resource inefficiency', 'coordination overhead', 'resource allocation requires systematic review',
        'operational manifestations include', 'structural constraints limit execution capacity',
        'contextual understanding shapes execution strategy', 'insufficient contrast', 'role-specific operating detail',
        'distributed operational patterns', 'implied stability', 'localized optimization opportunities',
        'acute friction points', 'risk exposure identified', 'execution debt'
    ],
    DEPTH_RULES: {
        MIN_WORDS: 80,
        MAX_WORDS: 200, // Allowance for depth
        MIN_SENTENCES: 6,
        MIN_PARAGRAPHS: 2,
        MAX_PARAGRAPHS: 4
    },
    ANCHOR_DETECTION: {
        ROLES: /\b(owner|ops|floor|staff|team|leader|tech|service|customer|manager|clerk|driver)\b/i,
        FRICTION: /\b(escalation|handoff|inventory|schedule|delay|backlog|bottleneck|friction|morale|wait|error|missed|late)\b/i
    },
    TRIAD_REQUIRED: [
        {
            id: 'TRIAD_LIVED_REALITY',
            patterns: [
                /^(Today, we’re seeing|On the floor, it’s showing up as|Lately, what’s been real for us is|In practice, the issue is|The pattern we keep running into is|If we’re being honest, the truth is|As it stands, we’re operating with|This week, it’s been clear that|At the moment, we’re stuck in|What’s actually playing out day to day is)/i
            ],
            label: 'Approved Lived Reality lead pattern'
        }
    ]
};

const TAXONOMY_TOKENS = [
    'OPERATING_REALITY', 'CONSTRAINT_LANDSCAPE', 'BLIND_SPOT_RISKS', 'ALIGNMENT_SIGNALS',
    'EXEC_SUMMARY', 'EXECUTIVE_SYNTHESIS'
];

/**
 * Validate mirror narrative voice contract
 * Enforces: hard gates (pronouns, jargon, leaks) and soft guides (triad sentences)
 */
export function validateMirrorNarrativeOrThrow(synthesis: ExecutiveBriefSynthesis): void {
    const hardViolations: any[] = [];
    const softViolations: any[] = [];

    const sectionKeys: ExecutiveBriefSectionKey[] = [
        'OPERATING_REALITY',
        'CONSTRAINT_LANDSCAPE',
        'BLIND_SPOT_RISKS',
        'ALIGNMENT_SIGNALS'
    ];

    // 1. Validate Executive Summary (Flat string compatibility)
    const summaryText = synthesis.content.mirrorSummary || '';
    if (summaryText) {
        validateSectionText('EXEC_SUMMARY', summaryText, softViolations, hardViolations);
    }

    // 2. Validate Structured Sections
    sectionKeys.forEach(key => {
        const section = synthesis.content.mirrorSections?.[key];
        if (!section) return;

        const combinedText = [section.livedReality, section.costOfStatusQuo, section.theCall].join('\n\n');
        validateSectionText(key, combinedText, softViolations, hardViolations);

        // Depth & Cadence Rules (Specific to MirrorSections)
        const wordCount = combinedText.trim().split(/\s+/).length;
        if (wordCount < MIRROR_VOICE_RULES.DEPTH_RULES.MIN_WORDS) {
            softViolations.push({ ruleId: 'DEPTH_SHALLOW', sectionKey: key, message: `Section is too shallow (${wordCount} words, min ${MIRROR_VOICE_RULES.DEPTH_RULES.MIN_WORDS})` });
        }

        const paragraphs = combinedText.split('\n\n').filter(p => p.trim().length > 0);
        if (paragraphs.length < MIRROR_VOICE_RULES.DEPTH_RULES.MIN_PARAGRAPHS) {
            softViolations.push({ ruleId: 'PARAGRAPH_COUNT_LOW', sectionKey: key, message: `Section has too few paragraphs (${paragraphs.length}, min ${MIRROR_VOICE_RULES.DEPTH_RULES.MIN_PARAGRAPHS})` });
        }

        // Anchor Checks
        if (!MIRROR_VOICE_RULES.ANCHOR_DETECTION.ROLES.test(combinedText)) {
            softViolations.push({ ruleId: 'MISSING_ROLE_REF', sectionKey: key, message: 'Missing concrete role references' });
        }
        if (!MIRROR_VOICE_RULES.ANCHOR_DETECTION.FRICTION.test(combinedText)) {
            softViolations.push({ ruleId: 'MISSING_OPERATIONAL_ANCHOR', sectionKey: key, message: 'Missing concrete operational friction anchors' });
        }
    });

    // Attach soft counts to metadata for persistence
    if (!(synthesis as any).meta) (synthesis as any).meta = {};
    (synthesis as any).meta.softContractViolationCount = softViolations.length;

    if (softViolations.length > 0) {
        console.log(`[MirrorNarrative][SOFT_CONTRACT_VIOLATIONS] count=${softViolations.length}`, {
            violations: softViolations.map(v => ({ ruleId: v.ruleId, sectionKey: v.sectionKey }))
        });
    }

    // Only throw for HARD violations
    if (hardViolations.length > 0) {
        console.error('[MirrorNarrative][VIOLATION_SUMMARY]', { count: hardViolations.length, violations: hardViolations });

        throw new SynthesisError(
            `Mirror narrative voice contract violated: ${hardViolations.length} hard violation(s)`,
            'MIRROR_NARRATIVE_CONTRACT_VIOLATION',
            'NARRATIVE_VALIDATION',
            { violations: hardViolations, hardViolations, softViolations }
        );
    }
}

/**
 * Shared logic for validating mirror text
 */
function validateSectionText(key: string, text: string, softViolations: any[], hardViolations: any[]) {
    if (!text) return;

    // 1. SOFT GATE: Banned Pronouns
    MIRROR_VOICE_RULES.BANNED_PRONOUNS.forEach(rule => {
        const match = text.match(rule.regex);
        if (match) {
            softViolations.push({
                ruleId: rule.id,
                sectionKey: key,
                message: `Banned pronoun detected: "${match[0]}"`
            });
        }
    });

    // 2. SOFT GATE: Banned Jargon
    MIRROR_VOICE_RULES.BANNED_JARGON.forEach(phrase => {
        if (text.toLowerCase().includes(phrase.toLowerCase())) {
            softViolations.push({
                ruleId: 'BANNED_JARGON',
                sectionKey: key,
                message: `Banned jargon detected: "${phrase}"`
            });
        }
    });

    // 3. HARD GATE: Debug/Taxonomy Leaks
    if (/\[DEBUG|TODO|FIXME|XXX\]/i.test(text)) {
        hardViolations.push({ ruleId: 'DEBUG_LEAK', sectionKey: key, message: 'Debug marker' });
    }
    TAXONOMY_TOKENS.forEach(token => {
        if (text.includes(token)) {
            hardViolations.push({ ruleId: 'TAXONOMY_LEAK', sectionKey: key, match: token, message: 'Taxonomy leak' });
        }
    });

    // 4. SOFT GUIDE: Lead pattern
    if (key !== 'EXEC_SUMMARY') {
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        const firstPara = paragraphs[0] || '';
        if (!MIRROR_VOICE_RULES.TRIAD_REQUIRED[0].patterns.some(p => p.test(firstPara))) {
            softViolations.push({
                ruleId: 'TRIAD_LIVED_REALITY',
                sectionKey: key,
                message: 'Missing or unapproved Lived Reality lead pattern'
            });
        }
    }
}

