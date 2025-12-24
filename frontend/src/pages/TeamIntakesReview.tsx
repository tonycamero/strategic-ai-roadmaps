import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CommandStrip } from '../components/dashboard/CommandStrip';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter';

export default function TeamIntakesReview() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: intakesData, isLoading } = useQuery({
    queryKey: ['owner-intakes'],
    queryFn: () => api.getOwnerIntakes(),
  });

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const intakes = intakesData?.intakes || [];
  const roleLabels: Record<string, string> = {
    ops: 'Operations',
    sales: 'Sales',
    delivery: 'Delivery',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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

      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Team Intakes Review</h1>
          <p className="text-sm text-slate-400">
            Review intake responses from your leadership team
          </p>
        </div>

        {isLoading ? (
          <div className="text-slate-400">Loading intakes...</div>
        ) : intakes.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400">No team intakes submitted yet.</p>
            <p className="text-sm text-slate-500 mt-2">
              Invite your team members to complete their intake forms.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {intakes.map((intake: any) => (
              <div key={intake.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {roleLabels[intake.role] || intake.role}
                    </h3>
                    <p className="text-sm text-slate-400">
                      Submitted {new Date(intake.createdAt as any).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-medium rounded-full">
                    Complete
                  </span>
                </div>

                <div className="space-y-4">
                  {Object.entries((intake.answers || {}) as any).map(([key, value]) => (
                    <div key={key} className="border-t border-slate-800 pt-4">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-slate-200">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
