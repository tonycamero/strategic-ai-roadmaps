

export interface TruthProbeData {
    tenantId: string;
    tenantName: string;
    tenantStatus: string;

    intake: { exists: boolean; state: string | null; };
    executiveBrief: { exists: boolean; state: string | null; };
    diagnostic: { exists: boolean; state: string | null; };
    discovery: { exists: boolean; state: string | null; };
    findings: { exists: boolean; state: string | null; };
    tickets: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        isDraft: boolean;
        lastGeneratedAt: string | null;
        lastModeratedAt: string | null;
    };
    roadmap: { exists: boolean; state: string | null; };
    readiness: {
        canRunDiscovery: boolean;
        canModerateTickets: boolean;
        canFinalizeRoadmap: boolean;
        blockingReasons: string[];
    };
}

interface TruthProbeCardProps {
    data: TruthProbeData;
}

export function TruthProbeCard({ data }: TruthProbeCardProps) {
    if (!data) return null;

    const { intake, executiveBrief, diagnostic, discovery, tickets, roadmap, readiness } = data;

    const StateBadge = ({ label, state, exists }: { label: string, state: string | null, exists: boolean }) => {
        let color = 'text-slate-500 bg-slate-900 border-slate-800'; // Default gray/missing
        if (exists) {
            color = 'text-blue-400 bg-blue-900/20 border-blue-800'; // Exists
            if (state === 'completed' || state === 'APPROVED' || state === 'captured') {
                color = 'text-emerald-400 bg-emerald-900/20 border-emerald-800'; // Success
            } else if (state === 'pending' || state === 'draft') {
                color = 'text-amber-400 bg-amber-900/20 border-amber-800'; // In Progress
            }
        }

        return (
            <div className={`text-[10px] px-2 py-1 rounded border flex justify-between items-center ${color}`}>
                <span className="font-semibold uppercase tracking-wider">{label}</span>
                <span className="font-mono opacity-80">{state || (exists ? 'EXISTS' : 'MISSING')}</span>
            </div>
        );
    };

    const ReadinessFlag = ({ label, value }: { label: string, value: boolean }) => (
        <div className={`w-2 h-2 rounded-full ${value ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} title={label} />
    );

    return (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-sans text-sm shadow-sm opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-start mb-3 border-b border-slate-800 pb-2">
                <div>
                    <h3 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Lifecycle Truth</h3>
                    <div className="text-slate-500 text-[10px] mt-0.5">ID: {data.tenantId.slice(0, 8)}...</div>
                </div>
                <div className="flex gap-1.5" title="Readiness Gates: Discovery, Moderation, Finalization">
                    <ReadinessFlag label="Discovery Ready" value={readiness.canRunDiscovery} />
                    <ReadinessFlag label="Moderation Ready" value={readiness.canModerateTickets} />
                    <ReadinessFlag label="Finalization Ready" value={readiness.canFinalizeRoadmap} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
                <StateBadge label="Intake" exists={intake.exists} state={intake.state} />
                <StateBadge label="Brief" exists={executiveBrief.exists} state={executiveBrief.state} />
                <StateBadge label="Diagnostic" exists={diagnostic.exists} state={diagnostic.state} />
                <StateBadge label="Discovery" exists={discovery.exists} state={discovery.state} />
                <StateBadge label="Roadmap" exists={roadmap.exists} state={roadmap.state} />

                <div className="text-[10px] px-2 py-1 rounded border text-slate-400 bg-slate-900/50 border-slate-800 flex justify-between items-center">
                    <span className="font-semibold uppercase tracking-wider">Tickets</span>
                    <span className="font-mono">
                        <span className="text-amber-500">{tickets.pending}</span> / <span className="text-emerald-500">{tickets.approved}</span>
                    </span>
                </div>
            </div>

            {readiness.blockingReasons.length > 0 && (
                <div className="mt-2 text-[10px] font-mono text-amber-500/80 bg-amber-900/10 border border-amber-900/30 p-2 rounded">
                    <strong className="block text-amber-600 mb-1 uppercase tracking-wider">Blocking Reasons:</strong>
                    <ul className="list-disc pl-3 space-y-0.5">
                        {readiness.blockingReasons.map(r => (
                            <li key={r}>{r}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
