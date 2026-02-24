// frontend/src/lib/api.ts

import { jwtDecode } from 'jwt-decode';

import type {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  CreateInviteRequest,
  AcceptInviteRequest,
  SubmitIntakeRequest,
  Invite,
  Intake,
} from '@roadmap/shared';

const API_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_URL) {
  throw new Error(
    'VITE_API_BASE_URL is not defined. Did you forget to set it in Netlify?'
  );
}

const API_BASE = API_URL.replace(/\/$/, '');

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

type JwtPayload = { exp?: number };

function isJwtExpired(token: string, skewSeconds = 60): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const exp = decoded?.exp;
    if (!exp) return false; // if no exp claim, don't force-expire here
    const now = Math.floor(Date.now() / 1000);
    return exp <= now + skewSeconds;
  } catch {
    // if token can't be decoded, treat as invalid/expired
    return true;
  }
}

function clearAuthAndRedirect(reason: 'expired' | 'unauthorized' = 'expired') {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {}

  // preserve deep-link return path
  const next = encodeURIComponent(
    window.location.pathname + window.location.search + window.location.hash
  );

  // Canonical auth route is /login (but /auth is aliased to Auth component too)
  window.location.href = `/login?reason=${reason}&next=${next}`;
}

/**
 * Central fetch wrapper.
 * - Adds Authorization header (Bearer token)
 * - Proactively forces re-auth if token is expired/near-expired
 * - On 401, clears auth + redirects to /login with next=...
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  // Proactive guard: prevents cascades of failing requests when token is stale.
  if (token && isJwtExpired(token, 60)) {
    clearAuthAndRedirect('expired');
    return new Promise<T>(() => {}); // stop downstream execution
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Central recovery on unauthorized
  if (response.status === 401) {
    clearAuthAndRedirect('expired');
    return new Promise<T>(() => {}); // stop downstream execution
  }

  if (!response.ok) {
    // Keep your existing JSON error extraction, but harden for non-JSON bodies.
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }

  // Most endpoints are JSON; keep it simple.
  return response.json();
}

export const api = {
  // Auth endpoints
  register: (data: RegisterRequest) =>
    fetchAPI<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    fetchAPI<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Invite endpoints
  createInvite: (data: CreateInviteRequest) =>
    fetchAPI<{ invite: Invite }>('/api/invites/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listInvites: () => fetchAPI<{ invites: Invite[] }>('/api/invites/list'),

  acceptInvite: (data: AcceptInviteRequest) =>
    fetchAPI<LoginResponse>('/api/invites/accept', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendInvite: (inviteId: string) =>
    fetchAPI<{ message: string }>(`/api/invites/${inviteId}/resend`, {
      method: 'POST',
    }),

  revokeInvite: (inviteId: string) =>
    fetchAPI<{ message: string }>(`/api/invites/${inviteId}/revoke`, {
      method: 'DELETE',
    }),

  // Intake endpoints
  submitIntake: (data: SubmitIntakeRequest) =>
    fetchAPI<{ intake: Intake }>('/api/intake/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyIntake: () => fetchAPI<{ intake: Intake | null }>('/api/intake/mine'),

  getOwnerIntakes: () => fetchAPI<{ intakes: Intake[] }>('/api/intake/owner'),

  // Document endpoints
  listDocuments: () => fetchAPI<{ documents: any[] }>('/api/documents'),

  // Roadmap endpoints
  getRoadmapSections: () =>
    fetchAPI<{ sections: any[] }>('/api/roadmap/sections'),

  // SuperAdmin endpoints
  getSuperadminTenants: () =>
    fetchAPI<{ tenants: { id: string; name: string }[] }>(
      '/api/superadmin/tenants'
    ),

  // Agent Thread endpoints
  getAgentThreads: (roleType?: string) =>
    fetchAPI<{ threads: any[] }>(
      `/api/agents/threads${roleType ? `?roleType=${roleType}` : ''}`
    ),

  getThreadMessages: (threadId: string) =>
    fetchAPI<{ messages: any[] }>(`/api/agents/threads/${threadId}/messages`),

  // Roadmap Tickets endpoint
  getRoadmapTickets: () => fetchAPI<{ tickets: any[] }>('/api/roadmap/tickets'),

  // Roadmap Q&A endpoint
  askRoadmapQuestion: (payload: {
    question: string;
    sectionKey?: string;
    currentSection?: {
      slug: string;
      title: string;
      content: string;
    };
  }) =>
    fetchAPI<{ answer: string }>('/api/roadmap/qna', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Owner Dashboard endpoint
  getOwnerDashboard: () => fetchAPI<any>('/api/dashboard/owner'),

  // Onboarding endpoints
  getOnboardingState: (tenantId: string) =>
    fetchAPI<any>(`/api/tenants/${tenantId}/onboarding`),

  // Tenant endpoints
  getTenant: () => fetchAPI<{ tenant: any }>('/api/tenants/me'),

  // Advisor threads (shared Tap-In threads)
  listAdvisorThreads: () =>
    fetchAPI<{
      threads: Array<{
        id: string;
        roleType: string;
        createdAt: string;
        lastActivityAt: string;
        preview: string;
      }>;
    }>('/api/dashboard/owner/advisor-threads'),

  // Intake Vector endpoints
  listIntakeVectors: (tenantId: string) =>
    fetchAPI<{ vectors: any[] }>(`/api/tenants/${tenantId}/intake-vectors`),

  createIntakeVector: (tenantId: string, data: any) =>
    fetchAPI<{ vector: any }>(`/api/tenants/${tenantId}/intake-vectors`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateIntakeVector: (vectorId: string, data: any) =>
    fetchAPI<{ vector: any }>(`/api/tenants/intake-vectors/${vectorId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  sendIntakeVectorInvite: (vectorId: string) =>
    fetchAPI<{ vector: any }>(
      `/api/tenants/intake-vectors/${vectorId}/send-invite`,
      {
        method: 'POST',
      }
    ),

  // Password reset endpoints
  requestPasswordReset: (email: string) =>
    fetchAPI<{ success: boolean; message: string; resetToken?: string }>(
      '/api/auth/request-reset',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    ),

  validateResetToken: (token: string) =>
    fetchAPI<{ valid: boolean; email: string; error?: string }>(
      `/api/auth/validate-reset/${token}`
    ),

  resetPassword: (data: { token: string; newPassword: any }) =>
    fetchAPI<{ success: boolean; message: string }>(
      '/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Clarification Pipeline endpoints (Stakeholder side)
  getClarificationByToken: (token: string) =>
    fetchAPI<any>(`/api/clarify/${token}`),

  submitClarification: (token: string, response: string) =>
    fetchAPI<any>(`/api/clarify/${token}`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    }),
};

export { ApiError };