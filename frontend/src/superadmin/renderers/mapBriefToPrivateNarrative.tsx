import {
    ExecutiveBriefSection,
    ViewProjection,
    MetricBlock,
    splitSentences,
    normalizeText,
    missingSignalsToHuman,
    mapSynthesisToSections,
    projectSections
} from '@roadmap/shared';

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
 * Standard Narrative Section Component
 * Enforces SA-EXEC-BRIEF-RENDERING-CONTRACT-LOCK-1
 */
export function NarrativeSection({ section, view = 'PRIVATE' }: { section: ExecutiveBriefSection, view?: ViewProjection }) {
    const isSystem = view === 'SYSTEM';

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
                {/* PATTERN_LIST Mode */}
                {section.renderMode === 'PATTERN_LIST' && (
                    <div className="space-y-6">
                        {section.intro && (
                            <p className="text-[12px] text-slate-400 leading-[1.7] italic mb-2">
                                {section.intro}
                            </p>
                        )}
                        {(() => {
                            const lines = (section.content as string).split(/\n/);
                            const blocks: { type: 'PROSE' | 'BULLET', content: string }[] = [];

                            lines.forEach((line: string) => {
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
                                return splitSentences(block.content, isSystem ? 3 : 4).map((para: string, pIdx: number) => (
                                    <p key={`${bIdx}-${pIdx}`} className="text-[13px] text-slate-200 leading-[1.45] max-w-3xl font-normal mb-[10pt] last:mb-0 break-inside-avoid">
                                        {para}
                                    </p>
                                ));
                            });
                        })()}
                    </div>
                )}

                {/* PROSE_NARRATIVE Mode */}
                {section.renderMode === 'PROSE_NARRATIVE' && (
                    <div className="space-y-[10pt]">
                        {splitSentences(section.content as string, isSystem ? 3 : 4).map((para: string, pIdx: number) => (
                            <p key={pIdx} className="text-[13px] text-slate-200 leading-[1.45] max-w-3xl font-normal break-inside-avoid">
                                {para}
                            </p>
                        ))}
                    </div>
                )}

                {/* BULLET_LIST Mode */}
                {section.renderMode === 'BULLET_LIST' && (
                    <ul className="list-disc pl-5 space-y-[6pt]">
                        {(section.content as string[]).map((item, idx) => (
                            <li key={idx} className="text-[13px] text-slate-300 leading-[1.45] font-normal break-inside-avoid">
                                {String(item).replace(/^[•\-\*]\s+/, '').trim()}
                            </li>
                        ))}
                    </ul>
                )}

                {/* METRIC_CALLOUT Mode */}
                {section.renderMode === 'METRIC_CALLOUT' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg break-inside-avoid">
                            <div className="text-[14px] text-slate-200 leading-[1.45] font-normal italic">
                                {normalizeText((section.content as MetricBlock).interpretation)}
                            </div>
                        </div>
                        <div className="flex gap-10 pl-1">
                            <div>
                                <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Calculated Level</div>
                                <div className="text-[13px] font-bold text-slate-400 mt-1">{(section.content as MetricBlock).level}</div>
                            </div>
                            {(section.content as MetricBlock).capacityScore !== undefined && (
                                <div>
                                    <div className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">Capacity Score</div>
                                    <div className="text-[13px] font-bold text-slate-400 mt-1">{(section.content as MetricBlock).capacityScore}/10</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
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

// Re-export common orientation/metadata/closing for views
export { mapSynthesisToSections, projectSections, type ExecutiveBriefSection };
