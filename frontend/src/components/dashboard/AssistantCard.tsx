import { MessageSquare, Eye, Edit } from 'lucide-react';

type AssistantMode = 'editor' | 'observer' | 'superadmin';
type AssistantRoleType = 'owner' | 'ops' | 'sales' | 'tc' | 'agent_support';

interface AssistantCardProps {
  roleType: AssistantRoleType;
  mode: AssistantMode;
  onOpenChat: () => void;
  className?: string;
}

const roleConfig: Record<
  AssistantRoleType,
  { title: string; description: string }
> = {
  owner: {
    title: 'Owner Assistant',
    description: 'Strategic guidance and roadmap execution',
  },
  ops: {
    title: 'Operations Assistant',
    description: 'Workflow automation and process optimization',
  },
  sales: {
    title: 'Sales Assistant',
    description: 'Lead pipeline insights and CRM automation',
  },
  tc: {
    title: 'Transaction Coordinator',
    description: 'Deal coordination and client communication',
  },
  agent_support: {
    title: 'Agent Support',
    description: 'Team enablement and training',
  },
};

const modeConfig: Record<
  AssistantMode,
  { badge: string; icon: React.ElementType; color: string }
> = {
  editor: {
    badge: 'Full Access',
    icon: Edit,
    color: 'bg-emerald-900/40 text-emerald-200 border-emerald-600/60',
  },
  observer: {
    badge: 'Observer Mode',
    icon: Eye,
    color: 'bg-amber-900/40 text-amber-200 border-amber-600/60',
  },
  superadmin: {
    badge: 'Admin Mode',
    icon: Edit,
    color: 'bg-purple-900/40 text-purple-200 border-purple-600/60',
  },
};

export function AssistantCard({
  roleType,
  mode,
  onOpenChat,
  className = '',
}: AssistantCardProps) {
  const role = roleConfig[roleType];
  const modeInfo = modeConfig[mode];
  const ModeIcon = modeInfo.icon;

  return (
    <div
      className={`border border-slate-800 rounded-xl p-4 bg-slate-950/60 hover:bg-slate-900/40 hover:border-slate-700 transition ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-100 mb-1">{role.title}</h3>
          <p className="text-xs text-slate-400">{role.description}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border font-medium ${modeInfo.color}`}
        >
          <ModeIcon className="h-3 w-3" />
          {modeInfo.badge}
        </span>
      </div>

      <button
        onClick={onOpenChat}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium border border-sky-500 transition"
      >
        <MessageSquare className="h-4 w-4" />
        Open Chat
      </button>

      {mode === 'observer' && (
        <p className="text-xs text-slate-500 mt-2 text-center">
          Can analyze and suggest, but cannot execute actions
        </p>
      )}
    </div>
  );
}
