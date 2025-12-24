// Visitor context for personalization

export interface VisitorContext {
  companyType?: string;
  teamSizeBracket?: 'solo' | '2-5' | '6-15' | '16-50' | '50+';
  currentCrm?: string;
  urgencyLevel?: 'curious' | 'ready_in_90' | 'urgent';
}

const CONTEXT_KEY = 'trustagent_context';

// Load context from sessionStorage
export function loadVisitorContext(): VisitorContext {
  try {
    const stored = sessionStorage.getItem(CONTEXT_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save context to sessionStorage
export function saveVisitorContext(context: VisitorContext): void {
  try {
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
  } catch (error) {
    console.error('Failed to save visitor context:', error);
  }
}

// Update specific context fields
export function updateVisitorContext(updates: Partial<VisitorContext>): VisitorContext {
  const current = loadVisitorContext();
  const updated = { ...current, ...updates };
  saveVisitorContext(updated);
  return updated;
}

// Generate query params for booking URL
export function generateBookingParams(context: VisitorContext): string {
  const params = new URLSearchParams();

  if (context.teamSizeBracket) {
    params.append('teamSize', context.teamSizeBracket);
  }

  if (context.currentCrm) {
    params.append('crm', context.currentCrm);
  }

  if (context.companyType) {
    params.append('industry', context.companyType);
  }

  params.append('source', 'trustagent');

  return params.toString();
}

// Personalize message based on context
export function personalizeMessage(message: string, context: VisitorContext): string {
  let personalized = message;

  // Replace placeholders with context values
  if (context.teamSizeBracket) {
    personalized = personalized.replace('{{team_size}}', context.teamSizeBracket);
  }

  if (context.currentCrm) {
    personalized = personalized.replace('{{crm}}', context.currentCrm);
  }

  return personalized;
}
