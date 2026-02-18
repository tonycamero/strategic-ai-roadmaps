// frontend/src/superadmin/components/AssistedSynthesisModal.tsx

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { superadminApi } from '../api';
import AssistedSynthesisAgentConsole from './AssistedSynthesisAgentConsole';

interface ProposedFindingItem {
    id: string;
    type: 'CurrentFact' | 'FrictionPoint' | 'Goal' | 'Constraint';
    text: string;
    anchors: Array<{
        source: 'RAW_NOTES' | 'INTAKE' | 'DISCOVERY_QA' | 'DIAGNOSTIC' | 'EXEC_BRIEF';
        speaker?: string;
        quote: string;
    }>;
    status: 'pending' | 'accepted' | 'rejected';
    editedText?: string;
    operatorNote?: string;
    mechanical_effect?: string;
    operational_effect?: string;
    economic_vector?: string;
    archetype_selected?: string;
    runners_up_archetypes?: string[];
    deciding_signal?: string;
    confidence?: 'LOW' | 'MED' | 'HIGH';
}

interface AssistedSynthesisModalProps {
    open: boolean;
    onClose: () => void;
    tenantId: string;
    artifacts: {
        discoveryNotes?: any;
        diagnostic?: any;
        executiveBrief?: any;
    };
    teamMemberIntakes?: any[];
    onRefresh?: () => void;
}

export function AssistedSynthesisModal({ open, onClose, tenantId, artifacts, teamMemberIntakes = [], onRefresh }: AssistedSynthesisModalProps) {
    const [proposals, setProposals] = useState<ProposedFindingItem[]>([]);
    const [requiresGeneration, setRequiresGeneration] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeSourceTab, setActiveSourceTab] = useState<'notes' | 'diagnostic' | 'brief' | 'qa' | 'intakes'>('notes');
    const [isSaving, setIsSaving] = useState(false);
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
    const [error, setError] = useState<{ code: string; message: string; requestId?: string } | null>(null);
    const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (open) {
            loadProposedFindings();
            setError(null); // Clear errors on modal open
        }
    }, [open, tenantId]);

    const loadProposedFindings = async () => {
        try {
            // ENABLED: Feature active
            const data = await superadminApi.getProposedFindings(tenantId);
            setProposals(deduplicateProposals(data.items || []));
            setRequiresGeneration(data.requiresGeneration);
        } catch (err) {
            console.error('Failed to load proposed findings:', err);
            setRequiresGeneration(true);
        }
    };

    const deduplicateProposals = (items: ProposedFindingItem[]) => {
        const seen = new Set<string>();
        return items.filter(item => {
            const normalizedText = item.text.trim().toLowerCase();
            if (seen.has(normalizedText)) return false;
            seen.add(normalizedText);
            return true;
        });
    };

    const safeMarkdown = (content: any): string => {
        if (!content) return '';
        if (typeof content === 'string') return content;
        if (content.markdown) return content.markdown;
        if (content.content) return content.content;
        if (content.list && Array.isArray(content.list)) return content.list.join('\n\n');
        if (Array.isArray(content)) return content.join('\n\n');
        return JSON.stringify(content, null, 2);
    };

    const handleGenerateProposals = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            // ENABLED: Feature active
            const data = await superadminApi.generateAssistedProposals(tenantId);
            setProposals(deduplicateProposals(data.items || []));
            setRequiresGeneration(false);
        } catch (err: any) {
            console.error('Failed to generate proposals:', err);

            // PHASE 3: Parse and display structured error
            const errorData = err.response?.data || {};
            setError({
                code: errorData.code || 'FEATURE_DISABLED',
                message: err.message || 'Failed to generate proposals. See console for details.',
                requestId: errorData.requestId
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAccept = (id: string) => {
        setProposals((prev: ProposedFindingItem[]) => prev.map(p => p.id === id ? { ...p, status: 'accepted' as const } : p));
    };

    const handleReject = (id: string) => {
        setProposals((prev: ProposedFindingItem[]) => prev.map(p => p.id === id ? { ...p, status: 'rejected' as const } : p));
    };

    const handleEdit = (id: string, newText: string) => {
        setProposals((prev: ProposedFindingItem[]) => prev.map(p => p.id === id ? { ...p, editedText: newText } : p));
    };

    const handleAddProposal = (type: ProposedFindingItem['type'], initialData?: Partial<ProposedFindingItem>) => {
        const newProposal: ProposedFindingItem = {
            id: `human-${Date.now()}`,
            type,
            text: '',
            anchors: [],
            status: 'pending',
            operatorNote: 'Human Added (Pre-Canonical)',
            ...initialData
        };
        setProposals((prev: ProposedFindingItem[]) => [...prev, newProposal]);
    };

    const handleDeclareCanon = async () => {
        setIsSaving(true);
        try {
            // ENABLED: Feature active
            await superadminApi.declareCanonicalFindings(tenantId, (proposals || []).filter(p => p.status === 'accepted').map(p => ({
                ...p,
                // Ensure legacy archetypes are mapped to the new field if needed during declaration
                archetype_selected: p.archetype_selected || (p as any).archetype
            })));
            await onRefresh?.();

            onClose();
        } catch (err) {
            console.error('Failed to declare canonical findings:', err);
            alert('Failed to declare findings. Feature disabled.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleCluster = (archetype: string) => {
        setExpandedClusters((prev: Record<string, boolean>) => ({ ...prev, [archetype]: !prev[archetype] }));
    };

    const scrollToSource = (source: string) => {
        const mapping: Record<string, string> = {
            'INTAKE': 'intakes',
            'TEAM_MEMBER_INTAKE': 'intakes',
            'RAW_NOTES': 'notes',
            'DISCOVERY_NOTES': 'notes',
            'EXEC_BRIEF': 'brief',
            'DIAGNOSTIC': 'diagnostic'
        };
        const targetTab = mapping[source.toUpperCase()] || 'notes';
        setActiveSourceTab(targetTab as any);
    };

    const handleExportData = () => {
        const exportData = {
            metadata: {
                tenantId,
                timestamp: new Date().toISOString(),
                exportedBy: 'AssistedSynthesisModal'
            },
            proposals,
            artifacts,
            sessionStats: {
                total: proposals.length,
                pending: proposals.filter((p: ProposedFindingItem) => p.status === 'pending').length,
                accepted: proposals.filter((p: ProposedFindingItem) => p.status === 'accepted').length,
                rejected: proposals.filter((p: ProposedFindingItem) => p.status === 'rejected').length
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `synthesis-export-${tenantId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!open) return null;

    const pendingCount = proposals.filter((p: ProposedFindingItem) => p.status === 'pending').length;
    const acceptedCount = proposals.filter((p: ProposedFindingItem) => p.status === 'accepted').length;
    const rejectedCount = proposals.filter((p: ProposedFindingItem) => p.status === 'rejected').length;
    const allResolved = proposals.length > 0 && pendingCount === 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            Stage 5: Assisted Synthesis
                        </h2>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Pre-Canonical Workspace // Authority Mode</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-3xl font-light">
                        &times;
                    </button>
                </div>

                {/* Governance Microcopy (Non-Dismissable) */}
                <div className="px-8 py-3 bg-amber-900/10 border-b border-amber-500/20">
                    <p className="text-xs text-amber-200 font-bold flex items-center gap-2">
                        <span>⚠️</span>
                        These are agent-generated proposals. Source truth is shown on the right. Nothing here becomes canonical until you explicitly declare it.
                    </p>
                </div>

                {/* Error Banner (PHASE 3) */}
                {error && (
                    <div className="px-8 py-4 bg-red-900/20 border-b border-red-500/30">
                        <div className="flex items-start gap-3">
                            <span className="text-red-400 text-xl">⚠</span>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-red-300 mb-1">Proposal Generation Failed</h4>
                                <p className="text-xs text-red-200/80 mb-2">{error.message}</p>
                                <div className="flex items-center gap-4 text-[10px] text-red-300/60">
                                    <span className="font-mono">Code: {error.code}</span>
                                    {error.requestId && <span className="font-mono">Request ID: {error.requestId}</span>}
                                </div>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-400 hover:text-red-200 text-lg font-bold transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex overflow-hidden">

                    {/* Pane 1: Authority Controls (20%) */}
                    <div className="w-1/5 border-r border-slate-800 bg-slate-950/40 p-6 flex flex-col">
                        <div className="flex-1 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Readiness Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                        <span className="text-xs text-slate-400">Total Proposals</span>
                                        <span className="text-sm font-bold text-white">{proposals.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                        <span className="text-xs text-slate-400">Accepted</span>
                                        <span className="text-sm font-bold text-emerald-400">{acceptedCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                        <span className="text-xs text-slate-400">Rejected</span>
                                        <span className="text-sm font-bold text-red-400">{rejectedCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                        <span className="text-xs text-slate-400">Pending</span>
                                        <span className="text-sm font-bold text-amber-400">{pendingCount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">⚠️</span>
                                    <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Invariants</h4>
                                </div>
                                <ul className="text-[10px] text-amber-200/60 font-medium space-y-2 list-disc pl-4">
                                    <li>Verbatim grounding required</li>
                                    <li>No solution language</li>
                                    <li>Explicit source anchoring</li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800 space-y-3">
                            <button
                                onClick={handleDeclareCanon}
                                disabled={!allResolved || isSaving}
                                className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 ${allResolved && !isSaving
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 hover:bg-indigo-500'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                    }`}
                            >
                                {isSaving ? 'Declaring...' : 'Declare Canonical Findings'}
                            </button>
                            {!allResolved && proposals.length > 0 && (
                                <p className="text-[9px] text-amber-500 text-center uppercase font-bold tracking-tighter">
                                    🔒 LOCKED: {pendingCount} pending resolution{pendingCount !== 1 ? 's' : ''}
                                </p>
                            )}
                            {allResolved && (
                                <p className="text-[9px] text-emerald-500 text-center uppercase font-bold tracking-tighter">
                                    ✓ READY FOR CANON DECLARATION
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Pane 2: Proposed Findings (40%) */}
                    <div className="w-2/5 border-r border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Proposed Findings (Draft)</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleExportData}
                                    className="text-[9px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-wider flex items-center gap-1 transition-colors"
                                    title="Export JSON"
                                >
                                    <span>⇩</span> JSON
                                </button>
                                {!requiresGeneration && proposals.length > 0 && (
                                    <button
                                        onClick={() => setShowRegenerateConfirm(true)}
                                        className="text-[9px] font-bold text-amber-400 uppercase hover:text-amber-300 transition-colors"
                                    >
                                        ↻ Regenerate
                                    </button>
                                )}
                            </div>
                        </div>

                        {requiresGeneration || proposals.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center p-12">
                                <div className="text-center space-y-6 max-w-md">
                                    <div className="w-16 h-16 mx-auto bg-indigo-900/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                                        <span className="text-3xl">🤖</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">No Proposals Generated Yet</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Click below to analyze all source artifacts and generate atomic, evidence-anchored findings.
                                            The agent will synthesize Current Facts, Friction Points, Goals, and Constraints.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleGenerateProposals}
                                        disabled={isGenerating}
                                        className="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <span className="inline-block animate-spin mr-2">⟳</span>
                                                Agent synthesizing from source artifacts...
                                            </>
                                        ) : (
                                            'Generate Agent Proposals'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
                                {(() => {
                                    // G2 Implementation: Mechanical clustering by Archetype
                                    const clusters = proposals.reduce((acc, p) => {
                                        const arch = p.archetype_selected || (p as any).archetype || 'UNCLASSIFIED';
                                        if (!acc[arch]) acc[arch] = [];
                                        acc[arch].push(p);
                                        return acc;
                                    }, {} as Record<string, ProposedFindingItem[]>);

                                    const sortedEntries = (Object.entries(clusters) as [string, ProposedFindingItem[]][]).sort(([a], [b]) => {
                                        if (a === 'UNCLASSIFIED') return 1;
                                        if (b === 'UNCLASSIFIED') return -1;
                                        return a.localeCompare(b);
                                    });

                                    return sortedEntries.map(([archetype, clusterItems]) => {
                                        const isExpanded = expandedClusters[archetype] !== false; // Default to expanded
                                        return (
                                            <div key={archetype} className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleCluster(archetype)}
                                                        className="flex items-center gap-3 hover:text-white transition-colors group/arch"
                                                    >
                                                        <span className={`text-[10px] transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                                                        <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 group-hover/arch:text-indigo-300">
                                                            {archetype === 'UNCLASSIFIED' ? 'Uncategorized Findings' : archetype}
                                                        </h4>
                                                    </button>
                                                    <div className="h-px flex-1 bg-slate-800" />
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{clusterItems.length} items</span>
                                                        <button
                                                            onClick={() => handleAddProposal('CurrentFact', { archetype })}
                                                            className="text-[9px] font-bold text-slate-500 hover:text-indigo-400 uppercase transition-colors"
                                                            title="Add human-authored proposal to this cluster"
                                                        >
                                                            + Add
                                                        </button>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="space-y-2">
                                                        {clusterItems.map((proposal: ProposedFindingItem) => (
                                                            <div
                                                                key={proposal.id}
                                                                className={`group relative p-3 rounded-lg border transition-all ${proposal.status === 'accepted' ? 'bg-emerald-900/5 border-emerald-500/30' :
                                                                    proposal.status === 'rejected' ? 'bg-red-900/5 border-red-500/20 opacity-50' :
                                                                        'bg-slate-950 border-slate-800'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${proposal.type === 'FrictionPoint' ? 'bg-red-900/20 text-red-400 border border-red-500/20' :
                                                                            proposal.type === 'Constraint' ? 'bg-amber-900/20 text-amber-400 border border-amber-500/20' :
                                                                                proposal.type === 'Goal' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/20' :
                                                                                    'bg-indigo-900/20 text-indigo-400 border border-indigo-500/20'
                                                                            }`}>
                                                                            {proposal.type}
                                                                        </span>
                                                                        {proposal.economic_vector && (
                                                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-900/20 text-purple-400 border border-purple-500/20">
                                                                                {proposal.economic_vector}
                                                                            </span>
                                                                        )}
                                                                        {!proposal.archetype_selected && !(proposal as any).archetype && (
                                                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-800 text-slate-500 border border-slate-700">
                                                                                LEGACY
                                                                            </span>
                                                                        )}
                                                                        {proposal.confidence && (
                                                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                                                                {proposal.confidence} CONFIDENCE
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleReject(proposal.id)}
                                                                            className={`px-2 py-0.5 rounded transition-all text-[10px] font-bold ${proposal.status === 'rejected' ? 'text-red-400 bg-red-900/20 border border-red-500/30' : 'text-slate-500 hover:text-red-400 hover:bg-red-950/50'}`}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleAccept(proposal.id)}
                                                                            className={`px-2 py-0.5 rounded transition-all text-[10px] font-bold ${proposal.status === 'accepted' ? 'text-emerald-400 bg-emerald-900/20 border border-emerald-500/30' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-950/50'}`}
                                                                        >
                                                                            ✓
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div
                                                                    contentEditable
                                                                    suppressContentEditableWarning
                                                                    onBlur={(e) => handleEdit(proposal.id, e.currentTarget.textContent || '')}
                                                                    className="text-sm text-slate-300 leading-snug mb-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 rounded px-1 py-0.5"
                                                                >
                                                                    {proposal.editedText !== undefined ? proposal.editedText : proposal.text}
                                                                </div>

                                                                {proposal.deciding_signal && (
                                                                    <div className="mb-3 p-2 bg-indigo-950/20 border border-indigo-500/10 rounded">
                                                                        <div className="text-[8px] font-black uppercase text-indigo-400/60 mb-1">Deciding Signal</div>
                                                                        <div className="text-[10px] text-indigo-200/80 italic leading-tight">{proposal.deciding_signal}</div>
                                                                    </div>
                                                                )}

                                                                {/* Cascade Block */}
                                                                {(proposal.mechanical_effect || proposal.operational_effect) && (
                                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                                        {proposal.mechanical_effect && (
                                                                            <div className="p-2 rounded bg-slate-900/50 border border-slate-800/50">
                                                                                <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Mechanical</div>
                                                                                <div className="text-[10px] text-slate-400 leading-tight">{proposal.mechanical_effect}</div>
                                                                            </div>
                                                                        )}
                                                                        {proposal.operational_effect && (
                                                                            <div className="p-2 rounded bg-slate-900/50 border border-slate-800/50">
                                                                                <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Operational</div>
                                                                                <div className="text-[10px] text-slate-400 leading-tight">{proposal.operational_effect}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Runners Up Block (G3) */}
                                                                {proposal.runners_up_archetypes && proposal.runners_up_archetypes.length > 0 && (
                                                                    <div className="mb-3 flex items-center gap-2">
                                                                        <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Rotated:</span>
                                                                        <div className="flex gap-1">
                                                                            {proposal.runners_up_archetypes.map((arch, idx) => (
                                                                                <span key={idx} className="text-[8px] font-bold text-slate-400 bg-slate-900 px-1 rounded border border-slate-800">
                                                                                    {arch}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {proposal.anchors && proposal.anchors.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {proposal.anchors.map((anchor, idx) => (
                                                                            <button
                                                                                key={idx}
                                                                                onClick={() => scrollToSource(anchor.source)}
                                                                                className="group/ref px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all cursor-pointer truncate max-w-[150px]"
                                                                                title={anchor.quote}
                                                                            >
                                                                                <span className="font-black uppercase mr-1">{anchor.source}</span>
                                                                                <span className="opacity-50 italic">"{anchor.quote.substring(0, 20)}..."</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {/* Fallback for legacy evidenceRefs */}
                                                                {(!proposal.anchors || proposal.anchors.length === 0) && (proposal as any).evidenceRefs && (proposal as any).evidenceRefs.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {((proposal as any).evidenceRefs as any[]).map((ref, idx) => (
                                                                            <button
                                                                                key={idx}
                                                                                onClick={() => scrollToSource(ref.artifact)}
                                                                                className="group/ref px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-400/50 hover:text-indigo-400 hover:border-indigo-500/50 transition-all cursor-pointer truncate max-w-[150px]"
                                                                                title={ref.quote}
                                                                            >
                                                                                <span className="font-black uppercase mr-1">LEGACY: {ref.artifact}</span>
                                                                                <span className="opacity-50 italic">"{ref.quote.substring(0, 20)}..."</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Pane 3: Source Artifacts (40%) */}
                    <div className="w-2/5 bg-slate-950 flex flex-col overflow-hidden relative">
                        <div className="px-6 pt-4 border-b border-slate-800 bg-slate-900/30">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Source Artifacts (Read-Only Truth)</h3>
                            <div className="flex gap-1">
                                {[
                                    { id: 'notes', label: 'Raw Notes' },
                                    { id: 'intakes', label: 'Intakes' },
                                    { id: 'diagnostic', label: 'Diagnostic' },
                                    { id: 'brief', label: 'Exec Brief' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSourceTab(tab.id as any)}
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeSourceTab === tab.id
                                            ? 'text-indigo-400 border-b-2 border-indigo-500'
                                            : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800">
                            {activeSourceTab === 'notes' && (
                                <div className="space-y-6 text-sm text-slate-300 leading-relaxed break-words">
                                    {(() => {
                                        const notesRaw = artifacts.discoveryNotes;
                                        if (!notesRaw) return <div className="italic text-slate-500 text-center py-20 uppercase tracking-widest text-[10px] font-black opacity-30">No Raw Notes Available</div>;

                                        try {
                                            const parsed = typeof notesRaw === 'string' ? JSON.parse(notesRaw) : notesRaw;
                                            const narrative = parsed.currentBusinessReality || parsed.notes || (typeof parsed === 'string' ? parsed : null);

                                            return (
                                                <div className="space-y-6">
                                                    {parsed.sessionMetadata && (
                                                        <div className="flex justify-between items-center text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800/50">
                                                            <span>Date: {parsed.sessionMetadata.date || 'Unknown'}</span>
                                                            <span>{parsed.sessionMetadata.firmName || 'Project Discovery'}</span>
                                                        </div>
                                                    )}

                                                    {narrative ? (
                                                        <div className="prose prose-invert prose-sm max-w-none">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {safeMarkdown(narrative)}
                                                            </ReactMarkdown>
                                                        </div>
                                                    ) : (
                                                        <div className="font-mono text-xs whitespace-pre-wrap opacity-50 bg-slate-900/20 p-4 rounded-lg border border-slate-800/30">
                                                            {JSON.stringify(parsed, null, 2)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } catch (e) {
                                            // Fallback for non-JSON strings or malformed JSON
                                            return (
                                                <div className="prose prose-invert prose-sm max-w-none">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {typeof notesRaw === 'string' ? notesRaw : JSON.stringify(notesRaw, null, 2)}
                                                    </ReactMarkdown>
                                                </div>
                                            );
                                        }
                                    })()}
                                </div>
                            )}
                            {activeSourceTab === 'diagnostic' && (
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">1. Strategic Overview</h4>
                                        <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800/50 text-sm text-slate-400">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {safeMarkdown(artifacts.diagnostic?.outputs?.overview || 'No Overview')}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">2. AI Opportunities</h4>
                                        <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800/50 text-sm text-slate-400">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {safeMarkdown(artifacts.diagnostic?.outputs?.aiOpportunities || 'No AI Opportunities')}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-amber-400 text-xs font-black uppercase tracking-widest mb-4">3. Roadmap Skeleton</h4>
                                        <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800/50 text-sm text-slate-400">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {safeMarkdown(artifacts.diagnostic?.outputs?.roadmapSkeleton || 'No Roadmap Skeleton')}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-purple-400 text-xs font-black uppercase tracking-widest mb-4">4. Discovery Questions</h4>
                                        <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800/50 text-sm text-slate-400">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {safeMarkdown(artifacts.diagnostic?.outputs?.discoveryQuestions || 'No Discovery Questions')}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeSourceTab === 'brief' && (
                                <div className="space-y-6">
                                    {artifacts.executiveBrief?.synthesis?.executiveSummary && (
                                        <div>
                                            <h4 className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">1. Executive Summary</h4>
                                            <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800/50 text-sm text-slate-400">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {safeMarkdown(artifacts.executiveBrief.synthesis.executiveSummary)}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {artifacts.executiveBrief?.synthesis?.operatingReality && (
                                        <div>
                                            <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4">2. Operating Reality</h4>
                                            <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800/50 text-sm text-slate-400">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {safeMarkdown(artifacts.executiveBrief.synthesis.operatingReality)}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {artifacts.executiveBrief?.synthesis?.constraintLandscape && (
                                        <div>
                                            <h4 className="text-amber-400 text-xs font-black uppercase tracking-widest mb-4">3. Constraint Landscape</h4>
                                            <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800/50 text-sm text-slate-400">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {safeMarkdown(artifacts.executiveBrief.synthesis.constraintLandscape)}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {artifacts.executiveBrief?.synthesis?.blindSpotRisks && (
                                        <div>
                                            <h4 className="text-red-400 text-xs font-black uppercase tracking-widest mb-4">4. Blind Spot Risks</h4>
                                            <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800/50 text-sm text-slate-400">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {safeMarkdown(artifacts.executiveBrief.synthesis.blindSpotRisks)}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                    {artifacts.executiveBrief?.synthesis?.alignmentSignals && (
                                        <div>
                                            <h4 className="text-cyan-400 text-xs font-black uppercase tracking-widest mb-4">5. Alignment Signals</h4>
                                            <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-800/50 text-sm text-slate-400">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {safeMarkdown(artifacts.executiveBrief.synthesis.alignmentSignals)}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeSourceTab === 'intakes' && (
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 px-1">Raw Stakeholder Intakes</h4>
                                    {teamMemberIntakes && teamMemberIntakes.length > 0 ? (
                                        <div className="space-y-4">
                                            {teamMemberIntakes.map((intake, idx) => (
                                                <div key={idx} className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/50 space-y-3">
                                                    <div className="flex justify-between items-center bg-slate-950/50 -mx-5 -mt-5 px-5 py-2 border-b border-slate-800/50 rounded-t-xl mb-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Respondent: {intake.userName || intake.respondentName || 'Unknown'}</span>
                                                        <span className="text-[9px] text-slate-500 font-mono uppercase">{new Date(intake.completedAt || intake.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    {intake.answers && typeof intake.answers === 'object' && Object.entries(intake.answers).map(([key, value]: [string, any], vIdx: number) => (
                                                        <div key={vIdx} className="space-y-1">
                                                            <div className="text-[9px] font-black uppercase text-slate-500 tracking-tighter opacity-80">{key.replace(/_/g, ' ')}</div>
                                                            <div className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-slate-800 pl-3">
                                                                "{typeof value === 'string' ? value : JSON.stringify(value)}"
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="italic text-slate-500 text-center py-20 uppercase tracking-widest text-[10px] font-black opacity-30">
                                            No Intake Data Found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Agent Console (Pinned to bottom of Right Pane) */}
                        <div className="border-t border-slate-800 bg-slate-950/80 p-4">
                            <AssistedSynthesisAgentConsole
                                tenantId={tenantId}
                                currentFactsPending={proposals.filter(p => p.type === 'CurrentFact' && p.status === 'pending').length}
                                // Stable version: only resets when proposals are regenerated/updated
                                contextVersion={artifacts?.diagnostic?.id || 'default'}
                                onAddProposal={(p) => handleAddProposal(p.type, p)}
                            />
                        </div>
                    </div>
                </div>

                {/* Regenerate Confirm Modal */}
                {showRegenerateConfirm && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-8 max-w-md">
                            <h3 className="text-lg font-bold text-white mb-4">Regenerate Proposals?</h3>
                            <p className="text-sm text-slate-300 mb-6">
                                This will archive the current proposals and generate new ones. All pending resolutions will be lost.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRegenerateConfirm(false);
                                        handleGenerateProposals();
                                    }}
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white text-xs font-bold uppercase rounded hover:bg-amber-500 transition-colors"
                                >
                                    Confirm Regenerate
                                </button>
                                <button
                                    onClick={() => setShowRegenerateConfirm(false)}
                                    className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold uppercase rounded hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
