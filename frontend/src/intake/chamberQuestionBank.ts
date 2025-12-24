// frontend/src/intake/chamberQuestionBank.ts

export type ChamberRole =
  | 'chamber_executive'
  | 'membership_director'
  | 'community_engagement_lead'
  | 'programs_events_lead';

type QuestionDef = {
  id: string;
  label: string;
};

const chamberQuestionBank: Record<ChamberRole, QuestionDef[]> = {
  chamber_executive: [
    {
      id: 'chamber_exec_membership_pressure',
      label: 'Where does membership revenue feel most at risk or stagnant?',
    },
    {
      id: 'chamber_exec_board_engagement',
      label: 'How engaged is your board and leadership team in driving strategic initiatives?',
    },
  ],
  membership_director: [
    {
      id: 'md_member_retention',
      label: 'What are the most common reasons members do NOT renew?',
    },
    {
      id: 'md_member_value',
      label: 'What value proposition do members cite most when they DO renew or refer others?',
    },
  ],
  community_engagement_lead: [
    {
      id: 'ce_partnerships',
      label: 'Who are your top community partners and what do those relationships look like?',
    },
    {
      id: 'ce_community_gaps',
      label: 'Where do you feel the largest gap between what your Chamber could do for the community and what it currently does?',
    },
  ],
  programs_events_lead: [
    {
      id: 'pe_event_bottlenecks',
      label: 'What are the biggest execution bottlenecks when running events?',
    },
    {
      id: 'pe_sponsorships',
      label: 'How do you attract, manage, and renew sponsors for key programs and events?',
    },
  ],
};

// Map existing platform roles → Chamber metadata roles
// (we do NOT change stored UserRole values)
export function mapPlatformRoleToChamberRole(
  platformRole: string
): ChamberRole | null {
  switch (platformRole) {
    case 'owner':
      return 'chamber_executive';
    case 'ops':
      return 'membership_director';
    case 'sales':
      return 'community_engagement_lead';
    case 'delivery':
      return 'programs_events_lead';
    default:
      return null;
  }
}

export function getChamberQuestionsForPlatformRole(platformRole: string) {
  const chamberRole = mapPlatformRoleToChamberRole(platformRole);
  if (!chamberRole) {
    return {
      chamberRole: null as ChamberRole | null,
      questions: [] as QuestionDef[],
    };
  }

  return {
    chamberRole,
    questions: chamberQuestionBank[chamberRole] ?? [],
  };
}
