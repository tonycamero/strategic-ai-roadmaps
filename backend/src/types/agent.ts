// ============================================================================
// Agent Interaction Modes
// ============================================================================

/**
 * Defines the level of access and capabilities an agent has based on user role.
 * 
 * - `editor`: Full agent capabilities including mutative tools (owners)
 * - `observer`: Read-only agent, analysis and suggestions only (team/staff)
 * - `superadmin`: Full visibility + diagnostic tools (superadmin)
 */
export type AgentInteractionMode = 'editor' | 'observer' | 'superadmin';

/**
 * Maps user roles to agent interaction modes
 */
export function getInteractionMode(userRole: string): AgentInteractionMode {
  if (userRole === 'superadmin') return 'superadmin';
  if (userRole === 'owner') return 'editor';
  
  // Everything else: staff / sales / ops / delivery
  return 'observer';
}
