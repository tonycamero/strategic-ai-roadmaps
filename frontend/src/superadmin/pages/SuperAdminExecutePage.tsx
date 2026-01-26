import { useState, useEffect, useCallback } from 'react';
import { superadminApi } from '../api';
import { BatchActionModal } from '../components/BatchActionModal';
import { useLocation } from 'wouter';
import { ExecuteTenantRow } from '../components/ExecuteTenantRow';
import { ExecutionContextPanel } from '../components/ExecutionContextPanel';
import { CommandCenterTenant } from '../types';

export default function SuperAdminExecutePage() {
    const [, setLocation] = useLocation();

    // Data State
    // State
    const [tenants, setTenants] = useState<CommandCenterTenant[]>([]);
    const [total, setTotal] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterStates, setFilterStates] = useState<string[]>([]);
    const [filterFlags, setFilterFlags] = useState<string[]>([]);
    const [sort, setSort] = useState('recent');
    const [loading, setLoading] = useState(true);

    // UI State
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [focusedTenant, setFocusedTenant] = useState<CommandCenterTenant | null>(null);

    // Modal State
    const [batchModal, setBatchModal] = useState<{
        isOpen: boolean;
        type: 'readiness' | 'finalize';
        flag?: string;
        value?: boolean;
    }>({ isOpen: false, type: 'readiness' });

    // Fetch Tenants
    const fetchTenants = useCallback(async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getCommandCenterTenants({
                search: search || undefined,
                states: filterStates.length > 0 ? filterStates.join(',') : undefined,
                missingFlags: filterFlags.length > 0 ? filterFlags.join(',') : undefined,
                sort
            });
            setTenants(data.tenants);
            setTotal(data.total);

            // Re-focus original tenant if it still exists
            if (focusedTenant) {
                const refreshed = data.tenants.find((t: CommandCenterTenant) => t.id === focusedTenant.id);
                if (refreshed) setFocusedTenant(refreshed);
            }
        } catch (err) {
            console.error('Failed to fetch executable tenants:', err);
        } finally {
            setLoading(false);
        }
    }, [search, filterStates, filterFlags, sort, focusedTenant]);

    // Initial Load
    useEffect(() => {
        fetchTenants();
    }, [search, filterStates, filterFlags, sort]);

    // Handlers
    const toggleSelectAll = () => {
        if (selectedIds.length === tenants.length && tenants.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(tenants.map((t: CommandCenterTenant) => t.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev: string[]) =>
            prev.includes(id) ? prev.filter((oid: string) => oid !== id) : [...prev, id]
        );
    };

    const getOnboardingStateLabel = (state: string) => {
        const labels: Record<string, string> = {
            intake_open: 'Intake Open',
            diagnostic_ready: 'Ready for Synthesis',
            diagnostic_complete: 'Synthesis Complete',
            delegate_ready: 'Ready for Exec Review',
            exec_review: 'In Executive Review',
            roadmap_finalized: 'Finalized'
        };
        return labels[state] || state;
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
            {/* Upper Toolbar */}
            <header className="px-10 py-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl z-30 sticky top-0">
                <div className="flex items-center justify-between gap-10">
                    <div className="flex items-center gap-12">
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <span className="text-emerald-500">Execute</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                Workbench
                            </p>
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 border ${showFilters ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-200'}`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                        </button>
                    </div>

                    <div className="flex-1 max-w-2xl relative">
                        <input
                            type="text"
                            placeholder="Find tenant by name or email..."
                            className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl px-12 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-600 font-medium"
                            value={search}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        />
                        <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Queue Depth</span>
                            <span className="text-xl font-black text-white font-mono leading-none mt-1">{total}</span>
                        </div>
                        <button onClick={fetchTenants} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl transition-all text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 group">
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Global Filters Sidebar (Slide-over) */}
                {showFilters && (
                    <aside className="absolute inset-y-0 left-0 w-80 border-r border-slate-900 bg-slate-950/95 backdrop-blur-2xl p-10 z-40 shadow-[20px_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-left duration-500">
                        <div className="flex flex-col gap-12">
                            <header className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Filter Spectrum</h3>
                                <button onClick={() => setShowFilters(false)} className="text-slate-600 hover:text-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </header>

                            <section>
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Onboarding Lifecycle</h4>
                                <div className="space-y-1.5 text-xs font-bold">
                                    {['intake_open', 'diagnostic_ready', 'diagnostic_complete', 'delegate_ready', 'exec_review', 'roadmap_finalized'].map(state => (
                                        <label key={state} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${filterStates.includes(state) ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-transparent border-transparent hover:bg-slate-900/50'}`}>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded-md bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500/20"
                                                checked={filterStates.includes(state)}
                                                onChange={() => {
                                                    setFilterStates((prev: string[]) => prev.includes(state) ? prev.filter((s: string) => s !== state) : [...prev, state]);
                                                }}
                                            />
                                            <span className={filterStates.includes(state) ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}>{getOnboardingStateLabel(state)}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Readiness Gaps</h4>
                                <div className="space-y-1.5">
                                    {[
                                        { id: 'kb', label: 'Knowledge Base Pending' },
                                        { id: 'roles', label: 'Roles Validation Pending' },
                                        { id: 'exec', label: 'Executive Review Pending' }
                                    ].map(gate => (
                                        <label key={gate.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${filterFlags.includes(gate.id) ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-transparent border-transparent hover:bg-slate-900/50'}`}>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded-md bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500/20"
                                                checked={filterFlags.includes(gate.id)}
                                                onChange={() => {
                                                    setFilterFlags((prev: string[]) => prev.includes(gate.id) ? prev.filter((s: string) => s !== gate.id) : [...prev, gate.id]);
                                                }}
                                            />
                                            <span className={filterFlags.includes(gate.id) ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}>{gate.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </aside>
                )}

                {/* Left Column: Tenant Execution Queue */}
                <main className="w-[62%] flex flex-col border-r border-slate-900 bg-slate-950">
                    <div className="flex items-center justify-between px-8 py-4 bg-slate-900/20 border-b border-slate-900/50">
                        <div className="flex items-center gap-4">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded-md bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500/20"
                                checked={selectedIds.length === tenants.length && tenants.length > 0}
                                onChange={toggleSelectAll}
                            />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Select All Potential Targets</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Sort:</span>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="bg-transparent text-[10px] font-black text-indigo-400 uppercase tracking-widest focus:outline-none cursor-pointer"
                            >
                                <option value="recent">Activity Recency</option>
                                <option value="progress">Completion Velocity</option>
                                <option value="blocked">Hard Blockers</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading && tenants.length === 0 ? (
                            <div className="py-40 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] animate-pulse">Syncing Orchestration Engine...</p>
                            </div>
                        ) : tenants.length === 0 ? (
                            <div className="py-40 flex flex-col items-center justify-center text-center px-10">
                                <div className="w-20 h-20 mb-6 bg-slate-900/50 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2 font-mono">Void Detected</h3>
                                <p className="text-xs font-bold text-slate-700 leading-relaxed max-w-sm">No tenants matches the current filter spectrum. Adjust search or filters to resume execution.</p>
                            </div>
                        ) : (
                            tenants.map(tenant => (
                                <ExecuteTenantRow
                                    key={tenant.id}
                                    tenant={tenant}
                                    isSelected={selectedIds.includes(tenant.id)}
                                    isFocused={focusedTenant?.id === tenant.id}
                                    onSelect={toggleSelect}
                                    onFocus={setFocusedTenant}
                                    onExecute={(id) => setLocation(`/superadmin/execute/firms/${id}`)}
                                />
                            ))
                        )}
                    </div>
                </main>

                {/* Right Column: Execution Context Panel */}
                <aside className="w-[38%] bg-slate-950 flex flex-col border-l border-slate-900 shadow-[-10px_0_30px_rgba(0,0,0,0.2)]">
                    <ExecutionContextPanel
                        tenant={focusedTenant}
                        onViewFirm={(id) => setLocation(`/superadmin/execute/firms/${id}`)}
                        onViewRoadmap={(id) => setLocation(`/superadmin/firms/${id}/roadmap`)} // Simplified for now
                        onViewDiagnostics={(id) => setLocation(`/superadmin/firms/${id}/diagnostics`)}
                    />
                </aside>
            </div>

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-10 left-[31%] -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/40 rounded-3xl px-8 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-10 ring-1 ring-white/10">
                        <div className="flex items-center gap-5 border-r border-slate-800 pr-10">
                            <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-lg shadow-indigo-600/30">
                                {selectedIds.length}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Batch Targets</span>
                                <span className="text-xs font-bold text-white whitespace-nowrap">Tactical Convergence Active</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setBatchModal({ isOpen: true, type: 'readiness', flag: 'kb', value: true })}
                                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-slate-700 hover:border-indigo-500/30"
                            >
                                Batch Readiness
                            </button>
                            <button
                                onClick={() => setBatchModal({ isOpen: true, type: 'finalize' })}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-indigo-600/20"
                            >
                                Finalize Roadmaps
                            </button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="ml-4 p-3 text-slate-500 hover:text-white transition-opacity"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BatchActionModal
                isOpen={batchModal.isOpen}
                onClose={() => setBatchModal(prev => ({ ...prev, isOpen: false }))}
                tenantIds={selectedIds}
                actionType={batchModal.type}
                flag={batchModal.flag}
                value={batchModal.value}
                onSuccess={() => {
                    fetchTenants();
                    setSelectedIds([]);
                }}
            />
        </div>
    );
}
