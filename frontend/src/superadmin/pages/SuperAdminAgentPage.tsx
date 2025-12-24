import { SuperadminAssistantConsole } from '../../components/SuperadminAssistantConsole';

export default function SuperAdminAgentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Tap-In</h1>
          <p className="text-sm text-slate-400 mt-1">
            Access any firm's Assistant as if you're part of their leadership team
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <SuperadminAssistantConsole />
      </div>
    </div>
  );
}
