// frontend/src/superadmin/components/AssistedSynthesisAgentConsole.tsx

import React, { useState, useEffect, useRef } from 'react';
import { superadminApi } from '../api';
import ReactMarkdown from 'react-markdown';

interface AgentMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

interface AssistedSynthesisAgentConsoleProps {
    tenantId: string;
    currentFactsPending: number;
    contextVersion: string;
    onReset?: () => void;
    onAddProposal?: (proposal: ProposalBlock) => void;
}

interface ProposalBlock {
    type: 'CurrentFact' | 'FrictionPoint' | 'Goal' | 'Constraint';
    text: string;
    anchors: Array<{
        source: string;
        speaker?: string;
        quote: string;
    }>;
    confidence: 'LOW' | 'MED' | 'HIGH';
    mechanical_effect?: string;
    operational_effect?: string;
    economic_vector?: string;
    archetype_selected?: string;
    runners_up_archetypes?: string[];
    deciding_signal?: string;
}

function ProposalCard({ proposal, onAdd }: { proposal: ProposalBlock; onAdd?: (p: ProposalBlock) => void }) {
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        if (onAdd) {
            onAdd(proposal);
            setAdded(true);
        }
    };

    return (
        <div className="mt-3 mb-1 bg-slate-900 border border-indigo-500/30 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-indigo-900/20 border-b border-indigo-500/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                        Suggest: {proposal.type}
                    </span>
                    {(proposal.archetype_selected || (proposal as any).archetype) && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-900/40 text-indigo-200 border border-indigo-500/30">
                            {proposal.archetype_selected || (proposal as any).archetype}
                        </span>
                    )}
                    {(!proposal.archetype_selected && !(proposal as any).archetype) && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
                            LEGACY
                        </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        {proposal.confidence} Confidence
                    </span>
                </div>
                {added && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">✓ ADDED</span>}
            </div>
            <div className="p-3 space-y-3">
                <p className="text-xs text-white font-medium leading-relaxed">"{proposal.text}"</p>

                {proposal.deciding_signal && (
                    <div className="p-2 bg-indigo-950/20 border border-indigo-500/10 rounded">
                        <p className="text-[9px] uppercase font-bold text-indigo-400/60 tracking-wider mb-1">Deciding Signal:</p>
                        <p className="text-[10px] text-indigo-200/80 italic leading-tight">
                            {proposal.deciding_signal}
                        </p>
                    </div>
                )}

                <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Evidence:</p>
                    {proposal.anchors.map((anchor, idx) => (
                        <div key={idx} className="pl-2 border-l-2 border-slate-700">
                            <p className="text-[10px] text-slate-400 italic">"{anchor.quote}"</p>
                            <p className="text-[9px] text-slate-600">— {anchor.source} {anchor.speaker ? `(${anchor.speaker})` : ''}</p>
                        </div>
                    ))}
                </div>

                {/* Cascade Block */}
                {(proposal.mechanical_effect || proposal.operational_effect || proposal.economic_vector || proposal.runners_up_archetypes) && (
                    <div className="space-y-2 p-2 bg-slate-950/50 rounded border border-slate-800">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Economic Cascade</p>
                            {proposal.runners_up_archetypes && proposal.runners_up_archetypes.length > 0 && (
                                <div className="text-[8px] text-slate-500 uppercase font-black">
                                    Rotated: {proposal.runners_up_archetypes.join(' | ')}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                            {proposal.mechanical_effect && (
                                <div className="text-[10px]">
                                    <span className="text-slate-500 font-bold uppercase mr-1">Mechanical:</span>
                                    <span className="text-slate-300 font-mono">{proposal.mechanical_effect}</span>
                                </div>
                            )}
                            {proposal.operational_effect && (
                                <div className="text-[10px]">
                                    <span className="text-slate-500 font-bold uppercase mr-1">Operational:</span>
                                    <span className="text-slate-300 font-mono">{proposal.operational_effect}</span>
                                </div>
                            )}
                            {proposal.economic_vector && (
                                <div className="text-[10px]">
                                    <span className="text-slate-500 font-bold uppercase mr-1">Economic:</span>
                                    <span className="text-slate-300 font-mono italic text-indigo-300/80">{proposal.economic_vector}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!added && (
                    <button
                        onClick={handleAdd}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
                    >
                        <span>+</span> Add to Drafts
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Stage 5 Assisted Synthesis Agent Console
 * 
 * Bounded persistence interpretive Q&A assistant.
 * Session persists ONLY while Current Facts have pending items.
 * Auto-resets when CF pending count reaches 0.
 */
export default function AssistedSynthesisAgentConsole({
    tenantId,
    currentFactsPending,
    contextVersion,
    onReset,
    onAddProposal
}: AssistedSynthesisAgentConsoleProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<{ code: string; message: string; requestId?: string } | null>(null);
    const [resetNotice, setResetNotice] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevPendingRef = useRef<number>(currentFactsPending);

    // Load session on mount
    useEffect(() => {
        if (isExpanded) {
            loadSession();
        }
    }, [isExpanded, tenantId, contextVersion]);

    // Disabled Auto-reset to allow conversation to persist after facts resolved
    // useEffect(() => {
    //     if (prevPendingRef.current > 0 && currentFactsPending === 0 && sessionId) {
    //         handleAutoReset();
    //     }
    //     prevPendingRef.current = currentFactsPending;
    // }, [currentFactsPending]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadSession = async () => {
        try {
            setError(null);
            // ENABLED: Feature active
            const session = await superadminApi.getAgentSession(tenantId, contextVersion);
            setSessionId(session.sessionId);
            setMessages(session.messages || []);
        } catch (err) {
            console.error('Failed to load agent session:', err);
            // Silent fail or retry? Usually silent for load
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !sessionId) return;

        const userMsg = inputValue.trim();
        setInputValue('');
        setIsLoading(true);
        setError(null);

        // Optimistic UI update
        const tempId = Date.now().toString();
        const optimisticMessage: AgentMessage = {
            id: tempId,
            role: 'user',
            content: userMsg,
            createdAt: new Date()
        };

        setMessages((prev: AgentMessage[]) => [...prev, optimisticMessage]);

        try {
            const result = await superadminApi.sendAgentMessage(tenantId, sessionId, userMsg);

            const replyMessage: AgentMessage = {
                id: result.messageId,
                role: 'assistant',
                content: result.reply,
                createdAt: new Date()
            };

            setMessages((prev: AgentMessage[]) => [...prev, replyMessage]);
        } catch (err: any) {
            console.error('Failed to send message:', err);
            // Revert optimistic update (optional, or just show error)
            setError({
                code: err.response?.data?.code || 'SEND_FAILED',
                message: err.message || 'Failed to send message',
                requestId: err.response?.data?.requestId
            });
            // Ideally revert the user message or mark as failed
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoReset = async () => {
        if (!sessionId) return;

        try {
            await superadminApi.resetAgentSession(tenantId, sessionId);

            setMessages([]);
            setSessionId(null);
            setIsExpanded(false);
            setResetNotice(true);

            setTimeout(() => setResetNotice(false), 5000);

            if (onReset) onReset();
        } catch (err) {
            console.error('Failed to reset agent session:', err);
        }
    };

    if (currentFactsPending === 0 && resetNotice) {
        return (
            <div className="px-4 py-2 bg-emerald-900/20 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs">
                ✓ Current Facts resolved. Agent context cleared.
            </div>
        );
    }

    // Simplified: Always allow access to the agent console during synthesis
    // if (currentFactsPending === 0) {
    //     return null; //  Don't show console after CF resolved
    // }

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="px-4 py-2 bg-indigo-900/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs font-bold hover:bg-indigo-900/30 transition-all"
            >
                💬 Reason With Agent
            </button>
        );
    }

    return (
        <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden h-96">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Interpretive Agent</h4>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-slate-500 hover:text-slate-300 text-lg"
                >
                    ×
                </button>
            </div>

            {/* Scope Notice */}
            <div className="px-4 py-2 bg-amber-900/10 border-b border-amber-500/20 text-[10px] text-amber-300/80">
                ⚠ Agent can only answer questions about source artifacts. Cannot modify proposals.
            </div>

            {/* Error Banner */}
            {error && (
                <div className="px-4 py-2 bg-red-900/20 border-b border-red-500/30">
                    <div className="flex items-start gap-2">
                        <span className="text-red-400 text-sm">⚠</span>
                        <div className="flex-1">
                            <p className="text-xs text-red-300">{error.message}</p>
                            <div className="flex items-center gap-3 text-[9px] text-red-300/60 mt-1">
                                <span className="font-mono">Code: {error.code}</span>
                                {error.requestId && <span className="font-mono">ID: {error.requestId}</span>}
                            </div>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-slate-600 text-xs py-8">
                        Ask the agent about source artifacts or proposals.
                    </div>
                )}

                {messages.map((msg: AgentMessage, idx: number) => {
                    // PARSE MESSAGE CONTENT for <SAR_PROPOSAL> blocks
                    const parts = msg.content.split(/(<SAR_PROPOSAL>[\s\S]*?<\/SAR_PROPOSAL>)/g);

                    return (
                        <div
                            key={msg.id || idx}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1`}
                        >
                            <div
                                className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${msg.role === 'user'
                                    ? 'bg-indigo-900/30 text-indigo-200 border border-indigo-500/30'
                                    : 'bg-slate-900/80 text-slate-300 border border-slate-700'
                                    }`}
                            >
                                {parts.map((part: string, pIdx: number) => {
                                    if (part.startsWith('<SAR_PROPOSAL>')) {
                                        try {
                                            const jsonStr = part.replace(/<\/?SAR_PROPOSAL>/g, '').trim();
                                            const proposal = JSON.parse(jsonStr) as ProposalBlock;
                                            return <ProposalCard key={pIdx} proposal={proposal} onAdd={onAddProposal} />;
                                        } catch (e) {
                                            return <div key={pIdx} className="text-red-400 text-[10px] p-2 border border-red-500/30 rounded">Error parsing proposal block</div>;
                                        }
                                    } else if (part.trim()) {
                                        return (
                                            <div key={pIdx} className="prose prose-invert prose-xs max-w-none leading-relaxed">
                                                <ReactMarkdown>
                                                    {part}
                                                </ReactMarkdown>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                            <span className="text-[9px] text-slate-600 px-1">
                                {msg.role === 'assistant' ? 'Agent' : 'You'}
                            </span>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-slate-900/30 border-t border-slate-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Ask about source artifacts..."
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="px-4 py-2 bg-indigo-900/30 border border-indigo-500/30 rounded text-xs font-bold text-indigo-300 hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? '...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}
