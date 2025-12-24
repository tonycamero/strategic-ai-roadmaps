interface IntakeModalProps {
  intake: {
    id: string;
    role: string;
    status: string;
    answers: Record<string, unknown>;
    createdAt: string;
    completedAt: string | null;
    userName: string;
    userEmail: string;
  };
  onClose: () => void;
}

export function IntakeModal({ intake, onClose }: IntakeModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Intake Form
            </h2>
            <div className="mt-1 text-sm text-slate-400">
              {intake.userName} &lt;{intake.userEmail}&gt;
            </div>
            <div className="mt-1 flex gap-3 text-xs text-slate-500">
              <span className="uppercase font-medium">{intake.role}</span>
              <span>•</span>
              <span className="capitalize">{intake.status}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body - Answers */}
        <div className="p-6 space-y-6">
          {Object.keys(intake.answers).length === 0 ? (
            <div className="text-slate-500 text-sm">No answers submitted yet.</div>
          ) : (
            Object.entries(intake.answers).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-slate-400 font-medium">
                  {formatQuestionKey(key)}
                </div>
                <div className="text-sm text-slate-200 bg-slate-950 border border-slate-800 rounded-lg p-4 whitespace-pre-wrap">
                  {formatAnswerValue(value)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex justify-between items-center text-xs text-slate-500">
          <div>
            Started {new Date(intake.createdAt).toLocaleString()}
          </div>
          {intake.completedAt && (
            <div>
              Completed {new Date(intake.completedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatQuestionKey(key: string): string {
  // Convert snake_case or camelCase to Title Case
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
