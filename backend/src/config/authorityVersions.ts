
/**
 * AUTHORITY INFRASTRUCTURE VERSIONS
 * 
 * Central registry for versioning the structural invariants of the SAR Authority Spine.
 * Increment these versions when making breaking changes to prompts, extraction logic, 
 * or database schemas that affect authority enforcement.
 */

export const AUTHORITY_VERSION_STAGE1_INTAKE = '1.0.0' as const;
export const AUTHORITY_VERSION_STAGE2_BRIEF = '1.0.0' as const;
export const AUTHORITY_VERSION_STAGE3_DIAGNOSTIC = '1.0.0' as const;
export const AUTHORITY_VERSION_STAGE4_DISCOVERY = '1.0.0' as const;
export const AUTHORITY_VERSION_STAGE5_SYNTHESIS = '1.0.0' as const;

/**
 * STAGE 6: Inventory -> Tickets
 * Locked: 2026-01-22
 */
export const AUTHORITY_VERSION_STAGE6 = '1.0.0' as const;

export const AUTHORITY_VERSION_STAGE7_ROADMAP = '1.0.0' as const;
