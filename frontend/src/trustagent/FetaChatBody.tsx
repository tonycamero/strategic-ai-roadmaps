import ReactMarkdown from 'react-markdown';
import { type ConversationMessage } from './flows';

interface FetaChatBodyProps {
    messages: ConversationMessage[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    handleOptionClick: (id: string, label: string, next: string) => void;
    handleCtaClick: (cta: any) => void;
}

export function FetaChatBody({
    messages,
    isLoading,
    messagesEndRef,
    handleOptionClick,
    handleCtaClick,
}: FetaChatBodyProps) {
    return (
        <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && isLoading ? (
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
                <div className="flex-1 px-4 py-2 text-center text-slate-500 text-sm italic bg-slate-900/50 rounded-lg border border-slate-800">
                    Please select an option from the diagnostic choices above.
                </div>
            </div>
        </>
    );
}
