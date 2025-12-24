import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import type { OnboardingState } from '../types/onboarding';
import { jwtDecode } from 'jwt-decode';

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
  
  // For detecting state changes (rewards/badges)
  const previousStateRef = useRef<OnboardingState | null>(null);

  const fetchOnboardingState = async () => {
    // Only fetch for owner role
    if (!user || user.role !== 'owner') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get tenantId from JWT token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const decoded = jwtDecode<{ tenantId: string }>(token);
      if (!decoded.tenantId) {
        throw new Error('No tenant ID in token');
      }
      
      const data = await api.getOnboardingState(decoded.tenantId);
      
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
    } else {
      setState(null);
      setLoading(false);
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
