import { RoleStatus } from './roles';

export interface DashboardState {
  roles: RoleStatus[];
}

export const getCounts = (state: DashboardState) => {
  const invitesAccepted = state.roles.filter(
    r => r.inviteStatus === 'accepted'
  ).length;

  const intakesSubmitted = state.roles.filter(
    r => r.intakeStatus === 'submitted'
  ).length;

  return { invitesAccepted, intakesSubmitted };
};

// Tile lock states
export const isSummaryUnlocked = (state: DashboardState): boolean => {
  const { intakesSubmitted } = getCounts(state);
  return intakesSubmitted >= 1;
};

export const isRoadmapUnlocked = (state: DashboardState): boolean => {
  const { intakesSubmitted } = getCounts(state);
  return intakesSubmitted === 3;
};

// Next action guidance
export const getNextAction = (state: DashboardState): string => {
  const { invitesAccepted, intakesSubmitted } = getCounts(state);

  if (invitesAccepted === 0) {
    return '→ Invite your leadership team to begin';
  }

  if (invitesAccepted < 3) {
    return `→ ${3 - invitesAccepted} more invite(s) needed`;
  }

  if (intakesSubmitted === 0) {
    return '→ Waiting for intake submissions';
  }

  if (intakesSubmitted < 3) {
    return `→ ${3 - intakesSubmitted} more intake(s) needed`;
  }

  return '✓ All intakes complete — view your roadmap';
};
