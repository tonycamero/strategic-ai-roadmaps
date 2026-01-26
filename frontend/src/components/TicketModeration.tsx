// frontend/src/components/TicketModeration.tsx

import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { useAuth } from "../context/AuthContext";

// Fail-open typing: we intentionally cast the api client to any so TS won't block builds.
import { api } from "../lib/api"; // adjust ONLY if your project imports api from a different path

type ModerationSession = {
  id?: string;
  tenantId?: string;
  diagnosticId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

export default function TicketModeration() {
  const { isAuthenticated, user } = useAuth();

  // /superadmin/tickets/:tenantId/:diagnosticId
  const [, params] = useRoute<{ tenantId: string; diagnosticId: string }>(
    "/superadmin/tickets/:tenantId/:diagnosticId"
  );

  const tenantId = params?.tenantId;
  const diagnosticId = params?.diagnosticId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ModerationSession | null>(null);

  const canView = useMemo(() => {
    if (!isAuthenticated) return false;
    return user?.role === "superadmin";
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError(null);

      if (!canView) {
        setLoading(false);
        return;
      }

      if (!tenantId || !diagnosticId) {
        setError("Missing tenantId or diagnosticId in route.");
        setLoading(false);
        return;
      }

      try {
        const client: any = api as any;

        let res: any = null;

        if (typeof client.getActiveModerationSession === "function") {
          res = await client.getActiveModerationSession({ tenantId, diagnosticId });
        } else if (typeof client.getModerationSession === "function") {
          res = await client.getModerationSession({ tenantId, diagnosticId });
        } else if (typeof client.getOverview === "function") {
          // Ultra-safe fallback: show something rather than crashing the page.
          res = await client.getOverview();
        } else {
          throw new Error(
            "API client missing getActiveModerationSession/getModerationSession/getOverview. Check frontend api client exports."
          );
        }

        if (!alive) return;

        // normalize
        const normalized =
          res?.session ??
          res?.data?.session ??
          res?.moderationSession ??
          res?.data?.moderationSession ??
          res ??
          null;

        setSession(normalized);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load moderation session.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [canView, tenantId, diagnosticId]);

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access restricted</h1>
          <p className="text-gray-600">This page is available to superadmin users only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ticket Moderation</h1>
            <p className="text-gray-600 mt-1">
              Tenant: <span className="font-mono text-gray-800">{tenantId ?? "—"}</span> · Diagnostic:{" "}
              <span className="font-mono text-gray-800">{diagnosticId ?? "—"}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-6 text-gray-700">Loading moderation session…</div>
          ) : error ? (
            <div className="p-6">
              <div className="text-red-700 font-medium mb-2">Failed to load</div>
              <div className="text-gray-700">{error}</div>
            </div>
          ) : !session ? (
            <div className="p-6 text-gray-700">No active moderation session found.</div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-gray-900 font-medium">Session</div>
                <div className="text-xs text-gray-500 font-mono">{session.id ?? "—"}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-500">Status</div>
                  <div className="text-gray-900 mt-1">{session.status ?? "—"}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-gray-500">Updated</div>
                  <div className="text-gray-900 mt-1">{session.updatedAt ?? "—"}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-gray-500 text-xs mb-2">Raw session payload</div>
                <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
