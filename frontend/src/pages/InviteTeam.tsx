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
        <div className="mb-8 bg-blue-900/20 border border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👥</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-200 mb-2">
                Why Your Team's Input Matters
              </h3>
              <p className="text-xs text-blue-300/80 mb-3">
                To build an accurate AI Roadmap, we need perspectives from three key roles in your organization.
                Each team member will complete a brief 10-minute intake focused on their area of expertise.
              </p>
              <p className="text-xs text-blue-300/60">
                <strong>Required:</strong> All three roles must be invited to continue. They'll receive an email
                with a secure link to complete their intake.
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
                className={`border rounded-xl p-6 transition-all ${
                  status === 'accepted'
                    ? 'bg-green-900/10 border-green-800'
                    : status === 'pending'
                    ? 'bg-yellow-900/10 border-yellow-800'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{role.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-200 mb-1">
                      {role.label}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">{role.description}</p>

                    {status === 'not_sent' ? (
                      <div className="space-y-3">
                        <div>
                          <input
                            type="email"
                            value={emails[role.id]}
                            onChange={(e) => setEmails(prev => ({ ...prev, [role.id]: e.target.value }))}
                            placeholder="team.member@company.com"
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {errors[role.id] && (
                            <p className="mt-1 text-xs text-red-400">{errors[role.id]}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleInvite(role.id)}
                          disabled={sendInviteMutation.isPending}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {sendInviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                        </button>
                      </div>
                    ) : status === 'pending' ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm text-slate-300 mb-1">{invite?.email}</div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-900/40 border border-yellow-800 rounded-full">
                            <span className="text-xs text-yellow-300">⏳ Invitation sent - awaiting response</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-sm text-slate-300 mb-1">{invite?.email}</div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/40 border border-green-800 rounded-full">
                            <span className="text-xs text-green-300">✓ Accepted - intake in progress</span>
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
            className="flex-1 px-6 py-3 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-900 transition-colors"
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
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
