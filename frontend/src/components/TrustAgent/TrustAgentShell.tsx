import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { TrustAgentAvatar } from '../../trustagent/TrustAgentAvatar';

export interface TrustAgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  cta?: {
    type: string;
    label: string;
    action?: () => void;
  };
  reveal?: {
    headline: string;
    signals: string[];
    diagnosis: string;
  };
}

export interface TrustAgentShellProps {
  title?: string;
  subtitle?: string;
  messages: TrustAgentMessage[];
  isLoading?: boolean;
  onSend: (content: string) => void;
  suggestedPrompts?: Array<{
    label: string;
    prompt: string;
  }>;
  showBubble?: boolean; // Show floating bubble
  bubblePosition?: 'top-right' | 'bottom-right';
  isOpen?: boolean; // Controlled open state (optional)
  onClose?: () => void; // Callback when panel closes
  enabled?: boolean; // Added for compatibility
}

export function TrustAgentShell({
  title = 'Trust Console Agent',
  subtitle = 'Your AI assistant',
  messages = [],
  isLoading = false,
  onSend = () => { },
  suggestedPrompts = [],
  showBubble = true,
  bubblePosition = 'top-right',
  isOpen: controlledIsOpen,
  onClose,
}: TrustAgentShellProps) {
  // Defensive defaults
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safePrompts = Array.isArray(suggestedPrompts) ? suggestedPrompts : [];
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onClose !== undefined
    ? (value: boolean) => {
      if (!value) onClose();
      setInternalIsOpen(value);
    }
    : setInternalIsOpen;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Refocus input after loading completes
  useEffect(() => {
    if (isOpen && !isLoading) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen, isLoading]);

  // ESC to close panel
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    onSend(inputValue.trim());
    setInputValue('');
    // Keep focus in input after sending
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleSuggestedPromptClick = (prompt: string) => {
    setInputValue(prompt);
    setTimeout(() => handleSendMessage(), 50);
  };

  const bubbleStyles = {
    'top-right': 'top-20 right-5',
    'bottom-right': 'bottom-6 right-6',
  };

  return createPortal(
    <>
      {/* Bubble - always visible if enabled */}
      {showBubble && !isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          className={`fixed ${bubbleStyles[bubblePosition]} z-[80] cursor-pointer hover:scale-110 transition-transform duration-200`}
          aria-label={`Open ${title}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setIsOpen(true);
            }
          }}
        >
          <TrustAgentAvatar size="medium" showPulse={true} />
        </div>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed inset-0 sm:top-0 sm:right-0 sm:bottom-0 sm:left-auto w-full sm:w-[440px] bg-slate-950 sm:border-l border-slate-800 z-[80] shadow-2xl flex flex-col"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-2xl leading-none transition-colors"
              aria-label="Close panel"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {safeMessages.length === 0 && !isLoading ? (
              <div className="text-center text-slate-400 mt-8">
                <p className="mb-4">👋 Hi! I'm {title}.</p>
                <p className="text-sm">Ask me anything or try a suggestion below.</p>
              </div>
            ) : safeMessages.length === 0 && isLoading ? (
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
              <>
                {safeMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-200'} rounded-lg p-4`}>
                      {msg.role === 'assistant' ? (
                        <div className="text-sm prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-line">{msg.content}</div>
                      )}

                      {msg.role === 'assistant' && msg.reveal && (
                        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-4 text-left">
                          <h3 className="text-base font-semibold text-white mb-2">
                            {msg.reveal.headline}
                          </h3>

                          <ul className="mb-3 list-disc pl-5 text-sm text-slate-300 space-y-1">
                            {msg.reveal.signals.map((signal, i) => (
                              <li key={i}>{signal}</li>
                            ))}
                          </ul>

                          <p className="text-sm text-slate-400 font-medium">
                            {msg.reveal.diagnosis}
                          </p>
                        </div>
                      )}

                      {/* CTA */}
                      {msg.cta && (
                        <button
                          onClick={msg.cta.action}
                          className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                          {msg.cta.label}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-slate-900 text-slate-200 rounded-lg p-4">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800">
            {/* Suggested prompts */}
            {safeMessages.length === 0 && safePrompts.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {safePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPromptClick(prompt.prompt)}
                    className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 transition-colors"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
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
                type="button"
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
