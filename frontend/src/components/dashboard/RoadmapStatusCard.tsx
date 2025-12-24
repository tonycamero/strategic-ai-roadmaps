interface RoadmapStatusCardProps {
  status: 'draft' | 'review' | 'finalized';
  lastUpdated: Date;
  nextMilestone: string;
  onOpenRoadmap: () => void;
  isRoadmapGenerated?: boolean;
}

const STATUS_CONFIG = {
  draft: {
    label: 'Not Generated',
    color: 'bg-slate-700 text-slate-300 border-slate-600',
  },
  review: {
    label: 'Under Review',
    color: 'bg-amber-900/40 text-amber-300 border-amber-700',
  },
  finalized: {
    label: 'Finalized',
    color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  },
};

export function RoadmapStatusCard({
  status,
  lastUpdated,
  nextMilestone,
  onOpenRoadmap,
  isRoadmapGenerated = false,
}: RoadmapStatusCardProps) {
  const config = STATUS_CONFIG[status];

  const handleClick = () => {
    if (!isRoadmapGenerated) {
      alert(
        '🗺️ Roadmap Not Yet Generated\n\n' +
        'Your roadmap is currently being prepared through our 4-step workflow:\n\n' +
        '1. ✅ Complete all intake forms (Owner, Ops, Sales, Delivery)\n' +
        '2. Generate SOP-01 diagnostic\n' +
        '3. Complete discovery call\n' +
        '4. Generate full roadmap\n\n' +
        'Check the "Roadmap Generation Workflow" card above to see your current progress.'
      );
    } else {
      onOpenRoadmap();
    }
  };

  return (
    <div className="bg-slate-900/60 border border-blue-500/70 rounded-xl p-5 shadow-lg shadow-blue-900/20">
      <h3 className="text-sm font-semibold text-slate-100 mb-4">Roadmap Status</h3>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Status</span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${config.color}`}>
            {config.label}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Last Updated</span>
          <span className="text-xs text-slate-300">
            {lastUpdated.toLocaleDateString()}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Next Milestone</span>
          <span className="text-xs text-slate-200">{nextMilestone}</span>
        </div>
      </div>

      <button
        onClick={handleClick}
        disabled={!isRoadmapGenerated}
        className={`w-full px-4 py-2.5 text-white text-xs font-medium rounded-lg transition-colors ${
          isRoadmapGenerated
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-slate-700 hover:bg-slate-600 cursor-pointer'
        }`}
      >
        {isRoadmapGenerated ? 'Open Roadmap' : 'Roadmap Not Ready'}
      </button>
    </div>
  );
}
