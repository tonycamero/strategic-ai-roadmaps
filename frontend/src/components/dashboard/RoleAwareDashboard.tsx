// frontend/src/components/dashboard/RoleAwareDashboard.tsx
import React from 'react';
import type { DashboardData, UserRole } from './types';
import { OwnerDashboard } from './OwnerDashboard';
import { StaffDashboard } from './StaffDashboard';

type Props = {
  data: DashboardData;
  userRole: UserRole;
};

/**
 * RoleAwareDashboard
 * 
 * Smart router that renders the correct dashboard variant based on the user's role:
 * - owner → OwnerDashboard (full control, action-focused)
 * - staff/team → StaffDashboard (observer, read-only)
 * - superadmin → redirect to superadmin cohort view
 */
export const RoleAwareDashboard: React.FC<Props> = ({ data, userRole }) => {
  // Superadmin: redirect to cohort page
  if (userRole === 'superadmin') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-slate-100">Redirecting to SuperAdmin...</h2>
          <p className="text-sm text-slate-400 mb-4">
            SuperAdmins use the cohort view to manage all tenants. Redirecting you now...
          </p>
          <button
            onClick={() => window.location.href = '/superadmin/cohort'}
            className="rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white transition"
          >
            Go to Cohort View
          </button>
        </div>
      </div>
    );
  }

  // Owner: full control dashboard
  if (userRole === 'owner') {
    return <OwnerDashboard data={data} />;
  }

  // Staff / team roles: observer dashboard
  return <StaffDashboard data={data} />;
};
