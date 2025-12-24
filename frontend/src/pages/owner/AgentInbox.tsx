import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useLocation } from 'wouter';

type RoleType = 'owner' | 'ops' | 'sales' | 'delivery' | 'agent_support';

const ROLE_LABELS: Record<RoleType, string> = {
  owner: 'Owner',
  ops: 'Operations',
  sales: 'Sales',
  delivery: 'Delivery',
  agent_support: 'Agent Support',
};

const ROLE_COLORS: Record<RoleType, string> = {
  owner: 'bg-purple-900/40 text-purple-300 border-purple-800',
  ops: 'bg-blue-900/40 text-blue-300 border-blue-800',
  sales: 'bg-green-900/40 text-green-300 border-green-800',
  delivery: 'bg-orange-900/40 text-orange-300 border-orange-800',
  agent_support: 'bg-slate-700 text-slate-300 border-slate-600',
};

interface Thread {
  id: string;
  roleType: RoleType;
  openaiThreadId: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function AgentInbox() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Fetch threads with optional role filter
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ['agent-threads', selectedRole],
    queryFn: () => api.getAgentThreads(selectedRole || undefined),
    refetchInterval: 5000,
    staleTime: 2000, // Prevent unnecessary refetches
  });

  // Fetch messages for selected thread
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['agent-messages', selectedThreadId],
    queryFn: () => selectedThreadId ? api.getThreadMessages(selectedThreadId) : null,
    enabled: !!selectedThreadId,
    refetchInterval: 3000,
    staleTime: 1000, // Prevent flicker on refetch
  });

  const threads = (threadsData?.threads || []) as Thread[];
  const messages = ((messagesData as any)?.messages || []) as Message[];

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Agent Inbox</h1>
              <p className="text-sm text-slate-400 mt-1">
                View conversations with your AI assistants
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
              >
                ← Back to Dashboard
              </button>
              {(user?.role as string) === 'superadmin' && (
                <button
                  onClick={() => setLocation('/superadmin')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
                >
                  Superadmin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel: Thread List */}
          <div className="lg:col-span-1 bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200 mb-3">Filter by Role</h2>
              <select
                value={selectedRole || ''}
                onChange={(e) => {
                  setSelectedRole(e.target.value as RoleType || null);
                  setSelectedThreadId(null);
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <option key={role} value={role}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {threadsLoading ? (
                <div className="text-sm text-slate-400">Loading threads...</div>
              ) : threads.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8">
                  No conversations yet
                </div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedThreadId === thread.id
                        ? 'bg-blue-900/40 border-blue-700'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${ROLE_COLORS[thread.roleType]}`}>
                        {ROLE_LABELS[thread.roleType]}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(thread.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      Thread {thread.id.slice(0, 8)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Message History */}
          <div className="lg:col-span-2 bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            {!selectedThreadId ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Select a thread to view messages
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-200">
                    Conversation History
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="text-sm text-slate-400">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-slate-400 text-center py-8">
                      No messages in this thread
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id}>
                        {msg.role === 'user' ? (
                          /* User Message */
                          <div className="flex justify-end mb-4">
                            <div className="max-w-[80%]">
                              <div className="bg-blue-600 text-white p-3 rounded-lg">
                                <div className="text-sm whitespace-pre-wrap">
                                  {msg.content}
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 mt-1 text-right">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Assistant Response */
                          <div className="flex justify-start mb-4">
                            <div className="max-w-[80%]">
                              <div className="bg-slate-800 text-slate-100 p-3 rounded-lg border border-slate-700">
                                <div className="text-sm whitespace-pre-wrap">
                                  {msg.content}
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
