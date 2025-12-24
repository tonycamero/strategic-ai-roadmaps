/**
 * Role Runtime Context Wrapper
 * 
 * Provides "one brain, many lenses" - wraps user messages with role-specific context
 * so the same Assistant can adapt its tone and focus based on who's asking.
 */

export type ActorRole = 'owner' | 'ops' | 'sales' | 'delivery' | 'superadmin';

/**
 * Wraps user message with role-specific context to guide Assistant behavior
 * without needing separate Assistants per role.
 */
export function wrapUserMessageWithRoleContext(
  message: string,
  actorRole: ActorRole
): string {
  switch (actorRole) {
    case 'owner':
      return `[Context: Speaking with the firm owner. Focus on strategic clarity, delegation, and roadmap execution. Avoid deep implementation detail unless asked.]\n\n${message}`;

    case 'ops':
      return `[Context: Speaking with operations lead. Focus on systems, workflows, and making the roadmap executable. Be concrete and tactical, but always tie back to roadmap stages.]\n\n${message}`;

    case 'sales':
      return `[Context: Speaking with sales lead. Focus on pipeline, lead handling, response times, and conversion. Keep it practical and time-aware.]\n\n${message}`;

    case 'delivery':
      return `[Context: Speaking with delivery / CX lead. Focus on client journey, handoffs, and reducing fires.]\n\n${message}`;

    case 'superadmin':
    default:
      return `[Context: Speaking with platform operator (Tony). You may reason across firms, templates, and product strategy. Never leak tenant-specific data across firms.]\n\n${message}`;
  }
}
