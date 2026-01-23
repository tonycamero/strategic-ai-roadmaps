import { useAuth } from '../../context/AuthContext';
import { useBusinessTypeProfile } from '../../context/TenantContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

/**
 * Dashboard for team members (ops, sales, delivery)
 * Shows:
 * - Their intake status
 * - Roadmap progress relevant to their role
 * - TrustAgent for questions
 */
export default function TeamMemberDashboard() {
  const { user, logout } = useAuth();
  const profile = useBusinessTypeProfile();

  const { data: intakeData, isLoading } = useQuery({
    queryKey: ['my-intake'],
    queryFn: () => api.getMyIntake(),
  });

  const roleLabel = user?.role
    ? profile.roleLabels[user.role as keyof typeof profile.roleLabels]
    : 'Team Member';

  const hasCompletedIntake = !!intakeData?.intake;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">
                {roleLabel} Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Welcome back, {user?.name || 'Team Member'}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Intake Status Card */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Your Intake Status
            </h2>
            
            {isLoading ? (
              <div className="text-slate-400">Loading...</div>
            ) : hasCompletedIntake ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Intake Complete</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Your {roleLabel.toLowerCase()} intake has been submitted. The owner will review your responses and incorporate them into the strategic roadmap.
                </p>
                <a
                  href={`/intake/${user?.role}`}
                  className="inline-block text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Update your responses →
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Intake Pending</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Please complete your {roleLabel.toLowerCase()} intake to help shape the strategic roadmap.
                </p>
                <a
                  href={`/intake/${user?.role}`}
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Complete Intake
                </a>
              </div>
            )}
          </div>

          {/* Roadmap Status Card */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Roadmap Status
            </h2>
            <p className="text-slate-400 text-sm">
              Your owner is building the strategic roadmap. Once complete, you'll be able to view implementation priorities and how your role contributes to the overall strategy.
            </p>
            <p className="text-slate-500 text-xs mt-4">
              Check back soon or ask your owner for updates.
            </p>
          </div>

          {/* TrustAgent Info Card */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              Need Help?
            </h2>
            <p className="text-slate-400 text-sm">
              Use the TrustAgent assistant (bottom right) to ask questions about the roadmap, your role, or next steps.
            </p>
            <div className="mt-4 flex gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 bg-slate-800 rounded">Ask about priorities</span>
              <span className="px-2 py-1 bg-slate-800 rounded">Get timeline updates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
