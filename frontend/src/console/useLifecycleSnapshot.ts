import { useQuery } from '@tanstack/react-query';

export function useLifecycleSnapshot(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['lifecycleSnapshot', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID required');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/snapshot/${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch snapshot');
      }
      const json = await res.json();
      return json.data;
    },
    enabled: !!tenantId,
    staleTime: 5000,
  });
}
