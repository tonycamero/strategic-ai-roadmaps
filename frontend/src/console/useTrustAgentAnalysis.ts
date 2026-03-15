import { useQuery } from '@tanstack/react-query';

const ANALYSIS_TIMEOUT_MS = 5000;

export function useTrustAgentAnalysis(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['trustAgentAnalysis', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID required');

      const token = localStorage.getItem('token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

      try {
        const res = await fetch(`/api/agent/analysis/${tenantId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.error || 'Failed to fetch analysis');
        }

        const json = await res.json();
        return json.data;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Timeout fired — console continues without analysis
          return null;
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    enabled: !!tenantId,
    // Retry once on network error after a 2s delay; don't retry on timeout
    retry: (failureCount: number, error: any) => {
      if (error?.name === 'AbortError') return false;
      return failureCount < 1;
    },
    retryDelay: 2000,
    // Refresh every 60s so panels re-hydrate if analysis becomes available later
    refetchInterval: 60000,
  });
}
