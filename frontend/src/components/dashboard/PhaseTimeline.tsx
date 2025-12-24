interface PhaseTimelineProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { number: 1, label: 'Leadership Intakes' },
  { number: 2, label: 'Roadmap Draft' },
  { number: 3, label: 'Roadmap Review' },
  { number: 4, label: 'Pilot Selection' },
];

export function PhaseTimeline({ currentStep }: PhaseTimelineProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-100 mb-4">Journey Progress</h3>
      
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step) => {
            const isComplete = step.number < currentStep;
            const isCurrent = step.number === currentStep;

            return (
              <div key={step.number} className="flex flex-col items-center gap-2">
                {/* Circle indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isComplete
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-900/40'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs text-center max-w-[80px] ${
                    isCurrent ? 'text-slate-200 font-medium' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
