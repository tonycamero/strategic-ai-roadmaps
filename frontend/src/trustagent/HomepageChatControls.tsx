import { useRef } from 'react';
import { type ConversationMessage } from './flows';


interface HomepageChatControlsProps {
    isLoading: boolean;
    inputValue: string;
    setInputValue: (val: string) => void;
    handleSendMessage: () => Promise<void>;
    mode: 'simulated' | 'live';
    startFlow: (flowId: any) => void;
    messages: ConversationMessage[];
}

export function HomepageChatControls({
    isLoading,
    inputValue,
    setInputValue,
    handleSendMessage,
    mode,
    startFlow,
    messages,
}: HomepageChatControlsProps) {
    const inputRef = useRef<HTMLInputElement>(null);



    return (
        <div className="p-6 border-t border-slate-800">
            {/* Suggested prompts */}
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
    );
}
