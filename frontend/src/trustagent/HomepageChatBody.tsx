import { useRef } from 'react';
import { type ConversationMessage, type FlowId } from './flows';
import ReactMarkdown from 'react-markdown';

interface HomepageChatBodyProps {
    messages: ConversationMessage[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    handleOptionClick: (id: string, label: string, next: string) => void;
    handleCtaClick: (cta: any) => void;
    startFlow: (id: FlowId) => void;
    mode: 'simulated' | 'live';
    inputValue: string;
    setInputValue: (val: string) => void;
    handleSendMessage: () => Promise<void>;
}

export function HomepageChatBody({
    messages,
    isLoading,
    messagesEndRef,
    handleOptionClick,
    handleCtaClick,
    startFlow,
    mode,
    inputValue,
    setInputValue,
    handleSendMessage,
}: HomepageChatBodyProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && !isLoading ? (
                    <div className="text-center text-slate-400 mt-8">
                        <p className="mb-4">👋 Hi! I'm TrustAgent.</p>
                        <p className="text-sm">Click a suggestion below to start chatting.</p>
                    </div>
                ) : messages.length === 0 && isLoading ? (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] bg-slate-900 text-slate-200 rounded-lg p-4">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] ${msg.speaker === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-200'} rounded-lg p-4`}>
                                {msg.speaker === 'agent' ? (
                                    <div className="text-sm prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="text-sm whitespace-pre-line">{msg.message}</div>
                                )}

                                {msg.options && (
                                    <div className="mt-3 space-y-2">
                                        {msg.options.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleOptionClick(option.id, option.label, option.nextStepId ?? '')}
                                                className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded text-sm text-slate-200 transition-colors"
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {msg.cta && (
                                    <button
                                        onClick={() => handleCtaClick(msg.cta)}
                                        className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        {msg.cta.label}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t border-slate-800">
                {messages.length === 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        <button
                            onClick={() => {
                                if (mode === 'live') {
                                    setInputValue('Can you explain the Strategic AI Roadmap in simple terms?');
                                    setTimeout(() => handleSendMessage(), 100);
                                } else {
                                    startFlow('explain_roadmap');
                                }
                            }}
                            className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 transition-colors"
                        >
                            What is the Roadmap?
                        </button>
                        <button
                            onClick={() => {
                                if (mode === 'live') {
                                    setInputValue('I want to know if the Strategic AI Roadmap is right for my firm. Can you help assess fit?');
                                    setTimeout(() => handleSendMessage(), 100);
                                } else {
                                    startFlow('fit_check');
                                }
                            }}
                            className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 transition-colors"
                        >
                            Am I a fit?
                        </button>
                        <button
                            onClick={() => {
                                if (mode === 'live') {
                                    setInputValue('Can you walk me through ROI examples for a professional-service firm like mine?');
                                    setTimeout(() => handleSendMessage(), 100);
                                } else {
                                    startFlow('roi_teaser');
                                }
                            }}
                            className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 transition-colors"
                        >
                            Show me ROI
                        </button>
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        disabled={!inputValue.trim() || isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </>
    );
}
