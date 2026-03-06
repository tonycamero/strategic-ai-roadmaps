// frontend/src/superadmin/components/AssistedSynthesisModal.tsx

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import AssistedSynthesisAgentConsole from './AssistedSynthesisAgentConsole'
import { superadminApi } from '../api'

interface ProposedFindingItem {
    id: string
    type: 'CurrentFact' | 'FrictionPoint' | 'Goal' | 'Constraint'
    text: string
    evidenceRefs: Array<{
        artifact: 'raw' | 'execBrief' | 'diagnostic' | 'qna'
        quote: string
        location?: string
    }>
    status: 'pending' | 'accepted' | 'rejected'
    editedText?: string
    operatorNote?: string
}

interface AssistedSynthesisModalProps {
    open: boolean
    onClose: () => void
    tenantId: string
    artifacts: {
        discoveryNotes?: any
        diagnostic?: any
        executiveBrief?: any
    }
    onRefresh?: () => void
}

// NOTE: defensive normalization because some callers pass the firm object instead of the id
export function AssistedSynthesisModal({ open, onClose, tenantId, artifacts, onRefresh }: AssistedSynthesisModalProps) {

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

    const [confidence, setConfidence] = useState<Record<string, { keep: number; trash: number }>>({})

    useEffect(() => {
        if (open) {
            loadProposedFindings()
            loadElectionConfidence()
            setError(null)
        }
    }, [open, firmId])

    const loadProposedFindings = async () => {
        try {
            const res = await superadminApi.getProposedFindings(firmId)

            if (!res || !res.items || res.items.length === 0) {
                setRequiresGeneration(true)
                setProposals([])
                return
            }

            setProposals(res.items)
            setRequiresGeneration(false)

        } catch (err) {
            console.error('[SAS] failed loading proposals', err)
            setRequiresGeneration(true)
            setProposals([])
        }
    }

    // S6-02/S6-08: Load persisted election state from backend
    const loadElectionConfidence = async () => {
        try {
            const res = await superadminApi.getElectionSummary(firmId)
            if (!res?.elections) return

            // Build map: proposalId → latest decision
            const electionMap: Record<string, 'keep' | 'trash'> = {}
            for (const e of res.elections) {
                electionMap[e.proposalId] = e.decision as 'keep' | 'trash'
            }

            // Apply persisted election state to proposals
            setProposals(prev =>
                prev.map(p => {
                    const decision = electionMap[p.id]
                    if (decision === 'keep') return { ...p, status: 'accepted' as const }
                    if (decision === 'trash') return { ...p, status: 'rejected' as const }
                    return p
                })
            )
        } catch (err) {
            console.warn('[SAS] Election load failed (non-fatal)', err)
        }
    }

    const handleGenerateProposals = async () => {

        setIsGenerating(true)
        setError(null)

        try {

            const response = await superadminApi.generateAssistedProposals(firmId)

            setProposals(response.items || [])
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

    // S6-02: Elections persist to backend, local state updates after success
    const handleAccept = async (id: string) => {
        try {
            await superadminApi.recordProposalElection(firmId, id, 'keep')
            setProposals(prev =>
                prev.map(p =>
                    p.id === id ? { ...p, status: 'accepted' as const } : p
                )
            )
        } catch (err) {
            console.error('Election failed', err)
        }
    }

    const handleReject = async (id: string) => {
        try {
            await superadminApi.recordProposalElection(firmId, id, 'trash')
            setProposals(prev =>
                prev.map(p =>
                    p.id === id ? { ...p, status: 'rejected' as const } : p
                )
            )
        } catch (err) {
            console.error('Election failed', err)
        }
    }

    const handleEdit = (id: string, newText: string) => {

        setProposals(prev =>
            prev.map(p =>
                p.id === id ? { ...p, editedText: newText } : p
            )
        )

    }

    const handleAddProposal = (type: ProposedFindingItem['type']) => {

        const newProposal: ProposedFindingItem = {
            id: `human-${Date.now()}`,
            type,
            text: '',
            evidenceRefs: [],
            status: 'pending',
            operatorNote: 'Human Added'
        }

        setProposals(prev => [...prev, newProposal])

    }

    const handleDeclareCanon = async () => {

        setIsSaving(true)

        try {

            const accepted = proposals.filter(p => p.status === 'accepted')

            if (!accepted.length) {

                alert('You must accept at least one finding.')
                return

            }

            await superadminApi.declareCanonicalFindings(
                firmId,
                accepted
            )

            await onRefresh?.()
            onClose()

        } catch (err) {

            console.error('Failed to declare canonical findings:', err)
            alert('Failed to declare findings.')

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

    const pendingCount = proposals.filter(p => p.status === 'pending').length
    const acceptedCount = proposals.filter(p => p.status === 'accepted').length
    const rejectedCount = proposals.filter(p => p.status === 'rejected').length
    const allResolved = proposals.length > 0 && pendingCount === 0

    return (

        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">

            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[95vw] h-[90vh] flex flex-col overflow-hidden relative">

                {/* HEADER */}

                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/50">

                    <div>

                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">

                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />

                            Stage 5: Assisted Synthesis

                        </h2>

                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">

                            Pre-Canonical Workspace // Authority Mode

                        </p>

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

                                            {proposals
                                                .filter(p => p.type === section.type)
                                                .map(proposal => {

                                                    const conf = confidence[proposal.id]
                                                    const total = conf ? conf.keep + conf.trash : 0
                                                    const pct = total ? Math.round((conf.keep / total) * 100) : null

                                                    return (

                                                        <div
                                                            key={proposal.id}
                                                            className="bg-slate-950 border border-slate-800 rounded p-3"
                                                        >

                                                            <div className="flex justify-end gap-2 mb-1">

                                                                <button
                                                                    onClick={() => handleReject(proposal.id)}
                                                                    className="text-red-400"
                                                                >
                                                                    ✕
                                                                </button>

                                                                <button
                                                                    onClick={() => handleAccept(proposal.id)}
                                                                    className="text-emerald-400"
                                                                >
                                                                    ✓
                                                                </button>

                                                            </div>

                                                            <div
                                                                contentEditable
                                                                suppressContentEditableWarning
                                                                onBlur={(e) => handleEdit(proposal.id, e.currentTarget.textContent || '')}
                                                                className="text-sm text-slate-300 leading-snug"
                                                            >
                                                                {proposal.editedText ?? proposal.text}
                                                            </div>



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

                                <div className="prose prose-invert max-w-none text-xs">

                                    {activeSourceTab === 'notes' && (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {artifacts?.discoveryNotes?.content || 'No discovery notes available'}
                                        </ReactMarkdown>
                                    )}

                                    {activeSourceTab === 'diagnostic' && (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {artifacts?.diagnostic?.content || 'No diagnostic available'}
                                        </ReactMarkdown>
                                    )}

                                    {activeSourceTab === 'brief' && (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {artifacts?.executiveBrief?.content || 'No executive brief available'}
                                        </ReactMarkdown>
                                    )}

                                    {activeSourceTab === 'qa' && (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {artifacts?.discoveryNotes?.qa || 'No Q&A captured'}
                                        </ReactMarkdown>
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

        </div>

    )

}
