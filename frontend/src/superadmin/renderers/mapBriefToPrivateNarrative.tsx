import React from 'react';
import {
    ExecutiveBriefSection,
    RenderMode,
    ViewProjection,
    MetricBlock,
    projectToSystem,
    validateSection,
    splitSentences
} from './ExecutiveBriefSchema';

/**
 * Pure Render Functions for Executive Brief Rendering Contract
 *
 * INVARIANTS:
 * - No inferred bullets (bullets require STRUCTURED_LIST + Array input)
 * - Explicit Render Modes only
 * - View-dependent semantic projections (Private vs System)
 */

// Pure helpers

// Section C: Paragraph Normalization
export function normalizeText(s: unknown): string {
    if (!s) return "";
    let text = String(s).replace(/\r\n/g, '\n').trim();

    // Collapse multiple spaces
    text = text.replace(/[ \t]+/g, ' ');

    const lines = text.split('\n').map(l => l.trim());

    // Section D: Junk Token Removal
    const cleanLines = lines.filter(line => {
        if (!line) return true; // keep blank lines for paragraph splitting
        const junk = /^(,|,,|;|—|-)$/;
        return !junk.test(line);
    });

    return cleanLines.join('\n');
}

export function isMeaningfulValue(x: unknown): boolean {
    if (x === null || x === undefined) return false;
    const s = String(x).trim();
    const lower = s.toLowerCase();

    // List of garbage/placeholder tokens
    if (lower === "" || lower === "," || lower === ",," || lower === ";" || lower === "unknown" || lower === "n/a") return false;

    // Standalone punctuation/operators
    if (/^[.,;!?\- ]+$/.test(s)) return false;

    return true;
}

export function missingSignalsToHuman(missing: string[]): string {
    return missing.map((m) => {
        if (m === "constraints") return "Constraints not explicitly articulated";
        if (m === "blind_spots" || m === "blindSpots") return "Blind spots not explicitly articulated";
        if (m === "operating_reality") return "Operational reality context missing";
        if (m === "alignment") return "Alignment/Conflict signals missing";
        return `Missing signal: ${m}`;
    }).join(", ");
}


/**
 * Signal Normalization for METRIC mode
 * HARDENED: Recursively strips redundant level-word prefixes to eliminate "junk" tokens.
 */
export function normalizeToMetric(input: any, type: "RISK" | "READINESS"): MetricBlock {
    const rawValues = Array.isArray(input) ? input : [String(input)];
    const interpretation: string[] = [];
    let level: "Low" | "Medium" | "High" = "Medium";
    let capacityScore: number | undefined;

    rawValues.forEach(v => {
        let s = String(v).trim();
        if (!isMeaningfulValue(s)) return;

        // 1. Recursive Strip Level Prefix
        const levelPrefixReg = /^(low|medium|high)\b[\s,:]*/i;
        while (levelPrefixReg.test(s)) {
            const match = s.match(levelPrefixReg);
            if (match) {
                level = (match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()) as any;
                s = s.replace(levelPrefixReg, "").trim();
            }
        }

        if (!s) return;

        // 2. Score extraction (Readiness Only)
        if (type === "READINESS") {
            const scoreMatch = s.match(/^(\d+)(?:\s*\/10)?\b/);
            if (scoreMatch) {
                capacityScore = parseInt(scoreMatch[1]);
                // If it was just a score, don't add to narrative
                if (s.replace(/^(\d+)(?:\s*\/10)?[\s,.]*/, "").trim().length === 0) return;
            }
        }

        // 3. Clean trailing punctuation from individual tokens
        const cleanVal = s.replace(/[,;]+$/, "").trim();
        if (cleanVal && !interpretation.includes(cleanVal)) {
            interpretation.push(cleanVal);
        }
    });

    return {
        level,
        capacityScore,
        interpretation: interpretation.join(". ").replace(/\.\s+\./g, ".").trim()
    };
}

// Orientation (Static Boilerplate)
export function renderOrientation(): any {
    return (
        <div className="p-6 bg-slate-900/10 border border-slate-800/50 rounded-lg">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                Orientation: What This Is (and Is Not)
            </h2>
            <div className="space-y-3 max-w-3xl">
                <p className="text-[12px] text-slate-400 leading-relaxed">
                    This brief is a private synthesis of leadership-level signals surfaced during the Strategic AI Roadmap process.
                </p>
                <p className="text-[12px] text-slate-500 leading-relaxed italic">
                    It is not a performance evaluation, not a cultural diagnosis, not a set of recommendations, and not intended for cross-functional distribution.
                    Its purpose is to surface patterns of perception, awareness, and signal flow that influence execution but do not belong in a shared roadmap.
                </p>
            </div>
        </div>
    );
}

// Metadata (Facts Only)
export function renderMetadata(signals: any, verification: any): any {
    const verificationLine = verification?.required
        ? `Verification note: ${missingSignalsToHuman(verification.missingSignals || [])}.`
        : null;

    const renderSignalTuple = (val: any) => {
        if (!val) return 'N/A';
        const rawItems = Array.isArray(val) ? val : [String(val)];
        const filtered = rawItems
            .map(v => String(v).trim())
            .filter(v => v && v !== 'undefined' && v !== 'null' && v !== ',');

        if (filtered.length === 0) return 'N/A';
        if (filtered.length === 1) return filtered[0];

        return (
            <div className="space-y-1">
                {filtered.map((item, idx) => (
                    <div key={idx} className="flex items-baseline gap-2">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Detail {idx + 1}:</span>
                        <span className="text-[12px] font-medium text-slate-300">{item}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 bg-slate-900/10 border border-slate-800/50 rounded-lg space-y-4">
            <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800/50 pb-2">
                Executive Signal Metadata
            </h2>
            <div className="grid grid-cols-3 gap-8">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Constraint Consensus</div>
                    <div className="text-[14px] font-semibold text-slate-200">
                        {renderSignalTuple(signals.constraintConsensusLevel)}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Execution Risk</div>
                    <div className="text-[14px] font-semibold text-slate-200">
                        {renderSignalTuple(signals.executionRiskLevel)}
                    </div>
                </div>
                <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Org Clarity</div>
                    <div className="text-[14px] font-semibold text-slate-200">
                        {renderSignalTuple(signals.orgClarityScore !== undefined ? `${signals.orgClarityScore}/100` : undefined)}
                    </div>
                </div>
            </div>
            {verificationLine && <div className="text-[11px] text-amber-500 font-medium italic pt-2 border-t border-slate-800/50">{verificationLine}</div>}
        </div>
    );
}

/**
 * Canonical Executive Narrative Renderer
 * Enforces SA-EXEC-BRIEF-RENDERING-CONTRACT-LOCK-1
 */
export function renderNarrativeBlock(section: ExecutiveBriefSection, view: ViewProjection = 'PRIVATE') {
    // 1. View-Specific Filters (Rule: UI MUST NOT DUPLICATE CONTENT ACROSS VIEWS)
    if (view === 'SYSTEM' && section.id === 'constraint-landscape') return null;

    // 2. Validate Contract (FAIL-CLOSED)
    if (!validateSection(section)) {
        console.warn(`[CONTRACT VIOLATION] Suppressed: ${section.title}`);
        return null;
    }

    // 3. Apply Semantic Reduction for System View
    let displayContent = section.content;
    const isSystem = view === 'SYSTEM';

    if (isSystem) {
        if (typeof displayContent === 'string') {
            displayContent = projectToSystem(displayContent);
        } else if (Array.isArray(displayContent)) {
            displayContent = displayContent.map(s => projectToSystem(s));
        } else {
            const m = { ...displayContent as MetricBlock };
            m.interpretation = projectToSystem(m.interpretation);
            displayContent = m;
        }
    }

    return (
        <section className="space-y-6">
            <div>
                <h2 className="text-[13px] font-bold text-white uppercase tracking-[0.2em] border-b border-slate-800 pb-3">
                    {section.title}
                </h2>
                {section.sublabel && (
                    <p className="text-[11px] text-slate-400 font-medium italic mt-2 leading-relaxed">
                        {section.sublabel}
                    </p>
                )}
            </div>

            <div className="space-y-6">
                {/* PATTERN_LIST Mode: Required Intro + Narrative Grouping with Explicit Bullets */}
                {section.renderMode === 'PATTERN_LIST' && (
                    <div className="space-y-6">
                        <p className="text-[12px] text-slate-400 leading-[1.7] italic mb-2">
                            {section.intro}
                        </p>
                        {(() => {
                            const lines = (displayContent as string).split(/\n/);
                            const blocks: { type: 'PROSE' | 'BULLET', content: string }[] = [];

                            lines.forEach(line => {
                                const trimmed = line.trim();
                                if (!trimmed) return;

                                if (trimmed.startsWith('•')) {
                                    blocks.push({ type: 'BULLET', content: trimmed.replace(/^•\s*/, '') });
                                } else {
                                    const last = blocks[blocks.length - 1];
                                    if (last && last.type === 'PROSE') {
                                        last.content += " " + trimmed;
                                    } else {
                                        blocks.push({ type: 'PROSE', content: trimmed });
                                    }
                                }
                            });

                            return blocks.map((block, bIdx) => {
                                if (block.type === 'BULLET') {
                                    return (
                                        <div key={bIdx} className="flex gap-3 pl-2 break-inside-avoid">
                                            <span className="text-slate-500 mt-1.5 text-[10px]">●</span>
                                            <span className="text-[13px] text-slate-300 leading-[1.45]">
                                                {block.content}
                                            </span>
                                        </div>
                                    );
                                }
                                // Prose: Apply cognitive splitting
                                return splitSentences(block.content, isSystem ? 3 : 4).map((para, pIdx) => (
                                    <p key={`${bIdx}-${pIdx}`} className="text-[13px] text-slate-200 leading-[1.45] max-w-3xl font-normal mb-[10pt] last:mb-0 break-inside-avoid">
                                        {para}
                                    </p>
                                ));
                            });
                        })()}
                    </div>
                )}

                {/* PROSE_NARRATIVE Mode: Cohesive Blocks Only, Strictly No Bullets */}
                {section.renderMode === 'PROSE_NARRATIVE' && (
                    <div className="space-y-[10pt]">
                        {splitSentences(displayContent as string, isSystem ? 3 : 4).map((para, pIdx) => (
                            <p key={pIdx} className="text-[13px] text-slate-200 leading-[1.45] max-w-3xl font-normal break-inside-avoid">
                                {para}
                            </p>
                        ))}
                    </div>
                )}

                {/* BULLET_LIST Mode: Pure Enumeration */}
                {section.renderMode === 'BULLET_LIST' && (
                    <ul className="list-disc pl-5 space-y-[6pt]">
                        {(displayContent as string[]).map((item, idx) => (
                            <li key={idx} className="text-[13px] text-slate-300 leading-[1.45] font-normal break-inside-avoid">
                                {String(item).replace(/^[•\-\*]\s+/, '').trim()}
                            </li>
                        ))}
                    </ul>
                )}

                {/* METRIC_CALLOUT Mode: Narrative Interpretation + Muted Scalar Footer */}
                {section.renderMode === 'METRIC_CALLOUT' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg break-inside-avoid">
                            <div className="text-[14px] text-slate-200 leading-[1.45] font-normal italic">
                                {normalizeText((displayContent as MetricBlock).interpretation)}
                            </div>
                        </div>
                        <div className="flex gap-10 pl-1">
                            <div>
                                <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Calculated Level</div>
                                <div className="text-[13px] font-bold text-slate-400 mt-1">{(displayContent as MetricBlock).level}</div>
                            </div>
                            {(displayContent as MetricBlock).capacityScore !== undefined && (
                                <div>
                                    <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Capacity Score</div>
                                    <div className="text-[13px] font-bold text-slate-400 mt-1">{(displayContent as MetricBlock).capacityScore}/10</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

// Section Renderers
export function renderOperatingReality(synthesis: any, view: ViewProjection = 'PRIVATE'): any {
    return renderNarrativeBlock({
        id: 'operating-reality',
        title: "Leadership Perception vs Operational Reality",
        content: synthesis.operatingReality,
        renderMode: 'PATTERN_LIST',
        intro: "This section surfaces recurring execution patterns where leadership intent and day-to-day operations diverge, based on cross-role intake synthesis."
    }, view);
}

export function renderConstraintLandscape(synthesis: any, view: ViewProjection = 'PRIVATE'): any {
    const raw = Array.isArray(synthesis.constraintLandscape) ? synthesis.constraintLandscape : [synthesis.constraintLandscape];
    return renderNarrativeBlock({
        id: 'constraint-landscape',
        title: "Awareness Gaps (Unseen or Normalized)",
        content: raw.filter(x => isMeaningfulValue(x)),
        renderMode: 'BULLET_LIST'
    }, view);
}

export function renderAlignmentSignals(synthesis: any, view: ViewProjection = 'PRIVATE'): any {
    return renderNarrativeBlock({
        id: 'alignment-signals',
        title: "Trust & Signal Flow",
        content: synthesis.alignmentSignals,
        renderMode: 'PROSE_NARRATIVE',
        sublabel: "Future-state signal mapping and desired operational transparency."
    }, view);
}

export function renderBlindSpotRisks(synthesis: any, view: ViewProjection = 'PRIVATE'): any {
    return renderNarrativeBlock({
        id: 'blind-spot-risks',
        title: "Decision Latency & Risk",
        content: synthesis.blindSpotRisks,
        renderMode: 'PROSE_NARRATIVE'
    }, view);
}

export function renderRiskSignals(synthesis: any, view: ViewProjection = 'PRIVATE'): any {
    const metric = normalizeToMetric(synthesis.riskSignals, "RISK");
    return renderNarrativeBlock({
        id: 'risk-signals',
        title: "Executive Risk Language",
        content: metric,
        renderMode: 'METRIC_CALLOUT'
    }, view);
}

export function renderReadinessSignals(synthesis: any, view: ViewProjection = 'PRIVATE'): any {
    const metric = normalizeToMetric(synthesis.readinessSignals, "READINESS");
    return renderNarrativeBlock({
        id: 'readiness-signals',
        title: "Implementation Readiness",
        content: metric,
        renderMode: 'METRIC_CALLOUT'
    }, view);
}

export function renderExecutiveSummary(synthesis: any, view: ViewProjection = 'PRIVATE'): any {
    return renderNarrativeBlock({
        id: 'executive-summary',
        title: "Executive Summary (For Reference Only)",
        content: synthesis.executiveSummary,
        renderMode: 'PROSE_NARRATIVE'
    }, view);
}

// Closing (Static)
export function renderClosing(): any {
    return (
        <div className="pt-12 border-t border-slate-800/50">
            <p className="text-[11px] text-slate-500 uppercase tracking-[0.3em] font-bold text-center">
                –– End of Brief ––
            </p>
        </div>
    );
}
