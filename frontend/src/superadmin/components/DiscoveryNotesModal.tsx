import { useState, useEffect, ChangeEvent } from 'react';
import { type CanonicalDiscoveryNotes } from '@roadmap/shared';
import { superadminApi } from '../api';

interface DiscoveryNotesModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (notes: CanonicalDiscoveryNotes) => void;
    isSaving: boolean;
    referenceQuestions?: string;
    /** EXEC-19: When true, system is in append mode (discovery already ingested) */
    appendMode?: boolean;
    /** EXEC-27: tenantId used to fetch discovery log history */
    tenantId?: string;
}

// EXEC-24: Canonical-aligned dropdown option sets
// One per canonical discovery section — no parallel structure
const REALITY_TYPE_OPTIONS = [
    'Founder-led with no process layer',
    'Growth plateau — revenue stalled',
    'Post-acquisition integration',
    'Operational chaos despite revenue',
    'Scaling from proven model',
    'Turnaround / distressed',
    'Steady-state optimization',
    'Other'
];

const FRICTION_CATEGORY_OPTIONS = [
    'Sales pipeline fragmentation',
    'Manual / paper-based workflows',
    'Leadership bandwidth bottleneck',
    'Systems not integrated',
    'Hiring / retention drag',
    'Financial visibility gaps',
    'Unclear ownership / accountability',
    'Customer delivery inconsistency',
    'Other'
];

const FUTURE_ORIENTATION_OPTIONS = [
    'Operational reliability',
    'Revenue growth',
    'Team scalability',
    'Exit / acquisition readiness',
    'Geographic / market expansion',
    'Product / service diversification',
    'Cost reduction',
    'Other'
];

const SYSTEM_MATURITY_OPTIONS = [
    'Pre-digital (spreadsheets / paper)',
    'Basic tools — no integration',
    'Partially integrated stack',
    'Mature stack — underutilized',
    'Modern stack — well-integrated',
    'Unknown'
];

const CONSTRAINT_TYPE_OPTIONS = [
    'Capital / cash flow',
    'Time / bandwidth',
    'Team skill gaps',
    'Regulatory / compliance',
    'Market / demand',
    'Technology debt',
    'None stated'
];

const EMPTY_NOTES: CanonicalDiscoveryNotes = {
    sessionMetadata: {
        date: new Date().toISOString().split('T')[0],
        attendees: '',
        firmName: '',
        duration: ''
    },
    currentBusinessReality: '',
    primaryFrictionPoints: '',
    desiredFutureState: '',
    technicalOperationalEnvironment: '',
    explicitClientConstraints: 'None stated'
};

/** Compact inline select — renders as a subtle hint above a canonical textarea */
function CanonicalHint({
    label,
    value,
    options,
    onChange
}: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-slate-600 font-mono uppercase shrink-0">{label}:</span>
            <select
                value={value}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
                className="bg-transparent border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-400 focus:outline-none focus:border-indigo-500/50 cursor-pointer max-w-xs"
            >
                <option value="">— optional hint —</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}

// EXEC-27: shape for log entries returned by GET /discovery-notes/log
interface DiscoveryLogEntry {
    id: string;
    source: string;
    delta: string;
    createdAt: string;
    createdByUserId?: string | null;
}

export function DiscoveryNotesModal({ open, onClose, onSave, isSaving, referenceQuestions, appendMode, tenantId }: DiscoveryNotesModalProps) {
    const [notes, setNotes] = useState<CanonicalDiscoveryNotes>(EMPTY_NOTES);
    const [rawNotesBlob, setRawNotesBlob] = useState('');
    const [showReference, setShowReference] = useState(true);

    // EXEC-24: One structured hint per canonical section — all optional, default empty
    const [realityType, setRealityType] = useState('');
    const [frictionCategory, setFrictionCategory] = useState('');
    const [futureOrientation, setFutureOrientation] = useState('');
    const [systemMaturity, setSystemMaturity] = useState('');
    const [constraintType, setConstraintType] = useState('');

    // EXEC-27: discovery history panel state
    const [logEntries, setLogEntries] = useState<DiscoveryLogEntry[]>([]);
    const [logLoading, setLogLoading] = useState(false);
    const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

    // EXEC-27: Persistent Question Checkboxes
    const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});

    // Load persisted checkbox state on open
    useEffect(() => {
        if (!open || !tenantId) return;
        try {
            const saved = localStorage.getItem(`discovery_checks_${tenantId}`);
            if (saved) {
                setCheckedQuestions(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load discovery checks', e);
        }
    }, [open, tenantId]);

    const toggleQuestion = (questionId: string) => {
        setCheckedQuestions(prev => {
            const next = { ...prev, [questionId]: !prev[questionId] };
            if (tenantId) {
                localStorage.setItem(`discovery_checks_${tenantId}`, JSON.stringify(next));
            }
            return next;
        });
    };

    // Fetch log on open — only when tenantId is present
    useEffect(() => {
        if (!open || !tenantId) return;
        let cancelled = false;
        setLogLoading(true);
        superadminApi.getDiscoveryNotesLog(tenantId)
            .then(data => {
                if (!cancelled) setLogEntries(data.entries ?? []);
            })
            .catch(err => {
                console.error('[Discovery History] Failed to fetch:', err);
                if (!cancelled) setLogEntries([]);
            })
            .finally(() => { if (!cancelled) setLogLoading(false); });
        return () => { cancelled = true; };
    }, [open, tenantId]);

    if (!open) return null;

    const handleSave = () => {
        if (!rawNotesBlob.trim()) {
            alert('Please paste discovery notes or transcripts before ingesting.');
            return;
        }

        // Build optional hint block from selected values
        const hintLines: string[] = [];
        if (realityType) hintLines.push(`- **Business Reality:** ${realityType}`);
        if (frictionCategory) hintLines.push(`- **Friction Category:** ${frictionCategory}`);
        if (futureOrientation) hintLines.push(`- **Future Orientation:** ${futureOrientation}`);
        if (systemMaturity) hintLines.push(`- **System Maturity:** ${systemMaturity}`);
        if (constraintType) hintLines.push(`- **Constraint Type:** ${constraintType}`);

        const hintBlock = hintLines.length > 0
            ? `### Context Hints\n${hintLines.join('\n')}\n\n---\n\n`
            : '';

        // Append mode: inject hint block into the delta before the raw notes
        // Ingest mode: hints flow via structuredMeta only
        const finalNotes = appendMode && hintBlock
            ? `${hintBlock}${rawNotesBlob}`
            : rawNotesBlob;

        const rawPayload = {
            sessionDate: notes.sessionMetadata.date,
            durationMinutes: notes.sessionMetadata.duration,
            attendees: notes.sessionMetadata.attendees,
            rawNotes: finalNotes,
            // structuredMeta omitted entirely if all canonical hints are blank
            ...(realityType || frictionCategory || futureOrientation || systemMaturity || constraintType
                ? {
                    structuredMeta: {
                        ...(realityType && { realityType }),
                        ...(frictionCategory && { frictionCategory }),
                        ...(futureOrientation && { futureOrientation }),
                        ...(systemMaturity && { systemMaturity }),
                        ...(constraintType && { constraintType }),
                    }
                }
                : {}),
        };

        // We use 'as any' here to bypass the strict CanonicalDiscoveryNotes type
        // The backend has been updated to accept this RAW shape (Option 1).
        onSave(rawPayload as any);
    };

    const updateMetadata = (field: keyof CanonicalDiscoveryNotes['sessionMetadata'], value: string) => {
        setNotes(prev => ({
            ...prev,
            sessionMetadata: { ...prev.sessionMetadata, [field]: value }
        }));
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={onClose}
        >
            <div
                className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full flex my-8 transition-all duration-300 ${showReference && referenceQuestions ? 'max-w-7xl' : 'max-w-4xl'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Reference Column */}
                {showReference && referenceQuestions && (
                    <div className="w-1/3 border-r border-slate-800 bg-slate-950/50 flex flex-col rounded-l-xl">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase text-slate-400">REFERENCE ONLY — DO NOT ANSWER HERE</h3>
                            <button
                                onClick={() => setShowReference(false)}
                                className="text-[10px] text-slate-600 hover:text-slate-400 font-bold uppercase"
                            >
                                Hide
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden max-h-[75vh]">
                            {/* Top Half: Reference Questions */}
                            <div className="flex-1 overflow-y-auto p-6 min-h-0 border-b border-slate-800">
                                <h4 className="text-xs font-bold text-slate-300 mb-4 uppercase tracking-wider">Discovery Call Questions</h4>
                                <div className="flex flex-col gap-2">
                                    {referenceQuestions
                                        ? referenceQuestions.split('\n').filter(q => q.trim().length > 0).map((q, idx) => {
                                            const questionId = `q_${idx}`;
                                            const isChecked = checkedQuestions[questionId] || false;
                                            // strip markdown bullets
                                            const cleanText = q.replace(/^-\s*/, '').trim();
                                            return (
                                                <div
                                                    key={questionId}
                                                    onClick={() => toggleQuestion(questionId)}
                                                    className={`
                                                        flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
                                                        ${isChecked
                                                            ? 'bg-emerald-950/20 border-emerald-900/40 opacity-70'
                                                            : 'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/40 hover:border-slate-700/50'
                                                        }
                                                    `}
                                                >
                                                    <div className={`
                                                        shrink-0 mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center border transition-colors
                                                        ${isChecked
                                                            ? 'bg-emerald-600 border-emerald-500 text-white'
                                                            : 'bg-slate-950 border-slate-700 text-transparent'
                                                        }
                                                    `}>
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <p className={`text-xs font-mono leading-relaxed ${isChecked ? 'text-emerald-400/80 line-through' : 'text-slate-400'}`}>
                                                        {cleanText}
                                                    </p>
                                                </div>
                                            );
                                        })
                                        : <p className="text-xs font-mono text-slate-600 italic">No reference questions provided</p>
                                    }
                                </div>
                            </div>

                            {/* Bottom Half: History Panel */}
                            {(logEntries.length > 0 || logLoading) && (
                                <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80">
                                    <div className="px-6 pt-4 pb-2 flex items-center justify-between shrink-0">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Previous Discovery Entries</span>
                                        {logLoading && (
                                            <span className="text-[9px] text-slate-600 font-mono animate-pulse">Loading…</span>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-2 min-h-0">
                                        {logEntries.map(entry => {
                                            const isExpanded = expandedEntryId === entry.id;
                                            const dt = new Date(entry.createdAt);
                                            const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                            const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                            const hintMatch = entry.delta.match(/### Context Hints\n([\s\S]*?)(?:\n\n---|$)/);
                                            const hintLines = hintMatch
                                                ? hintMatch[1].split('\n')
                                                    .filter(l => l.trim().startsWith('- '))
                                                    .map(l => l.replace(/^- \*\*(.*?)\*\*(?::)? (.*)/, '$1: $2').trim())
                                                : [];
                                            const previewText = entry.delta.replace(/### Context Hints[\s\S]*?\n\n---\n\n/, '').trim();
                                            const preview = previewText.length > 120 ? previewText.slice(0, 120) + '…' : previewText;
                                            return (
                                                <div
                                                    key={entry.id}
                                                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-slate-700 transition-colors"
                                                    onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5 border-b border-slate-800/50 pb-1.5">
                                                                <span className="text-[10px] font-mono text-slate-500">{dateStr}</span>
                                                                <span className="text-[10px] font-mono text-slate-600">{timeStr}</span>
                                                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700 ml-auto">
                                                                    {entry.source}
                                                                </span>
                                                            </div>
                                                            {hintLines.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mb-1.5">
                                                                    {hintLines.map((h, i) => (
                                                                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 font-mono leading-none">
                                                                            {h}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {!isExpanded && (
                                                                <p className="text-[10px] text-slate-500 font-mono leading-relaxed line-clamp-2">{preview}</p>
                                                            )}
                                                            {isExpanded && (
                                                                <pre className="text-[10px] text-slate-400 font-mono leading-relaxed whitespace-pre-wrap bg-slate-950 rounded p-2 mt-1 border border-slate-800/60">{entry.delta}</pre>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-600 shrink-0 pt-0.5">{isExpanded ? '▲' : '▼'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 rounded-t-xl">
                        <div className="flex items-center gap-4">
                            {!showReference && referenceQuestions && (
                                <button
                                    onClick={() => setShowReference(true)}
                                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded border border-slate-700 uppercase tracking-wider"
                                >
                                    Show Reference
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-slate-100 uppercase tracking-tight">INGEST DISCOVERY CALL NOTES (RAW)</h2>
                                <p className="text-[11px] text-slate-500 mt-1 font-medium tracking-wide uppercase">Raw Truth Capture — No Interpretation Required</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-300 transition-colors text-3xl font-light leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    {/* EXEC-19: Append Mode Banner */}
                    {appendMode && (
                        <div className="mx-6 mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-[12px] text-amber-300">
                            <span className="font-semibold">APPEND ONLY</span> — Existing discovery captured.
                            New entries will be timestamped and cumulative.
                        </div>
                    )}

                    {/* Body — two-column layout: metadata left 1/3, capture right 2/3 */}
                    <div className="flex flex-row gap-0 bg-slate-900 text-sm flex-1 min-h-0 overflow-hidden">

                        {/* LEFT COLUMN — 1/3: Session Metadata (stacked fields) */}
                        <div className="w-1/3 shrink-0 border-r border-slate-800 p-6 flex flex-col gap-5 overflow-y-auto">
                            <h3 className="text-xs font-bold uppercase text-indigo-400">1. Session Metadata</h3>
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 text-xs"
                                    value={notes.sessionMetadata.date}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateMetadata('date', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Duration</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 60 min"
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 text-xs"
                                    value={notes.sessionMetadata.duration}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateMetadata('duration', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Attendees</label>
                                <input
                                    type="text"
                                    placeholder="Client names, roles..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 text-xs"
                                    value={notes.sessionMetadata.attendees}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateMetadata('attendees', e.target.value)}
                                />
                            </div>

                            {/* EXEC-24: Canonical section hints — compact, stacked in left column */}
                            <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-800/60">
                                <span className="text-[9px] font-bold uppercase text-slate-600 tracking-widest mb-1">Optional Context Hints</span>
                                <CanonicalHint label="Business Reality" value={realityType} options={REALITY_TYPE_OPTIONS} onChange={setRealityType} />
                                <CanonicalHint label="Friction Category" value={frictionCategory} options={FRICTION_CATEGORY_OPTIONS} onChange={setFrictionCategory} />
                                <CanonicalHint label="Future Orientation" value={futureOrientation} options={FUTURE_ORIENTATION_OPTIONS} onChange={setFutureOrientation} />
                                <CanonicalHint label="System Maturity" value={systemMaturity} options={SYSTEM_MATURITY_OPTIONS} onChange={setSystemMaturity} />
                                <CanonicalHint label="Constraint Type" value={constraintType} options={CONSTRAINT_TYPE_OPTIONS} onChange={setConstraintType} />
                            </div>
                        </div>

                        {/* RIGHT COLUMN — 2/3: Raw Discovery Context */}
                        <div className="flex-1 flex flex-col min-h-0 p-6 gap-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase text-indigo-400 block">2. Raw Discovery Context (Notes &amp; Transcripts)</label>
                                <span className="text-[10px] text-slate-500 font-mono uppercase">Single Capture Field</span>
                            </div>
                            <p className="text-[10px] text-slate-500">Paste everything here: call transcripts, verbatim pain statements, technical details, and stated goals. Structure is not required.</p>

                            <textarea
                                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-5 text-slate-300 text-xs focus:ring-1 focus:ring-indigo-500/50 font-mono leading-relaxed resize-none min-h-64"
                                placeholder="Paste transcripts or long-form notes here..."
                                value={rawNotesBlob}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRawNotesBlob(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* History panel moved to left column */}

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950 rounded-b-xl">
                        <div className="text-[10px] text-slate-600 font-mono italic">
                            * Raw capture is used as context for Stage 5 Assisted Synthesis.
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-6 py-2.5 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3 border border-indigo-400/20"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Capturing Raw Truth...
                                    </>
                                ) : (
                                    appendMode ? 'Append Notes' : 'Ingest Raw Notes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
