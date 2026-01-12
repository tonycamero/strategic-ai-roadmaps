
/**
 * Sunset Service for API Deprecation
 */

// Deployment date of Phase 3 (simulated as today for dev)
const DEPRECATION_START_DATE = new Date('2026-01-11');

export enum DeprecationPhase {
    SOFT = 'soft',   // Day 0-30: Header only
    WARN = 'warn',   // Day 30-60: Warning in body
    GONE = 'gone',   // Day 60-90: 410 Gone
    REMOVED = 'removed' // Day 90+: Remove code
}

export function getDeprecationPhase(now: Date = new Date()): DeprecationPhase {
    const diffMs = now.getTime() - DEPRECATION_START_DATE.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return DeprecationPhase.SOFT;
    if (diffDays < 60) return DeprecationPhase.WARN;
    if (diffDays < 90) return DeprecationPhase.GONE;
    return DeprecationPhase.REMOVED;
}

export function getDeprecationWarning(): string {
    return "This endpoint is deprecated and will be removed in a future update. Please migrate to the new canonical finalize endpoint: /api/superadmin/firms/:id/roadmap/finalize";
}
