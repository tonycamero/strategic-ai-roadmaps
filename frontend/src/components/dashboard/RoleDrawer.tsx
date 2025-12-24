import React from 'react';
import { RoleStatus, ROLE_METADATA } from '../../types/roles';

interface RoleDrawerProps {
  open: boolean;
  onClose: () => void;
  role: RoleStatus | null;
  onViewIntake?: () => void;
  onResendInvite?: () => void;
  onReplaceLead?: () => void;
  onCopyLink?: () => void;
}

export const RoleDrawer: React.FC<RoleDrawerProps> = ({
  open,
  onClose,
  role,
  onViewIntake,
  onResendInvite,
  onReplaceLead,
  onCopyLink,
}) => {
  if (!open || !role) return null;

  const metadata = ROLE_METADATA[role.role];
  const accepted = role.inviteStatus === 'accepted';
  const intakeComplete = role.intakeStatus === 'submitted';
  const inviteSent = role.inviteStatus === 'invite_sent';

  return (
    <div 
      className="fixed inset-0 z-40 flex justify-end bg-black/30 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="h-full w-full max-w-md bg-white shadow-xl animate-slideInRight overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{metadata.icon}</span>
              <h2 className="text-lg font-semibold text-gray-900">
                {metadata.displayName}
              </h2>
            </div>
            <p className="text-xs text-gray-500">
              {role.role === 'ops'
                ? 'Operations Role'
                : role.role === 'sales'
                ? 'Sales Role'
                : 'Delivery Role'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Role Overview */}
          <section className="rounded-lg border bg-gray-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Role Overview
            </h3>
            <p className="mt-2 text-sm text-gray-700">
              {metadata.description}
            </p>
          </section>

          {/* Status */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Current Status
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-800 font-medium">{role.email ?? 'Not set'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Accepted</dt>
                <dd className="text-gray-800">
                  {accepted ? (
                    <span className="text-green-600 font-medium">✓ Yes</span>
                  ) : inviteSent ? (
                    <span className="text-yellow-600 font-medium">⏳ Pending</span>
                  ) : (
                    <span className="text-gray-500">Not invited</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Intake Submitted</dt>
                <dd className="text-gray-800">
                  {intakeComplete ? (
                    <span className="text-green-600 font-medium">✓ Complete</span>
                  ) : (
                    <span className="text-gray-500">Not yet</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Actions */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Available Actions
            </h3>
            <div className="space-y-3">
              {intakeComplete && onViewIntake && (
                <button
                  onClick={onViewIntake}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  View Intake Details
                </button>
              )}

              {inviteSent && !accepted && onResendInvite && role.email && (
                <button
                  onClick={onResendInvite}
                  className="w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  Resend Invite
                </button>
              )}

              {inviteSent && !accepted && onCopyLink && (
                <button
                  onClick={onCopyLink}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Copy Invite Link
                </button>
              )}

              {onReplaceLead && (
                <button
                  onClick={onReplaceLead}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Replace Lead
                </button>
              )}
            </div>
          </section>

          {/* Timestamps (if available) */}
          {(role.inviteSentAt || role.acceptedAt || role.intakeUpdatedAt) && (
            <section className="pt-4 border-t">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Timeline
              </h3>
              <dl className="space-y-1 text-xs text-gray-600">
                {role.inviteSentAt && (
                  <div>Invited: {new Date(role.inviteSentAt).toLocaleDateString()}</div>
                )}
                {role.acceptedAt && (
                  <div>Accepted: {new Date(role.acceptedAt).toLocaleDateString()}</div>
                )}
                {role.intakeUpdatedAt && (
                  <div>Last updated: {new Date(role.intakeUpdatedAt).toLocaleDateString()}</div>
                )}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
