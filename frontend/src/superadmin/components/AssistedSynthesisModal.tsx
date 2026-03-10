// frontend/src/superadmin/components/AssistedSynthesisModal.tsx

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import AssistedSynthesisAgentConsole from './AssistedSynthesisAgentConsole'
import ArtifactViewer from './ArtifactViewer' // Use default export
import { superadminApi } from '../api'

interface ProposedFindingItem {
    id: string
    findingId?: string
    title?: string
    text: string
    description?: string
    status: 'pending' | 'accepted' | 'rejected'
    evidenceRefs?: any[]
    sourceAnchors?: {
        capability?: string
        namespace?: string
    }
    type: 'CurrentFact' | 'FrictionPoint' | 'Goal' | 'Constraint'
    editedText?: string
    operatorNote?: string
}

interface AssistedSynthesisModalProps {
    open: boolean
    onClose: () => void
    tenantId: string
    snapshot: any
    onRefresh?: () => void
}

// NOTE: defensive normalization because some callers pass the firm object instead of the id
export function AssistedSynthesisModal({ open, onClose, tenantId, snapshot, onRefresh }: AssistedSynthesisModalProps) {
    const snapshotData = snapshot?.data ?? snapshot;
    const artifacts = snapshotData?.artifacts ?? {};
    const notes = artifacts.notes ?? [];
    const discoveryNotes = artifacts.discoveryNotes ?? null;
    const diagnostic = artifacts.diagnostic ?? null;
    const executiveBrief = artifacts.executiveBrief ?? null;
    // Q&A fallback: Source from Diagnostic's discoveryQuestions if standalone Q&A is missing
    const qaSource = artifacts.qa || diagnostic?.outputs?.discoveryQuestions || diagnostic?.raw?.discoveryQuestions || [];
    // Ensure qa is an array for mapping, but handle object/single item fallbacks
    const qa = Array.isArray(qaSource) ? qaSource : (typeof qaSource === 'object' && Object.keys(qaSource).length > 0 ? [qaSource] : []);

    // normalize tenantId in case the parent accidentally passes the firm object
    // stronger normalization to guarantee a string id even if an object leaks through
    const firmId: string = typeof tenantId === 'string'
        ? tenantId
        : String((tenantId as any)?.id ?? '')

    const [proposals, setProposals] = useState<ProposedFindingItem[]>([])
    const [requiresGeneration, setRequiresGeneration] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [activeSourceTab, setActiveSourceTab] = useState<'notes' | 'diagnostic' | 'brief' | 'qa'>('notes')
    const [isSaving, setIsSaving] = useState(false)
    const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
    const [error, setError] = useState<{ code: string; message: string; requestId?: string } | null>(null)



    const [pendingProposalId, setPendingProposalId] = useState<string | null>(null)
    const [electionError, setElectionError] = useState<string | null>(null)
    const [sasRunId, setSasRunId] = useState<string | null>(null)



    useEffect(() => {
        if (open) {
            loadProposedFindings()
            setError(null)
        }
    }, [open, firmId])

    const loadProposedFindings = async () => {
        try {
            const [proposalRes, electionRes] = await Promise.all([
                superadminApi.getAssistedProposals(firmId),
                superadminApi.getElectionSummary(firmId)
            ])

            if (!proposalRes || !proposalRes.items || proposalRes.items.length === 0) {
                setProposals([])
                setSasRunId(proposalRes?.runId || null)
                return
            }

            setSasRunId(proposalRes.runId)

            // Map election state to proposals
            const electionMap: Record<string, 'keep' | 'trash'> = {}
            if (electionRes?.elections) {
                for (const e of electionRes.elections) {
                    electionMap[e.proposalId] = e.decision as 'keep' | 'trash'
                }
            }

            const normalized = (proposalRes?.items ?? []).map((p: ProposedFindingItem) => {
                const decision = electionMap[p.id]
                let status = p.status || 'pending'
                if (decision === 'keep') status = 'accepted'
                if (decision === 'trash') status = 'rejected'
                return { ...p, status }
            })

            setProposals(normalized)
            setRequiresGeneration(false)

        } catch (err) {
            console.error('[SAS] failed loading proposals', err)
            setRequiresGeneration(true)
            setProposals([])
        }
    }


    const handleGenerateProposals = async () => {

        setIsGenerating(true)
        setError(null)

        try {

            const response = await superadminApi.generateAssistedProposals(firmId)

            setProposals(response.items || [])
            setSasRunId(response.runId)
            setRequiresGeneration(false)

        } catch (err: any) {

            console.error('Failed to generate proposals:', err)

            const errorData = err.response?.data || {}

            setError({
                code: errorData.code || 'UNKNOWN_ERROR',
                message: err.message || 'Failed to generate proposals.',
                requestId: errorData.requestId
            })

        } finally {

            setIsGenerating(false)

        }

    }

    const handleRegenerateProposals = async () => {

        setShowRegenerateConfirm(false)
        setIsGenerating(true)
        setError(null)

        try {

            const response = await superadminApi.generateAssistedProposals(
                firmId,
                { force: true }
            )

            setProposals(response.items || [])
            setSasRunId(response.runId)
            setRequiresGeneration(false)

        } catch (err: any) {

            console.error('[SAS] regenerate failed', err)

            const errorData = err.response?.data || {}

            setError({
                code: errorData.code || 'UNKNOWN_ERROR',
                message: err.message || 'Failed to regenerate proposals.',
                requestId: errorData.requestId
            })

        } finally {

            setIsGenerating(false)

        }

    }

    const updateProposalStatus = (index: number, status: 'accepted' | 'rejected') => {
        setProposals((prev: ProposedFindingItem[]) => {
            const next = [...prev];
            if (next[index]) {
                next[index] = { ...next[index], status };
            }
            return next;
        });
    };

    // META-TICKET SAS-STAGE5-UI-STABILIZATION-01: Elections with lifecycle guard
    const handleAccept = async (id: string) => {
        if (pendingProposalId) return // guard: one request at a time
        setPendingProposalId(id)
        setElectionError(null)
        try {
            await superadminApi.recordProposalElection(firmId, id, 'keep')
            const index = proposals.findIndex(p => p.id === id)
            updateProposalStatus(index, 'accepted')
        } catch (err: any) {
            console.error('[SAS] Election failed', err)
            setElectionError(err?.message || 'Failed to record election. Backend may be unavailable.')
            // Do NOT update local state on failure
        } finally {
            setPendingProposalId(null)
        }
    }

    const handleReject = async (id: string) => {
        if (pendingProposalId) return // guard: one request at a time
        setPendingProposalId(id)
        setElectionError(null)
        try {
            await superadminApi.recordProposalElection(firmId, id, 'trash')
            const index = proposals.findIndex(p => p.id === id)
            updateProposalStatus(index, 'rejected')
        } catch (err: any) {
            console.error('[SAS] Election failed', err)
            setElectionError(err?.message || 'Failed to record election. Backend may be unavailable.')
            // Do NOT update local state on failure
        } finally {
            setPendingProposalId(null)
        }
    }

    const handleEdit = (id: string, newText: string) => {

        setProposals((prev: ProposedFindingItem[]) =>
            (prev ?? []).map((p: ProposedFindingItem) =>
                p.id === id ? { ...p, editedText: newText } : p
            )
        )

    }

    const handleAddProposal = (type: ProposedFindingItem['type']) => {

        const newProposal: ProposedFindingItem = {
            id: `human-${Date.now()}`,
            type,
            text: '',
            status: 'pending',
            operatorNote: 'Human Added',
            evidenceRefs: []
        }

        setProposals(prev => [...prev, newProposal])

    }

    const handleDeclareCanon = async () => {

        setIsSaving(true)
        setError(null) // Clear previous errors

        try {
            const acceptedFindings = (proposals ?? [])
                .filter(p => p.status === 'accepted')
                .map(p => ({
                    id: p.id,
                    text: p.editedText || p.text,
                    sourceFindingIds: p.sourceFindingIds || []
                }))

            if (acceptedFindings.length === 0) {
                setError({
                    code: 'NO_PROPOSALS',
                    message: 'Please accept at least one proposal to declare canonical findings.'
                })
                return
            }

            const sasRunId = snapshot?.data?.artifacts?.sasRunId || snapshot?.data?.sasRunId

            await superadminApi.declareCanonicalFindings(firmId, {
                sasRunId: sasRunId || 'latest',
                findings: acceptedFindings
            })

            await onRefresh?.()
            onClose()

        } catch (err) {

            console.error('Failed to declare canonical findings:', err)
            setError({
                code: 'CANON_DECLARATION_FAILED',
                message: 'Failed to declare findings. Please try again.'
            })

        } finally {

            setIsSaving(false)

        }

    }

    const scrollToArtifact = (artifact: string) => {
        setActiveSourceTab(artifact as any)
    }

    if (!open) return null

    const sections = [
        { type: 'CurrentFact' as const, label: 'Current Facts', color: 'indigo' },
        { type: 'FrictionPoint' as const, label: 'Friction Points', color: 'red' },
        { type: 'Goal' as const, label: 'Goals', color: 'emerald' },
        { type: 'Constraint' as const, label: 'Constraints', color: 'amber' }
    ]

    const pendingCount = (proposals ?? []).filter(p => p.status === 'pending').length
    const acceptedCount = (proposals ?? []).filter(p => p.status === 'accepted').length
    const rejectedCount = (proposals ?? []).filter(p => p.status === 'rejected').length
    const allResolved = (proposals ?? []).length > 0 && pendingCount === 0

    return (

        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <style>{`
                .artifact-text {
                  white-space: pre-wrap;
                  line-height: 1.6;
                  font-size: 14px;
                  color: #e5e7eb;
                }
            `}</style>

            {/* Election Error Toast */}
            {electionError && (
                <div className="fixed top-6 right-6 z-[100] bg-red-900/90 border border-red-500/50 rounded-lg p-4 max-w-sm shadow-2xl animate-pulse">
                    <div className="flex items-start gap-3">
                        <span className="text-red-400 text-lg">⚠</span>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-red-300 uppercase tracking-wider">Election Failed</p>
                            <p className="text-xs text-red-200/80 mt-1">{electionError}</p>
                        </div>
                        <button onClick={() => setElectionError(null)} className="text-red-400/60 hover:text-red-300 text-sm">✕</button>
                    </div>
                </div>
            )}

            {/* General Error Toast */}
            {error && (
                <div className="fixed top-6 right-6 z-[100] bg-red-900/90 border border-red-500/50 rounded-lg p-4 max-w-sm shadow-2xl animate-pulse">
                    <div className="flex items-start gap-3">
                        <span className="text-red-400 text-lg">⚠</span>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-red-300 uppercase tracking-wider">Error: {error.code}</p>
                            <p className="text-xs text-red-200/80 mt-1">{error.message}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-300 text-sm">✕</button>
                    </div>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden relative">

                {/* HEADER */}

                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/50">

                    <div>

                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">

                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />

                            Stage 5: Assisted Synthesis

                        </h2>

                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                                Pre-Canonical Workspace // Authority Mode
                            </p>
                            {sasRunId && (
                                <p className="text-[10px] text-indigo-400/60 font-mono tracking-tighter">
                                    RUN_ID: {sasRunId}
                                </p>
                            )}
                        </div>

                    </div>

                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors text-3xl font-light"
                    >

                        &times;

                    </button>

                </div>

                {/* BODY */}

                <div className="flex-1 flex overflow-hidden">

                    {/* LEFT PANEL */}

                    <div className="w-1/5 border-r border-slate-800 bg-slate-950/40 p-6 flex flex-col">

                        <div className="flex-1 space-y-8">

                            <div className="space-y-4">

                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">

                                    Readiness Summary

                                </h3>

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

                        </div>

                        <div className="pt-6 border-t border-slate-800">

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

                        </div>

                    </div>

                    {/* PROPOSALS */}

                    <div className="w-2/5 border-r border-slate-800 bg-slate-900 flex flex-col overflow-hidden">

                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">

                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                Proposed Findings (Draft)
                            </h3>

                            <button
                                onClick={() => setShowRegenerateConfirm(true)}
                                disabled={isSaving || isGenerating}
                                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 rounded hover:bg-slate-700"
                            >
                                Regenerate
                            </button>

                        </div>

                        {requiresGeneration || proposals.length === 0 ? (

                            <div className="flex-1 flex items-center justify-center p-12">

                                <div className="text-center space-y-6 max-w-md">

                                    <div className="w-16 h-16 mx-auto bg-indigo-900/20 rounded-full flex items-center justify-center border border-indigo-500/30">
                                        <span className="text-3xl">🤖</span>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-2">
                                            No Proposals Generated Yet
                                        </h4>

                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Click below to analyze all source artifacts and generate findings.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleGenerateProposals}
                                        disabled={isGenerating}
                                        className="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-lg hover:bg-indigo-500 transition-all"
                                    >
                                        {isGenerating ? 'Synthesizing…' : 'Generate Agent Proposals'}
                                    </button>

                                </div>

                            </div>

                        ) : (

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">

                                {sections.map(section => (

                                    <div key={section.type} className="space-y-4">

                                        <div className="flex items-center gap-3">

                                            <h4 className={`text-xs font-black uppercase tracking-widest ${section.type === 'CurrentFact' ? 'text-indigo-400' : section.type === 'FrictionPoint' ? 'text-red-400' : section.type === 'Goal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {section.label}
                                            </h4>

                                            <div className="h-px flex-1 bg-slate-800" />

                                            <button
                                                onClick={() => handleAddProposal(section.type)}
                                                className="text-[9px] font-bold text-slate-500 hover:text-indigo-400 uppercase"
                                            >
                                                + Add
                                            </button>

                                        </div>

                                        <div className="space-y-2">

                                            {(proposals ?? [])
                                                .filter(p => p.type === section.type)
                                                .map((proposal: ProposedFindingItem) => {

                                                    return (

                                                        <div
                                                            key={proposal.id}
                                                            className={`p-3 rounded border transition-all ${proposal.status === 'accepted' ? 'bg-emerald-900/10 border-emerald-500/50' :
                                                                proposal.status === 'rejected' ? 'bg-red-900/10 border-red-500/50' :
                                                                    'bg-slate-950 border-slate-800'
                                                                }`}
                                                        >

                                                            <div className="flex justify-end gap-2 mb-1">

                                                                {pendingProposalId === proposal.id ? (
                                                                    <span className="text-xs text-slate-500 animate-pulse">⏳</span>
                                                                ) : (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleReject(proposal.id)}
                                                                            disabled={!!pendingProposalId}
                                                                            className={`transition-colors ${proposal.status === 'rejected' ? 'text-red-500' : pendingProposalId ? 'text-slate-700 cursor-not-allowed' : 'text-red-400/40 hover:text-red-400'}`}
                                                                        >
                                                                            ✕
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleAccept(proposal.id)}
                                                                            disabled={!!pendingProposalId}
                                                                            className={`transition-colors ${proposal.status === 'accepted' ? 'text-emerald-500' : pendingProposalId ? 'text-slate-700 cursor-not-allowed' : 'text-emerald-400/40 hover:text-emerald-400'}`}
                                                                        >
                                                                            ✓
                                                                        </button>
                                                                    </>
                                                                )}

                                                            </div>

                                                            <div className="flex items-start gap-3">
                                                                {/* Removed checkbox input */}
                                                                <div
                                                                    contentEditable
                                                                    suppressContentEditableWarning
                                                                    onBlur={(e) => handleEdit(proposal.id, e.currentTarget.textContent || '')}
                                                                    className="text-sm text-slate-300 leading-snug flex-1"
                                                                >
                                                                    {proposal.title || proposal.text}
                                                                </div>
                                                            </div>
                                                            {proposal.sourceAnchors?.capability && (
                                                                <div className="mt-2 text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest">
                                                                    ⚓ {proposal.sourceAnchors.capability}
                                                                </div>
                                                            )}



                                                        </div>

                                                    )

                                                })}

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </div>

                    {/* RIGHT PANEL */}

                    <div className="w-2/5 bg-slate-950 flex flex-col overflow-hidden">

                        <div className="flex-1 overflow-y-auto p-6">

                            <div className="text-slate-500 text-xs">

                                {/* SOURCE ARTIFACT TABS */}

                                <div className="flex gap-4 mb-4 border-b border-slate-800 pb-2 text-[10px] uppercase tracking-widest">

                                    <button
                                        onClick={() => setActiveSourceTab('notes')}
                                        className={`${activeSourceTab === 'notes' ? 'text-white' : 'text-slate-500'}`}
                                    >
                                        Notes
                                    </button>

                                    <button
                                        onClick={() => setActiveSourceTab('diagnostic')}
                                        className={`${activeSourceTab === 'diagnostic' ? 'text-white' : 'text-slate-500'}`}
                                    >
                                        Diagnostic
                                    </button>

                                    <button
                                        onClick={() => setActiveSourceTab('brief')}
                                        className={`${activeSourceTab === 'brief' ? 'text-white' : 'text-slate-500'}`}
                                    >
                                        Exec Brief
                                    </button>

                                    <button
                                        onClick={() => setActiveSourceTab('qa')}
                                        className={`${activeSourceTab === 'qa' ? 'text-white' : 'text-slate-500'}`}
                                    >
                                        Q&A
                                    </button>

                                </div>

                                {/* ARTIFACT CONTENT */}

                                <div className="prose prose-invert max-w-none text-xs space-y-4">

                                    {activeSourceTab === 'notes' && (
                                        <div className="space-y-6">
                                            {discoveryNotes && (
                                                <div className="space-y-2">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 px-2">
                                                        Primary Discovery Note
                                                    </h4>
                                                    <ArtifactViewer artifact={discoveryNotes} />
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 px-2">
                                                    Clarification History
                                                </h4>
                                                {(notes ?? []).length > 0 ? (
                                                    (notes ?? []).map((note: any) => (
                                                        <ArtifactViewer key={note.id} artifact={note} />
                                                    ))
                                                ) : (
                                                    <div className="px-2 text-[10px] text-slate-600 italic">No history available</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeSourceTab === 'diagnostic' && (
                                        <ArtifactViewer artifact={diagnostic} />
                                    )}

                                    {activeSourceTab === 'brief' && (
                                        <ArtifactViewer artifact={executiveBrief} />
                                    )}

                                    {activeSourceTab === 'qa' && (
                                        <div className="space-y-4">
                                            {(() => {
                                                const qaItems = Array.isArray(qa) ? qa : (qa ? [qa] : []);
                                                if (qaItems.length > 0) {
                                                    return qaItems.map((item: any) => (
                                                        <ArtifactViewer key={item.id || Math.random()} artifact={item} />
                                                    ));
                                                }
                                                return (
                                                    <div className="flex items-center justify-center p-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                                                            No canonical Q&A artifact exists for this tenant yet.
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}

                                </div>

                            </div>

                        </div>

                        <div className="border-t border-slate-800 bg-slate-950/80 p-4">

                            <AssistedSynthesisAgentConsole
                                tenantId={firmId}
                                currentFactsPending={pendingCount}
                                contextVersion={String(artifacts?.diagnostic?.id ?? 'default')}
                            />

                        </div>

                    </div>

                </div>

            </div>
            {showRegenerateConfirm && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[420px]">

                        <h3 className="text-sm font-bold text-white mb-2">
                            Regenerate Proposals?
                        </h3>

                        <p className="text-xs text-slate-400 mb-6">
                            This will create a new synthesis run and generate fresh findings.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRegenerateConfirm(false)}
                                className="px-4 py-2 text-xs bg-slate-800 rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleRegenerateProposals}
                                className="px-4 py-2 text-xs bg-indigo-600 rounded"
                            >
                                Regenerate
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>

    )

}
