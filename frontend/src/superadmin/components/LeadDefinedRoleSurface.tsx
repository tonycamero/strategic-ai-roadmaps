import React, { useState } from 'react';
import { IntakeRoleDefinition } from '../types';

interface LeadDefinedRoleSurfaceProps {
    tenantId: string;
    roles: IntakeRoleDefinition[];
    onAddRole: (role: Omit<IntakeRoleDefinition, 'id' | 'inviteStatus' | 'intakeStatus'>) => void;
    onInvite: (roleId: string) => void;
    readOnly?: boolean;
}

export function LeadDefinedRoleSurface({ roles, onAddRole, onInvite, readOnly = false }: LeadDefinedRoleSurfaceProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        roleLabel: '',
        roleType: 'OPERATIONAL_LEAD',
        perceivedConstraints: '',
        anticipatedBlindSpots: '',
        recipientEmail: '',
        recipientName: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddRole({
            roleLabel: formData.roleLabel,
            roleType: formData.roleType as any,
            perceivedConstraints: formData.perceivedConstraints,
            anticipatedBlindSpots: formData.anticipatedBlindSpots,
            recipientEmail: formData.recipientEmail,
            recipientName: formData.recipientName
        });
        setIsAdding(false);
        setFormData({ roleLabel: '', roleType: 'OPERATIONAL_LEAD', perceivedConstraints: '', anticipatedBlindSpots: '', recipientEmail: '', recipientName: '' });
    };

    return (
        <section className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-indigo-900/30 pb-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-3">
                        Intake Vectors
                        <span className="text-[10px] text-slate-500 font-normal lowercase tracking-normal">
                            ({roles.length} roles defined)
                        </span>
                    </h3>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        disabled={isAdding}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        + Add Vector
                    </button>
                )}
            </div>


            {/* Add Role Form (Inline) */}
            {isAdding && (
                <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 animate-in fade-in slide-in-from-top-2 shadow-2xl overflow-hidden max-w-4xl mx-auto border-t-4 border-t-indigo-500">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-xl font-bold text-white mb-2">Define a Role Vector</h4>
                                <details className="group">
                                    <summary className="text-[10px] font-bold text-indigo-400 cursor-pointer list-none flex items-center gap-1 hover:text-indigo-300 transition-colors">
                                        [Learn how this works]
                                    </summary>
                                    <div className="mt-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-4 text-xs text-indigo-200/70 leading-relaxed font-mono">
                                        <strong className="text-indigo-400">Protocol:</strong> Define roles as vector lenses, not job titles.
                                        Capture leadership perception (hypotheses) to contrast with operational reality.
                                        This framing will be shared with the participant as their operational mandate.
                                    </div>
                                </details>
                            </div>
                            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex gap-12">
                            {/* Left Column: Semantic Role + Archetype */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Role Label (Semantic)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Manufacturing Facilitator"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                        value={formData.roleLabel}
                                        onChange={e => setFormData({ ...formData, roleLabel: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-600 mt-2 italic">Avoid generic titles. Use functional owners.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Role Archetype</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                        value={formData.roleType}
                                        onChange={e => setFormData({ ...formData, roleType: e.target.value })}
                                    >
                                        <option value="OPERATIONAL_LEAD">Operational Lead (Owner)</option>
                                        <option value="FACILITATOR">Facilitator / Enabler</option>
                                        <option value="EXECUTIVE">Executive / Oversight</option>
                                        <option value="OTHER">Other / Hybrid</option>
                                    </select>
                                </div>
                                <div className="pt-4 space-y-4 border-t border-slate-800/50">
                                    <div>
                                        <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Recipient Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                            value={formData.recipientName}
                                            onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Recipient Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                            value={formData.recipientEmail}
                                            onChange={e => setFormData({ ...formData, recipientEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Constraints + Blind Spots */}
                            <div className="flex-1 space-y-6">
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-purple-400 mb-2">
                                        Perceived Constraints (Hypothesis)
                                    </label>
                                    <textarea
                                        rows={5}
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none resize-none transition-all font-serif italic"
                                        placeholder="What do you believe is frustrating this role?"
                                        value={formData.perceivedConstraints}
                                        onChange={e => setFormData({ ...formData, perceivedConstraints: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-600 mt-2 lowercase">This will be shared with the participant as the primary vector.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-purple-400 mb-2">
                                        Anticipated Blind Spots
                                    </label>
                                    <textarea
                                        rows={5}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none resize-none transition-all font-serif italic"
                                        placeholder="What should they be worried about but aren't?"
                                        value={formData.anticipatedBlindSpots}
                                        onChange={e => setFormData({ ...formData, anticipatedBlindSpots: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-800 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-xl shadow-xl shadow-indigo-500/20 transition-all uppercase tracking-[0.2em]">
                                Create Vector & Prepare Invite
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-3">
                {roles.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded bg-slate-900/20 text-slate-500 italic text-sm">
                        No intake roles defined. The system cannot generate diagnostics without vectors.
                    </div>
                ) : (
                    roles.map(role => (
                        <RoleCard key={role.id} role={role} onInvite={() => onInvite(role.id)} readOnly={readOnly} />
                    ))
                )}
            </div>
        </section>
    );
}

function RoleCard({ role, onInvite, readOnly }: { role: IntakeRoleDefinition, onInvite: () => void, readOnly: boolean }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 group hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${role.intakeStatus === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-100">{role.roleLabel}</h4>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>{role.recipientName} ({role.recipientEmail})</span>
                            <span className="w-px h-3 bg-slate-700"></span>
                            <span className="text-[10px] uppercase tracking-wide font-bold">{role.roleType.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide border 
                        ${role.intakeStatus === 'COMPLETED' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' :
                            role.inviteStatus === 'SENT' ? 'bg-indigo-900/20 text-indigo-400 border-indigo-500/30' :
                                'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                        {role.intakeStatus === 'COMPLETED' ? 'Completed' : role.inviteStatus === 'SENT' ? 'Invite Sent' : 'Queued'}
                    </div>

                    {!readOnly && role.intakeStatus !== 'COMPLETED' && (
                        <button
                            onClick={onInvite}
                            disabled={role.inviteStatus === 'SENT'}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all
                                ${role.inviteStatus === 'SENT'
                                    ? 'text-slate-500 cursor-not-allowed border border-transparent'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                                }`}
                        >
                            {role.inviteStatus === 'SENT' ? 'Resend' : 'Send Invite'}
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
}
