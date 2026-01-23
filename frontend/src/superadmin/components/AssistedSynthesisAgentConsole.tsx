import React, { useState, useEffect, useRef } from 'react';
import { superadminApi } from '../api';

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
            const session = await superadminApi.getAgentSession(tenantId, contextVersion);
            setSessionId(session.sessionId);
            setMessages(session.messages);
        } catch (err: any) {
            console.error('[AgentConsole] Failed to load session:', err);

            // Extract error details from different error formats
            let errorData: any = {};

            // Check if this is a fetch Response error with JSON
            if (err.response?.data) {
                errorData = err.response.data; // Axios-style
            } else if (err.message) {
                // Parse SuperAdmin API error format: "SuperAdmin API error: 404"
                const statusMatch = err.message.match(/SuperAdmin API error: (\d+)/);
                if (statusMatch) {
                    errorData = {
                        code: `HTTP_${statusMatch[1]}`,
                        message: `API returned ${statusMatch[1]} error`
                    };
                } else {
                    errorData = {
                        code: 'NETWORK_ERROR',
                        message: err.message
                    };
                }
            }

            setError({
                code: errorData.code || 'LOAD_FAILED',
                message: errorData.message || 'Failed to load agent session.',
                requestId: errorData.requestId
            });
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !sessionId || isLoading) return;

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
            const result = await superadminApi.sendAgentMessage(tenantId, sessionId, userMessage);

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
        } catch (err: any) {
            // Remove optimistic message on error
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));

            const errorData = err.response?.data || {};
            setError({
                code: errorData.code || 'SEND_FAILED',
                message: errorData.message || 'Failed to send message.',
                requestId: errorData.requestId
            });
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

                {messages.map(msg => (
                    <div
                        key={msg.id}
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
                        disabled={isLoading || !sessionId}
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading || !sessionId}
                        className="px-4 py-2 bg-indigo-900/30 border border-indigo-500/30 rounded text-xs font-bold text-indigo-300 hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? '...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}
