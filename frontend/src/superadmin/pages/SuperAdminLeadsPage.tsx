import { useEffect, useState } from 'react';

interface WebinarRegistration {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string | null;
  teamSize: number | null;
  currentCrm: string | null;
  bottleneck: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export default function SuperAdminLeadsPage() {
  const [registrations] = useState<WebinarRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Password management
  const [passwordVersion] = useState<number>(1);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistrations();
    fetchPasswordSettings();
  }, [statusFilter, sourceFilter]);

  async function fetchRegistrations() {
    setLoading(true);
    setError(null);
    // TODO: Unauthorized direct fetch. Migrate to ApiClient.
    console.warn('Action disabled: direct fetch unauthorized. Migrate to ApiClient.');
    setLoading(false);
    /*
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);

      const res = await fetch(`/api/superadmin/webinar/registrations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch registrations');
      }

      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    */
  }

  async function fetchPasswordSettings() {
    // TODO: Unauthorized direct fetch. Migrate to ApiClient.
    console.warn('Action disabled: direct fetch unauthorized. Migrate to ApiClient.');
    /*
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/superadmin/webinar/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPasswordVersion(data.passwordVersion);
      }
    } catch (err) {
      console.error('Failed to fetch password settings:', err);
    }
    */
  }

  async function handleUpdatePassword() {
    if (!newPassword || newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters');
      return;
    }

    setUpdatingPassword(true);
    setPasswordMessage(null);

    // TODO: Unauthorized direct fetch. Migrate to ApiClient.
    console.warn('Action disabled: direct fetch unauthorized. Migrate to ApiClient.');
    setUpdatingPassword(false);
    /*
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/superadmin/webinar/password', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        throw new Error('Failed to update password');
      }

      const data = await res.json();
      setPasswordVersion(data.passwordVersion);
      setNewPassword('');
      setPasswordMessage(`✓ Password updated successfully (v${data.passwordVersion})`);

      setTimeout(() => setPasswordMessage(null), 5000);
    } catch (err: any) {
      setPasswordMessage(`✗ ${err.message}`);
    } finally {
      setUpdatingPassword(false);
    }
    */
  }

  async function handleSave(_registrationId: string) {
    setSaving(true);
    // TODO: Unauthorized direct fetch. Migrate to ApiClient.
    console.warn('Action disabled: direct fetch unauthorized. Migrate to ApiClient.');
    setSaving(false);
    /*
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/superadmin/webinar/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update registration');
      }

      const { registration } = await res.json();
      setRegistrations((prev) =>
        prev.map((r) => (r.id === registrationId ? registration : r))
      );
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
    */
  }

  function startEdit(registration: WebinarRegistration) {
    setEditingId(registration.id);
    setEditStatus(registration.status);
    setEditNotes(registration.notes || '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditStatus('');
    setEditNotes('');
  }

  const statuses = ['pending', 'reviewed', 'contacted', 'converted', 'rejected'];
  const sources = ['webinar_page', 'landing-page'];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Webinar Registrations
        </h1>
        <p className="text-sm text-slate-400">
          {registrations.length} total registrations
        </p>
      </header>

      {/* Password Management */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Webinar Password Management</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new webinar password (min 8 chars)"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={updatingPassword || !newPassword}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {updatingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Current version: <span className="font-mono text-slate-300">v{passwordVersion}</span>
          </p>
          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
              {passwordMessage}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-900/20 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Source:</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setStatusFilter('');
            setSourceFilter('');
          }}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Clear Filters
        </button>
      </div>

      {/* Registrations Table */}
      {loading ? (
        <div className="text-slate-400">Loading registrations...</div>
      ) : registrations.length === 0 ? (
        <div className="text-slate-400 text-center py-8">
          No registrations found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Name
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Email
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Company
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Team Size
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  CRM
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Bottleneck
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Source
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Notes
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Created
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-3 px-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr
                  key={registration.id}
                  className="border-b border-slate-800 hover:bg-slate-800/30"
                >
                  <td className="py-3 px-4 text-sm text-slate-200">
                    {registration.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    <a
                      href={`mailto:${registration.email}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {registration.email}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {registration.company || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {registration.role || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {registration.teamSize || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {registration.currentCrm || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300 max-w-xs truncate">
                    {registration.bottleneck || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {registration.source || '—'}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {editingId === registration.id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-200"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${registration.status === 'pending'
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : registration.status === 'reviewed'
                            ? 'bg-blue-900/30 text-blue-400'
                            : registration.status === 'contacted'
                              ? 'bg-purple-900/30 text-purple-400'
                              : registration.status === 'converted'
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-red-900/30 text-red-400'
                          }`}
                      >
                        {registration.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {editingId === registration.id ? (
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full rounded bg-slate-700 border border-slate-600 px-2 py-1 text-xs text-slate-200 min-h-[60px]"
                        placeholder="Add notes..."
                      />
                    ) : (
                      <div className="max-w-xs truncate">
                        {registration.notes || '—'}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    {new Date(registration.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {editingId === registration.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(registration.id)}
                          disabled={saving}
                          className="rounded bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="rounded bg-slate-700 hover:bg-slate-600 px-3 py-1 text-xs font-medium text-slate-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(registration)}
                        className="rounded bg-slate-700 hover:bg-slate-600 px-3 py-1 text-xs font-medium text-slate-300"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
