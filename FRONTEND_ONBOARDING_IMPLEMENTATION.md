# Frontend Onboarding Rail Implementation Guide

## Status: **FOUNDATION COMPLETE** ✅

This document provides complete implementation instructions for the Onboarding Rail UI, following the specifications in `/docs/onboarding-spec/`.

---

## 📋 Frontend Recon Map

```txt
Frontend Stack       → Vite + React 18 + TypeScript
Router               → wouter (lightweight, uses useLocation hook)
AppShell / Layout    → No centralized layout - routes render individually
Main Dashboard       → frontend/src/pages/owner/DashboardV5.tsx
API client           → frontend/src/lib/api.ts (async/await fetch wrapper)
Auth / tenant        → frontend/src/context/AuthContext.tsx
                      → user.id = ownerId for owner role users
Styling              → Tailwind CSS (default config, no custom tokens)
State Management     → @tanstack/react-query for server state
                      → React Context for app-level state
Icons                → lucide-react
Package Manager      → pnpm (monorepo with @roadmap/shared)
```

**Key Findings:**
- No React Router - uses `wouter` with `useLocation()` hook
- No framer-motion installed - will use CSS transitions instead
- Tailwind uses default palette - will use `slate-*` colors for dark theme
- Auth context provides tenantId via `user.id` (for owners)

---

## ✅ Completed Files

1. **Types** - `frontend/src/types/onboarding.ts` ✅
   - All TypeScript interfaces matching backend API

2. **API Client** - `frontend/src/lib/api.ts` (modified) ✅
   - Added `getOnboardingState(tenantId)` method

3. **Routes Helper** - `frontend/src/utils/onboardingRoutes.ts` ✅
   - Maps step IDs to actual routes
   - Contains TODOs for routes that don't exist yet

---

## 🚧 Implementation Tasks Remaining

### Step 1: Create OnboardingContext

**File:** `frontend/src/context/OnboardingContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import type { OnboardingState } from '../types/onboarding';

interface OnboardingContextValue {
  state: OnboardingState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For detecting state changes (rewards)
  const previousStateRef = useRef<OnboardingState | null>(null);

  const fetchOnboardingState = async () => {
    if (!user || user.role !== 'owner') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const tenantId = user.id; // For owners, user.id === ownerId === tenantId
      const data = await api.getOnboardingState(tenantId);
      
      previousStateRef.current = state;
      setState(data);
    } catch (err: any) {
      console.error('Failed to fetch onboarding state:', err);
      setError(err.message || 'Failed to load onboarding progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOnboardingState();
    }
  }, [isAuthenticated, user?.id]);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        loading,
        error,
        refresh: fetchOnboardingState,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
```

**Integration:** Wrap authenticated routes in `App.tsx`:

```typescript
// In App.tsx
import { OnboardingProvider } from './context/OnboardingContext';

// Wrap the authenticated portion of your app:
<AuthProvider>
  <OnboardingProvider>
    <Router>
      {/* routes */}
    </Router>
  </OnboardingProvider>
</AuthProvider>
```

---

### Step 2: Create Component Files

Create the `frontend/src/components/onboarding/` directory and add:

#### 2.1 ProgressRing Component

**File:** `frontend/src/components/onboarding/ProgressRing.tsx`

```typescript
interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ 
  percent, 
  size = 56, 
  strokeWidth = 6 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-500 transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-slate-200">
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}
```

#### 2.2 CollapseButton Component

**File:** `frontend/src/components/onboarding/CollapseButton.tsx`

```typescript
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapseButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function CollapseButton({ collapsed, onToggle }: CollapseButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
      aria-label={collapsed ? 'Expand onboarding' : 'Collapse onboarding'}
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </button>
  );
}
```

#### 2.3 RailHeader Component

**File:** `frontend/src/components/onboarding/RailHeader.tsx`

```typescript
import { ProgressRing } from './ProgressRing';
import { CollapseButton } from './CollapseButton';
import { useOnboarding } from '../../context/OnboardingContext';

interface RailHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function RailHeader({ collapsed, onToggle }: RailHeaderProps) {
  const { state } = useOnboarding();

  if (!state) return null;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-slate-800">
      <ProgressRing percent={state.percentComplete} />
      
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-200">
            Your Roadmap Journey
          </h3>
          <p className="text-xs text-slate-400">
            {state.totalPoints} of {state.maxPoints} points
          </p>
        </div>
      )}
      
      <CollapseButton collapsed={collapsed} onToggle={onToggle} />
    </div>
  );
}
```

#### 2.4 NextActionCard Component

**File:** `frontend/src/components/onboarding/NextActionCard.tsx`

```typescript
import { ArrowRight, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useOnboarding } from '../../context/OnboardingContext';
import { getRouteForStep } from '../../utils/onboardingRoutes';

export function NextActionCard() {
  const { state } = useOnboarding();
  const [, setLocation] = useLocation();

  if (!state?.nextStepId) return null;

  const handleClick = () => {
    const route = getRouteForStep(state.nextStepId!);
    setLocation(route);
  };

  return (
    <div className="mx-3 my-4 p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 shadow-lg">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-blue-400">Next Step</span>
        {state.nextStepEstimatedMinutes && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            ~{state.nextStepEstimatedMinutes} min
          </span>
        )}
      </div>
      
      <h4 className="text-sm font-semibold text-slate-100 mb-3">
        {state.nextStepLabel}
      </h4>
      
      <button
        onClick={handleClick}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
```

#### 2.5 StepItem Component

**File:** `frontend/src/components/onboarding/StepItem.tsx`

```typescript
import { Check, Circle, Loader } from 'lucide-react';
import { useLocation } from 'wouter';
import type { OnboardingStep } from '../../types/onboarding';
import { getRouteForStep } from '../../utils/onboardingRoutes';

interface StepItemProps {
  step: OnboardingStep;
  isNext: boolean;
}

export function StepItem({ step, isNext }: StepItemProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    const route = getRouteForStep(step.stepId);
    setLocation(route);
  };

  const getIcon = () => {
    switch (step.status) {
      case 'COMPLETED':
        return <Check className="h-4 w-4 text-green-400" />;
      case 'IN_PROGRESS':
        return <Loader className="h-4 w-4 text-blue-400" />;
      default:
        return <Circle className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg
        transition-colors cursor-pointer text-left
        ${isNext 
          ? 'bg-slate-800 border border-blue-500/40' 
          : 'hover:bg-slate-800/60'
        }
      `}
    >
      {getIcon()}
      
      <div className="flex-1 min-w-0">
        <div className="text-sm text-slate-200">{step.label}</div>
        {step.isRequired && (
          <span className="text-xs text-slate-500">Required</span>
        )}
      </div>
      
      <div className="text-xs text-slate-500">
        {step.pointsEarned}/{step.pointsPossible}
      </div>
    </button>
  );
}
```

#### 2.6 StepList Component

**File:** `frontend/src/components/onboarding/StepList.tsx`

```typescript
import { StepItem } from './StepItem';
import { useOnboarding } from '../../context/OnboardingContext';

export function StepList() {
  const { state } = useOnboarding();

  if (!state) return null;

  const sortedSteps = [...state.steps].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
      {sortedSteps.map(step => (
        <StepItem
          key={step.stepId}
          step={step}
          isNext={step.stepId === state.nextStepId}
        />
      ))}
    </div>
  );
}
```

#### 2.7 BadgesStrip Component

**File:** `frontend/src/components/onboarding/BadgesStrip.tsx`

```typescript
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
```

#### 2.8 OnboardingRail Component (Main)

**File:** `frontend/src/components/onboarding/OnboardingRail.tsx`

```typescript
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
```

---

### Step 3: Integrate into Dashboard

**File:** `frontend/src/pages/owner/DashboardV5.tsx`

Add the OnboardingRail to the layout:

```typescript
// At top of file
import { OnboardingRail } from '../../components/onboarding/OnboardingRail';

// In the return statement, wrap the main content:
return (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <CommandStrip {...} />
    
    {/* NEW: Two-column layout with rail */}
    <div className="flex">
      <OnboardingRail />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* All existing dashboard content */}
        ...
      </div>
    </div>
  </div>
);
```

---

## 🎨 Styling Notes

- Uses Tailwind default `slate-*` colors for dark theme consistency
- Rail uses `bg-slate-900/70` with `backdrop-blur-sm` for subtle depth
- Progress ring uses `text-blue-500` for primary accent
- Badges use `text-yellow-500` for award icons
- Transitions use `duration-300 ease-out` for smooth animations

---

## 🚀 Testing Instructions

### 1. Local Development

```bash
cd frontend
pnpm dev
```

### 2. Test Sequence

1. **Login as owner** at `http://localhost:5173/login`
2. **Navigate to dashboard** at `/dashboard`
3. **Verify rail appears** on left side
4. **Click collapse button** - rail should shrink to 48px wide
5. **Click next action CTA** - should navigate to appropriate route
6. **Complete Owner Intake** - rail should update automatically
7. **Check badges** - should appear at bottom after earning

### 3. Manual Testing Checklist

- [ ] Rail loads without errors
- [ ] Progress percentage displays correctly
- [ ] Collapse/expand works smoothly
- [ ] Next action card shows correct step
- [ ] Clicking steps navigates to correct routes
- [ ] Badges display when earned
- [ ] Rail persists collapsed state in localStorage
- [ ] Rail only shows for owner role

---

## 📝 Implementation Deviations from Spec

1. **No framer-motion**: Used CSS transitions instead (framer-motion not in package.json)
2. **No RewardOverlay**: Simplified to just display badges in strip (can add toast later)
3. **Simplified routes**: Many steps map to `/dashboard` placeholder (need dedicated pages)
4. **No animations**: Basic transitions only (can enhance later with framer-motion if added)
5. **Tenant ID resolution**: Uses `user.id` directly (backend confirmed this is correct for owners)

---

## 🔄 Next Steps (Future Enhancements)

1. **Create dedicated pages** for each onboarding step
2. **Add framer-motion** for richer animations
3. **Implement RewardOverlay** with confetti and toast notifications
4. **Add refresh polling** to detect backend state changes
5. **Mobile responsive** layout (hide rail on small screens)
6. **Analytics tracking** for step completion events

---

## 📚 Reference Documents

- Backend API: `/ONBOARDING_IMPLEMENTATION.md`
- Spec files: `/docs/onboarding-spec/`
- API Schema: `/docs/onboarding-spec/onboarding_progress_api_schema.md`
- Component Layout: `/docs/onboarding-spec/onboarding_rail_react_component_layout.md`
- Navigation Routes: `/docs/onboarding-spec/onboarding_rail_navigation_routes.md`

---

**Status**: Ready for integration and testing ✅
