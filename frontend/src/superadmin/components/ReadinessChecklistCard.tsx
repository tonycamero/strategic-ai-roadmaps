
import React from 'react';
import { AuthorityCategory } from '@roadmap/shared';
import { useSuperAdminAuthority } from '../hooks/useSuperAdminAuthority';

interface ReadinessChecklistCardProps {
    tenantId: string;
    flags: {
        knowledgeBaseReady: boolean;
        rolesValidated: boolean;
        execReady: boolean;
    };
    timestamps: {
        knowledgeBaseReadyAt?: string | null;
        rolesValidatedAt?: string | null;
        execReadyAt?: string | null;
    };
    onSignal: (flag: string, value: boolean) => Promise<void>;
}

export function ReadinessChecklistCard({
    tenantId,
    flags,
    timestamps,
    onSignal
}: ReadinessChecklistCardProps) {
    const { category } = useSuperAdminAuthority();
    const isExecutive = category === AuthorityCategory.EXECUTIVE;

    return (
        <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 shadow-sm hover:border-slate-800 transition-colors h-full">
            <h4 className="text-[10px] uppercase tracking-widest text-slate-600 font-inter font-extrabold mb-4">READINESS CHECKLIST</h4>
            <div className="space-y-4">
                <ReadinessItem
                    label="Assemble Knowledge Base"
                    isSet={flags.knowledgeBaseReady}
                    timestamp={timestamps.knowledgeBaseReadyAt}
                    onToggle={(val) => onSignal('knowledge_base_ready', val)}
                    canEdit={true}
                />
                <ReadinessItem
                    label="Validate Team Roles"
                    isSet={flags.rolesValidated}
                    timestamp={timestamps.rolesValidatedAt}
                    onToggle={(val) => onSignal('roles_validated', val)}
                    canEdit={true}
                />
                <ReadinessItem
                    label="Signal Execution Authority"
                    isSet={flags.execReady}
                    timestamp={timestamps.execReadyAt}
                    onToggle={(val) => onSignal('exec_ready', val)}
                    canEdit={true}
                    highlight={true}
                />
            </div>
            {!isExecutive && (
                <div className="mt-4 p-2 bg-blue-900/10 border border-blue-900/30 rounded text-[9px] text-blue-400">
                    Delegate Authority: You can signal preparation but final roadmap generation requires Executive review.
                </div>
            )}
        </div>
    );
}

function ReadinessItem({
    label,
    isSet,
    timestamp,
    onToggle,
    canEdit,
    highlight = false
}: {
    label: string,
    isSet: boolean,
    timestamp?: string | null,
    onToggle: (val: boolean) => void,
    canEdit: boolean,
    highlight?: boolean
}) {
    return (
        <div className={`p-3 rounded-lg border transition-all ${isSet ? 'bg-emerald-900/5 border-emerald-900/20' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${isSet ? 'text-emerald-400' : 'text-slate-400'} ${highlight && !isSet ? 'text-blue-400' : ''}`}>
                        {label}
                    </div>
                    {timestamp && (
                        <div className="text-[9px] text-slate-600 font-mono mt-0.5">
                            {new Date(timestamp).toLocaleString()}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onToggle(!isSet)}
                    disabled={!canEdit}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${isSet
                        ? 'bg-slate-800 text-slate-400 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/30 border border-transparent'
                        : highlight
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                >
                    {isSet ? 'Clear' : 'Mark Ready'}
                </button>
            </div>
        </div>
    );
}
