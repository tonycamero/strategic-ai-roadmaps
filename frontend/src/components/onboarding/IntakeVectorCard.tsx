import { CheckCircle2, Clock, AlertCircle, Edit2, Send, Mail } from 'lucide-react';

interface IntakeVectorCardProps {
    vector: {
        id: string;
        roleLabel: string;
        roleType: string;
        perceivedConstraints: string;
        anticipatedBlindSpots?: string;
        recipientName?: string;
        recipientEmail?: string;
        inviteStatus: 'NOT_SENT' | 'SENT' | 'FAILED' | 'ACCEPTED';
        intakeStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    };
    onEdit: (vector: any) => void;
    onSendInvite: (vectorId: string) => void;
    isSendingInvite: boolean;
    isLocked: boolean;
}

export function IntakeVectorCard({
    vector,
    onEdit,
    onSendInvite,
    isSendingInvite,
    isLocked
}: IntakeVectorCardProps) {

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'NOT_STARTED': return <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />;
            default: return null;
        }
    };

    const getInviteBadge = (status: string) => {
        const badges = {
            SENT: {
                bg: 'bg-indigo-900/40',
                border: 'border-indigo-800',
                text: 'text-indigo-300',
                label: 'Invite Sent'
            },
            FAILED: {
                bg: 'bg-red-900/40',
                border: 'border-red-800',
                text: 'text-red-300',
                label: 'Failed'
            },
            ACCEPTED: {
                bg: 'bg-emerald-900/40',
                border: 'border-emerald-800',
                text: 'text-emerald-300',
                label: 'Invite Accepted'
            },
            NOT_SENT: {
                bg: 'bg-slate-800',
                border: 'border-slate-700',
                text: 'text-slate-500',
                label: 'Not Sent'
            }
        };

        const badge = badges[status as keyof typeof badges] || badges.NOT_SENT;

        return (
            <span className={`px-2 py-0.5 ${badge.bg} border ${badge.border} rounded text-[10px] ${badge.text} font-bold uppercase tracking-wider`}>
                {badge.label}
            </span>
        );
    };

    const getRoleTypeBadge = (roleType: string) => {
        const formatted = roleType.replace(/_/g, ' ');
        const colors = {
            FACILITATOR: 'text-purple-400 bg-purple-900/20 border-purple-800',
            OPERATIONAL_LEAD: 'text-blue-400 bg-blue-900/20 border-blue-800',
            SALES_LEAD: 'text-emerald-400 bg-emerald-900/20 border-emerald-800',
            DELIVERY_LEAD: 'text-cyan-400 bg-cyan-900/20 border-cyan-800',
            EXECUTIVE: 'text-amber-400 bg-amber-900/20 border-amber-800',
            OTHER: 'text-slate-400 bg-slate-900/20 border-slate-700'
        };

        const colorClass = colors[roleType as keyof typeof colors] || colors.OTHER;

        return (
            <div className={`text-[9px] uppercase font-black tracking-tighter px-2 py-0.5 rounded border ${colorClass}`}>
                {formatted}
            </div>
        );
    };

    const canSendInvite =
        vector.recipientEmail &&
        (vector.inviteStatus === 'NOT_SENT' || vector.inviteStatus === 'FAILED') &&
        vector.intakeStatus !== 'COMPLETED' &&
        !isLocked;

    const canResend =
        (vector.inviteStatus === 'SENT' || vector.inviteStatus === 'ACCEPTED') &&
        vector.intakeStatus !== 'COMPLETED' &&
        !isLocked;

    return (
        <div className="group relative bg-slate-900/40 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(vector.intakeStatus)}
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-200">{vector.roleLabel}</h4>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {vector.recipientEmail || (
                                <span className="text-slate-600 italic">Not assigned</span>
                            )}
                        </div>
                        {vector.recipientName && (
                            <div className="text-[10px] text-slate-400 mt-0.5">{vector.recipientName}</div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    {getInviteBadge(vector.inviteStatus)}
                    {getRoleTypeBadge(vector.roleType)}
                </div>
            </div>

            {/* Perception Hub */}
            <div className="space-y-3 mb-5">
                <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/30">
                    <span className="text-[9px] uppercase font-black text-blue-500/70 tracking-widest block mb-1">
                        Perception Hub
                    </span>
                    <p className="text-[10px] text-slate-400 italic line-clamp-2">
                        "{vector.perceivedConstraints || 'No constraint hypothesis defined.'}"
                    </p>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-2">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        {vector.intakeStatus === 'COMPLETED'
                            ? 'Intake Complete'
                            : vector.intakeStatus === 'IN_PROGRESS'
                                ? 'In Progress'
                                : 'Waiting for Submission'}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Edit Button */}
                    <button
                        onClick={() => onEdit(vector)}
                        disabled={isLocked}
                        className={`p-1.5 rounded transition-all ${isLocked
                            ? 'text-slate-700 cursor-not-allowed'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                        title={isLocked ? 'Locked' : 'Edit stakeholder'}
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Send Invite Button */}
                    {canSendInvite && (
                        <button
                            onClick={() => onSendInvite(vector.id)}
                            disabled={isSendingInvite}
                            className="px-4 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded transition-all border border-blue-600/20 flex items-center gap-1.5"
                        >
                            <Send className="w-3 h-3" />
                            {isSendingInvite ? 'Sending...' : vector.inviteStatus === 'FAILED' ? 'Retry' : 'Send Invite'}
                        </button>
                    )}

                    {/* Resend Button */}
                    {canResend && (
                        <button
                            onClick={() => onSendInvite(vector.id)}
                            disabled={isSendingInvite}
                            className="text-[10px] font-bold text-indigo-500/50 hover:text-indigo-400 transition-colors uppercase tracking-widest flex items-center gap-1"
                        >
                            <Mail className="w-3 h-3" />
                            Resend Link
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
