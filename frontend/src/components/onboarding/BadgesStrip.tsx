import { Award } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

export function BadgesStrip() {
  const { state } = useOnboarding();

  if (!state || state.badges.length === 0) return null;

  // Show most recent 3 badges
  const displayBadges = state.badges.slice(-3).reverse();

  return (
    <div className="mt-auto pt-4 px-3 pb-3 border-t border-slate-800">
      <div className="text-xs font-medium text-slate-400 mb-2">Badges Earned</div>
      <div className="flex flex-wrap gap-2">
        {displayBadges.map(badge => (
          <div
            key={badge.badgeId}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-xs text-slate-300"
            title={badge.description}
          >
            <Award className="h-3 w-3 text-yellow-500" />
            {badge.label}
          </div>
        ))}
      </div>
    </div>
  );
}
