import { CommandStrip } from '../components/dashboard/CommandStrip';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter';
import { Calendar, Mail, CheckCircle } from 'lucide-react';

export default function DiscoveryCallScheduler() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const handleScheduleCall = () => {
    const subject = encodeURIComponent('Schedule Discovery Call');
    const body = encodeURIComponent(
      `Hi Tony,\n\nI'd like to schedule a discovery call to finalize our strategic AI roadmap.\n\nMy organization: ${user?.name || 'N/A'}\n\nPlease let me know your availability.\n\nThanks!`
    );
    window.location.href = `mailto:tony@scend.cash?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <CommandStrip
        firmName={user?.name || 'Organization'}
        cohort="Eugene Q1 2026"
        onScheduleCall={handleScheduleCall}
        onOpenRoadmap={() => setLocation('/roadmap')}
        onLogout={handleLogout}
        isSuperadmin={(user?.role as string) === 'superadmin'}
        onSuperadminClick={() => setLocation('/superadmin')}
        isRoadmapGenerated={false}
      />

      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 card-glow-hover relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="p-3 bg-blue-900/20 rounded-xl border border-blue-900/30">
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100 uppercase tracking-wide">Schedule Discovery Call</h1>
              <p className="text-slate-400 text-sm mt-1">Finalize your strategic AI roadmap</p>
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            <p className="text-slate-300 leading-relaxed text-lg">
              You're ready to move forward! Schedule a discovery call with Tony to review
              your diagnostic findings and create a customized implementation plan tailored to your organization.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Agenda Items
              </h3>
              <ul className="space-y-4">
                {[
                  'Review your Business Health Diagnostic results',
                  'Discuss AI opportunities specific to your operations',
                  'Prioritize quick wins and long-term initiatives',
                  'Define implementation timeline and resource requirements',
                  'Answer any questions about the roadmap process',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 group">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5 group-hover:text-emerald-400 transition-colors" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 border-t border-slate-800">
              <button
                onClick={handleScheduleCall}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-blue-600/20 w-full sm:w-auto uppercase tracking-widest text-sm"
              >
                <Mail className="h-5 w-5" />
                Email Tony to Schedule
              </button>
              <div className="text-sm text-slate-500 flex flex-col">
                <span className="uppercase tracking-wide text-xs font-bold mb-0.5">Contact Direct</span>
                <span className="text-slate-400">tony@scend.cash</span>
              </div>
            </div>

            <div className="bg-blue-900/10 border border-blue-900/20 rounded-xl p-4">
              <p className="text-xs text-blue-200/80 leading-relaxed">
                <strong className="text-blue-200 uppercase tracking-wider text-[10px] block mb-1">Preparation</strong>
                This call typically takes 45-60 minutes. Please review your diagnostic
                documents before the call to make the most of our time together.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
