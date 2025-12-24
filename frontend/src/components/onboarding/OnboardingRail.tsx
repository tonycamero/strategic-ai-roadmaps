import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { RailHeader } from './RailHeader';
import { NextActionCard } from './NextActionCard';
import { StepList } from './StepList';
import { BadgesStrip } from './BadgesStrip';

export function OnboardingRail() {
  const { user } = useAuth();
  const { state, loading, error } = useOnboarding();
  
  // Collapse state persisted in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('onboarding-rail-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('onboarding-rail-collapsed', String(collapsed));
  }, [collapsed]);

  // Only show for owners
  if (user?.role !== 'owner') return null;

  // Loading skeleton
  if (loading) {
    return (
      <aside className={`h-[calc(100vh-4rem)] sticky top-16 bg-slate-900/70 border-r border-slate-800 transition-all duration-300 ${
        collapsed ? 'w-12' : 'w-[280px]'
      }`}>
        <div className="p-4 animate-pulse">
          <div className="h-14 bg-slate-800 rounded-full w-14"></div>
        </div>
      </aside>
    );
  }

  // Error state
  if (error) {
    return (
      <aside className="w-[280px] h-[calc(100vh-4rem)] sticky top-16 bg-slate-900/70 border-r border-slate-800 p-4">
        <div className="text-sm text-red-400">
          Failed to load onboarding progress
        </div>
      </aside>
    );
  }

  // No state yet
  if (!state) return null;

  return (
    <aside
      className={`
        h-[calc(100vh-4rem)] sticky top-16
        bg-slate-900/70 backdrop-blur-sm border-r border-slate-800
        flex flex-col
        transition-all duration-300 ease-out
        ${collapsed ? 'w-12' : 'w-[280px]'}
      `}
    >
      <RailHeader collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      
      {!collapsed && (
        <>
          <NextActionCard />
          <StepList />
          <BadgesStrip />
        </>
      )}
    </aside>
  );
}
