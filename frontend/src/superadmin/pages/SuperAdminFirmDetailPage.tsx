import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { superadminApi } from '../api';
import { SuperAdminTenantDetail } from '../types';

// Inline type definition to avoid module resolution issues
type FirmDetailResponse = {
  tenantSummary: {
    id: string;
    name: string;
    cohortLabel: string | null;
    segment: string | null;
    region: string | null;
    status: string;
    businessType: 'default' | 'chamber';
    teamHeadcount: number | null;
    baselineMonthlyLeads: number | null;
    firmSizeTier: string | null;
    createdAt: string;
    notes: string | null;
    lastDiagnosticId: string | null;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  } | null;
  teamMembers: { id: string; name: string; email: string; role: string; createdAt: string }[];
  intakes: any[];
  roadmaps: any[];
  recentActivity: any[];
};
import { OrgChart } from '../components/OrgChart';
import { IntakeModal } from '../components/IntakeModal';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { MetricsCard } from '../components/MetricsCard';
import { TicketModerationCard } from '../components/TicketModerationCard';
import { ExecutiveBriefPanel } from '../components/ExecutiveBriefPanel';

export default function SuperAdminFirmDetailPage() {
  const [, params] = useRoute<{ tenantId: string }>(
    '/superadmin/firms/:tenantId'
  );
  const [, setLocation] = useLocation();
  const [data, setData] = useState<SuperAdminTenantDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgChartOpen, setOrgChartOpen] = useState(true);
  const [selectedIntake, setSelectedIntake] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);

  // Workflow status state
  const [workflowStatus, setWorkflowStatus] = useState<any | null>(null);
  const [, setLoadingStatus] = useState(false);
  const [runningSop01, setRunningSop01] = useState(false);
  const [runningRoadmap, setRunningRoadmap] = useState(false);
  const [discoveryModalOpen, setDiscoveryModalOpen] = useState(false);
  const [discoveryDraft, setDiscoveryDraft] = useState('');
  const [savingDiscovery, setSavingDiscovery] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  // SA-INTAKE-AUTHORITY-FINAL-SWEEP-002: Canonical Authority
  const [truthProbe, setTruthProbe] = useState<any | null>(null); // Weak typing to avoid importing heavy component types if not needed

  useEffect(() => {
    if (!params?.tenantId) return;
    superadminApi.getTruthProbe(params.tenantId).then(setTruthProbe).catch(console.error);
  }, [params?.tenantId]);

  useEffect(() => {
    if (!params?.tenantId) return;
    superadminApi
      .getFirmDetail(params.tenantId)
      .then((response) => {
        const firmDetail = response as unknown as FirmDetailResponse;
        // Map FirmDetailResponse to SuperAdminTenantDetail format
        setData({
          tenant: {
            id: firmDetail.tenantSummary.id,
            name: firmDetail.tenantSummary.name,
            cohortLabel: firmDetail.tenantSummary.cohortLabel,
            segment: firmDetail.tenantSummary.segment,
            region: firmDetail.tenantSummary.region,
            status: firmDetail.tenantSummary.status,
            notes: firmDetail.tenantSummary.notes,
            createdAt: firmDetail.tenantSummary.createdAt,
            ownerEmail: firmDetail.owner?.email || '',
            ownerName: firmDetail.owner?.name || '',
            lastDiagnosticId: firmDetail.tenantSummary.lastDiagnosticId,

            // required by SuperAdminTenantDetail
            intakeWindowState: (firmDetail.tenantSummary as any).intakeWindowState ?? 'OPEN',
            discoveryComplete: (firmDetail.tenantSummary as any).discoveryComplete ?? false,
            diagnosticStatus: (firmDetail as any).diagnosticStatus ?? null,
            executiveBriefStatus: (firmDetail as any).executiveBriefStatus ?? null,

          },

          owner: firmDetail.owner,
          teamMembers: firmDetail.teamMembers,
          intakes: firmDetail.intakes,
          roadmaps: firmDetail.roadmaps,
          recentActivity: firmDetail.recentActivity,
        } as any);

      })
      .catch((err) => setError(err.message));

    // Fetch documents and workflow status
    fetchDocuments();
    fetchWorkflowStatus();
  }, [params?.tenantId]);

  async function fetchDocuments() {
    if (!params?.tenantId) return;
    setLoadingDocs(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/superadmin/firms/${params.tenantId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function fetchWorkflowStatus() {
    if (!params?.tenantId) return;
    setLoadingStatus(true);
    try {
      const status = await superadminApi.getFirmWorkflowStatus(params.tenantId);
      setWorkflowStatus(status);
    } catch (err) {
      console.error('Failed to fetch workflow status', err);
    } finally {
      setLoadingStatus(false);
    }
  }

  // Phase 2: Redirect to Control Plane
  function goControlPlane(hash: string) {
    if (!params?.tenantId) return;
    setLocation(`/superadmin/control-plane/firms/${params.tenantId}#${hash}`);
  }

  // PHASE 2: DISABLED - Mutations moved to Control Plane
  async function handleGenerateSop01() {
    goControlPlane('diagnostic');
  }

  async function openDiscoveryModal() {
    if (!params?.tenantId) return;
    try {
      const { notes } = await superadminApi.getDiscoveryNotes(params.tenantId);
      setDiscoveryDraft(notes);
      setDiscoveryModalOpen(true);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSaveDiscovery() {
    if (!params?.tenantId) return;
    setSavingDiscovery(true);
    try {
      await superadminApi.saveDiscoveryNotes(params.tenantId, discoveryDraft);
      setDiscoveryModalOpen(false);
      await fetchWorkflowStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingDiscovery(false);
    }
  }

  // PHASE 2: DISABLED - Mutations moved to Control Plane
  async function handleGenerateRoadmap() {
    goControlPlane('roadmap');
  }

  async function handleExport(format: 'csv' | 'json') {
    if (!params?.tenantId || !data) return;
    setExporting(true);
    try {
      await superadminApi.exportFirmIntakes(params.tenantId, format, data.tenant.name);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleImpersonate() {
    if (!params?.tenantId || !data?.owner) return;
    if (!confirm(`Are you sure you want to impersonate ${data.owner.name}?`)) return;

    // Open window immediately to avoid popup blockers
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.title = 'Impersonating...';
      newWindow.document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">Initializing secure session...</div>';
    }

    setImpersonating(true);
    try {
      const { token, user } = await superadminApi.impersonateTenantOwner(params.tenantId);
      const url = `/impersonate?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`;
      if (newWindow) {
        newWindow.location.href = url;
      }
    } catch (err: any) {
      setError(err.message);
      if (newWindow) newWindow.close();
    } finally {
      setImpersonating(false);
    }
  }

  if (error) return <div className="text-red-400">Error: {error}</div>;
  if (!params?.tenantId) return <div>Missing tenant ID.</div>;
  if (!data) return <div className="text-slate-400">Loading firm…</div>;

  const { tenant, owner, teamMembers, intakes, roadmaps, recentActivity } = data;

  async function handleUpdateTenant(patch: Partial<typeof tenant>) {
    if (!params?.tenantId) return;
    setSaving(true);
    try {
      const res = await superadminApi.updateTenant(params.tenantId, patch);
      setData((prev) => (prev ? { ...prev, tenant: res.tenant } : prev));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // SA-INTAKE-AUTHORITY-FINAL-SWEEP-002: Replicate Control Plane Logic
  const computeCanonicalIntakeWindowState = () => {
    // 1. TruthProbe Authoritative (if present)
    if (truthProbe?.intake?.windowState === 'OPEN' || truthProbe?.intake?.windowState === 'CLOSED') {
      return truthProbe.intake.windowState;
    }

    // 2. TruthProbe Derived (Closed At)
    if (truthProbe?.intake?.closedAt) {
      return 'CLOSED';
    }

    // 3. Immutable Artifacts (on tenant if available, or fallbacks)
    // Note: Legacy firmDetail might not have all immutable fields, so we rely heavily on TruthProbe here.

    // 4. Tenant Column Fallback (Mutable)
    return tenant.intakeWindowState;
  };

  const canonicalIntakeWindowState = computeCanonicalIntakeWindowState();

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {tenant.name}
          </h1>
          <p className="text-sm text-slate-400">
            {tenant.ownerName} &lt;{tenant.ownerEmail}&gt;
          </p>
          <div className="flex gap-2 items-center mt-1">
            <p className="text-xs text-slate-500">
              Created {new Date(tenant.createdAt).toLocaleString()}
            </p>
            {owner && (
              <button
                onClick={handleImpersonate}
                disabled={impersonating}
                className="text-xs text-purple-400 hover:text-purple-300 underline disabled:opacity-50 ml-2"
              >
                {impersonating ? 'Starting session...' : 'Impersonate Owner'}
              </button>
            )}
            {/* SA-INTAKE-AUTHORITY-FINAL-SWEEP-002: Explicit Intake Status Display */}
            {canonicalIntakeWindowState === 'CLOSED' && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-[10px] border border-emerald-800 font-medium">
                INTAKE CLOSED
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">
            {saving ? 'Saving…' : exporting ? 'Exporting…' : '\u00A0'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLocation(`/superadmin/tenant/${params?.tenantId}/roadmap`)}
              className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              View as Client
            </button>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Upload Document
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting || intakes.length === 0}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-lg transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting || intakes.length === 0}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-lg transition-colors"
            >
              Export JSON
            </button>
          </div>
        </div>
      </header>

      {/* Org Chart */}
      {owner && (
        <section className="border border-slate-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setOrgChartOpen(!orgChartOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-900 transition-colors"
          >
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Organization
            </div>
            <div className="text-slate-400">
              {orgChartOpen ? '▼' : '▶'}
            </div>
          </button>
          {orgChartOpen && (
            <div className="p-6 pt-0">
              <OrgChart owner={owner} teamMembers={teamMembers} />
            </div>
          )}
        </section>
      )}

      {/* Editable meta block */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <EditableField
          label="Cohort"
          value={tenant.cohortLabel ?? ''}
          onSave={(value) => handleUpdateTenant({ cohortLabel: value || null })}
        />
        <EditableField
          label="Segment"
          value={tenant.segment ?? ''}
          onSave={(value) => handleUpdateTenant({ segment: value || null })}
        />
        <EditableField
          label="Region"
          value={tenant.region ?? ''}
          onSave={(value) => handleUpdateTenant({ region: value || null })}
        />
        <EditableField
          label="Status"
          value={tenant.status}
          onSave={(value) =>
            handleUpdateTenant({ status: value || 'prospect' })
          }
        />
      </section>

      {/* Performance Metrics & ROI (EPIC 3 - F3.1) */}
      {params?.tenantId && (
        <section>
          <MetricsCard tenantId={params.tenantId} />
        </section>
      )}

      {/* Intakes + Roadmaps + Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
        <div className="lg:col-span-2 space-y-4">
          <ExecutiveBriefPanel
            tenantId={params.tenantId}
            onApproved={() => {
              fetchWorkflowStatus();
              fetchDocuments();
            }}
          />

          {/* Ticket Moderation Cockpit (TM-3a) */}
          {workflowStatus?.sop01?.complete && data?.tenant?.lastDiagnosticId && (
            <TicketModerationCard
              key={data.tenant.lastDiagnosticId} // Force remount on new diagnostic
              tenantId={params.tenantId}
              diagnosticId={data.tenant.lastDiagnosticId}
              onComplete={() => {
                fetchWorkflowStatus();
                fetchDocuments();
              }}
            />
          )}

          <Card title="Intakes">
            {intakes.length === 0 ? (
              <div className="text-slate-500 text-sm">No intakes yet.</div>
            ) : (
              <div className="space-y-2">
                {intakes.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setSelectedIntake(i)}
                    className="w-full text-left border border-slate-800 rounded-lg p-3 hover:border-slate-700 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium uppercase text-xs text-slate-300">
                          {i.role}
                        </div>
                        <div className="text-xs text-slate-500">
                          {i.userName} • {i.userEmail}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 text-right">
                        <div>
                          Started {new Date(i.createdAt).toLocaleDateString()}
                        </div>
                        {i.completedAt && (
                          <div>
                            Completed{' '}
                            {new Date(i.completedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card title="Roadmaps">
            {roadmaps.length === 0 ? (
              <div className="text-slate-500 text-sm">
                No roadmap artifacts yet.
              </div>
            ) : (
              <div className="space-y-2">
                {roadmaps.map((r) => (
                  <div
                    key={r.id}
                    className="border border-slate-800 rounded-lg p-3 flex justify-between"
                  >
                    <div>
                      <div className="font-medium text-slate-200">
                        {r.status}
                        {r.pilotStage ? ` • ${r.pilotStage}` : ''}
                      </div>
                      {r.pdfUrl && (
                        <a
                          href={r.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 underline"
                        >
                          View PDF
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 text-right">
                      <div>
                        Created {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                      {r.deliveredAt && (
                        <div>
                          Delivered{' '}
                          {new Date(r.deliveredAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Documents">
            <button
              onClick={() => setDocumentsOpen(!documentsOpen)}
              className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 hover:text-slate-200 transition-colors"
            >
              <span>
                {documentsOpen ? 'Hide documents' : 'Show documents'} ({documents.length} total)
              </span>
              <span>{documentsOpen ? '▲' : '▼'}</span>
            </button>

            {!documentsOpen ? (
              <div className="text-slate-500 text-xs">
                Roadmap artifacts and SOP outputs are available here when you need them.
              </div>
            ) : loadingDocs ? (
              <div className="text-slate-500 text-sm">Loading...</div>
            ) : documents.length === 0 ? (
              <div className="text-slate-500 text-sm">No documents uploaded yet.</div>
            ) : (
              <div className="space-y-4">
                {/* Group documents */}
                {(() => {
                  const sop01Docs = documents.filter((d) => d.sopNumber === 'SOP-01');
                  const roadmapDocs = documents.filter((d) => d.category === 'roadmap');
                  const otherDocs = documents.filter(
                    (d) => d.sopNumber !== 'SOP-01' && d.category !== 'roadmap'
                  );

                  return (
                    <>
                      {/* SOP-01 Outputs */}
                      {sop01Docs.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-blue-400 mb-2">
                            SOP-01 Outputs ({sop01Docs.length})
                          </div>
                          <div className="space-y-2">
                            {sop01Docs.map((doc: any) => (
                              <DocumentRow key={doc.id} doc={doc} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Roadmap Sections */}
                      {roadmapDocs.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-green-400 mb-2">
                            Roadmap Sections ({roadmapDocs.length})
                          </div>
                          <div className="space-y-2">
                            {roadmapDocs.map((doc: any) => (
                              <DocumentRow key={doc.id} doc={doc} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Documents */}
                      {otherDocs.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-slate-400 mb-2">
                            Other Documents ({otherDocs.length})
                          </div>
                          <div className="space-y-2">
                            {otherDocs.map((doc: any) => (
                              <DocumentRow key={doc.id} doc={doc} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {/* Workflow Card */}
          {workflowStatus && (
            <Card title="Workflow">
              <div className="space-y-3">
                {/* Workflow Status Rows */}
                <StatusRow
                  label="1. Intakes"
                  complete={workflowStatus.intakes.complete}
                  status={`${workflowStatus.intakes.rolesCompleted.length}/4 roles`}
                />
                <StatusRow
                  label="2. SOP-01 Diagnostic"
                  complete={workflowStatus.sop01.complete}
                  status={`${workflowStatus.sop01.documents.length}/4 outputs`}
                />
                <StatusRow
                  label="3. Discovery Call"
                  complete={workflowStatus.discovery.complete}
                  status={workflowStatus.discovery.hasNotes ? 'Notes saved' : 'Pending'}
                />
                <StatusRow
                  label="4. Roadmap (SOP-03)"
                  complete={workflowStatus.roadmap.complete}
                  status={`${workflowStatus.roadmap.sectionsCount}/9 sections`}
                />

                {/* Action Buttons - PHASE 2: Disabled, redirect to Control Plane */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="space-y-2">
                    <button
                      onClick={() => goControlPlane('diagnostic')}
                      className="w-full px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center justify-between"
                      title="This action moved to Control Plane"
                    >
                      <span>Generate SOP-01 Diagnostic</span>
                      <span className="text-[10px] opacity-60">→ Control Plane</span>
                    </button>
                    <div className="text-[10px] text-slate-500 italic px-2">
                      Diagnostic generation moved to Control Plane for authority enforcement
                    </div>
                  </div>

                  <button
                    onClick={openDiscoveryModal}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                  >
                    Edit Discovery Call Questions
                  </button>

                  {/* Roadmap generation - redirect to Control Plane */}
                  {!data?.tenant?.lastDiagnosticId && (
                    <div className="space-y-2">
                      <button
                        onClick={() => goControlPlane('roadmap')}
                        className="w-full px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center justify-between"
                        title="This action moved to Control Plane"
                      >
                        <span>Generate Roadmap (Legacy)</span>
                        <span className="text-[10px] opacity-60">→ Control Plane</span>
                      </button>
                      <div className="text-[10px] text-slate-500 italic px-2">
                        Roadmap generation moved to Control Plane for authority enforcement
                      </div>
                    </div>
                  )}

                  {/* Show instruction if tickets exist */}
                  {data?.tenant?.lastDiagnosticId && (
                    <div className="w-full px-3 py-2 text-xs text-slate-400 bg-slate-900/40 border border-slate-800 rounded-lg">
                      📋 Use Control Plane for ticket moderation and roadmap finalization
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card title="Recent Activity">
            {recentActivity.length === 0 ? (
              <div className="text-slate-500 text-sm">No events logged.</div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((ev) => (
                  <div key={ev.id} className="border-b border-slate-800 pb-2">
                    <div className="flex justify-between">
                      <div className="text-xs font-medium text-slate-200">
                        {ev.eventType}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(ev.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {ev.actorName} ({ev.actorRole || 'system'})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Intake Modal */}
      {selectedIntake && (
        <IntakeModal
          intake={selectedIntake}
          // SA-INTAKE-AUTHORITY-FINAL-SWEEP-002: Use Canonical State
          intakeWindowState={canonicalIntakeWindowState || 'OPEN'}
          onClose={() => setSelectedIntake(null)}
        />
      )}

      {/* Document Upload Modal */}
      {uploadModalOpen && params?.tenantId && (
        <DocumentUploadModal
          tenantId={params.tenantId}
          tenantName={tenant.name}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            fetchDocuments(); // Refresh documents list
            setUploadModalOpen(false);
          }}
        />
      )}

      {/* Discovery Notes Modal */}
      {discoveryModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-3xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-100">Discovery Call Questions</h2>
              <button
                onClick={() => setDiscoveryModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <textarea
              value={discoveryDraft}
              onChange={(e) => setDiscoveryDraft(e.target.value)}
              className="w-full h-96 px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter discovery call notes in markdown format..."
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setDiscoveryModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-700 rounded-lg font-medium text-slate-300 hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDiscovery}
                disabled={savingDiscovery}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingDiscovery ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({ label, complete, status }: { label: string; complete: boolean; status: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`text-lg ${complete ? 'text-green-400' : 'text-slate-500'}`}>
          {complete ? '✓' : '○'}
        </span>
        <span className="text-xs font-medium text-slate-300">{label}</span>
      </div>
      <span className="text-xs text-slate-400">{status}</span>
    </div>
  );
}

function DocumentRow({ doc }: { doc: any }) {
  const [, params] = useRoute<{ tenantId: string }>('/superadmin/firms/:tenantId');
  const [, setLocation] = useLocation();

  const handleOpen = () => {
    if (params?.tenantId) {
      setLocation(`/superadmin/firms/${params.tenantId}/case-study/${doc.id}`);
    }
  };

  return (
    <div className="border border-slate-800 rounded-lg p-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-medium text-slate-200 text-sm">
            {doc.title}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {doc.sopNumber && <span>{doc.sopNumber}</span>}
            {doc.outputNumber && <span> • {doc.outputNumber}</span>}
            {doc.section && <span> • {doc.section}</span>}
          </div>
          {doc.description && (
            <div className="text-xs text-slate-400 mt-1">
              {doc.description}
            </div>
          )}
        </div>
        <button
          onClick={handleOpen}
          className="ml-3 text-xs text-blue-400 hover:text-blue-300 underline whitespace-nowrap"
        >
          View
        </button>
      </div>
      <div className="text-[10px] text-slate-500 mt-2">
        {(doc.fileSize / 1024).toFixed(1)} KB •
        Uploaded {new Date(doc.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-800 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (val: string) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  async function handleBlur() {
    setEditing(false);
    if (draft !== value) {
      await onSave(draft);
    }
  }

  return (
    <div className="border border-slate-800 rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">
        {label}
      </div>
      {editing ? (
        <input
          autoFocus
          className="w-full bg-transparent border-b border-slate-700 text-sm outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleBlur();
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          className="text-sm text-left text-slate-100 hover:text-white"
          onClick={() => setEditing(true)}
        >
          {value || <span className="text-slate-500 italic">Set {label}</span>}
        </button>
      )}
    </div>
  );
}
