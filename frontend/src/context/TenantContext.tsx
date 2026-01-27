import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { getBusinessTypeProfile, type BusinessTypeProfile, type BusinessType } from '@roadmap/shared';

// ============================================================================
// TYPES
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  businessType: BusinessType;
  teamHeadcount?: number | null;
  baselineMonthlyLeads?: number | null;
  firmSizeTier?: string | null;
  segment?: string | null;
  region?: string | null;
  latestDiagnostic?: {
    id: string;
    status: string;
    generatedAt: string;
  } | null;
}

interface TenantContextValue {
  tenant: Tenant | null;
  businessType: BusinessType;
  isLoading: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  businessType: 'default',
  isLoading: true,
});

export const useTenant = () => useContext(TenantContext);

// ============================================================================
// PROVIDER
// ============================================================================

export interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  const { data: tenantData, isLoading } = useQuery({
    queryKey: ['tenant'],
    queryFn: () => api.getTenant(),
    enabled: isAuthenticated, // Only fetch when user is logged in
    retry: false, // Don't retry 401s
    staleTime: 30000, // 30 seconds
  });

  const tenant = tenantData?.tenant || null;
  const businessType: BusinessType =
    (tenant?.businessType as BusinessType) || 'default';

  return (
    <TenantContext.Provider value={{ tenant, businessType, isLoading: isAuthenticated && isLoading }}>
      {children}
    </TenantContext.Provider>
  );
};

// ============================================================================
// BUSINESS TYPE PROFILE HOOK
// ============================================================================

/**
 * Hook to get the business type profile for the current tenant.
 * Returns the profile configuration including labels, intros, and KPIs.
 */
export function useBusinessTypeProfile(): BusinessTypeProfile {
  const { businessType } = useTenant();
  return getBusinessTypeProfile(businessType);
}
