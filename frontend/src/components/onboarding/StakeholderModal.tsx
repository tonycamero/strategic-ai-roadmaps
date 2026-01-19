<<<<<<< HEAD
<<<<<<< HEAD
// frontend/src/components/onboarding/StakeholderModal.tsx

interface StakeholderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StakeholderModal({ isOpen, onClose }: StakeholderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-white">Add Stakeholder</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-indigo-900/20 border border-indigo-700/50 rounded-lg">
            <p className="text-sm text-indigo-300">
              <strong>Phase D Placeholder:</strong> Stakeholder creation is intentionally disabled in this recovery build.
            </p>
          </div>

          <div className="text-slate-400 text-sm italic">
            Logic will be reintroduced after canonical API stabilization.
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
=======
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface StakeholderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    loading?: boolean;
}

export function StakeholderModal({ isOpen, onClose, onSubmit, initialData, loading }: StakeholderModalProps) {
    const [formData, setFormData] = useState({
        roleLabel: initialData?.roleLabel || '',
        roleType: initialData?.roleType || 'OPERATIONAL_LEAD',
        perceivedConstraints: initialData?.perceivedConstraints || '',
        anticipatedBlindSpots: initialData?.anticipatedBlindSpots || '',
        recipientEmail: initialData?.recipientEmail || '',
        recipientName: initialData?.recipientName || '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-100">
                        {initialData ? 'Edit Stakeholder' : 'Add Strategic Stakeholder'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5">
                                    Role Label
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Head of Production"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    value={formData.roleLabel}
                                    onChange={(e) => setFormData({ ...formData, roleLabel: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5">
                                    Archetype
                                </label>
                                <select
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    value={formData.roleType}
                                    onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                                >
                                    <option value="OPERATIONAL_LEAD">Operational Lead</option>
                                    <option value="SALES_LEAD">Sales Lead</option>
                                    <option value="DELIVERY_LEAD">Delivery Lead</option>
                                    <option value="EXECUTIVE">Executive / Oversight</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5">
                                    Recipient Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    value={formData.recipientName}
                                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5">
                                    Recipient Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="email@company.com"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    value={formData.recipientEmail}
                                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1.5">
                                    Perceived Constraints
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="What is frustrating this role? (Your perspective)"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none text-xs leading-relaxed"
                                    value={formData.perceivedConstraints}
                                    onChange={(e) => setFormData({ ...formData, perceivedConstraints: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1.5">
                                    Anticipated Blind Spots
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="What are they missing in their current workflow?"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none text-xs leading-relaxed"
                                    value={formData.anticipatedBlindSpots}
                                    onChange={(e) => setFormData({ ...formData, anticipatedBlindSpots: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all"
                        >
                            {loading ? 'Processing...' : initialData ? 'Update Stakeholder' : 'Define Vector'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
>>>>>>> 02e8d03 (feat: executive brief approval, state sync, and pdf delivery pipeline)
=======
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface StakeholderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    loading?: boolean;
}

export function StakeholderModal({ isOpen, onClose, onSubmit, initialData, loading }: StakeholderModalProps) {
    const [formData, setFormData] = useState({
        roleLabel: initialData?.roleLabel || '',
        roleType: initialData?.roleType || 'OPERATIONAL_LEAD',
        perceivedConstraints: initialData?.perceivedConstraints || '',
        anticipatedBlindSpots: initialData?.anticipatedBlindSpots || '',
        recipientEmail: initialData?.recipientEmail || '',
        recipientName: initialData?.recipientName || '',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-100">
                        {initialData ? 'Edit Stakeholder' : 'Add Strategic Stakeholder'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5">
                                    Role Label
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Head of Production"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    value={formData.roleLabel}
                                    onChange={(e) => setFormData({ ...formData, roleLabel: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5">
                                    Archetype
                                </label>
                                <select
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    value={formData.roleType}
                                    onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
                                >
                                    <option value="OPERATIONAL_LEAD">Operational Lead</option>
                                    <option value="SALES_LEAD">Sales Lead</option>
                                    <option value="DELIVERY_LEAD">Delivery Lead</option>
                                    <option value="EXECUTIVE">Executive / Oversight</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5">
                                    Recipient Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    value={formData.recipientName}
                                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1.5">
                                    Recipient Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="email@company.com"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                    value={formData.recipientEmail}
                                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1.5">
                                    Perceived Constraints
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="What is frustrating this role? (Your perspective)"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none text-xs leading-relaxed"
                                    value={formData.perceivedConstraints}
                                    onChange={(e) => setFormData({ ...formData, perceivedConstraints: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-1.5">
                                    Anticipated Blind Spots
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="What are they missing in their current workflow?"
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none text-xs leading-relaxed"
                                    value={formData.anticipatedBlindSpots}
                                    onChange={(e) => setFormData({ ...formData, anticipatedBlindSpots: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all"
                        >
                            {loading ? 'Processing...' : initialData ? 'Update Stakeholder' : 'Define Vector'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
>>>>>>> 1e46cab (chore: lock executive brief render + pdf contracts)
