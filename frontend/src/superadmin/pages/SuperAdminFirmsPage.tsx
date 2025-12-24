import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { superadminApi } from '../api';
import { SuperAdminFirmRow } from '../types';

export default function SuperAdminFirmsPage() {
  const [firms, setFirms] = useState<SuperAdminFirmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    superadminApi
      .getFirms()
      .then((res) => setFirms(res.firms))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400">Loading firms…</div>;
  if (error)
    return <div className="text-red-400">Failed to load firms: {error}</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Firms</h1>
          <p className="text-sm text-slate-400">
            All tenants in the Strategic AI Infrastructure program.
          </p>
        </div>
      </header>

      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900">
            <tr>
              <Th>Firm</Th>
              <Th>Owner</Th>
              <Th>Cohort</Th>
              <Th>Segment</Th>
              <Th>Region</Th>
              <Th>Status</Th>
              <Th>Intakes</Th>
              <Th>Roadmaps</Th>
            </tr>
          </thead>
          <tbody>
            {firms.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No firms yet
                </td>
              </tr>
            ) : (
              firms.map((firm) => (
                <tr
                  key={firm.tenantId}
                  className="border-t border-slate-800 hover:bg-slate-900 cursor-pointer"
                  onClick={() =>
                    setLocation(`/superadmin/firms/${firm.tenantId}`)
                  }
                >
                  <Td>
                    <div className="font-medium">{firm.name}</div>
                    <div className="text-xs text-slate-500">
                      Created {new Date(firm.createdAt).toLocaleDateString()}
                    </div>
                  </Td>
                  <Td>{firm.ownerEmail}</Td>
                  <Td>{firm.cohortLabel ?? '-'}</Td>
                  <Td>{firm.segment ?? '-'}</Td>
                  <Td>{firm.region ?? '-'}</Td>
                  <Td>
                    <span className="px-2 py-0.5 rounded-full border border-slate-700 text-xs">
                      {firm.status}
                    </span>
                  </Td>
                  <Td>{firm.intakeCount}</Td>
                  <Td>{firm.roadmapCount}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-2 font-medium text-slate-300 text-xs uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>;
}
