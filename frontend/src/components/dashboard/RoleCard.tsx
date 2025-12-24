import React from 'react';
import { RoleStatus, ROLE_METADATA, getRoleBadge } from '../../types/roles';

interface RoleCardProps {
  role: RoleStatus;
  onClick: () => void;
  onInviteClick?: () => void;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onClick,
  onInviteClick,
}) => {
  const metadata = ROLE_METADATA[role.role];
  const badge = getRoleBadge(role);
  const isComplete = role.intakeStatus === 'submitted';
  const isNotInvited = role.inviteStatus === 'not_invited';

  return (
    <div
      className={`relative rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer ${
        isComplete ? 'border-green-300 bg-green-50/60' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      {/* Badge */}
      <div className="absolute right-4 top-4">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.class}`}>
          {badge.text}
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-5 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">{metadata.icon}</span>
          <h3 className="text-sm font-medium text-gray-500">
            {metadata.displayName}
          </h3>
        </div>
        <p className="text-xs text-gray-500">
          {role.email ?? 'No invite sent yet'}
        </p>
        <p className="mt-2 text-sm text-gray-700">
          {metadata.description}
        </p>
        {isComplete && (
          <p className="mt-2 text-xs text-green-700">
            ✓ Leadership insights captured.
          </p>
        )}
        <p className="mt-3 text-xs text-gray-500">Click for details →</p>
      </div>

      {/* Invite button for not invited */}
      {isNotInvited && onInviteClick && (
        <div className="px-5 pb-5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInviteClick();
            }}
            className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Invite Lead
          </button>
        </div>
      )}
    </div>
  );
};
