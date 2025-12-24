/**
 * Capability Profile System
 * 
 * Replaces "interaction modes" with invisible capability constraints.
 * These are computed server-side from JWT role + context and passed to
 * the prompt builder, but NEVER mentioned in the assistant's responses.
 */

/**
 * User persona - determines tone and perspective, not capabilities
 */
export type UserPersona = 'owner' | 'staff' | 'advisor';

/**
 * Capability profile - what the assistant can help with in this context
 */
export interface CapabilityProfile {
  /**
   * Can propose creating tickets or structured actions
   * (Future: will actually create them via tools)
   */
  canWriteTickets: boolean;

  /**
   * Can suggest changes to roadmap structure/content
   * (Future: will require approval workflow)
   */
  canChangeRoadmap: boolean;

  /**
   * Can see data across multiple tenants
   * (SuperAdmin only - for diagnostics)
   */
  canSeeCrossTenant: boolean;

  /**
   * User's persona - shapes tone, not permissions
   * - owner: strategic, high-level
   * - staff: tactical, execution-focused
   * - advisor: external perspective, best practices
   */
  persona: UserPersona;
}

/**
 * Compute capability profile from user context
 */
export function computeCapabilityProfile(
  role: string,
  tenantId: string,
  context?: {
    route?: string; // e.g., '/roadmap/view', '/admin/diagnostics'
    action?: string; // e.g., 'query', 'moderate'
  }
): CapabilityProfile {
  // Base capabilities by role
  const baseProfile: CapabilityProfile = {
    canWriteTickets: false,
    canChangeRoadmap: false,
    canSeeCrossTenant: false,
    persona: 'staff', // Default
  };

  switch (role) {
    case 'owner':
      return {
        canWriteTickets: true,
        canChangeRoadmap: true,
        canSeeCrossTenant: false,
        persona: 'owner',
      };

    case 'superadmin':
      return {
        canWriteTickets: true,
        canChangeRoadmap: true,
        canSeeCrossTenant: true,
        persona: 'advisor',
      };

    case 'staff':
    case 'team':
      return {
        canWriteTickets: true,
        canChangeRoadmap: false,
        canSeeCrossTenant: false,
        persona: 'staff',
      };

    default:
      // Viewer / unknown roles
      return {
        canWriteTickets: false,
        canChangeRoadmap: false,
        canSeeCrossTenant: false,
        persona: 'staff',
      };
  }

  // Future: context-based overrides
  // if (context?.route === '/admin/diagnostics') {
  //   profile.canSeeCrossTenant = true; // if superadmin
  // }
}

/**
 * Check if a profile has a specific capability
 */
export function hasCapability(
  profile: CapabilityProfile,
  capability: keyof Omit<CapabilityProfile, 'persona'>
): boolean {
  return profile[capability] === true;
}
