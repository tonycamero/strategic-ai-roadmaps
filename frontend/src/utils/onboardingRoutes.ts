import type { OnboardingStepId } from '../types/onboarding';

/**
 * Maps onboarding step IDs to actual routes in the application
 * 
 * IMPORTANT: Some routes are mapped to existing pages, others to placeholders.
 * See FRONTEND_ONBOARDING_IMPLEMENTATION.md for details on which routes need creation.
 */
export function getRouteForStep(stepId: OnboardingStepId): string {
  switch (stepId) {
    case 'ORGANIZATION_TYPE':
      return '/organization-type';  // ✅ EXISTS
    
    case 'OWNER_INTAKE':
      return '/intake/owner';  // ✅ EXISTS
    
    case 'BUSINESS_PROFILE':
      return '/business-profile';  // ✅ EXISTS
    
    case 'INVITE_TEAM':
      return '/invite-team';  // ✅ EXISTS
    
    case 'TEAM_INTAKES':
      // TODO: Create team intakes status page
      return '/dashboard'; // PLACEHOLDER - Leadership Team section
    
    case 'DISCOVERY_CALL':
      // TODO: Create discovery call scheduling page
      return '/dashboard'; // PLACEHOLDER
    
    case 'DIAGNOSTIC_GENERATED':
      // TODO: Create diagnostic review page
      return '/dashboard'; // PLACEHOLDER
    
    case 'ROADMAP_REVIEWED':
      return '/roadmap';  // ✅ EXISTS
    
    case 'TICKETS_MODERATED':
      // TODO: Create tickets moderation page
      return '/roadmap'; // PLACEHOLDER - will need tickets view
    
    case 'IMPLEMENTATION_DECISION':
      // TODO: Create implementation decision page
      return '/dashboard'; // PLACEHOLDER
    
    default:
      return '/dashboard';
  }
}

/**
 * Get a human-readable label for a step
 */
export function getStepLabel(stepId: OnboardingStepId): string {
  const labels: Record<OnboardingStepId, string> = {
    ORGANIZATION_TYPE: 'Organization Type',
    OWNER_INTAKE: 'Owner Intake',
    BUSINESS_PROFILE: 'Business Profile',
    INVITE_TEAM: 'Invite Team',
    TEAM_INTAKES: 'Team Intakes',
    DISCOVERY_CALL: 'Discovery Call',
    DIAGNOSTIC_GENERATED: 'Diagnostic Generated',
    ROADMAP_REVIEWED: 'Roadmap Reviewed',
    TICKETS_MODERATED: 'Tickets Moderated',
    IMPLEMENTATION_DECISION: 'Implementation Decision',
  };
  
  return labels[stepId] || stepId;
}
