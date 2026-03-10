import { useState, useEffect, useRef } from 'react';
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

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevPendingRef = useRef<number>(currentFactsPending);

    /*
    ------------------------------------------------
    LOAD SESSION
    ------------------------------------------------
    */

    useEffect(() => {

        if (!isExpanded) return;
        if (currentFactsPending === 0) return;

        loadSession();

    }, [isExpanded, tenantId, contextVersion]);

    const loadSession = async () => {

        try {

            const session = await superadminApi.getAgentSession(tenantId, contextVersion);

            setSessionId(session.sessionId);

            const mapped = session.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                createdAt: new Date(m.createdAt)
            }));

            setMessages(mapped);

        } catch (err) {

            console.warn('[AgentConsole] No session found — starting new');

            setSessionId(null);
            setMessages([]);

        }

    };

    /*
    ------------------------------------------------
    AUTO RESET WHEN CURRENT FACTS RESOLVED
    ------------------------------------------------
    */

    useEffect(() => {

        if (prevPendingRef.current > 0 && currentFactsPending === 0 && sessionId) {
            resetSession();
        }

        prevPendingRef.current = currentFactsPending;

    }, [currentFactsPending]);

    const resetSession = async () => {

        try {

            await superadminApi.resetAgentSession(tenantId, sessionId!);

        } catch (err) {

            console.warn('[AgentConsole] reset failed', err);

        }

        setMessages([]);
        setSessionId(null);
        setIsExpanded(false);

        if (onReset) onReset();
    };

    /*
    ------------------------------------------------
    AUTO SCROLL
    ------------------------------------------------
    */

    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    }, [messages]);

    /*
    ------------------------------------------------
    SEND MESSAGE
    ------------------------------------------------
    */

    const handleSendMessage = async () => {

        if (!inputValue.trim()) return;
        if (isLoading) return;

        const message = inputValue.trim();
        setInputValue('');
        setIsLoading(true);

        const optimistic: AgentMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: message,
            createdAt: new Date()
        };

        setMessages(prev => [...prev, optimistic]);

        try {

            const result = await superadminApi.sendAgentMessage(tenantId, sessionId!, message);

            const assistantMessage: AgentMessage = {
                id: result.messageId,
                role: 'assistant',
                content: result.reply,
                createdAt: new Date()
            };

            setMessages(prev => [
                ...prev.filter(m => m.id !== optimistic.id),
                { ...optimistic, id: `user-${Date.now()}` },
                assistantMessage
            ]);

        } catch (err) {

            console.error('[AgentConsole] send failed', err);

            setMessages(prev => prev.filter(m => m.id !== optimistic.id));

        } finally {

            setIsLoading(false);

        }

    };

    /*
    ------------------------------------------------
    HIDDEN IF NO CF PENDING
    ------------------------------------------------
    */

    if (currentFactsPending === 0) return null;

    /*
    ------------------------------------------------
    COLLAPSED STATE
    ------------------------------------------------
    */

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

    /*
    ------------------------------------------------
    FULL CONSOLE
    ------------------------------------------------
    */

    return (

        <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-lg overflow-hidden h-96">

            {/* HEADER */}

            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800">

                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    Interpretive Agent
                </h4>

                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-slate-500 hover:text-slate-300 text-lg"
                >
                    ×
                </button>

            </div>

            {/* SCOPE NOTICE */}

            <div className="px-4 py-2 bg-amber-900/10 border-b border-amber-500/20 text-[10px] text-amber-300/80">
                ⚠ Agent can reason over artifacts but cannot modify canonical findings.
            </div>

            {/* MESSAGES */}

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

                {messages.length === 0 && (
                    <div className="text-center text-slate-600 text-xs py-8">
                        Ask questions about the discovery artifacts.
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

            {/* INPUT */}

            <div className="px-4 py-3 bg-slate-900/30 border-t border-slate-800">

                <div className="flex gap-2">

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) =>
                            e.key === 'Enter' && !e.shiftKey && handleSendMessage()
                        }
                        placeholder="Ask about the artifacts..."
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