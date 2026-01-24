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
          <div className="flex items-center justify-center p-12">
            <div className="text-slate-400 animate-pulse text-sm font-bold uppercase tracking-widest">
              Loading Team Context...
            </div>
          </div>
        ) : intakes.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center card-glow-hover">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <span className="text-2xl">📭</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">No Team Intakes Yet</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              When your team members complete their specific intake forms, their responses will appear here for your review.
            </p>
            <button
              onClick={() => setLocation('/invite-team')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20"
            >
              Invite Team Members
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {intakes.map((intake: any) => (
              <div key={intake.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 card-glow-hover">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center border border-blue-900/30 text-blue-400 font-bold uppercase">
                      {roleLabels[intake.role]?.[0] || intake.role?.[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {roleLabels[intake.role] || intake.role}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                        Submitted {new Date(intake.createdAt as any).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest rounded-full">
                    Complete
                  </span>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  {Object.entries((intake.answers || {}) as any).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
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
