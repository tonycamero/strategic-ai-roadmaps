<<<<<<< HEAD


export interface SnapshotData {
    executionPhase?: 'INTAKE_OPEN' | 'EXEC_BRIEF_DRAFT' | 'EXEC_BRIEF_APPROVED' | 'ROADMAP_READY';
    executiveBriefStatus?: 'DRAFT' | 'APPROVED' | null;
    intakeWindowState?: 'OPEN' | 'CLOSED';
    coverage: {
        rolesInvited: number;
        rolesCompleted: number;
        organizationInputPercent: number;
    };
    frictionMap: {
        totalTickets: number;
        rejectedTickets: number;
        manualWorkflowsIdentified: number;
        strategicMisalignmentScore: number; // 0-100
        highPriorityBottlenecks: number;
    };
    capacityROI: {
        projectedHoursSavedWeekly: number;
        speedToValue: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    distribution: Record<string, number>;
}

interface ExecutiveSnapshotPanelProps {
    data: SnapshotData | null;
    loading?: boolean;
}

export function ExecutiveSnapshotPanel({ data, loading }: ExecutiveSnapshotPanelProps) {
    if (loading) {
        return (
            <div className="w-full h-32 bg-slate-900/50 animate-pulse rounded-xl border border-slate-800" />
        );
    }

    if (!data) {
        // Snapshot Not Ready - show prerequisites
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 tracking-wider">Strategic Context & Capacity ROI</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                            SNAPSHOT NOT AVAILABLE
                        </p>
                    </div>
                    <div className="px-2 py-1 bg-amber-900/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded uppercase">
                        Prerequisites Required
                    </div>
                </div>

                {/* Prerequisites Panel */}
                <div className="p-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-amber-900/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-200 mb-1">Snapshot Not Available</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    The executive snapshot requires stakeholder intake data to generate strategic context metrics.
                                    Complete the prerequisites below to enable snapshot generation.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 mt-4 pt-4 border-t border-slate-800">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Required Prerequisites</div>

                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border-2 border-slate-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-slate-600 text-xs">✗</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300 font-medium">Define at least one strategic stakeholder</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Click "Add Stakeholder" above to begin</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border-2 border-slate-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-slate-600 text-xs">✗</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300 font-medium">Complete owner intake</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Executive/owner must complete their strategic intake</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border-2 border-slate-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-slate-600 text-xs">✗</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300 font-medium">Close intake window</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Finalize stakeholder collection to begin synthesis</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white tracking-wider">Strategic Context & Capacity ROI</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                        NON-FINANCIAL METRICS • CAPACITY & FRICTION ONLY
                    </p>
                </div>
                <div className="px-2 py-1 bg-green-900/20 border border-green-500/30 text-green-400 text-[10px] font-bold rounded uppercase">
                    Executive Visible
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-900">

                {/* ZONE 1: Coverage */}
                <div className="p-6 space-y-4">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold">Organizational Readiness Context</h4>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-bold text-white">{data.coverage.organizationInputPercent}%</span>
                            <span className="text-xs text-slate-400 mb-1">Role Coverage</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${data.coverage.organizationInputPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>{data.coverage.rolesCompleted} Completed</span>
                            <span>{data.coverage.rolesInvited} Invited</span>
                        </div>
                    </div>
                </div>

                {/* ZONE 2: Friction Map */}
                <div className="p-6 space-y-4">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold">Execution Friction Context</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xl font-bold text-white">{data.frictionMap.manualWorkflowsIdentified}</div>
                            <div className="text-[10px] text-slate-500 uppercase leading-tight mt-1">Manual Workflows</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-amber-400">{data.frictionMap.highPriorityBottlenecks}</div>
                            <div className="text-[10px] text-slate-500 uppercase leading-tight mt-1">High Priority Bottlenecks</div>
                        </div>
                        <div>
                            <div className={`text-xl font-bold ${data.frictionMap.strategicMisalignmentScore > 20 ? 'text-red-400' : 'text-slate-300'}`}>
                                {data.frictionMap.strategicMisalignmentScore}%
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase leading-tight mt-1">Misalignment (Rejection Rate)</div>
                        </div>
                    </div>
                </div>

                {/* ZONE 3: Capacity ROI */}
                <div className="p-6 space-y-4 bg-slate-900/10">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold">Strategic Capacity Projections</h4>

                    <div className="space-y-4">
                        <div>
                            <div className="text-3xl font-bold text-green-400">{data.capacityROI.projectedHoursSavedWeekly} <span className="text-sm font-normal text-slate-500">hrs/week</span></div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Recovered Organizational Capacity</div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Speed to Value</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${data.capacityROI.speedToValue === 'HIGH' ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                                    data.capacityROI.speedToValue === 'MEDIUM' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' :
                                        'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                    {data.capacityROI.speedToValue}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
=======
import React from 'react';

export interface SnapshotData {
    executionPhase?: 'INTAKE_OPEN' | 'EXEC_BRIEF_DRAFT' | 'EXEC_BRIEF_APPROVED' | 'ROADMAP_READY';
    executiveBriefStatus?: 'DRAFT' | 'APPROVED' | null;
    intakeWindowState?: 'OPEN' | 'CLOSED';
    coverage: {
        rolesInvited: number;
        rolesCompleted: number;
        organizationInputPercent: number;
    };
    frictionMap: {
        totalTickets: number;
        rejectedTickets: number;
        manualWorkflowsIdentified: number;
        strategicMisalignmentScore: number; // 0-100
        highPriorityBottlenecks: number;
    };
    capacityROI: {
        projectedHoursSavedWeekly: number;
        speedToValue: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    distribution: Record<string, number>;
}

interface ExecutiveSnapshotPanelProps {
    data: SnapshotData | null;
    loading?: boolean;
}

export function ExecutiveSnapshotPanel({ data, loading }: ExecutiveSnapshotPanelProps) {
    if (loading) {
        return (
            <div className="w-full h-32 bg-slate-900/50 animate-pulse rounded-xl border border-slate-800" />
        );
    }

    if (!data) {
        // Snapshot Not Ready - show prerequisites
        return (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-300 tracking-wider">Strategic Context & Capacity ROI</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                            SNAPSHOT NOT AVAILABLE
                        </p>
                    </div>
                    <div className="px-2 py-1 bg-amber-900/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded uppercase">
                        Prerequisites Required
                    </div>
                </div>

                {/* Prerequisites Panel */}
                <div className="p-6">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-amber-900/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-200 mb-1">Snapshot Not Available</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    The executive snapshot requires stakeholder intake data to generate strategic context metrics.
                                    Complete the prerequisites below to enable snapshot generation.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 mt-4 pt-4 border-t border-slate-800">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Required Prerequisites</div>

                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border-2 border-slate-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-slate-600 text-xs">✗</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300 font-medium">Define at least one strategic stakeholder</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Click "Add Stakeholder" above to begin</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border-2 border-slate-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-slate-600 text-xs">✗</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300 font-medium">Complete owner intake</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Executive/owner must complete their strategic intake</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border-2 border-slate-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-slate-600 text-xs">✗</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm text-slate-300 font-medium">Close intake window</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Finalize stakeholder collection to begin synthesis</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white tracking-wider">Strategic Context & Capacity ROI</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                        NON-FINANCIAL METRICS • CAPACITY & FRICTION ONLY
                    </p>
                </div>
                <div className="px-2 py-1 bg-green-900/20 border border-green-500/30 text-green-400 text-[10px] font-bold rounded uppercase">
                    Executive Visible
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-900">

                {/* ZONE 1: Coverage */}
                <div className="p-6 space-y-4">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold">Organizational Readiness Context</h4>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-2xl font-bold text-white">{data.coverage.organizationInputPercent}%</span>
                            <span className="text-xs text-slate-400 mb-1">Role Coverage</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${data.coverage.organizationInputPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                            <span>{data.coverage.rolesCompleted} Completed</span>
                            <span>{data.coverage.rolesInvited} Invited</span>
                        </div>
                    </div>
                </div>

                {/* ZONE 2: Friction Map */}
                <div className="p-6 space-y-4">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold">Execution Friction Context</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xl font-bold text-white">{data.frictionMap.manualWorkflowsIdentified}</div>
                            <div className="text-[10px] text-slate-500 uppercase leading-tight mt-1">Manual Workflows</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-amber-400">{data.frictionMap.highPriorityBottlenecks}</div>
                            <div className="text-[10px] text-slate-500 uppercase leading-tight mt-1">High Priority Bottlenecks</div>
                        </div>
                        <div>
                            <div className={`text-xl font-bold ${data.frictionMap.strategicMisalignmentScore > 20 ? 'text-red-400' : 'text-slate-300'}`}>
                                {data.frictionMap.strategicMisalignmentScore}%
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase leading-tight mt-1">Misalignment (Rejection Rate)</div>
                        </div>
                    </div>
                </div>

                {/* ZONE 3: Capacity ROI */}
                <div className="p-6 space-y-4 bg-slate-900/10">
                    <h4 className="text-[10px] tracking-widest text-slate-500 font-bold">Strategic Capacity Projections</h4>

                    <div className="space-y-4">
                        <div>
                            <div className="text-3xl font-bold text-green-400">{data.capacityROI.projectedHoursSavedWeekly} <span className="text-sm font-normal text-slate-500">hrs/week</span></div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">Recovered Organizational Capacity</div>
                        </div>

                        <div className="pt-2 border-t border-slate-800/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">Speed to Value</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${data.capacityROI.speedToValue === 'HIGH' ? 'bg-green-900/20 text-green-400 border-green-500/30' :
                                    data.capacityROI.speedToValue === 'MEDIUM' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' :
                                        'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                    {data.capacityROI.speedToValue}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
