import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

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

  const queryMutation = useMutation({
    mutationFn: async (message: string) => {
      const token = localStorage.getItem('token');
      
      // Decode JWT to check role
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
      const isSuperadmin = payload?.role === 'superadmin';
      
      // Superadmin uses legacy console agent, owners use tenant Assistant
      const endpoint = isSuperadmin ? '/api/agent/query' : '/api/assistant/query';
      const body = isSuperadmin 
        ? { message, context: {} }
        : { message, roleType: 'owner' };
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Agent query failed');
      }

      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || data.response,
          timestamp: new Date(),
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

  const clearConversation = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 hover:scale-110 touch-manipulation"
        title="Open Agent Assistant"
        aria-label="Open Agent Assistant"
      >
        💬
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-28 sm:inset-x-auto sm:bottom-24 sm:right-6 w-full max-w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-10rem)] sm:h-[600px] bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col z-50 animate-slideUp">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">Roadmap Assistant</h3>
              <p className="text-xs text-blue-100">Ask about firms, intakes, roadmaps</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-11 h-11 flex items-center justify-center text-white hover:bg-blue-700 active:bg-blue-800 rounded-md text-2xl leading-none touch-manipulation"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">
                <div className="mb-2">👋</div>
                <p>Ask me anything about your firms, intakes, or roadmaps.</p>
                <div className="mt-4 text-xs space-y-1">
                  <p className="text-gray-400">Try asking:</p>
                  <p className="italic">"Tell me about Hayes Real Estate"</p>
                  <p className="italic">"List all firms"</p>
                  <p className="italic">"What are Hayes' top pain points?"</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {queryMutation.isPending && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
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
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-2"
              >
                Clear conversation
              </button>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about firms, intakes..."
                className="flex-1 px-4 py-3.5 sm:py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-base touch-manipulation"
                disabled={queryMutation.isPending}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || queryMutation.isPending}
                className="px-5 py-3.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-manipulation font-medium"
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
