/**
 * EXEC-BRIEF-CANONICAL-CONTRACT-PREEMPT-001
 * Canonical Type Definitions for Deterministic Executive Brief Synthesis
 */

export type ExecutiveBriefSectionKey =
    | 'EXEC_SUMMARY'
    | 'OPERATING_REALITY'
    | 'CONSTRAINT_LANDSCAPE'
    | 'BLIND_SPOT_RISKS'
    | 'ALIGNMENT_SIGNALS';

export interface MirrorSection {
    livedReality: string;      // 2 paragraphs, grounded
    costOfStatusQuo: string;   // 1 paragraph, concrete impact
    theCall: string;           // 1 paragraph, decision + first move
}

export interface ExecutiveAssertionBlock {
    id: string;

    // REQUIRED — EXECUTIVE VISIBLE
    assertion: string;          // ≤ 24 words, declarative, present tense
    evidence: string[];         // 1–3 compressed signals, no quotes
    implication: string;        // exec-level cost/leverage, ≤ 2 sentences
    constraint_signal: string;  // structural root cause only (no blaming people)

    // NEW CONTRACT LAYER: SECTION GOVERNANCE (Ticket SECTION-COVERAGE-012)
    primarySection: ExecutiveBriefSectionKey;
    secondarySections?: ExecutiveBriefSectionKey[];

    // PRIORITY SIGNAL (Ticket CONTRAST-SIGNAL-013)
    contrastScore?: number; // 0-1, heuristic for role divergence

    // OPTIONAL — EXECUTIVE VISIBLE
    leverage_direction?: string; // class of intervention

    // REQUIRED — INTERNAL ONLY (NEVER RENDERED)
    alignment_strength: "low" | "medium" | "high";
    alignment_scope: "cross-role" | "leadership-only" | "fragmented";
    confidence_score: number;   // 0–1
    source_refs: string[];      // intake / diagnostic IDs
    roles_observed?: string[];  // captured from pattern for elaboration context
}

export interface Pattern {
    pattern_id: string;
    description: string;        // system-level, non-executive
    supporting_facts: string[]; // raw signals, terse
    roles_observed: string[];   // e.g., owner, ops, sales
    recurrence_level: "low" | "medium" | "high";
    confidence: number;         // 0–1
}

export interface ExecutiveBriefSynthesis {
    // Canonical Section Content (Pure Narrative)
    // Locked for UI rendering. Must be sanitized strings (markdown supported).
    content: {
        executiveSummary: string;
        operatingReality: string;
        constraintLandscape: string;
        blindSpotRisks: string;
        alignmentSignals: string;
        // Structured representation (v1.1)
        sections?: Record<ExecutiveBriefSectionKey, string[]>;

        // Mirror Narrative layer (Ticket META-EXECBRIEF-MIRROR-VOICE-DEPTH-026D)
        mirrorSummary?: string;
        mirrorSections?: Record<ExecutiveBriefSectionKey, MirrorSection>;
        mirrorPatternIds?: Record<string, string>; // Pattern tracking for audit/debug

        // Evidence sections for appendix
        evidenceSections?: Record<ExecutiveBriefSectionKey, string[]>;

        // Mirror Narrative flag (Ticket EXEC-BRIEF-MIRROR-VOICE-016)
        isMirrorNarrative?: boolean;
    };

    // Metadata & Quality Telemetry
    // NOT rendered in body, used for banners/modals.
    meta: {
        expansion?: {
            invoked: boolean;
            acceptedCount: number;
            requestId?: string;
        };
        elaboration?: {
            elaborationApplied: boolean;
            elaboratedAssertionIds: string[];
            elaborationDepthBySection: Record<string, number>;
        };
        signalQuality: {
            status: 'SUFFICIENT' | 'LOW_SIGNAL';
            assertionCount: number;
            targetCount: number;
        };
        sectionCoverage?: Record<string, { count: number; usedFallback: boolean }>;
        contrastCoverage?: {
            contrastAvailableBySection: Record<string, boolean>;
            contrastUsedBySection: Record<string, boolean>;
            highContrastCount: number;
            threshold: number;
        };
        mirrorEnforcement?: {
            noRepeat: { triggered: boolean; count: number; rewrites: number; collisions: string[] };
            jargonHitsCount: number;
            jargonHits: { phrase: string; replacement: string; sectionKey: string; sentenceIndex: number; severity: "LOW" | "MEDIUM" | "HIGH" }[];
            repairedSentences: number;
            callSpec: { pass: boolean; patched: boolean; llmFix: boolean; count: number };
            samples: { beforeAfterSnippets: string[] };
        };
        diagnostics?: any;
    };

    // RAW BLOCKS (Internal/Audit use)
    executiveAssertionBlock: ExecutiveAssertionBlock[];
    topRisks: ExecutiveAssertionBlock[];
    leverageMoves: ExecutiveAssertionBlock[];

    // LEGACY SUPPORT / DEPRECATED
    /** @deprecated Use content.executiveSummary */
    strategicSignalSummary?: string;
    /** @deprecated Use content.operatingReality */
    operatingContextNotes?: string;
    /** @deprecated Use meta.signalQuality.status */
    signalQuality?: 'SUFFICIENT' | 'LOW_SIGNAL';
    /** @deprecated Use meta.signalQuality.assertionCount */
    assertionCount?: number;
    /** @deprecated Use meta.signalQuality.targetCount */
    targetCount?: number;
}
