import { useState, useEffect } from 'react';
import { superadminApi } from '../api';
import { ClarificationPipelineSubSection } from './ClarificationPipelineSubSection';

interface CoachingFeedback {
  comment: string;
  isFlagged: boolean;
}

interface IntakeModalProps {
  intake: {
    id: string;
    role: string;
    status: string;
    answers: Record<string, unknown>;
    coachingFeedback?: Record<string, CoachingFeedback>;
    createdAt: string;
    completedAt: string | null;
    userName: string;
    userEmail: string;
  };
  intakeWindowState: 'OPEN' | 'CLOSED';
  onClose: () => void;
  onRefresh?: () => void;
}

export function IntakeModal({ intake, intakeWindowState, onClose, onRefresh }: IntakeModalProps) {
  const [feedback, setFeedback] = useState<Record<string, CoachingFeedback>>(intake.coachingFeedback || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [clarifications, setClarifications] = useState<any[]>([]);

  useEffect(() => {
    fetchClarifications();
  }, [intake.id]);

  const fetchClarifications = async () => {
    try {
      const res = await superadminApi.getIntakeClarifications(intake.id);
      if (Array.isArray(res)) {
        setClarifications(res);
      } else if (res && (res as any).clarifications) {
        setClarifications((res as any).clarifications);
      }
    } catch (error) {
      console.error('Failed to load clarifications:', error);
    }
  };

  const handleResendEmail = async (clarificationId: string) => {
    try {
      await superadminApi.resendIntakeClarificationEmail(clarificationId);
      await fetchClarifications();
    } catch (error) {
      console.error('Resend email error:', error);
    }
  };

  const handleFeedbackChange = (key: string, field: keyof CoachingFeedback, value: string | boolean) => {
    setFeedback((prev: Record<string, CoachingFeedback>) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { comment: '', isFlagged: false }),
        [field]: value
      }
    }));
    setIsModified(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await superadminApi.updateIntakeCoaching(intake.id, feedback);
      setIsModified(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to save coaching feedback:', err);
      alert('Failed to save coaching feedback');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestClarification = async (key: string, prompt: string, blocking: boolean) => {
    try {
      await superadminApi.requestIntakeClarification({
        intakeId: intake.id,
        questionId: key,
        clarificationPrompt: prompt,
        blocking
      });
      loadClarifications();
    } catch (err) {
      console.error('Failed to request clarification:', err);
      alert('Failed to request clarification');
    }
  };

  const isReadOnly = intakeWindowState === 'CLOSED';

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-100 uppercase tracking-tight">
              Review: {intake.role} Intake
            </h2>
            <div className="mt-1 text-sm text-slate-400">
              {intake.userName} &lt;{intake.userEmail}&gt;
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!isReadOnly && (
              <button
                onClick={handleSave}
                disabled={isSaving || !isModified}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Review'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body - Answers & Coaching */}
        <div className="p-6 space-y-12 overflow-y-auto flex-1">
          {Object.keys(intake.answers).length === 0 ? (
            <div className="text-slate-500 text-sm italic py-8 text-center">No answers submitted yet.</div>
          ) : (
            Object.entries(intake.answers).map(([key, value]) => {
              const itemFeedback = feedback[key] || { comment: '', isFlagged: false };
              const questionClarifications = clarifications.filter(c => c.questionId === key);
              return (
                <div key={key} className="space-y-4 pb-12 border-b border-slate-800/50 last:border-0 last:pb-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Answer Section */}
                    <div className="space-y-3">
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        {formatQuestionKey(key)}
                      </div>
                      <div className="text-sm text-slate-200 bg-slate-950 border border-slate-800 rounded-lg p-4 whitespace-pre-wrap min-h-[100px]">
                        {formatAnswerValue(value)}
                      </div>
                    </div>

                    {/* Coaching Section */}
                    <div className="space-y-3 bg-slate-800/20 p-4 rounded-lg border border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                          Consultant Coaching Note (Internal)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={itemFeedback.isFlagged}
                            onChange={(e) => handleFeedbackChange(key, 'isFlagged', e.target.checked)}
                            disabled={isReadOnly}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500 focus:ring-offset-slate-900 disabled:opacity-50"
                          />
                          <span className={`text-[10px] uppercase font-bold tracking-wider ${itemFeedback.isFlagged ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                            Flag for Action
                          </span>
                        </label>
                      </div>
                      <textarea
                        value={itemFeedback.comment}
                        onChange={(e) => handleFeedbackChange(key, 'comment', e.target.value)}
                        disabled={isReadOnly}
                        placeholder={isReadOnly ? "No coaching notes provided." : "Add internal feedback or coaching notes..."}
                        className="w-full text-sm bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-slate-300 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-950/20 disabled:text-slate-500 transition-all resize-none min-h-[80px]"
                      />
                    </div>
                  </div>

                  {/* Clarification Pipeline Section */}
                  {!isReadOnly && (
                    <div className="lg:col-span-2">
                      <ClarificationPipelineSubSection
                        questionId={key}
                        originalResponse={formatAnswerValue(value)}
                        existingClarifications={questionClarifications}
                        onRequestClarification={(prompt, blocking) => handleRequestClarification(key, prompt, blocking)}
                        onResendEmail={handleResendEmail}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Re-open Intake (Special Action) */}
          {intake.status === 'completed' && !isReadOnly && (
            <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Re-open Intake</h4>
                <p className="text-[10px] text-slate-500 font-medium">This will move the intake back to "In Progress" and allow the user to continue submitting answers.</p>
              </div>
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to re-open this intake? The user will be able to edit their responses.')) return;
                  try {
                    await superadminApi.reopenIntake(intake.id);
                    if (onRefresh) onRefresh();
                    onClose();
                  } catch (err) {
                    alert('Failed to re-open intake');
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-amber-900/40 transition-all"
              >
                Execute Re-open
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/40 border-t border-slate-800 p-4 shrink-0">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-tighter text-slate-600 font-mono">
            <div className="flex gap-4">
              <span>STARTED: {new Date(intake.createdAt).toLocaleString()}</span>
              {intake.completedAt && (
                <span>COMPLETED: {new Date(intake.completedAt).toLocaleString()}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${intakeWindowState === 'OPEN' ? 'bg-green-500' : 'bg-red-500'}`} />
              WINDOW STATE: {intakeWindowState}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatQuestionKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '(No answer provided)';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}
