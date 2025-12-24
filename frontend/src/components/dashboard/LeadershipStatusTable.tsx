import { useBusinessTypeProfile } from '../../context/TenantContext';

interface Leader {
  role: 'ops' | 'sales' | 'delivery';
  name?: string;
  email?: string;
  inviteId?: string;
  inviteAccepted: boolean;
  intakeComplete: boolean;
}

interface LeadershipStatusTableProps {
  leaders: Leader[];
  onViewIntake: (role: string) => void;
  onManageInvites: () => void;
  onResendInvite: (inviteId: string) => void;
  onRevokeInvite: (inviteId: string) => void;
}

export function LeadershipStatusTable({
  leaders,
  onViewIntake,
  onManageInvites,
  onResendInvite,
  onRevokeInvite,
}: LeadershipStatusTableProps) {
  const profile = useBusinessTypeProfile();
  
  const ROLE_LABELS = {
    ops: profile.roleLabels.ops,
    sales: profile.roleLabels.sales,
    delivery: profile.roleLabels.delivery,
  };
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-slate-100">Leadership Team Status</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/20">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Person</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Invite</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Intake</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {leaders.map((leader, idx) => (
              <tr key={leader.role} className={idx % 2 === 1 ? 'bg-slate-900/10' : ''}>
                <td className="px-4 py-3 text-sm text-slate-200 font-medium">
                  {ROLE_LABELS[leader.role]}
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {leader.email || (
                    <span className="text-slate-500 italic">Not invited</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {leader.inviteAccepted ? (
                    <span className="text-emerald-400 text-sm">✓</span>
                  ) : leader.email ? (
                    <span className="text-slate-500 text-sm">○</span>
                  ) : (
                    <span className="text-slate-600 text-sm">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {leader.intakeComplete ? (
                    <span className="text-emerald-400 text-sm">✓</span>
                  ) : leader.inviteAccepted ? (
                    <span className="text-slate-500 text-sm">○</span>
                  ) : (
                    <span className="text-slate-600 text-sm">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    {leader.intakeComplete ? (
                      <button
                        onClick={() => onViewIntake(leader.role)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View
                      </button>
                    ) : leader.email && leader.inviteId && !leader.inviteAccepted ? (
                      <>
                        <button
                          onClick={() => onResendInvite(leader.inviteId!)}
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          title="Resend invitation email"
                        >
                          Resend
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          onClick={() => onRevokeInvite(leader.inviteId!)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          title="Revoke invitation"
                        >
                          Revoke
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/10">
        <button
          onClick={onManageInvites}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
        >
          Manage Invites →
        </button>
      </div>
    </div>
  );
}
