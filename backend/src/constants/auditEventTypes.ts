/**
 * Audit Event Type Constants
 * Phase 1.5: Centralized event type definitions for type safety and consistency
 */

export const AUDIT_EVENT_TYPES = {
    // Executive Brief
    EXEC_BRIEF_STATUS_CHANGED: 'EXEC_BRIEF_STATUS_CHANGED',

    // Diagnostic & Roadmap
    DIAGNOSTIC_SYNTHESIS_TRIGGERED: 'DIAGNOSTIC_SYNTHESIS_TRIGGERED',
    ROADMAP_FINALIZED: 'ROADMAP_FINALIZED',

    // Readiness Flags (Phase 3)
    READINESS_FLAG_SET: 'READINESS_FLAG_SET',
    READINESS_FLAG_CLEARED: 'READINESS_FLAG_CLEARED',
    READINESS_FLAG_OVERRIDE: 'READINESS_FLAG_OVERRIDE',

    // Overrides
    PILOT_CAP_OVERRIDE_USED: 'PILOT_CAP_OVERRIDE_USED',

    // Deprecation
    DEPRECATED_ENDPOINT_USED: 'DEPRECATED_ENDPOINT_USED',

    // Backfill (Phase 3)
    READINESS_BACKFILLED: 'READINESS_BACKFILLED',

    // Intakes (Phase 7)
    INTAKE_REOPENED: 'INTAKE_REOPENED',
} as const;

export type AuditEventType = typeof AUDIT_EVENT_TYPES[keyof typeof AUDIT_EVENT_TYPES];
