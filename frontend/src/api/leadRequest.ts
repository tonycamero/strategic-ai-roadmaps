export interface LeadRequestData {
  name: string;
  email: string;
  company: string;
  role: string;
  teamSize: number;
  currentCrm: string;
  bottleneck: string;
  source?: string;
}

export interface LeadRequestResponse {
  success: boolean;
  message: string;
}

export async function submitLeadRequest(
  data: LeadRequestData
): Promise<LeadRequestResponse> {
  const response = await fetch('/api/lead-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Failed to submit request');
  }

  return response.json();
}
