import { mockSnapshot } from './snapshotMock';
import { TenantLifecycleSnapshot } from './snapshotContract';

/**
 * EXEC-078B: Snapshot Service
 * The primary interface for the Control Spine shared execution state.
 */

export async function getSnapshot(tenantId: string): Promise<TenantLifecycleSnapshot> {
  // Check for demo toggle in environment
  // Vite uses import.meta.env.VITE_...
  const useDemo = import.meta.env.VITE_USE_DEMO_SNAPSHOT === "true" || localStorage.getItem('USE_DEMO_SNAPSHOT') === "true";

  if (useDemo) {
    const snapshot = mockSnapshot(tenantId);
    console.log("Snapshot (MOCK):", snapshot);
    return snapshot;
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/snapshot/${tenantId}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch snapshot: ${res.statusText}`);
    }

    const snapshot = await res.json();
    console.log("Snapshot (LIVE):", snapshot);
    return snapshot;
  } catch (err) {
    console.error("Snapshot service error, falling back to mock:", err);
    return mockSnapshot(tenantId);
  }
}

export type { TenantLifecycleSnapshot };
