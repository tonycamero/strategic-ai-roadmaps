import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { ExecutiveBrief, ExecutiveBriefStatus } from '@roadmap/shared';
import { useSuperAdminAuthority } from '../../hooks/useSuperAdminAuthority';

interface ExecutiveBriefSurfaceProps {
    onStatusChange?: (status: ExecutiveBriefStatus) => void;
}

export const ExecutiveBriefSurface: React.FC<ExecutiveBriefSurfaceProps> = ({ onStatusChange }) => {
    const { tenantId } = useParams();
    const { isExecutive } = useSuperAdminAuthority();
    const [brief, setBrief] = useState<ExecutiveBrief | null>(null);
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch brief on mount
    useEffect(() => {
        fetchBrief();
    }, [tenantId]);

    const fetchBrief = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/superadmin/firms/${tenantId}/exec-brief`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.status === 404) {
                setBrief(null);
                return;
            }
            const data = await res.json();
            setBrief(data.brief);
            setContent(data.brief?.content || '');
            if (data.brief?.status) onStatusChange?.(data.brief.status);
        } catch (err) {
            setError('Failed to fetch Executive Brief');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/superadmin/firms/${tenantId}/exec-brief`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ content }),
            });
            const data = await res.json();
            if (res.ok) {
                setBrief(data.brief);
                setError(null);
            } else {
                setError(data.error || 'Failed to save brief');
            }
        } catch (err) {
            setError('Network error saving brief');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusTransition = async (newStatus: ExecutiveBriefStatus) => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/superadmin/firms/${tenantId}/exec-brief/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (res.ok) {
                setBrief(data.brief);
                onStatusChange?.(data.brief.status);
                setError(null);
            } else {
                setError(data.error || 'Failed to transition status');
            }
        } catch (err) {
            setError('Network error during transition');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="animate-pulse h-48 bg-slate-800/50 rounded-lg" />;
    if (!isExecutive) return null; // Double safety gating

    const isLocked = brief ? ['ACKNOWLEDGED', 'WAIVED'].includes(brief.status) : false;
    const status = brief?.status || 'DRAFT';

    return (
        <div className="bg-slate-900 border border-purple-500/30 rounded-xl overflow-hidden shadow-2xl shadow-purple-900/10">
            {/* Surface Header */}
            <div className="px-6 py-4 bg-purple-900/10 border-b border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${status === 'DRAFT' ? 'bg-amber-500' :
                        status === 'READY_FOR_EXEC' ? 'bg-blue-500' :
                            'bg-emerald-500'
                        }`} />
                    <h3 className="text-lg font-bold text-slate-100 italic tracking-tight">Executive Briefing Surface</h3>
                    <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-500/40 rounded text-[10px] uppercase font-bold text-purple-300 tracking-widest">
                        {status.replace(/_/g, ' ')}
                    </span>
                </div>
                {brief && (
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                        ID: {brief.id.split('-')[0]} // Updated: {new Date(brief.updatedAt).toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Surface Body */}
            <div className="p-6 space-y-4">
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-400">
                        {error}
                    </div>
                )}

                <div className="relative group">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isLocked || isSaving}
                        className={`w-full h-64 bg-slate-950 border ${isLocked ? 'border-slate-800' : 'border-slate-700/50 group-hover:border-purple-500/40'} rounded-lg p-4 text-slate-200 font-inter text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none`}
                        placeholder="Define the strategic boundary and leadership expectations for this firm..."
                    />
                    {isLocked && (
                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] pointer-events-none flex items-center justify-center">
                            <div className="bg-slate-900/80 border border-slate-700 px-4 py-2 rounded-full text-xs text-slate-400 font-semibold shadow-xl">
                                🔒 Artifact Locked (Read-Only)
                            </div>
                        </div>
                    )}
                </div>

                {/* Transition Controls */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                        {!isLocked && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !content}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 border border-slate-700/50"
                            >
                                {isSaving ? 'Saving...' : 'Save Draft'}
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {status === 'DRAFT' && brief && (
                            <button
                                onClick={() => handleStatusTransition('READY_FOR_EXEC_REVIEW')}
                                disabled={isSaving}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-purple-900/20 transition-all border border-purple-400/30"
                            >
                                Send to Executive Review
                            </button>
                        )}

                        {status === 'READY_FOR_EXEC_REVIEW' && (
                            <>
                                <button
                                    onClick={() => {
                                        const reason = window.prompt('Please provide a reason for waiving this brief:');
                                        if (reason) handleStatusTransition('WAIVED', reason);
                                    }}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/30 text-slate-400 text-xs font-bold rounded-lg transition-all border border-slate-700"
                                >
                                    Waive Brief
                                </button>
                                <button
                                    onClick={() => handleStatusTransition('ACKNOWLEDGED')}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all border border-emerald-400/30"
                                >
                                    Acknowledge & Finalize
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-[10px] text-slate-600 italic">
                    Note: Acknowledging or Waiving the brief is an immutable leadership action.
                </p>
            </div>
        </div>
    );
};
