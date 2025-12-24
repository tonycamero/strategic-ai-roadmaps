// Role state model for Leadership Onboarding

export type LeadershipRole = 'ops' | 'sales' | 'delivery';

export type InviteStatus =
  | 'not_invited'
  | 'invite_sent'
  | 'accepted';

export type IntakeStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted';

export interface RoleStatus {
  role: LeadershipRole;
  displayName: string;
  email?: string;
  inviteStatus: InviteStatus;
  intakeStatus: IntakeStatus;
  // timestamps are optional but useful
  inviteSentAt?: string;
  acceptedAt?: string;
  intakeUpdatedAt?: string;
}

// Role metadata
export const ROLE_METADATA: Record<LeadershipRole, { displayName: string; description: string; icon: string }> = {
  ops: {
    displayName: 'Operations Lead',
    description: 'Maps workflow friction and internal process bottlenecks.',
    icon: '⚙️',
  },
  sales: {
    displayName: 'Sales Lead',
    description: 'Reveals follow-up gaps and pipeline inefficiencies.',
    icon: '📊',
  },
  delivery: {
    displayName: 'Delivery Lead',
    description: 'Surfaces handoff breakdowns and customer experience friction.',
    icon: '🚀',
  },
};

// Helper: derive badge text and style from role status
export const getRoleBadge = (role: RoleStatus) => {
  if (role.intakeStatus === 'submitted') {
    return { text: 'Intake Complete', class: 'bg-green-100 text-green-800' };
  }
  if (role.inviteStatus === 'accepted') {
    return { text: 'Account Created', class: 'bg-purple-100 text-purple-800' };
  }
  if (role.inviteStatus === 'invite_sent') {
    return { text: 'Invite Sent', class: 'bg-blue-100 text-blue-800' };
  }
  return { text: 'Not Invited', class: 'bg-gray-100 text-gray-700' };
};
