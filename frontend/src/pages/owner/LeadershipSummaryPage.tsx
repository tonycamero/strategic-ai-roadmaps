import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { ROLE_METADATA, LeadershipRole } from '../../types/roles';

interface RoleIntake {
  role: LeadershipRole;
  userName: string;
  userEmail: string;
  answers: Record<string, any>;
  submittedAt: string;
}

export const LeadershipSummaryPage: React.FC = () => {
  const { token } = useAuth();
  const [intakes, setIntakes] = useState<RoleIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntake, setSelectedIntake] = useState<RoleIntake | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const response = await api.getOwnerIntakes();
        const data = response.intakes;
        // Transform data to match our interface
        const formattedIntakes: RoleIntake[] = data
          .filter((item: any) => item.role !== 'owner') // Filter out owner intakes
          .map((item: any) => ({
            role: item.role as LeadershipRole,
            userName: item.userName,
            userEmail: item.userEmail,
            answers: item.answers,
            submittedAt: item.createdAt, // Backend uses createdAt
          }));
        setIntakes(formattedIntakes);
      } catch (error) {
        console.error('Failed to fetch intakes:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-500">Loading leadership summary...</div>
      </div>
    );
  }

  const submittedCount = intakes.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Leadership Summary
          </h1>
          <p className="text-sm text-gray-600">
            Review all submitted intake forms from your leadership team.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {submittedCount}/3 Submitted
        </span>
      </header>

      {/* Empty state */}
      {submittedCount === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <p className="text-sm text-gray-600">
            No intakes submitted yet. Invite your leadership team to get started.
          </p>
        </div>
      )}

      {/* Overview cards (if at least 1 intake) */}
      {submittedCount > 0 && (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {['ops', 'sales', 'delivery'].map((role) => {
            const intake = intakes.find(i => i.role === role);
            const metadata = ROLE_METADATA[role as LeadershipRole];
            return (
              <div
                key={role}
                className={`rounded-xl border px-4 py-3 ${
                  intake
                    ? 'border-green-300 bg-green-50/60'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{metadata.icon}</span>
                  <h3 className="text-xs font-semibold text-gray-700">
                    {metadata.displayName}
                  </h3>
                </div>
                <p className="text-xs text-gray-600">
                  {intake ? (
                    <span className="text-green-700">✓ Complete</span>
                  ) : (
                    <span className="text-gray-500">Pending</span>
                  )}
                </p>
                {intake && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    By {intake.userName}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed intake cards */}
      <div className="space-y-4">
        {intakes.map((intake, idx) => {
          const metadata = ROLE_METADATA[intake.role];
          return (
            <div
              key={idx}
              className="rounded-xl border bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{metadata.icon}</span>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      {metadata.displayName}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {intake.userName} · {intake.userEmail}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Intake Complete
                  </span>
                  <button
                    onClick={() => setSelectedIntake(intake)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Full Details
                  </button>
                </div>
              </div>

              {/* Key answers preview */}
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-lg border bg-gray-50 px-3 py-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">Key Insights</p>
                  <div className="text-xs text-gray-700 space-y-1">
                    {Object.entries(intake.answers).slice(0, 3).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium text-gray-500">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                        </span>{' '}
                        <span>{String(value).substring(0, 80)}{String(value).length > 80 ? '...' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Submitted {new Date(intake.submittedAt).toLocaleDateString()} at{' '}
                {new Date(intake.submittedAt).toLocaleTimeString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Next Step Panel */}
      {submittedCount === 3 && (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            ✓ All Intakes Complete
          </h3>
          <p className="text-xs text-blue-700">
            Use this summary to guide your Strategic AI Discovery call. We'll use these
            patterns to build your 2026 Strategic AI Infrastructure Roadmap.
          </p>
        </div>
      )}

      {/* Modal for full details */}
      {selectedIntake && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fadeIn"
          onClick={() => setSelectedIntake(null)}
        >
          <div
            className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto rounded-xl bg-white shadow-xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {ROLE_METADATA[selectedIntake.role].displayName} - Full Intake
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedIntake.userName} · {selectedIntake.userEmail}
                </p>
              </div>
              <button
                onClick={() => setSelectedIntake(null)}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {Object.entries(selectedIntake.answers).map(([key, value]) => (
                <div key={key} className="border-b pb-3 last:border-b-0">
                  <p className="text-xs font-semibold text-gray-600 mb-1">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-sm text-gray-800">{String(value)}</p>
                </div>
              ))}
              <p className="text-xs text-gray-500 pt-3 border-t">
                Submitted {new Date(selectedIntake.submittedAt).toLocaleDateString()} at{' '}
                {new Date(selectedIntake.submittedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
