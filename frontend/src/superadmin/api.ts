import { SuperAdminOverview, SuperAdminFirmRow, SuperAdminTenantDetail } from './types';

// V2: Comprehensive single-source-of-truth firm detail
export interface FirmDetailResponseV2 {
  tenant: {
    id: string;
    name: string;
    businessType: 'default' | 'chamber';
    status: 'prospect' | 'engaged' | 'qualified' | 'pilot_candidate' | 'pilot_active' | 'no_fit';
    cohortLabel: string | null;
    segment: string | null;
    region: string | null;
    firmSizeTier: 'micro' | 'small' | 'mid' | 'large' | null;
    teamHeadcount: number | null;
    baselineMonthlyLeads: number | null;
    discoveryComplete: boolean;
    createdAt: string;
    updatedAt: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  } | null;
  onboarding: {
    percentComplete: number;
    totalPoints: number;
    maxPoints: number;
    steps: { id: string; label: string; complete: boolean; points: number }[];
    badges: { id: string; label: string; earnedAt: string }[];
  } | null;
  engagementSummary: {
    lastActivityAt: string | null;
    last30d: {
      intakeStarted: number;
      intakeCompleted: number;
      roadmapsCreated: number;
      roadmapsDelivered: number;
      pilotOpen: number;
      pilotWon: number;
    };
    lifetime: {
      intakeCompleted: number;
      roadmapsDelivered: number;
      pilotWon: number;
    };
  };
  intakes: {
    byRole: {
      owner?: { status: 'not_started' | 'in_progress' | 'completed'; completedAt: string | null };
      sales?: { status: 'not_started' | 'in_progress' | 'completed'; completedAt: string | null };
      ops?: { status: 'not_started' | 'in_progress' | 'completed'; completedAt: string | null };
      delivery?: { status: 'not_started' | 'in_progress' | 'completed'; completedAt: string | null };
    };
    totalCompleted: number;
    lastCompletedAt: string | null;
  };
  discovery: {
    hasDiscoveryNotes: boolean;
    lastDiscoveryAt: string | null;
    summarySnippet: string | null;
  };
  diagnostics: {
    lastDiagnosticId: string | null;
    generatedAt: string | null;
    sopOutputs: {
      id: string;
      sopNumber: string | null;
      outputNumber: string | null;
      title: string;
      createdAt: string;
    }[];
  };
  roadmaps: {
    total: number;
    delivered: number;
    draft: number;
    lastRoadmap: {
      id: string;
      status: 'draft' | 'in_progress' | 'delivered';
      pilotStage: 'pilot_proposed' | 'pilot_active' | 'pilot_completed' | null;
      deliveredAt: string | null;
      createdAt: string;
    } | null;
  };
  tickets: {
    hasTicketPack: boolean;
    ticketPack: {
      id: string;
      version: string;
      status: 'not_started' | 'in_progress' | 'completed';
      totalTickets: number;
      totalSprints: number;
      totalsByStatus: {
        not_started: number;
        in_progress: number;
        blocked: number;
        done: number;
        skipped: number;
      };
    } | null;
  };
  implementation: {
    hasSnapshots: boolean;
    baseline: {
      snapshotId: string;
      snapshotDate: string;
      label: string;
      metrics: Record<string, number>;
    } | null;
  };
  latest: {
    snapshotId: string;
    snapshotDate: string;
    label: string;
    metrics: Record<string, number>;
  } | null;
  outcomes: {
    id: string;
    status: 'on_track' | 'at_risk' | 'off_track';
    deltas: Record<string, number>;
    realizedRoi: {
      time_savings_hours_annual?: number;
      time_savings_value_annual?: number;
      revenue_impact_annual?: number;
      cost_avoidance_annual?: number;
      net_roi_percent?: number;
    } | null;
  } | null;
  documents: {
    totalsByCategory: {
      sop_output: number;
      roadmap: number;
      report: number;
      other: number;
    };
    recent: {
      id: string;
      category: 'sop_output' | 'roadmap' | 'report' | 'other';
      title: string;
      sopNumber: string | null;
      outputNumber: string | null;
      section: string | null;
      createdAt: string;
    }[];
  };
  agents: {
    totalConfigs: number;
    activeConfigs: number;
    byRole: Record<string, { assistantId?: string; lastProvisionedAt?: string | null }>;
    threads: {
      totalThreads: number;
      lastActivityAt: string | null;
    };
  };
}

// Legacy format (keep for backward compatibility)
export interface FirmDetailResponse {
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
  onboardingSummary: {
    percentComplete: number;
    totalPoints: number;
    maxPoints: number;
  } | null;
  activitySummary: {
    intakeStarted: number;
    intakeCompleted: number;
    roadmapCreated: number;
    roadmapDelivered: number;
    lastActivityAt: string | null;
  };
  roadmapStats: {
    total: number;
    delivered: number;
    draft: number;
  };
  documentSummary: Record<string, number>;
  intakes: any[];
  roadmaps: any[];
  recentActivity: any[];
}

const BASE = '/api/superadmin';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function apiGet<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    try {
      const errBody = await res.json();
      const message = errBody.message || errBody.error || `SuperAdmin API error: ${res.status}`;
      // Attach extra props to the error object for UI consumption
      const error = new Error(message);
      (error as any).errorCode = errBody.errorCode;
      (error as any).details = errBody.details;
      (error as any).status = res.status;
      throw error;
    } catch (e) {
      // If json parse fails, fall back to status text
      if (e instanceof Error && (e as any).status) throw e; // rethrow if it was our structured error
      throw new Error(`SuperAdmin API error: ${res.status} ${res.statusText}`);
    }
  }
  return res.json() as Promise<T>;
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    try {
      const errBody = await res.json();
      const message = errBody.message || errBody.error || `SuperAdmin API error: ${res.status}`;
      const error = new Error(message);
      (error as any).errorCode = errBody.errorCode;
      (error as any).status = res.status;
      throw error;
    } catch (e) {
      if (e instanceof Error && (e as any).status) throw e;
      throw new Error(`SuperAdmin API error: ${res.status} ${res.statusText}`);
    }
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    try {
      const errBody = await res.json();
      const message = errBody.message || errBody.error || `SuperAdmin API error: ${res.status}`;
      const error = new Error(message);
      (error as any).errorCode = errBody.errorCode;
      (error as any).status = res.status;
      throw error;
    } catch (e) {
      if (e instanceof Error && (e as any).status) throw e;
      throw new Error(`SuperAdmin API error: ${res.status} ${res.statusText}`);
    }
  }
  return res.json() as Promise<T>;
}

async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Export failed: ${res.status}`);
  }
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

export const superadminApi = {
  getOverview: () => apiGet<SuperAdminOverview>('/overview'),
  getActivityFeed: (limit?: number) => apiGet<{ activities: any[] }>(`/activity-feed${limit ? `?limit=${limit}` : ''}`),
  getFirms: (cohortLabel?: string) => {
    const params = new URLSearchParams();
    if (cohortLabel) params.append('cohortLabel', cohortLabel);
    return apiGet<{ firms: SuperAdminFirmRow[] }>(`/firms?${params.toString()}`);
  },
  getFirmDetail: (tenantId: string) =>
    apiGet<FirmDetailResponse>(`/firms/${tenantId}`),
  updateTenant: (
    tenantId: string,
    updates: Partial<SuperAdminTenantDetail['tenant']>
  ) =>
    apiPatch<{ tenant: SuperAdminTenantDetail['tenant'] }>(
      `/firms/${tenantId}`,
      updates
    ),
  exportAllIntakes: (format: 'csv' | 'json' = 'json', cohortLabel?: string) => {
    const params = new URLSearchParams({ format });
    if (cohortLabel) params.append('cohortLabel', cohortLabel);
    const filename = `intakes-export-${new Date().toISOString().split('T')[0]}.${format}`;
    return downloadFile(`/export/intakes?${params.toString()}`, filename);
  },
  exportFirmIntakes: (tenantId: string, format: 'csv' | 'json' = 'json', firmName?: string) => {
    const params = new URLSearchParams({ format });
    const safeName = firmName ? firmName.replace(/[^a-z0-9]/gi, '_') : 'firm';
    const filename = `${safeName}-intakes-${new Date().toISOString().split('T')[0]}.${format}`;
    return downloadFile(`/export/firms/${tenantId}/intakes?${params.toString()}`, filename);
  },

  // Workflow management functions
  getFirmWorkflowStatus: (tenantId: string) =>
    apiGet<any>(`/firms/${tenantId}/workflow-status`),

  getDiscoveryNotes: (tenantId: string) =>
    apiGet<{ notes: string; updatedAt: string | null }>(`/firms/${tenantId}/discovery-notes`),

  saveDiscoveryNotes: (tenantId: string, notes: string) =>
    apiPost<{ ok: boolean }>(`/firms/${tenantId}/discovery-notes`, { notes }),

  // TM-2: Ticket Moderation APIs
  getDiagnosticTickets: (tenantId: string, diagnosticId: string) =>
    apiGet<{ tickets: any[]; status: any }>(`/tickets/${tenantId}/${diagnosticId}`),

  getTicketModerationStatus: (tenantId: string, diagnosticId: string) =>
    apiGet<{
      total: number;
      approved: number;
      rejected: number;
      pending: number;
      readyForRoadmap: boolean;
    }>(`/tickets/${tenantId}/${diagnosticId}/status`),

  generateTickets: (tenantId: string, diagnosticId: string) =>
    apiPost<{ success: boolean; ticketCount: number }>(`/tickets/generate/${tenantId}/${diagnosticId}`, {}),

  approveTickets: (params: {
    tenantId: string;
    diagnosticId: string;
    ticketIds: string[];
    adminNotes?: string;
  }) =>
    apiPost<{ updated: number; status: any }>(`/tickets/approve`, params),

  rejectTickets: (params: {
    tenantId: string;
    diagnosticId: string;
    ticketIds: string[];
    adminNotes?: string;
  }) =>
    apiPost<{ updated: number; status: any }>(`/tickets/reject`, params),

  generateFinalRoadmap: (tenantId: string) =>
    apiPost<{ ok: boolean }>(`/firms/${tenantId}/generate-final-roadmap`),

  generateSop01: (tenantId: string) =>
    apiPost<{ ok: boolean }>(`/firms/${tenantId}/generate-sop01`),

  // SR-3: Roadmaps browser endpoints
  getRoadmaps: async (filters?: {
    cohort?: string;
    status?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.cohort) params.set('cohort', filters.cohort);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    return apiGet<{ roadmaps: any[] }>(`/roadmaps?${params.toString()}`);
  },

  getRoadmapSections: (tenantId: string) =>
    apiGet<{
      tenant: { id: string; name: string; cohortLabel: string | null };
      sections: any[];
    }>(`/firms/${tenantId}/roadmap-sections`),

  // V2: Comprehensive firm detail (single source of truth)
  getFirmDetailV2: (tenantId: string) =>
    apiGet<FirmDetailResponseV2>(`/firms/${tenantId}/detail`),

  // CR-UX-9: Command Center
  getCommandCenterTenants: (filters?: {
    search?: string;
    states?: string;
    missingFlags?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.states) params.set('states', filters.states);
    if (filters?.missingFlags) params.set('missingFlags', filters.missingFlags);
    if (filters?.sort) params.set('sort', filters.sort);
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.offset) params.set('offset', filters.offset.toString());
    return apiGet<{ tenants: any[]; total: number }>(`/command-center/tenants?${params.toString()}`);
  },

  getCommandCenterActivity: (window?: number) =>
    apiGet<{ events: any[] }>(`/command-center/activity?window=${window || 60}`),

  // Final Roadmap Assembly (Waterfall Step 5)
  assembleRoadmap: (tenantId: string) =>
    apiPost<{ success: boolean; roadmap: any }>(`/firms/${tenantId}/assemble-roadmap`),

  previewFinalizeBatch: (tenantIds: string[]) =>
    apiPost<{ eligible: any[]; ineligible: any[] }>(`/command-center/batch/roadmap/finalize/preview`, { tenantIds }),

  executeFinalizeBatch: (params: { tenantIds: string[]; override?: boolean; overrideReason?: string }) =>
    apiPost<{ results: any[] }>(`/command-center/batch/roadmap/finalize/execute`, params),

  // Phase 7: SNAPSHOT (Ticket 8)
  getSnapshot: (tenantId: string) =>
    apiGet<{ data: any }>(`/snapshot/${tenantId}`),

  // Executive Brief v0
  getExecutiveBrief: (tenantId: string) =>
    apiGet<{ brief: any; hasPdf?: boolean }>(`/firms/${tenantId}/executive-brief`),

  generateExecutiveBrief: (tenantId: string) =>
    apiPost<{ brief: any }>(`/firms/${tenantId}/executive-brief/generate`, {}),

  generateExecutiveBriefPDF: (tenantId: string) =>
    apiPost<{ success: boolean; message: string }>(`/firms/${tenantId}/executive-brief/generate-pdf`, {}),

  approveExecutiveBrief: (tenantId: string) =>
    apiPost<{ brief: any; intakeWindowState: string }>(`/firms/${tenantId}/executive-brief/approve`, {}),

  deliverExecutiveBrief: (tenantId: string) =>
    apiPost<{ success: boolean; deliveredAt: string }>(`/firms/${tenantId}/executive-brief/deliver`, {}),

  closeIntakeWindow: (tenantId: string) =>
    apiPost<{ ok: boolean }>(`/firms/${tenantId}/close-intake`),

  updateIntakeCoaching: (intakeId: string, coachingFeedback: Record<string, any>) =>
    apiPatch<{ ok: boolean }>(`/intakes/${intakeId}/coaching`, { coachingFeedback }),

  reopenIntake: (intakeId: string) =>
    apiPost<{ ok: boolean }>(`/intakes/${intakeId}/reopen`),

  // SR-4: Readiness Batching
  previewReadinessBatch: (tenantIds: string[]) =>
    apiPost<{ eligible: any[]; ineligible: any[] }>(`/command-center/batch/readiness/preview`, { tenantIds }),

  executeReadinessBatch: (params: { tenantIds: string[]; override?: boolean; overrideReason?: string }) =>
    apiPost<{ results: any[] }>(`/command-center/batch/readiness/execute`, params),

  signalReadiness: (tenantId: string, flags: any) =>
    apiPatch<{ ok: boolean }>(`/firms/${tenantId}/readiness`, { flags }),

  // Intake Vector Management (Unified Stakeholder System)
  createIntakeVector: (tenantId: string, vector: {
    roleLabel: string;
    roleType: string;
    perceivedConstraints: string;
    anticipatedBlindSpots?: string;
    recipientEmail?: string;
    recipientName?: string;
  }) =>
    apiPost<{ vector: any }>(`/tenants/${tenantId}/intake-vectors`, vector),

  getIntakeVectors: (tenantId: string) =>
    apiGet<{ vectors: any[] }>(`/tenants/${tenantId}/intake-vectors`),

  updateIntakeVector: (vectorId: string, updates: Partial<{
    roleLabel: string;
    roleType: string;
    perceivedConstraints: string;
    anticipatedBlindSpots: string;
    recipientEmail: string;
    recipientName: string;
  }>) =>
    apiPatch<{ vector: any }>(`/intake-vectors/${vectorId}`, updates),

  sendIntakeVectorInvite: (vectorId: string) =>
    apiPost<{ vector: any }>(`/intake-vectors/${vectorId}/send-invite`),

  // Truth Probe (Lifecycle Integrity)
  getTruthProbe: (tenantId: string) =>
    apiGet<any>(`/truth-probe?tenantId=${tenantId}`),

  // META-TICKET v2: Execution Pipeline Actions
  lockIntake: (tenantId: string) =>
    apiPost<{ success: boolean }>(`/firms/${tenantId}/lock-intake`),

  generateDiagnostics: (tenantId: string) =>
    apiPost<{ success: boolean; diagnosticId: string }>(`/firms/${tenantId}/generate-diagnostics`),

  lockDiagnostic: (tenantId: string, diagnosticId: string) =>
    apiPost<{ success: boolean }>(`/firms/${tenantId}/diagnostics/${diagnosticId}/lock`),

  publishDiagnostic: (tenantId: string, diagnosticId: string) =>
    apiPost<{ success: boolean }>(`/firms/${tenantId}/diagnostics/${diagnosticId}/publish`),

  // Note: Diagnostic artifacts are currently embedded in sop_output table
  // We'll use the firm detail endpoint's diagnostic data for now
  getDiagnosticArtifacts: (diagnosticId: string) =>
    apiGet<{ diagnostic: any; outputs: any }>(`/diagnostics/${diagnosticId}/artifacts`),

  ingestDiscoveryNotes: (tenantId: string, notes: import('@roadmap/shared').CanonicalDiscoveryNotes) =>
    apiPost<{ success: boolean }>(`/firms/${tenantId}/ingest-discovery`, { notes: JSON.stringify(notes) }),

  getProposedFindings: (tenantId: string) =>
    apiGet<{ items: any[]; requiresGeneration?: boolean }>(`/firms/${tenantId}/findings/proposed`),

  generateAssistedProposals: (tenantId: string) =>
    apiPost<{ items: any[]; version: string }>(`/firms/${tenantId}/assisted-synthesis/generate-proposals`, {}),

  declareCanonicalFindings: (tenantId: string, findings: any[]) =>
    apiPost<{ success: boolean }>(`/firms/${tenantId}/findings/declare`, { findings }),

  // Stage 5 Assisted Synthesis Agent (Bounded Persistence)
  getAgentSession: (tenantId: string, contextVersion: string) =>
    apiGet<{ sessionId: string; messages: any[]; contextVersion: string; phaseState: string }>(`/firms/${tenantId}/assisted-synthesis/agent/session?contextVersion=${contextVersion}`),

  sendAgentMessage: (tenantId: string, sessionId: string, message: string) =>
    apiPost<{ reply: string; messageId: string; requestId: string }>(`/firms/${tenantId}/assisted-synthesis/agent/messages`, { sessionId, message }),

  resetAgentSession: (tenantId: string, sessionId: string) =>
    apiPost<{ success: boolean; requestId: string }>(`/firms/${tenantId}/assisted-synthesis/agent/reset`, { sessionId }),

  activateTicketModeration: (tenantId: string) =>
    apiPost<{ status: string; sessionId: string; draftTicketCount: number }>(`/firms/${tenantId}/ticket-moderation/activate`, {}),

  getActiveModerationSession: (tenantId: string) =>
    apiGet<{ session: any; tickets: any[] }>(`/firms/${tenantId}/ticket-moderation/active`),
};
