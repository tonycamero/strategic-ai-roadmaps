import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getInteractionMode } from '../utils/roleAwareness';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type RoleType = 'owner' | 'ops' | 'sales' | 'delivery' | 'agent_support';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  routedTo?: RoleType;
  routingSource?: string;
}

const ROLE_OPTIONS: { value: RoleType; label: string; emoji: string }[] = [
  { value: 'owner', label: 'Owner Assistant', emoji: '👔' },
  { value: 'ops', label: 'Operations Lead', emoji: '⚙️' },
  { value: 'sales', label: 'Sales Lead', emoji: '📈' },
  { value: 'delivery', label: 'Delivery Lead', emoji: '🚀' },
  { value: 'agent_support', label: 'Agent Support', emoji: '🤝' },
];

interface AgentChatPanelProps {
  defaultRole?: RoleType;
  showRoleSelector?: boolean;
  showAutoRoute?: boolean;
}

export function AgentChatPanel({ 
  defaultRole = 'owner', 
  showRoleSelector = true,
  showAutoRoute = true,
}: AgentChatPanelProps) {
  const { user } = useAuth();
  const mode = getInteractionMode(user?.role || 'owner');
  const isObserver = mode === 'observer';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>(defaultRole);
  const [autoRoute, setAutoRoute] = useState(false);
  const [autoRouteDebounceTimer, setAutoRouteDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Lock body scroll when chat is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  const debouncedSetAutoRoute = useCallback((value: boolean) => {
    if (autoRouteDebounceTimer) {
      clearTimeout(autoRouteDebounceTimer);
    }
    const timer = setTimeout(() => {
      setAutoRoute(value);
    }, 300);
    setAutoRouteDebounceTimer(timer);
  }, [autoRouteDebounceTimer]);

  const queryMutation = useMutation({
    mutationFn: async (message: string) => {
      const token = localStorage.getItem('token');
      
      // Decode JWT to check role
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const isSuperadmin = payload?.role === 'superadmin';
      
      if (isSuperadmin) {
        // Superadmin uses legacy console agent
        const res = await fetch('/api/agent/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ message, context: {} }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Agent query failed');
        }

        return res.json();
      } else {
        // Owner/team uses new Assistant with roleType + autoRoute
        const res = await fetch('/api/assistant/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            message, 
            roleType: selectedRole,
            autoRoute,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Agent query failed');
        }

        return res.json();
      }
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || data.response,
          timestamp: new Date(),
          routedTo: data.routedTo,
          routingSource: data.routingSource,
        },
      ]);
    },
    onError: (error: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!input.trim() || queryMutation.isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    queryMutation.mutate(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedRoleData = ROLE_OPTIONS.find(r => r.value === selectedRole);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-110 touch-manipulation"
        title="Open AI Assistant"
        aria-label="Open AI Assistant"
      >
        💬
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 rounded-xl shadow-2xl border border-slate-800 flex flex-col z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-xl">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <button
                    title="What can I ask?&#10;&#10;• Roadmap status and progress&#10;• System implementation details&#10;• Ticket status and blockers&#10;• Pain points and goals&#10;• Timeline and milestones&#10;• Metrics and outcomes"
                    className="text-blue-200 hover:text-white text-sm w-6 h-6 flex items-center justify-center"
                  >
                    ?
                  </button>
                </div>
                <p className="text-xs text-blue-100 mt-0.5">
                  {selectedRoleData?.emoji} {selectedRoleData?.label}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-blue-100 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Role Selector */}
            {showRoleSelector && (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as RoleType)}
                className="w-full px-3 py-2 bg-blue-700 text-white border border-blue-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={queryMutation.isPending}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* AutoRoute Toggle */}
            {showAutoRoute && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRoute}
                  onChange={(e) => debouncedSetAutoRoute(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-blue-700 border-blue-500 rounded focus:ring-blue-500"
                  disabled={queryMutation.isPending}
                />
                <span className="text-xs text-blue-100">
                  Auto-route to best agent
                </span>
              </label>
            )}
          </div>

          {/* Observer Mode Banner */}
          {isObserver && (
            <div className="px-3 py-2 mx-4 mt-2 rounded-lg border border-amber-700/50 bg-amber-900/20 text-xs text-amber-200">
              🔒 Observer mode – you can ask questions, but only the owner can execute changes.
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
            {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-8">
                <svg className="w-8 h-8 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p>Ask me anything about your roadmap, systems, or operations.</p>
                <div className="mt-4 text-xs space-y-1">
                  <p className="text-slate-500">Try asking:</p>
                  <p className="italic">"What's my roadmap status?"</p>
                  <p className="italic">"Show ticket progress"</p>
                  <p className="italic">"What pain points did we identify?"</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-100 border border-slate-800'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 my-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-4 my-2 space-y-1" {...props} />,
                        p: ({node, ...props}) => <p className="my-2" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                        code: ({node, ...props}: any) => 
                          props.inline ? 
                            <code className="bg-slate-800 px-1 py-0.5 rounded text-xs" {...props} /> : 
                            <code className="block bg-slate-800 p-2 rounded my-2 text-xs overflow-x-auto" {...props} />,
                      }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {msg.routedTo && msg.routingSource && (
                    <div className="text-xs mt-2 pt-2 border-t border-slate-700 text-slate-400">
                      🎯 Routed to {ROLE_OPTIONS.find(r => r.value === msg.routedTo)?.label} 
                      {msg.routingSource !== 'semantic' && ` (${msg.routingSource})`}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {queryMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your roadmap..."
                className="flex-1 px-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-800 text-slate-100 text-sm placeholder:text-slate-500"
                disabled={queryMutation.isPending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || queryMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title={isObserver ? 'Observer mode - questions only' : 'Send message'}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
