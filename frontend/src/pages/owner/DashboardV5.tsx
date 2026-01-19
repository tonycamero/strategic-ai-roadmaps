import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTenant, useBusinessTypeProfile } from '../../context/TenantContext';
import { api, ApiError } from '../../lib/api';
import { useLocation } from 'wouter';
import { CommandStrip } from '../../components/dashboard/CommandStrip';
import { ROICard } from '../../components/roi/ROICard';
import { NextActionCard } from '../../components/dashboard/NextActionCard';
import { LeadershipStatusTable } from '../../components/dashboard/LeadershipStatusTable';
import { RoadmapStatusCard } from '../../components/dashboard/RoadmapStatusCard';
import { KeyFindingsPreview } from '../../components/dashboard/KeyFindingsPreview';
import { OnboardingRail } from '../../components/onboarding/OnboardingRail';
import { getOwnerDocumentLabel } from '../../types/documents';

type RoleType = 'ops' | 'sales' | 'delivery';

export default function DashboardV5() {
  const { user, logout } = useAuth();
  const { businessType } = useTenant();
  const profile = useBusinessTypeProfile();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [intakeDetailsOpen, setIntakeDetailsOpen] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<any>(null);
  const [documentsExpanded, setDocumentsExpanded] = useState(false);

  const { data: invitesData } = useQuery({
    queryKey: ['invites'],
    queryFn: () => api.listInvites(),
    refetchInterval: 5000,
  });

  const { data: intakesData } = useQuery({
    queryKey: ['owner-intakes'],
    queryFn: () => api.getOwnerIntakes(),
    refetchInterval: 5000,
  });

  const { data: documentsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.listDocuments(),
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['owner-dashboard'],
    queryFn: () => api.getOwnerDashboard(),
    refetchInterval: 10000,
    retry: false, // Don't retry if no roadmap exists yet
  });

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  // Calculate progress from new workflow-aware backend
  const invites = invitesData?.invites || [];
  const intakes = intakesData?.intakes || [];
  const documents = documentsData?.documents || [];
  const workflow = (dashboardData as any)?.workflow;

  const allIntakesComplete = workflow?.intakes?.allComplete || false;
  const sop01Generated = workflow?.sop01?.generated || false;
  const roadmapGenerated = workflow?.roadmapDocs?.generated || false;

  // Determine current phase based on new workflow
  const currentPhase: 'onboarding' | 'roadmap_review' | 'pilot_design' | 'implementation' =
    !allIntakesComplete ? 'onboarding' :
      !roadmapGenerated ? 'roadmap_review' :
        'pilot_design';

  // Prepare leadership data for table
  const leadershipData = ['ops', 'sales', 'delivery'].map(role => {
    const invite = invites.find(inv => inv.role === role);
    const intake = intakes.find(int => int.role === role);
    return {
      role: role as RoleType,
      name: invite?.email?.split('@')[0] || undefined,
      email: invite?.email,
      inviteId: invite?.id,
      inviteAccepted: !!invite?.accepted,
      intakeComplete: !!intake,
    };
  });

  // Resend invitation mutation
  const resendInviteMutation = useMutation({
    mutationFn: (inviteId: string) => api.resendInvite(inviteId),
    onSuccess: () => {
      alert('Invitation resent successfully!');
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error: ApiError) => {
      alert(`Failed to resend invitation: ${error.message}`);
    },
  });

  // Revoke invitation mutation
  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => api.revokeInvite(inviteId),
    onSuccess: () => {
      alert('Invitation revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['invites'] });
    },
    onError: (error: ApiError) => {
      alert(`Failed to revoke invitation: ${error.message}`);
    },
  });

  // Key findings only show when SOP-01 is generated (removed hardcoded data)
  const keyFindings = sop01Generated ? [
    // TODO: Load from SOP-01 AI Leverage Map document
  ] : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Band 1: Command Strip */}
      <CommandStrip
        firmName={user?.name || 'Hayes Real Estate Group'}
        cohort="Eugene Q1 2026"
        onScheduleCall={() => window.location.href = 'mailto:tony@scend.cash?subject=Schedule Discovery Call'}
        onOpenRoadmap={() => setLocation('/roadmap')}
        onLogout={handleLogout}
        isSuperadmin={(user?.role as string) === 'superadmin'}
        onSuperadminClick={() => setLocation('/superadmin')}
        isRoadmapGenerated={roadmapGenerated}
      />

      {/* Chamber Edition Badge */}
      {businessType === 'chamber' && (
        <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Chamber Edition
              </span>
              <span className="text-xs text-slate-400">
                Customized for membership organizations
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Band 2: Onboarding Rail + Main Content */}
      <div className="flex">
        <OnboardingRail />

        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Band 2: Two-column work zone */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left column: Execution */}
            <div className="space-y-6">
              {/* This Week's Focus - show when documents exist or roadmap generated */}
              {(roadmapGenerated || documents.length > 0) && (
                <NextActionCard
                  phase={currentPhase}
                  actions={[]}
                  onViewPlan={() => setLocation('/roadmap')}
                />
              )}

              {/* Roadmap Status - Top Priority */}
              <RoadmapStatusCard
                status={roadmapGenerated ? 'finalized' : 'draft'}
                lastUpdated={new Date()}
                nextMilestone={roadmapGenerated ? 'Select pilot systems' : 'Complete workflow steps'}
                onOpenRoadmap={() => setLocation('/roadmap')}
                isRoadmapGenerated={roadmapGenerated}
              />

              {/* Workflow Status */}
              {workflow && (
                <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-200">
                      Roadmap Generation Workflow
                    </h2>
                    <span className="text-2xl">🔄</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Intakes */}
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">1. Intakes</span>
                        {workflow.intakes.allComplete ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-yellow-400">⋯</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-slate-100">
                        {workflow.intakes.completed}/{workflow.intakes.total}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {workflow.intakes.allComplete ? 'Complete' : 'In Progress'}
                      </div>
                    </div>

                    {/* SOP-01 */}
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">2. Business Diagnostic</span>
                        {workflow.sop01.generated ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-slate-500">○</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-slate-100">
                        {workflow.sop01.count}/{workflow.sop01.expectedCount}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {workflow.sop01.generated ? 'Generated' : 'Not Started'}
                      </div>
                    </div>

                    {/* Discovery Call */}
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">3. Discovery Call</span>
                        {workflow.discovery.hasNotes ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-slate-500">○</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-slate-100">
                        {workflow.discovery.hasNotes ? '1' : '0'}/1
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {workflow.discovery.hasNotes ? 'Notes Saved' : 'Pending'}
                      </div>
                    </div>

                    {/* Roadmap */}
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-400">4. Strategic Roadmap</span>
                        {workflow.roadmapDocs.generated ? (
                          <span className="text-green-400">✓</span>
                        ) : (
                          <span className="text-slate-500">○</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-slate-100">
                        {workflow.roadmapDocs.count}/{workflow.roadmapDocs.expectedCount}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {workflow.roadmapDocs.generated ? 'Generated' : 'Not Started'}
                      </div>
                    </div>
                  </div>

                  {/* Next Action Prompt */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    {!workflow.intakes.allComplete ? (
                      <p className="text-sm text-slate-300">
                        <span className="text-blue-400 font-medium">Next:</span> Complete remaining intake forms
                      </p>
                    ) : !workflow.sop01.generated ? (
                      <p className="text-sm text-slate-300">
                        <span className="text-blue-400 font-medium">Next:</span> Generate business diagnostic (in progress)
                      </p>
                    ) : !workflow.discovery.hasNotes ? (
                      <p className="text-sm text-slate-300">
                        <span className="text-blue-400 font-medium">Next:</span> Schedule and complete discovery call
                      </p>
                    ) : !workflow.roadmapDocs.generated ? (
                      <p className="text-sm text-slate-300">
                        <span className="text-blue-400 font-medium">Next:</span> Roadmap generation in progress (Admin action required)
                      </p>
                    ) : (
                      <p className="text-sm text-green-300">
                        <span className="text-green-400 font-medium">✓</span> Roadmap generation workflow complete!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Key Findings - only show when SOP-01 generated */}
              {sop01Generated && keyFindings.length > 0 && (
                <KeyFindingsPreview findings={keyFindings} />
              )}

              {/* Leadership Team Status */}
              <LeadershipStatusTable
                leaders={leadershipData}
                onViewIntake={(role) => {
                  const intake = intakes.find(int => int.role === role);
                  if (intake) {
                    setSelectedIntake(intake);
                    setIntakeDetailsOpen(true);
                  }
                }}
                onManageInvites={() => {
                  const uninvitedRole = leadershipData.find(l => !l.email);
                  if (uninvitedRole) {
                    setSelectedRole(uninvitedRole.role);
                    setShowInviteModal(true);
                  }
                }}
                onResendInvite={(inviteId) => resendInviteMutation.mutate(inviteId)}
                onRevokeInvite={(inviteId) => {
                  if (confirm('Are you sure you want to revoke this invitation?')) {
                    revokeInviteMutation.mutate(inviteId);
                  }
                }}
              />

              {/* Your Documents - Collapsible */}
              <div className="bg-slate-900/40 rounded-xl border border-slate-800">
                <button
                  onClick={() => setDocumentsExpanded(!documentsExpanded)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-900/40 transition-colors rounded-t-xl"
                >
                  <h3 className="text-sm font-semibold text-slate-200">Your Documents</h3>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${documentsExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {documentsExpanded && (
                  <div className="px-6 pb-6">
                    {docsLoading ? (
                      <div className="text-sm text-slate-400">Loading...</div>
                    ) : documents.length === 0 ? (
                      <div className="text-sm text-slate-400">No documents yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc: any) => {
                          const { title: displayTitle, subtitle: displaySubtitle } = getOwnerDocumentLabel(doc);
                          return (
                            <div
                              key={doc.id}
                              className="border border-slate-800 rounded-lg p-4 bg-slate-900/60 hover:bg-slate-900 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="font-medium text-slate-100 text-sm">
                                    {displayTitle}
                                  </div>
                                  <div className="text-sm text-slate-400 mt-2">
                                    {displaySubtitle}
                                  </div>
                                </div>
                                <button
                                  onClick={() => setLocation(`/owner/case-study/${doc.id}`)}
                                  className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                                >
                                  View
                                </button>
                              </div>
                              <div className="text-xs text-slate-500 mt-3">
                                {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Status & Context */}
            <div className="space-y-6">
              {/* Need Support */}
              {allIntakesComplete && (
                <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-slate-100">Need Support?</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Schedule a call or send us a message</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLocation('/agents/inbox')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors"
                    >
                      Agent Inbox
                    </button>
                  </div>
                </div>
              )}

              {/* Transformation Metrics */}
              <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-200">
                      Transformation Metrics
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Track ROI, KPIs, and performance trends
                    </p>
                  </div>
                  <span className="text-2xl">📈</span>
                </div>
                <button
                  onClick={() => setLocation('/owner/transformation')}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  View Transformation Dashboard
                </button>
              </div>

              {/* ROI Insights Module */}
              <ROICard />
            </div>
          </div>
        </div>



        {/* Modals */}
        {showInviteModal && selectedRole && (
          <InviteModal
            role={selectedRole}
            roleLabel={profile.roleLabels[selectedRole]}
            onClose={() => {
              setShowInviteModal(false);
              setSelectedRole(null);
            }}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['invites'] });
              setShowInviteModal(false);
              setSelectedRole(null);
            }}
          />
        )}

        {intakeDetailsOpen && selectedIntake && (
          <IntakeDetailsModal
            intake={selectedIntake}
            onClose={() => {
              setIntakeDetailsOpen(false);
              setSelectedIntake(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Reuse modals from DashboardV4
function InviteModal({
  role,
  roleLabel,
  onClose,
  onSuccess
}: {
  role: string;
  roleLabel: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const createInviteMutation = useMutation({
    mutationFn: api.createInvite,
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: ApiError) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createInviteMutation.mutate({ email, role: role as 'ops' | 'sales' | 'delivery', name: '', perceptionPulse: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-100">Invite {roleLabel}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="leader@company.com"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInviteMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {createInviteMutation.isPending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IntakeDetailsModal({ intake, onClose }: { intake: any; onClose: () => void }) {
  const profile = useBusinessTypeProfile();
  const roleLabels: Record<string, string> = {
    ops: profile.roleLabels.ops,
    sales: profile.roleLabels.sales,
    delivery: profile.roleLabels.delivery,
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-slate-950 border-b border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-100 capitalize">
                {roleLabels[intake.role] || intake.role} Intake
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Submitted by {intake.userName || intake.userEmail}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-3xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {Object.entries(intake.answers || {}).map(([key, value]) => (
              <div key={key} className="border-b border-slate-800 pb-4 last:border-0">
                <h3 className="text-sm font-medium text-slate-300 mb-2">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </h3>
                <p className="text-slate-100 whitespace-pre-wrap leading-relaxed text-sm">
                  {String(value)}
                </p>
              </div>
            ))}

            {Object.keys(intake.answers || {}).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No intake data available
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900/40 border-t border-slate-800 p-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">
              Submitted {new Date(intake.createdAt).toLocaleDateString()} at{' '}
              {new Date(intake.createdAt).toLocaleTimeString()}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
