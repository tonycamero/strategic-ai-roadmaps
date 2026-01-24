import React from 'react';

interface StakeholderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    loading?: boolean;
}

export function StakeholderModal({ isOpen, onClose, onSubmit, loading }: StakeholderModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-white">Add Stakeholder</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-indigo-900/20 border border-indigo-700/50 rounded-lg">
                        <p className="text-sm text-indigo-300">
                            <strong>Phase D Placeholder:</strong> This component is currently a minimal placeholder to resolve build errors.
                        </p>
                    </div>

                    <div className="text-slate-400 text-sm italic">
                        Stakeholder creation logic is currently not implemented in this minimal recovery build.
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled
                        className="px-4 py-2 bg-slate-800 text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed"
                    >
                        Create Stakeholder (Locked)
                    </button>
                </div>
            </div>
        </div>
    );
}
