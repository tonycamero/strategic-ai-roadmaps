/**
 * CANONICAL FINDINGS HASH UTILITY
 *
 * Single authority for computing the deterministic SHA-256 hash of a canonical
 * findings array. Used by:
 *   - FindingsService (write time — stored as artifactHash on tenant_documents)
 *   - TenantStateAggregationService (read time — emitted on projection surface)
 *
 * Hash rules:
 *   - Input: findings[] (raw array from content JSON)
 *   - Filter:  only items where typeof id === 'string'
 *   - Sort:    ascending by id (lexicographic)
 *   - Normalize: JSON.stringify of the sorted array
 *   - Hash:   SHA-256 hex digest
 *   - No timestamps, no wrappers, no metadata included in hash input
 */

import { createHash } from 'crypto';

export interface HashableFinding {
  id: string;
  [key: string]: unknown;
}

/**
 * Compute a content-derived SHA-256 hash for a canonical findings array.
 * Safe against undefined ids, type drift, and insertion-order variance.
 */
export function computeCanonicalFindingsHash(findings: HashableFinding[]): string {
  const safe = findings.filter((f) => typeof f.id === 'string');
  const sorted = [...safe].sort((a, b) => a.id.localeCompare(b.id));
  const normalized = JSON.stringify(sorted);
  return createHash('sha256').update(normalized).digest('hex');
}
