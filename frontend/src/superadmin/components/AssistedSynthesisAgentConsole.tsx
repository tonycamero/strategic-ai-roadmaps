// frontend/src/superadmin/components/AssistedSynthesisAgentConsole.tsx

import { useState, useEffect, useRef } from 'react';

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
    onReset
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
        if (isExpanded && currentFactsPending > 0) {
            loadSession();
        }
    }, [isExpanded, tenantId, contextVersion]);

    // Auto-reset when Current Facts resolved
    useEffect(() => {
        if (prevPendingRef.current > 0 && currentFactsPending === 0 && sessionId) {
            handleAutoReset();
        }
        prevPendingRef.current = currentFactsPending;
    }, [currentFactsPending]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadSession = async () => {
        try {
            setError(null);
            // STRIKE 1: API method does not exist on SuperAdmin API surface
            // const session = await superadminApi.getAgentSession({ tenantId, kind: contextVersion });
            // setSessionId(session.sessionId);
            // setMessages(session.messages);
            setMessages([{
                id: 'system-disabled',
                role: 'assistant',
                content: 'Agent features are currently disabled in the SuperAdmin Console.',
                createdAt: new Date()
            }]);
        } catch (err) {
            console.error('[AgentConsole] Failed to load session:', err);
            setError({
                code: 'LOAD_FAILED',
                message: err instanceof Error ? err.message : 'Failed to load agent session.'
            });
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setIsLoading(true);
        setError(null);

        // Optimistic update
        const optimisticMessage: AgentMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: userMessage,
            createdAt: new Date()
        };
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            // STRIKE 1: API method does not exist on SuperAdmin API surface
            // const result = await superadminApi.sendAgentMessage({ tenantId, message: userMessage, kind: contextVersion });

            throw new Error("Feature currently disabled in SuperAdmin Console (API Surface Compliance)");

            /*
            // Replace optimistic + add assistant
            setMessages(prev => [
                ...prev.filter(m => m.id !== optimisticMessage.id),
                { ...optimisticMessage, id: `user-${Date.now()}` },
                {
                    id: result.messageId,
                    role: 'assistant',
                    content: result.reply,
                    createdAt: new Date()
                }
            ]);
            */
        } catch (err) {
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));

            setError({
                code: 'SEND_FAILED',
                message: err instanceof Error ? err.message : 'Failed to send message.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoReset = async () => {
        try {
            // STRIKE 1: API method does not exist on SuperAdmin API surface
            // await superadminApi.resetAgentSession({ tenantId, kind: contextVersion });
            console.warn("resetAgentSession disabled (Strike 1)");

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

    if (currentFactsPending === 0) {
        return null; //  Don't show console after CF resolved
    }

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

                {messages.map((msg, idx) => (
                    <div
                        key={msg.id || idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${msg.role === 'user'
                                ? 'bg-indigo-900/30 text-indigo-200 border border-indigo-500/30'
                                : 'bg-slate-900 text-slate-300 border border-slate-700'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
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
