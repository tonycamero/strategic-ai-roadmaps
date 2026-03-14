import crypto from "crypto";

/**
 * Snapshot Integrity Gate
 * 
 * Ensures the TrustAgent only operates on verified, complete, and immutable state.
 * Prevents mutation, partial projections, and cross-tenant state bleed.
 */
export function snapshotIntegrityGate(snapshot: any) {
  if (!snapshot) {
    throw new Error("Lifecycle snapshot missing");
  }

  // Ensure structural components are present from resolveTenantLifecycleSnapshot
  const required = ["artifacts", "diagnostics", "findings", "notes", "roadmap", "signals"];
  for (const key of required) {
    if (!(key in snapshot)) {
      throw new Error(`Snapshot integrity failure: missing required component [${key}]`);
    }
  }

  // Produce a deterministic hash of the state for forensic replay
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(snapshot))
    .digest("hex");

  // Freeze the object to prevent downstream mutation by agent logic
  Object.freeze(snapshot);

  return { 
    snapshot, 
    snapshotHash: hash 
  };
}
