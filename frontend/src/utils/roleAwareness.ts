// frontend/src/utils/roleAwareness.ts
import type { UserRole } from '@roadmap/shared';
import { isReadOnlyStaff } from './permissions';

export type InteractionMode = 'editor' | 'observer' | 'superadmin';

export function getInteractionMode(userRole: string): InteractionMode {
  if (userRole === 'superadmin') return 'superadmin';
  if (isReadOnlyStaff(userRole as UserRole)) return 'observer';
  return 'editor';
}

export function canEdit(userRole: string): boolean {
  return getInteractionMode(userRole) === 'editor';
}

export function canViewDocs(_userRole: string): boolean {
  // All roles can view documents for now
  return true;
}
