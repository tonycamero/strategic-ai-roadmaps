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
        <div className="bg-gradient-to-br from-blue-900/20 to-slate-900/40 rounded-xl border border-slate-800 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-slate-100">Schedule Your Discovery Call</h1>
          </div>

          <div className="space-y-6">
            <p className="text-slate-300 leading-relaxed">
              You're ready to finalize your strategic AI roadmap! Schedule a discovery call with Tony to review 
              your diagnostic findings and create a customized implementation plan.
            </p>

            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                What We'll Cover
              </h3>
              <ul className="space-y-3">
                {[
                  'Review your Business Health Diagnostic results',
                  'Discuss AI opportunities specific to your operations',
                  'Prioritize quick wins and long-term initiatives',
                  'Define implementation timeline and resource requirements',
                  'Answer any questions about the roadmap process',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={handleScheduleCall}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Mail className="h-5 w-5" />
                Email Tony to Schedule
              </button>
              <div className="text-sm text-slate-400">
                tony@scend.cash
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6 mt-6">
              <p className="text-xs text-slate-500">
                <strong>Note:</strong> This call typically takes 45-60 minutes. Please review your diagnostic 
                documents before the call to make the most of our time together.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
