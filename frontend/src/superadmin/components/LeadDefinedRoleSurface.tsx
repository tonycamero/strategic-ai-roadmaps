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
                    <div className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-indigo-400 mb-1">
                        Zone 1.5 // Operational Context
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        Lead-Defined Intake Roles
                        <span className="px-1.5 py-0.5 rounded bg-indigo-900/30 text-[9px] text-indigo-300 border border-indigo-500/30">
                            {roles.length} Vectors
                        </span>
                    </h3>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        disabled={isAdding}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        + Add Role Vector
                    </button>
                )}
            </div>

            {/* Framing Context */}
            <div className="bg-indigo-900/10 border border-indigo-500/20 rounded p-3 text-xs text-indigo-200/80 mb-4">
                <strong>Protocol:</strong> Define roles as vector lenses, not job titles. Capture leadership perception (hypotheses) to contrast with operational reality.
            </div>

            {/* Add Role Form (Inline) */}
            {isAdding && (
                <div className="bg-slate-900/50 border border-indigo-500/50 rounded-lg p-5 animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-white">Define New Role Context</h4>
                            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white text-xs underline">Cancel</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Role Label (Semantic)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Manufacturing Facilitator"
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                                    value={formData.roleLabel}
                                    onChange={e => setFormData({ ...formData, roleLabel: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-600 mt-1">Avoid generic titles like "Manager". Use "Owner" or "Facilitator".</p>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Role Archetype</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                                    value={formData.roleType}
                                    onChange={e => setFormData({ ...formData, roleType: e.target.value })}
                                >
                                    <option value="OPERATIONAL_LEAD">Operational Lead (Owner)</option>
                                    <option value="FACILITATOR">Facilitator / Enabler</option>
                                    <option value="EXECUTIVE">Executive / Oversight</option>
                                    <option value="OTHER">Other / Hybrid</option>
                                </select>
                            </div>
                        </div>

                        {/* Leadership Hypotheses */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-purple-400 mb-1">
                                    Perceived Constraints (Hypothesis)
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:border-purple-500 outline-none resize-none"
                                    placeholder="What do you believe is frustrating this role?"
                                    value={formData.perceivedConstraints}
                                    onChange={e => setFormData({ ...formData, perceivedConstraints: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-600 mt-1">This framing will be shared with the participant.</p>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-purple-400 mb-1">
                                    Anticipated Blind Spots
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:border-purple-500 outline-none resize-none"
                                    placeholder="What should they be worried about but aren't?"
                                    value={formData.anticipatedBlindSpots}
                                    onChange={e => setFormData({ ...formData, anticipatedBlindSpots: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Recipient */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/50">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Recipient Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={formData.recipientName}
                                        onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Recipient Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={formData.recipientEmail}
                                        onChange={e => setFormData({ ...formData, recipientEmail: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-lg">
                                Create Role & Prepare Invite
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

            {/* Perceived Constraints (Collapsed/Visible) */}
            <div className="mt-3 pl-4 border-l-2 border-purple-500/20">
                <div className="text-[9px] uppercase font-bold text-slate-600 mb-0.5">Focus Hypothesis</div>
                <p className="text-xs text-slate-400 italic font-serif leading-relaxed">
                    "{role.perceivedConstraints}"
                </p>
            </div>
        </div>
    );
}
