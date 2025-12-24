import {
  SuperAdminOverview,
  SuperAdminFirmRow,
  SuperAdminTenantDetail,
} from './types';

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
  };
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
    throw new Error(`SuperAdmin API error: ${res.status}`);
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
    throw new Error(`SuperAdmin API error: ${res.status}`);
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
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `SuperAdmin API error: ${res.status}`);
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
  getFirms: () => apiGet<{ firms: SuperAdminFirmRow[] }>('/firms'),
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
  
  generateSop01: (tenantId: string) =>
    apiPost<{ ok: boolean }>(`/firms/${tenantId}/generate-sop01`),
  
  getDiscoveryNotes: (tenantId: string) =>
    apiGet<{ notes: string; updatedAt: string | null }>(`/firms/${tenantId}/discovery-notes`),
  
  saveDiscoveryNotes: (tenantId: string, notes: string) =>
    apiPost<{ ok: boolean }>(`/firms/${tenantId}/discovery-notes`, { notes }),
  
  generateRoadmap: (tenantId: string) =>
    apiPost<{ ok: boolean }>(`/firms/${tenantId}/generate-roadmap`),
  
  getModerationStatus: (tenantId: string, diagnosticId: string) =>
    apiGet<{
      totalTickets: number;
      approvedCount: number;
      rejectedCount: number;
      pendingCount: number;
      allModerated: boolean;
    }>(`/tickets/${tenantId}/${diagnosticId}/status`),
  
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
};
