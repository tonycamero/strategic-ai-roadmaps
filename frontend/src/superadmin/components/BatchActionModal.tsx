import { useState, useEffect, FC } from 'react';
import { superadminApi } from '../api';

interface BatchActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantIds: string[];
    actionType: 'readiness' | 'finalize';
    flag?: string;
    value?: boolean;
    onSuccess: () => void;
}

export const BatchActionModal: FC<BatchActionModalProps> = ({
    isOpen,
    onClose,
    tenantIds,
    actionType,
    flag,
    value,
    onSuccess
}) => {
    const [step, setStep] = useState<'preview' | 'executing' | 'done'>('preview');
    const [previewData, setPreviewData] = useState<{ eligible: any[], ineligible: any[] } | null>(null);
    const [results, setResults] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const [overrideReason, setOverrideReason] = useState('');

    useEffect(() => {
        if (isOpen && tenantIds.length > 0) {
            handlePreview();
        } else {
            setStep('preview');
            setPreviewData(null);
            setResults(null);
        }
    }, [isOpen]);

const handlePreview = async () => {
  setLoading(true);
  try {
    if (actionType === 'readiness') {
      const data = await superadminApi.previewReadinessBatch(tenantIds);
      setPreviewData(data);
    } else {
      const data = await superadminApi.previewFinalizeBatch(tenantIds);
      setPreviewData(data);
    }
  } catch (err) {
    console.error('Batch preview error:', err);
  } finally {
    setLoading(false);
  }
};

const handleExecute = async () => {
  setLoading(true);
  setStep('executing');

  try {
    const eligibleIds = previewData?.eligible?.map((e: any) => e.tenantId) || [];

    if (actionType === 'readiness') {
      const data = await superadminApi.executeReadinessBatch({
        tenantIds: eligibleIds,
        // optional operator override controls (remove if you don't want override behavior)
        override: notes.trim().length > 0 || overrideReason.trim().length > 0 ? true : undefined,
        overrideReason: overrideReason.trim() || undefined,
      });
      setResults(data.results);
    } else {
      const data = await superadminApi.executeFinalizeBatch({
        tenantIds: eligibleIds,
      });
      setResults(data.results);
    }

    setStep('done');
    onSuccess();
  } catch (err) {
    console.error('Batch execute error:', err);
    setStep('preview');
  } finally {
    setLoading(false);
  }
};


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">
                            {actionType === 'readiness' ? 'Batch Readiness Update' : 'Batch Roadmap Finalization'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Processing {tenantIds.length} selected tenants
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'preview' && (
                        <div className="space-y-6">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm text-slate-400 font-medium">Calculating eligibility...</p>
                                </div>
                            ) : previewData && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-indigo-400">{previewData.eligible.length}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500/60 mt-1">Eligible</div>
                                        </div>
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-red-400">{previewData.ineligible.length}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-red-500/60 mt-1">Ineligible</div>
                                        </div>
                                    </div>

                                    {previewData.ineligible.length > 0 && (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ineligible Reasons</h3>
                                            <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-3 max-h-32 overflow-y-auto space-y-2">
                                                {previewData.ineligible.map((item, i) => (
                                                    <div key={i} className="text-[11px] text-slate-500 flex items-start gap-2">
                                                        <span className="text-red-500/50 font-bold">•</span>
                                                        <span>{item.name || item.tenantId}: {item.reasons.join(', ')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Audit Notes (Optional)</label>
                                            <textarea
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 min-h-[80px]"
                                                placeholder="Explain why this batch is being run..."
                                            />
                                        </div>

                                        {(actionType === 'finalize' || (actionType === 'readiness' && previewData.ineligible.length > 0)) && (
                                            <div>
                                                <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Override Reason (Required for ineligible)</label>
                                                <textarea
                                                    value={overrideReason}
                                                    onChange={e => setOverrideReason(e.target.value)}
                                                    className="w-full bg-slate-950 border border-purple-900/30 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500/50 min-h-[60px]"
                                                    placeholder="Executive justification for override..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 'executing' && (
                        <div className="py-12 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <h3 className="text-lg font-bold text-white">Applying Changes</h3>
                            <p className="text-sm text-slate-400">Please do not close this window...</p>
                        </div>
                    )}

                    {step === 'done' && results && (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Action Complete</h3>
                                <p className="text-sm text-slate-400 mt-1">Batch results summary below</p>
                            </div>

                            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">Tenant ID</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {results.map((res, i) => (
                                            <tr key={i} className="hover:bg-slate-900/30">
                                                <td className="px-4 py-3 font-mono text-slate-400">{res.tenantId.split('-')[0]}...</td>
                                                <td className="px-4 py-3">
                                                    {res.success ? (
                                                        <span className="text-green-500 font-bold tracking-tight">SUCCESS</span>
                                                    ) : (
                                                        <span className="text-red-500 font-bold tracking-tight">FAILED</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {res.error || 'Changes applied'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-end gap-3">
                    {step === 'preview' ? (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleExecute}
                                disabled={loading || !previewData?.eligible.length || (actionType === 'finalize' && !overrideReason)}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                            >
                                Confirm & Execute
                            </button>
                        </>
                    ) : step === 'done' ? (
                        <button
                            onClick={() => {
                                onSuccess();
                                onClose();
                            }}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-all"
                        >
                            Close
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
