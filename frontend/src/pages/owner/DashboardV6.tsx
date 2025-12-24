import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { api } from '../../lib/api';
import { useLocation } from 'wouter';
import { CommandStrip } from '../../components/dashboard/CommandStrip';
import { ProgressHeroCard } from '../../components/dashboard/ProgressHeroCard';
import { InsightsSidebar } from '../../components/dashboard/InsightsSidebar';
import { getOwnerDocumentLabel, TenantDocument } from '../../types/documents';
import { FileText } from 'lucide-react';
import { isReadOnlyStaff } from '../../utils/permissions';
import { canEdit } from '../../utils/roleAwareness';

export default function DashboardV6() {
  const { user, logout } = useAuth();
  const { businessType } = useTenant();
  const [, setLocation] = useLocation();

  const { data: intakesData } = useQuery({
    queryKey: ['owner-intakes'],
    queryFn: () => api.getOwnerIntakes(),
    refetchInterval: 5000,
  });

  const { data: documentsData, isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.listDocuments(),
  });

  const { data: advisorThreadsData, isLoading: advisorLoading } = useQuery({
    queryKey: ['advisor-threads'],
    queryFn: () => api.listAdvisorThreads(),
  });

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const intakes = intakesData?.intakes || [];
  const documents = documentsData?.documents || [];
  const advisorThreads = advisorThreadsData?.threads || [];
  const readOnly = user?.role ? isReadOnlyStaff(user.role) : false;

  // Prepare team status for hero card
  const teamStatus = ['ops', 'sales', 'delivery'].map(role => ({
    role,
    intakeComplete: !!intakes.find((int: any) => int.role === role),
  }));

  // Group documents by category
  const documentsByCategory: Record<string, TenantDocument[]> = {
    'Diagnostic Outputs': [],
    'AI Opportunities': [],
    'Roadmap Files': [],
  };

  documents.forEach((doc: any) => {
    const title = doc.title;
    if (title === 'Company Diagnostic Map') {
      documentsByCategory['Diagnostic Outputs'].push(doc);
    } else if (title === 'AI Leverage & Opportunity Map' || title === 'Discovery Call Preparation Questions') {
      documentsByCategory['AI Opportunities'].push(doc);
    } else if (title === 'Strategic Roadmap Skeleton' || title === 'Implementation Ticket Bundle' || title === 'Final Strategic Roadmap') {
      documentsByCategory['Roadmap Files'].push(doc);
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Command Strip */}
      <CommandStrip
        firmName={user?.name || 'Organization'}
        cohort="Eugene Q1 2026"
        onScheduleCall={() => window.location.href = 'mailto:tony@scend.cash?subject=Schedule Discovery Call'}
        onOpenRoadmap={() => setLocation('/roadmap')}
        onLogout={handleLogout}
        isSuperadmin={(user?.role as string) === 'superadmin'}
        onSuperadminClick={() => setLocation('/superadmin')}
        isRoadmapGenerated={false}
      />

      {/* Read-only indicator for staff */}
      {readOnly && (
        <div className="border-b border-slate-800 bg-amber-900/20 backdrop-blur">
          <div className="px-6 py-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-900/40 px-3 py-1 text-xs font-medium text-amber-200">
                🔒 View-Only Access
              </span>
              <span className="text-xs text-slate-400">
                You can view all firm data but cannot make changes
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chamber Edition Badge */}
      {businessType === 'chamber' && (
        <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="px-6 py-2">
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

      {/* Main Layout: 2 columns (sidebar is in OnboardingLayout) */}
      <div className="flex">
        {/* Center: Main Content */}
        <main className="flex-1 p-6 space-y-6 max-w-5xl">
          {/* Hero Progress Card */}
          <ProgressHeroCard teamStatus={teamStatus} />

          {/* Your Documents - Grouped by Category */}
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-6">Your Documents</h2>
            {docsLoading ? (
              <div className="text-sm text-slate-400">Loading...</div>
            ) : documents.length === 0 ? (
              <div className="text-sm text-slate-400">No documents yet.</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(documentsByCategory).map(([category, categoryDocs]) => {
                  if (categoryDocs.length === 0) return null;
                  return (
                    <div key={category}>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryDocs.map((doc) => {
                          const { title: displayTitle, subtitle: displaySubtitle } = getOwnerDocumentLabel(doc);
                          return (
                            <div
                              key={doc.id}
                              className="border border-slate-800 rounded-lg p-4 bg-slate-900/60 hover:bg-slate-900 transition-colors flex items-start justify-between gap-4"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-100 text-sm mb-1">
                                  {displayTitle}
                                </div>
                                <div className="text-xs text-slate-400 leading-relaxed">
                                  {displaySubtitle}
                                </div>
                              </div>
                              <button
                                onClick={() => setLocation(`/owner/case-study/${doc.id}`)}
                                className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={!canEdit(user?.role || '')}
                              >
                                {canEdit(user?.role || '') ? 'View' : 'View Only'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Advisor Notes */}
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Advisor Notes</h2>
            {advisorLoading ? (
              <div className="text-sm text-slate-400">Loading...</div>
            ) : advisorThreads.length === 0 ? (
              <div className="border border-slate-800 rounded-lg p-4 bg-slate-900/60">
                <p className="text-xs text-slate-400">
                  When our team reviews your roadmap, shared notes will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {advisorThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className="border border-slate-800 rounded-lg px-4 py-3 bg-slate-900/60 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="text-xs text-slate-400">
                        <span className="capitalize font-medium text-slate-300">{thread.roleType}</span>
                        {' · '}
                        {new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="text-sm text-slate-100 line-clamp-2">
                      {thread.preview}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right: Insights Sidebar */}
        <div className="p-6">
          <InsightsSidebar />
        </div>
      </div>
    </div>
  );
}
