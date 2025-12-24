interface CommandStripProps {
  firmName: string;
  cohort: string;
  onScheduleCall: () => void;
  onOpenRoadmap: () => void;
  onLogout: () => void;
  isSuperadmin?: boolean;
  onSuperadminClick?: () => void;
  isRoadmapGenerated?: boolean;
}

export function CommandStrip({
  firmName,
  cohort,
  onScheduleCall,
  onOpenRoadmap,
  onLogout,
  isSuperadmin,
  onSuperadminClick,
  isRoadmapGenerated = false,
}: CommandStripProps) {
  const handleRoadmapClick = () => {
    if (!isRoadmapGenerated) {
      alert(
        '🗺️ Roadmap Not Yet Generated\n\n' +
        'Your roadmap is currently being prepared through our 4-step workflow:\n\n' +
        '1. ✅ Complete all intake forms (Owner, Ops, Sales, Delivery)\n' +
        '2. Generate SOP-01 diagnostic\n' +
        '3. Complete discovery call\n' +
        '4. Generate full roadmap\n\n' +
        'Check the "Roadmap Generation Workflow" card below to see your current progress.'
      );
    } else {
      onOpenRoadmap();
    }
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800/50 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Context */}
          <div className="flex-shrink-0">
            <h1 className="text-base font-medium text-slate-100">
              Strategic AI Roadmaps
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Cohort: {cohort} • {firmName}
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onScheduleCall}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Schedule Call
            </button>
            <button
              onClick={handleRoadmapClick}
              className={`px-4 py-2 border text-xs font-medium rounded-lg transition-colors ${
                isRoadmapGenerated
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-800 text-slate-500 hover:bg-slate-900'
              }`}
            >
              Roadmap
            </button>
            {isSuperadmin && (
              <button
                onClick={onSuperadminClick}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                SuperAdmin
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
