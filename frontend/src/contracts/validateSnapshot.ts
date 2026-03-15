import type { TenantLifecycleSnapshotContract } from './TenantLifecycleSnapshot';

/**
 * EXEC-TICKET-075-B: Runtime snapshot validator.
 * Throws immediately if the API response is missing required projection fields.
 * Console never silently renders on corrupted state.
 */
export function validateSnapshot(data: any): TenantLifecycleSnapshotContract {
  if (!data) {
    throw new Error('[SnapshotContract] Snapshot data is null or undefined.');
  }
  if (!data.projection) {
    throw new Error('[SnapshotContract] Missing required field: projection');
  }
  if (!data.projection.lifecycle) {
    throw new Error('[SnapshotContract] Missing required field: projection.lifecycle');
  }
  if (!data.projection.lifecycle.currentPhase) {
    throw new Error('[SnapshotContract] Missing required field: projection.lifecycle.currentPhase');
  }
  if (!data.projection.analytics) {
    throw new Error('[SnapshotContract] Missing required field: projection.analytics');
  }
  if (!data.projection.artifacts) {
    throw new Error('[SnapshotContract] Missing required field: projection.artifacts');
  }
  if (!data.projection.stages) {
    throw new Error('[SnapshotContract] Missing required field: projection.stages');
  }
  if (!data.projection.stageState) {
    throw new Error('[SnapshotContract] Missing required field: projection.stageState');
  }
  // Coerce signals to array defensively
  if (!Array.isArray(data.signals)) {
    data.signals = [];
  }
  return data as TenantLifecycleSnapshotContract;
}
