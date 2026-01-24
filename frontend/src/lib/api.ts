// frontend/src/lib/api.ts

import type {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  CreateInviteRequest,
  AcceptInviteRequest,
  SubmitIntakeRequest,
  Invite,
  Intake,
} from "@roadmap/shared";

const API_URL = import.meta.env.VITE_API_URL || "";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(response.status, (error as any).error || "Request failed");
  }

  return response.json();
}

/**
 * Canonical Frontend API Client Contract
 */

type Id = string;

export type ApiClient = {
  // Auth
  register: (data: RegisterRequest) => Promise<LoginResponse>;
  login: (data: LoginRequest) => Promise<LoginResponse>;

  // Invites
  createInvite: (data: CreateInviteRequest) => Promise<{ invite: Invite }>;
  listInvites: () => Promise<{ invites: Invite[] }>;
  acceptInvite: (data: AcceptInviteRequest) => Promise<LoginResponse>;
  resendInvite: (inviteId: string) => Promise<{ message: string }>;
  revokeInvite: (inviteId: string) => Promise<{ message: string }>;

  // Intake
  submitIntake: (data: SubmitIntakeRequest) => Promise<{ intake: Intake }>;
  getMyIntake: () => Promise<{ intake: Intake | null }>;
  getOwnerIntakes: () => Promise<{ intakes: Intake[] }>;

  // Documents
  listDocuments: () => Promise<{ documents: any[] }>;

  // Roadmap (tenant)
  getRoadmapSections: () => Promise<{ sections: any[] }>;
  getRoadmapTickets: () => Promise<{ tickets: any[] }>;
  askRoadmapQuestion: (payload: {
    question: string;
    sectionKey?: string;
    currentSection?: { slug: string; title: string; content: string };
  }) => Promise<{ answer: string }>;

  // Owner dashboard
  getOwnerDashboard: () => Promise<any>;
  listAdvisorThreads: () => Promise<{
    threads: Array<{ id: string; roleType: string; createdAt: string; lastActivityAt: string; preview: string }>;
  }>;

  // Tenant
  getOnboardingState: (tenantId: string) => Promise<any>;
  getTenant: () => Promise<{ tenant: any }>;

  // Agents
  getAgentThreads: (roleType?: string) => Promise<{ threads: any[] }>;
  getThreadMessages: (threadId: string) => Promise<{ messages: any[] }>;

  // SuperAdmin (existing)
  getSuperadminTenants: () => Promise<{ tenants: { id: string; name: string }[] }>;

  // ===== SuperAdmin / Execution pipeline =====
  getFirmDetail: (args: { tenantId: Id }) => Promise<any>;
  getFirmDetailV2: (args: { tenantId: Id }) => Promise<any>;
  getSnapshot: (args: { tenantId: Id }) => Promise<any>;
  getFirmWorkflowStatus: (args: { tenantId: Id }) => Promise<any>;
  getDiagnosticArtifacts: (args: { diagnosticId: Id }) => Promise<any>;

  getDiscoveryNotes: (args: { tenantId: Id }) => Promise<any>;
  ingestDiscoveryNotes: (args: { tenantId: Id; notes: any }) => Promise<any>;

  // Diagnostics / Executive brief / intake locking
  generateDiagnostics: (args: { tenantId: Id; diagnosticId?: Id }) => Promise<any>;
  generateSop01: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;
  rerunSop01Diagnostic: (args: { tenantId: Id }) => Promise<any>;

  getExecutiveBrief: (args: { tenantId: Id }) => Promise<any>;

  lockIntake: (args: { tenantId: Id }) => Promise<any>;
  lockDiagnostic: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;
  publishDiagnostic: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;

  // Tickets + moderation (Unified)
  getDiagnosticTickets: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;
  approveTickets: (args: { tenantId: Id; diagnosticId: Id; ticketIds: string[]; adminNotes?: string }) => Promise<any>;
  rejectTickets: (args: { tenantId: Id; diagnosticId: Id; ticketIds: string[]; adminNotes?: string }) => Promise<any>;
  getTicketModerationStatus: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;

  generateTickets: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;
  activateTicketModeration: (args: { tenantId: Id }) => Promise<any>;
  getActiveModerationSession: (args: { tenantId: Id }) => Promise<any>;
  getModerationSession: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;

  // Roadmap
  assembleRoadmap: (args: { tenantId: Id }) => Promise<any>;
  publishRoadmap: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;
  getRoadmaps: (args?: { cohort?: string; status?: string; search?: string }) => Promise<any>;
  getRoadmapSectionsForFirm: (args: { tenantId: Id }) => Promise<any>;

  // Readiness batch
  previewReadinessBatch: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;
  executeReadinessBatch: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;
  previewFinalizeBatch: (args: { tenantIds: string[] }) => Promise<any>;
  executeFinalizeBatch: (args: { tenantIds: string[]; override?: boolean; overrideReason?: string }) => Promise<any>;

  // Truth probe
  getTruthProbeFull: (args: { tenantId: Id; diagnosticId: Id }) => Promise<any>;
  getTruthProbeOperator: () => Promise<any>;

  // Assisted synthesis (agent console + modal)
  getAgentSession: (args: { tenantId: Id; kind?: string }) => Promise<any>;
  sendAgentMessage: (args: { tenantId: Id; message: string; kind?: string }) => Promise<any>;
  resetAgentSession: (args: { tenantId: Id; kind?: string }) => Promise<any>;

  getProposedFindings: (args: { tenantId: Id }) => Promise<any>;
  generateAssistedProposals: (args: { tenantId: Id }) => Promise<any>;
  declareCanonicalFindings: (args: { tenantId: Id; findings: any }) => Promise<any>;

  // Intake vectors
  createIntakeVector: (args: { tenantId: Id; payload: any }) => Promise<any>;
  getIntakeVectors: (args: { tenantId: Id }) => Promise<any>;
  sendIntakeVectorInvite: (args: { vectorId: Id }) => Promise<any>;

  // Activity + Overview
  getOverview: () => Promise<any>;
  getActivityFeed: (args?: { limit?: number }) => Promise<any>;

  // Metrics
  getMetricsForFirm: (args: { tenantId: Id }) => Promise<any>;
  computeOutcomeForFirm: (args: { tenantId: Id }) => Promise<any>;

  // Legacy / Missing
  updateTenant: (args: { tenantId: Id; patch: any }) => Promise<any>;
  exportFirmIntakes: (args: { tenantId: Id; format: 'csv' | 'json'; firmName?: string }) => Promise<void>;
};

export const api: ApiClient = {
  // Auth endpoints
  register: (data) => fetchAPI("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => fetchAPI("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  // Invite endpoints
  createInvite: (data) => fetchAPI("/api/invites/create", { method: "POST", body: JSON.stringify(data) }),
  listInvites: () => fetchAPI("/api/invites/list"),
  acceptInvite: (data) => fetchAPI("/api/invites/accept", { method: "POST", body: JSON.stringify(data) }),
  resendInvite: (inviteId) => fetchAPI(`/api/invites/${inviteId}/resend`, { method: "POST" }),
  revokeInvite: (inviteId) => fetchAPI(`/api/invites/${inviteId}/revoke`, { method: "DELETE" }),

  // Intake endpoints
  submitIntake: (data) => fetchAPI("/api/intake/submit", { method: "POST", body: JSON.stringify(data) }),
  getMyIntake: () => fetchAPI("/api/intake/mine"),
  getOwnerIntakes: () => fetchAPI("/api/intake/owner"),

  // Document endpoints
  listDocuments: () => fetchAPI("/api/documents"),

  // Roadmap endpoints
  getRoadmapSections: () => fetchAPI("/api/roadmap/sections"),
  getRoadmapTickets: () => fetchAPI("/api/roadmap/tickets"),
  askRoadmapQuestion: (payload) => fetchAPI("/api/roadmap/qna", { method: "POST", body: JSON.stringify(payload) }),

  // Owner dashboard
  getOwnerDashboard: () => fetchAPI("/api/dashboard/owner"),
  listAdvisorThreads: () => fetchAPI("/api/dashboard/owner/advisor-threads"),

  // Tenant
  getOnboardingState: (tenantId) => fetchAPI(`/api/tenants/${tenantId}/onboarding`),
  getTenant: () => fetchAPI("/api/tenants/me"),

  // Agents
  getAgentThreads: (roleType) => fetchAPI(`/api/agents/threads${roleType ? `?roleType=${roleType}` : ""}`),
  getThreadMessages: (threadId) => fetchAPI(`/api/agents/threads/${threadId}/messages`),

  // SuperAdmin endpoints
  getSuperadminTenants: () => fetchAPI("/api/superadmin/tenants"),

  // EXECUTION PIPELINE
  getFirmDetail: ({ tenantId }) => fetchAPI(`/api/superadmin/firms/${tenantId}`),
  getFirmDetailV2: ({ tenantId }) => fetchAPI(`/api/superadmin/firms/${tenantId}/detail`),
  getSnapshot: ({ tenantId }) => fetchAPI(`/api/superadmin/snapshot/${tenantId}`),
  getFirmWorkflowStatus: ({ tenantId }) => fetchAPI(`/api/superadmin/firms/${tenantId}/workflow-status`),
  getDiagnosticArtifacts: ({ diagnosticId }) => fetchAPI(`/api/superadmin/diagnostics/${diagnosticId}/artifacts`),

  getDiscoveryNotes: ({ tenantId }) => fetchAPI(`/api/superadmin/firms/${tenantId}/discovery-notes`),
  ingestDiscoveryNotes: ({ tenantId, notes }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/ingest-discovery`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  generateDiagnostics: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/generate-diagnostics`, {
      method: "POST",
      body: JSON.stringify({ diagnosticId }),
    }),

  generateSop01: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/generate-sop01`, {
      method: "POST",
      body: JSON.stringify({ diagnosticId }),
    }),

  rerunSop01Diagnostic: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/diagnostic/rerun-sop01/${tenantId}`, {
      method: "POST",
    }),

  getExecutiveBrief: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/executive-brief`),

  lockIntake: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/lock-intake`, { method: "POST" }),

  lockDiagnostic: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/diagnostics/${diagnosticId}/lock`, { method: "POST" }),

  publishDiagnostic: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/diagnostics/${diagnosticId}/publish`, { method: "POST" }),

  getDiagnosticTickets: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/tickets/${tenantId}/${diagnosticId}`),

  approveTickets: (args) =>
    fetchAPI(`/api/superadmin/tickets/approve`, { method: "POST", body: JSON.stringify(args) }),

  rejectTickets: (args) =>
    fetchAPI(`/api/superadmin/tickets/reject`, { method: "POST", body: JSON.stringify(args) }),

  getTicketModerationStatus: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/tickets/${tenantId}/${diagnosticId}/status`),

  generateTickets: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/tickets/generate/${tenantId}/${diagnosticId}`, { method: "POST" }),

  activateTicketModeration: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/ticket-moderation/activate`, { method: "POST" }),

  getActiveModerationSession: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/ticket-moderation/active`),

  getModerationSession: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/tenants/${tenantId}/diagnostics/${diagnosticId}/tickets/moderation/session`),

  assembleRoadmap: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/assemble-roadmap`, { method: "POST" }),

  publishRoadmap: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/tenants/${tenantId}/diagnostics/${diagnosticId}/roadmap/publish`, { method: "POST" }),

  getRoadmaps: (args) => {
    const params = new URLSearchParams();
    if (args?.cohort) params.set('cohort', args.cohort);
    if (args?.status) params.set('status', args.status);
    if (args?.search) params.set('search', args.search);
    return fetchAPI(`/api/superadmin/roadmaps?${params.toString()}`);
  },

  getRoadmapSectionsForFirm: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/roadmap-sections`),

  previewReadinessBatch: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/tenants/${tenantId}/diagnostics/${diagnosticId}/readiness/preview`, { method: "POST" }),

  executeReadinessBatch: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/tenants/${tenantId}/diagnostics/${diagnosticId}/readiness/execute`, { method: "POST" }),

  previewFinalizeBatch: ({ tenantIds }) =>
    fetchAPI(`/api/superadmin/command-center/batch/roadmap/finalize/preview`, {
      method: "POST",
      body: JSON.stringify({ tenantIds }),
    }),

  executeFinalizeBatch: (args) =>
    fetchAPI(`/api/superadmin/command-center/batch/roadmap/finalize/execute`, {
      method: "POST",
      body: JSON.stringify(args),
    }),

  getTruthProbeFull: ({ tenantId, diagnosticId }) =>
    fetchAPI(`/api/superadmin/tenants/${tenantId}/diagnostics/${diagnosticId}/truth-probe`),

  getTruthProbeOperator: () => fetchAPI(`/api/superadmin/truth-probe`),

  getAgentSession: ({ tenantId, kind }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/assisted-synthesis/agent/session${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`),

  sendAgentMessage: ({ tenantId, message, kind }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/assisted-synthesis/agent/messages${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  resetAgentSession: ({ tenantId, kind }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/assisted-synthesis/agent/reset${kind ? `?kind=${encodeURIComponent(kind)}` : ""}`, {
      method: "POST",
    }),

  getProposedFindings: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/findings/proposed`),

  generateAssistedProposals: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/assisted-synthesis/generate-proposals`, {
      method: "POST",
    }),

  declareCanonicalFindings: ({ tenantId, findings }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/findings/declare`, {
      method: "POST",
      body: JSON.stringify({ findings }),
    }),

  createIntakeVector: ({ tenantId, payload }) =>
    fetchAPI(`/api/superadmin/tenants/${tenantId}/intake-vectors`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getIntakeVectors: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/tenants/${tenantId}/intake-vectors`),

  sendIntakeVectorInvite: ({ vectorId }) =>
    fetchAPI(`/api/superadmin/intake-vectors/${vectorId}/send-invite`, {
      method: "POST",
    }),

  getOverview: () => fetchAPI("/api/superadmin/overview"),
  getActivityFeed: (args) => fetchAPI(`/api/superadmin/activity-feed${args?.limit ? `?limit=${args.limit}` : ""}`),

  getMetricsForFirm: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/metrics`),

  computeOutcomeForFirm: ({ tenantId }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}/metrics/compute-outcome`, {
      method: "POST",
    }),

  updateTenant: ({ tenantId, patch }) =>
    fetchAPI(`/api/superadmin/firms/${tenantId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  exportFirmIntakes: async ({ tenantId, format, firmName }) => {
    const params = new URLSearchParams({ format });
    const safeName = firmName ? firmName.replace(/[^a-z0-9]/gi, '_') : 'firm';
    const filename = `${safeName}-intakes-${new Date().toISOString().split('T')[0]}.${format}`;

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/superadmin/export/firms/${tenantId}/intakes?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

export { ApiError };
