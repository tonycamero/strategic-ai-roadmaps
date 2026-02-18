/**
 * Explicit allowlist for known "orphan" or "legacy" migration hashes.
 * These hashes exist in the database (drizzle.__drizzle_migrations) 
 * but are not represented in the local Drizzle migration journal.
 */
export const ALLOWED_ORPHAN_HASHES = new Set([
  '6cec6782aaf9057166ccb08a58ef9b80d73f31313388e5223707008c0bd35984' // Legacy precursor hash
]);
