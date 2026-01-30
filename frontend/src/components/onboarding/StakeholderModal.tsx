import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Info } from 'lucide-react';

interface StakeholderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    loading?: boolean;
    initialData?: any;
}

const ROLE_TYPES = [
    { value: 'OPERATIONAL_LEAD', label: 'Operational Lead (e.g. Ops Manager, COO)' },
    { value: 'SALES_LEAD', label: 'Sales/Growth Lead (e.g. Sales Manager, Head of Growth)' },
    { value: 'DELIVERY_LEAD', label: 'Delivery/Product Lead (e.g. Head of Delivery, Tech Lead)' },
    { value: 'EXECUTIVE', label: 'Executive/Strategic (e.g. CFO, Partner)' },
    { value: 'FACILITATOR', label: 'Facilitator/Internal Admin' },
    { value: 'OTHER', label: 'Other Stakeholder' }
];

export function StakeholderModal({ isOpen, onClose, onSubmit, loading, initialData }: StakeholderModalProps) {
    const [formData, setFormData] = useState({
        roleLabel: '',
        roleType: 'OPERATIONAL_LEAD',
        perceivedConstraints: '',
        anticipatedBlindSpots: '',
        recipientName: '',
        recipientEmail: ''
    });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                roleLabel: initialData.roleLabel || '',
                roleType: initialData.roleType || 'OPERATIONAL_LEAD',
                perceivedConstraints: initialData.perceivedConstraints || '',
                anticipatedBlindSpots: initialData.anticipatedBlindSpots || '',
                recipientName: initialData.recipientName || '',
                recipientEmail: initialData.recipientEmail || ''
            });
        } else {
            setFormData({
                roleLabel: '',
                roleType: 'OPERATIONAL_LEAD',
                perceivedConstraints: '',
                anticipatedBlindSpots: '',
                recipientName: '',
                recipientEmail: ''
            });
        }
        setError(null);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!formData.roleLabel || !formData.perceivedConstraints) {
            setError('Please fill in all required fields.');
            return;
        }

        if (formData.perceivedConstraints.length < 10) {
            setError('Please provide a more detailed constraint hypothesis (min 10 chars).');
            return;
        }

        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err.message || 'Failed to save stakeholder vector.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 px-6 py-5 border-b border-slate-800 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-lg font-bold text-white uppercase tracking-widest">
                            {initialData ? 'Edit Strategic Vector' : 'Define New Vector'}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            Stakeholder Role & Constraint Mapping
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-xs text-red-300 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Role Definition */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                Role Label <span className="text-indigo-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.roleLabel}
                                onChange={(e) => setFormData({ ...formData, roleLabel: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                placeholder="e.g. Operations Director, Lead Sales Rep"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                Role Category <span className="text-indigo-500">*</span>
                            </label>
                            <select
                                value={formData.roleType}
                                onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                            >
                                {ROLE_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Vector Lens (Hypothesis) */}
                    <div className="space-y-4 pt-4 border-t border-slate-800/50">
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">
                                Perception Hub: Perceived Constraints <span className="text-indigo-500">*</span>
                            </label>
                            <div className="group relative">
                                <Info className="w-3 h-3 text-slate-600 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                    Describe what you believe is holding this role back. This hypothesis will be shared with the stakeholder.
                                </div>
                            </div>
                        </div>
                        <textarea
                            value={formData.perceivedConstraints}
                            onChange={(e) => setFormData({ ...formData, perceivedConstraints: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[100px] resize-none"
                            placeholder="e.g. Spends 10+ hours/week manually data-entering from spreadsheets; lack of visibility into lead status."
                            required
                        />

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                Anticipated Blind Spots (Internal Note)
                            </label>
                            <textarea
                                value={formData.anticipatedBlindSpots}
                                onChange={(e) => setFormData({ ...formData, anticipatedBlindSpots: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all min-h-[80px] resize-none"
                                placeholder="What might they not be seeing? (Optional)"
                            />
                        </div>
                    </div>

                    {/* Assignment (Optional) */}
                    <div className="space-y-4 pt-4 border-t border-slate-800/50">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            Stakeholder Assignment (Optional)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <input
                                    type="text"
                                    value={formData.recipientName}
                                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <input
                                    type="email"
                                    value={formData.recipientEmail}
                                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    placeholder="Email Address"
                                />
                            </div>
                        </div>
                        <p className="text-[9px] text-slate-600 italic">
                            Email is required to send the intake invite link later.
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-slate-900 border-t border-slate-800 mt-4 pb-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.roleLabel || !formData.perceivedConstraints}
                            className={`px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? 'Processing...' : initialData ? 'Update Vector' : 'Establish Vector'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
