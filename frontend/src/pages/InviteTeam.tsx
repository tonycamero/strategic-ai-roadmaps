import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useBusinessTypeProfile } from '../context/TenantContext';

type RoleId = 'ops' | 'sales' | 'delivery';

export default function InviteTeam() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const profile = useBusinessTypeProfile();

  // Dynamic roles based on business type
  const ROLES = useMemo(() => [
    { id: 'ops' as const, label: profile.roleLabels.ops, icon: '⚙️', description: 'Maps workflow friction and internal process bottlenecks' },
    { id: 'sales' as const, label: profile.roleLabels.sales, icon: '📈', description: 'Reveals follow-up gaps and pipeline inefficiencies' },
    { id: 'delivery' as const, label: profile.roleLabels.delivery, icon: '🚀', description: 'Surfaces handoff breakdowns and customer experience friction' },
  ], [profile]);

  // Fetch existing invites
  const { data: invitesData } = useQuery({
    queryKey: ['invites'],
    queryFn: () => api.listInvites(),
    refetchInterval: 3000,
  });

  const [emails, setEmails] = useState<Record<RoleId, string>>({
    ops: '',
    sales: '',
    delivery: '',
  });

  const [errors, setErrors] = useState<Record<RoleId, string>>({
    ops: '',
    sales: '',
    delivery: '',
  });

  // Populate existing invites
  useEffect(() => {
    if (invitesData?.invites) {
      const newEmails = { ...emails };
      invitesData.invites.forEach((invite: any) => {
        if (invite.role in newEmails) {
          newEmails[invite.role as RoleId] = invite.email;
        }
      });
      setEmails(newEmails);
    }
  }, [invitesData]);

  const sendInviteMutation = useMutation({
    mutationFn: ({ role, email }: { role: RoleId; email: string }) => api.createInvite({ role, email }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invites'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      setErrors(prev => ({ ...prev, [variables.role]: '' }));
    },
    onError: (error: any, variables) => {
      setErrors(prev => ({ ...prev, [variables.role]: error.message || 'Failed to send invite' }));
    },
  });

  const handleInvite = (role: RoleId) => {
    const email = emails[role].trim();

    if (!email) {
      setErrors(prev => ({ ...prev, [role]: 'Email is required' }));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors(prev => ({ ...prev, [role]: 'Invalid email format' }));
      return;
    }

    sendInviteMutation.mutate({ role, email });
  };

  // Check if all invites are sent
  const allInvitesSent = invitesData?.invites &&
    ROLES.every(role => invitesData.invites.some((inv: any) => inv.role === role.id));

  const getInviteStatus = (roleId: RoleId) => {
    const invite = invitesData?.invites?.find((inv: any) => inv.role === roleId);
    if (!invite) return 'not_sent';
    if (invite.accepted) return 'accepted';
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Invite Your Team</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Send intakes to your leadership team
            </p>
          </div>
          <button
            onClick={() => setLocation('/dashboard')}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Info Card */}
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center shrink-0">
              <span className="text-xl">👥</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-100 mb-2 uppercase tracking-widest">
                Why Your Team's Input Matters
              </h3>
              <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                To build an accurate AI Roadmap, we need perspectives from three key roles in your organization.
                Each team member will complete a brief 10-minute intake focused on their area of expertise.
              </p>
              <p className="text-xs text-blue-500 font-bold uppercase tracking-widest">
                <span className="text-slate-400 font-normal normal-case mr-1">Required:</span> All three roles must be invited.
              </p>
            </div>
          </div>
        </div>

        {/* Invite Cards */}
        <div className="space-y-4">
          {ROLES.map((role) => {
            const status = getInviteStatus(role.id);
            const invite = invitesData?.invites?.find((inv: any) => inv.role === role.id);

            return (
              <div
                key={role.id}
                className={`border rounded-xl p-6 transition-all ${status === 'accepted'
                    ? 'bg-emerald-950/30 border-emerald-900/50'
                    : status === 'pending'
                      ? 'bg-amber-950/30 border-amber-900/50'
                      : 'bg-slate-900 border-slate-800'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{role.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-100 mb-1 uppercase tracking-wider">
                      {role.label}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">{role.description}</p>

                    {status === 'not_sent' ? (
                      <div className="space-y-3">
                        <div>
                          <input
                            type="email"
                            value={emails[role.id]}
                            onChange={(e) => setEmails(prev => ({ ...prev, [role.id]: e.target.value }))}
                            placeholder="team.member@company.com"
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                          {errors[role.id] && (
                            <p className="mt-2 text-xs text-red-400 font-medium">{errors[role.id]}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleInvite(role.id)}
                          disabled={sendInviteMutation.isPending}
                          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                          {sendInviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                        </button>
                      </div>
                    ) : status === 'pending' ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-300 mb-2">{invite?.email}</div>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">⏳ Invitation Sent</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-300 mb-2">{invite?.email}</div>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">✓ Intake Active</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setLocation('/dashboard')}
            className="flex-1 px-6 py-4 border border-slate-800 rounded-xl font-bold text-slate-500 hover:text-slate-100 hover:bg-slate-900 transition-all uppercase tracking-widest text-sm"
          >
            Back to Dashboard
          </button>
          {allInvitesSent && (
            <button
              onClick={async () => {
                // Refresh onboarding progress before navigating
                await queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
                setLocation('/dashboard');
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 uppercase tracking-widest text-sm"
            >
              Continue →
            </button>
          )}
        </div>

        {!allInvitesSent && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Send all three invites to continue to the next step
          </p>
        )}
      </div>
    </div>
  );
}
