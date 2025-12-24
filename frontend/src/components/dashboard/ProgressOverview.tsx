import React from 'react';
import { DashboardState, getCounts } from '../../types/dashboard';

interface ProgressOverviewProps {
  state: DashboardState;
}

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({ state }) => {
  const { invitesAccepted, intakesSubmitted } = getCounts(state);
  const invitesPct = (invitesAccepted / 3) * 100;
  const intakesPct = (intakesSubmitted / 3) * 100;

  return (
    <section className="mt-4 rounded-xl border bg-white px-6 py-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Leadership Onboarding: {invitesAccepted}/3 Accepted
          </h2>
          <p className="text-xs text-gray-600">
            Invite your Operations, Sales, and Delivery leaders to begin the strategic intake process.
          </p>
        </div>
        <p className="text-xs text-gray-500">
          {intakesSubmitted}/3 Intakes Complete
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {/* Invites Progress */}
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">
            Invites Accepted
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${invitesPct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            Your leadership team must accept their invites before intakes can begin.
          </p>
        </div>

        {/* Intakes Progress */}
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">
            Intakes Submitted
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${intakesPct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            These submissions feed the Strategic AI Roadmap personalized for your team.
          </p>
        </div>
      </div>
    </section>
  );
};
