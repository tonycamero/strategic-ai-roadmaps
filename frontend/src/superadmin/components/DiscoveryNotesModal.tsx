import { useState, ChangeEvent } from 'react';
import { type CanonicalDiscoveryNotes } from '@roadmap/shared';

interface DiscoveryNotesModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (notes: CanonicalDiscoveryNotes) => void;
    isSaving: boolean;
    referenceQuestions?: string;
}

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

export function DiscoveryNotesModal({ open, onClose, onSave, isSaving, referenceQuestions }: DiscoveryNotesModalProps) {
    const [notes, setNotes] = useState<CanonicalDiscoveryNotes>(EMPTY_NOTES);
    const [rawNotesBlob, setRawNotesBlob] = useState('');
    const [showReference, setShowReference] = useState(true);

    if (!open) return null;

    const handleSave = () => {
        // Validation: Just ensure something was pasted
        if (!rawNotesBlob.trim()) {
            alert('Please paste discovery notes or transcripts before ingesting.');
            return;
        }

        const rawPayload = {
            sessionDate: notes.sessionMetadata.date,
            durationMinutes: notes.sessionMetadata.duration,
            attendees: notes.sessionMetadata.attendees,
            rawNotes: rawNotesBlob
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
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="prose prose-invert prose-slate prose-xs max-w-none">
                                <h4 className="text-xs font-bold text-slate-300 mb-2">Discovery Call Questions</h4>
                                <div className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
                                    {referenceQuestions}
                                </div>
                            </div>
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

                    {/* Body */}
                    <div className="p-8 bg-slate-900 flex flex-col gap-8 text-sm h-full">
                        {/* Session Metadata Row */}
                        <div className="flex gap-6 p-4 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                            <div className="shrink-0 flex flex-col justify-center">
                                <h3 className="text-xs font-bold uppercase text-indigo-400">1. Session Metadata</h3>
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs"
                                        value={notes.sessionMetadata.date}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateMetadata('date', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Duration</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 60 min"
                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs"
                                        value={notes.sessionMetadata.duration}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateMetadata('duration', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">Attendees</label>
                                    <input
                                        type="text"
                                        placeholder="Client names, roles..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 text-xs"
                                        value={notes.sessionMetadata.attendees}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateMetadata('attendees', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Single Massive Text Field */}
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold uppercase text-indigo-400 block">2. Raw Discovery Context (Notes & Transcripts)</label>
                                <span className="text-[10px] text-slate-500 font-mono uppercase">Single Capture Field</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mb-3">Paste everything here: call transcripts, verbatim pain statements, technical details, and stated goals. Structure is not required.</p>
                            <textarea
                                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-5 text-slate-300 text-xs focus:ring-1 focus:ring-indigo-500/50 font-mono leading-relaxed resize-none"
                                placeholder="Paste transcripts or long-form notes here..."
                                value={rawNotesBlob}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRawNotesBlob(e.target.value)}
                            />
                        </div>
                    </div>

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
                                    'Ingest Raw Notes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
