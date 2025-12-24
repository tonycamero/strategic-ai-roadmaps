import { useState, FormEvent, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

type RoleType = 'owner' | 'ops' | 'tc' | 'agent_support';
type Visibility = 'superadmin_only' | 'shared';

interface ChatMessage {
  id: string;
  role: 'admin' | 'assistant';
  content: string;
  timestamp: Date;
}

export function SuperadminAssistantConsole() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [roleType, setRoleType] = useState<RoleType>('owner');
  const [visibility, setVisibility] = useState<Visibility>('superadmin_only');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastThreadId, setLastThreadId] = useState<string | null>(null);

  // Fetch tenants list
  const { data: tenantsData, isLoading: loadingTenants } = useQuery({
    queryKey: ['superadmin-tenants'],
    queryFn: () => api.getSuperadminTenants(),
  });

  const tenants = tenantsData?.tenants || [];

  // Auto-select first tenant
  useEffect(() => {
    if (tenants.length > 0 && !selectedTenantId) {
      setSelectedTenantId(tenants[0].id);
    }
  }, [tenants, selectedTenantId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !selectedTenantId) return;

    const adminMsg: ChatMessage = {
      id: `admin-${Date.now()}`,
      role: 'admin',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, adminMsg]);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/superadmin/assistant/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          roleType,
          visibility,
          message: adminMsg.content,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || '(No response)',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (data.threadId) setLastThreadId(data.threadId);
    } catch (err: any) {
      console.error('Superadmin tap-in error:', err);
      setError(err.message || 'Failed to query assistant');
    } finally {
      setIsSending(false);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setMessages([]);
    setLastThreadId(null);
    setError(null);
  };

  const handleRoleChange = (role: RoleType) => {
    setRoleType(role);
    setMessages([]);
    setLastThreadId(null);
  };

  const handleVisibilityChange = (vis: Visibility) => {
    setVisibility(vis);
    setMessages([]);
    setLastThreadId(null);
  };

  if (loadingTenants) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        Loading tenants...
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        No tenants found
      </div>
    );
  }

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="flex flex-col h-[700px] border border-slate-700 rounded-xl bg-slate-800 shadow-sm">
      {/* Controls */}
      <div className="border-b border-slate-700 px-6 py-4 bg-slate-900">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex flex-col flex-1 min-w-[200px]">
            <span className="text-xs font-medium text-slate-300 mb-1">Tenant</span>
            <select
              className="text-sm border border-slate-600 bg-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedTenantId}
              onChange={e => handleTenantChange(e.target.value)}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-300 mb-1">Role</span>
            <select
              className="text-sm border border-slate-600 bg-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleType}
              onChange={e => handleRoleChange(e.target.value as RoleType)}
            >
              <option value="owner">Owner</option>
              <option value="ops">Ops</option>
              <option value="tc">TC</option>
              <option value="agent_support">Agent Support</option>
            </select>
            <span className="text-xs text-slate-400 mt-1">
              Assistant responds as if advising this role. This affects framing only.
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-300 mb-1">Visibility</span>
            <select
              className="text-sm border border-slate-600 bg-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={visibility}
              onChange={e => handleVisibilityChange(e.target.value as Visibility)}
            >
              <option value="superadmin_only">SuperAdmin Only</option>
              <option value="shared">Shared with Owner</option>
            </select>
          </div>
        </div>

        {lastThreadId && (
          <div className="text-xs text-slate-400 mt-2">
            Thread: <span className="font-mono">{lastThreadId.slice(0, 20)}...</span>
          </div>
        )}
      </div>

      {/* Tap-In Banner */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-700">
        <div className="text-xs bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-200">
          You are in <strong>SuperAdmin Tap-In</strong> mode for{' '}
          <strong>{selectedTenant?.name}</strong>, advising as{' '}
          <strong className="capitalize">{roleType}</strong>.
          {visibility === 'superadmin_only'
            ? ' This conversation is visible only to you.'
            : ' This conversation will be visible to the firm owner.'}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-900">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-8">
            <div className="mb-3 text-2xl">🔍</div>
            <p className="font-medium mb-2 text-slate-300">SuperAdmin Tap-In Mode</p>
            <p className="text-xs max-w-md mx-auto">
              You are in tap-in mode for <strong className="text-slate-200">{selectedTenant?.name}</strong>.
              Ask for snapshots, risks, or specific recommendations for this firm.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] text-sm px-4 py-3 rounded-lg shadow-sm ${
                msg.role === 'admin'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 border border-slate-600 text-slate-100'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className={`text-xs mt-1.5 ${msg.role === 'admin' ? 'text-blue-200' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-slate-700 border border-slate-600 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-3 text-sm text-red-400 border-t border-slate-700 bg-red-900/20">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-700 px-6 py-4 bg-slate-900 flex items-center gap-3">
        <input
          type="text"
          className="flex-1 text-sm px-4 py-2 border border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask as the platform admin…"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isSending || !selectedTenantId}
        />
        <button
          type="submit"
          className="text-sm px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isSending || !input.trim() || !selectedTenantId}
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
