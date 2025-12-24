export interface TenantDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  sopNumber: string | null;
  outputNumber: string | null;
  mimeType: string;
  fileSize: number;
  originalFilename: string;
  isPublic: boolean;
  createdAt: string;
  content?: string | null;
  // Display helpers
  filesizeLabel?: string;
  uploadedAtLabel?: string;
  sopCode?: string;
  outputLabel?: string;
  categoryLabel?: string;
}

// Owner-facing display labels for internal document titles
// Keyed by backend doc.title (e.g. "Company Diagnostic Map")
export const OWNER_DOCUMENT_LABELS: Record<
  string,
  { title: string; subtitle: string }
> = {
  'Company Diagnostic Map': {
    title: 'Business Health Diagnostic',
    subtitle:
      'A clear breakdown of your current workflows, bottlenecks, and opportunities.',
  },
  'AI Leverage & Opportunity Map': {
    title: 'AI Opportunities Report',
    subtitle:
      'Where AI and automation can immediately improve your operations, engagement, and renewals.',
  },
  'Discovery Call Preparation Questions': {
    title: 'Your Discovery Call Prep Sheet',
    subtitle: 'What we\'ll cover together to finalize your roadmap.',
  },
  'Strategic Roadmap Skeleton': {
    title: 'Your Strategic AI Roadmap (Draft)',
    subtitle: 'A preview of your upcoming 12-month automation plan.',
  },
  'Implementation Ticket Bundle': {
    title: 'Your Improvement Initiatives',
    subtitle:
      'A curated list of recommended workflow and automation upgrades.',
  },
  'Final Strategic Roadmap': {
    title: 'Your Final Strategic AI Roadmap',
    subtitle:
      'Your personalized 12-month plan to streamline operations and grow membership.',
  },
};

/**
 * Get owner-facing title and subtitle for a document
 */
export function getOwnerDocumentLabel(doc: TenantDocument): {
  title: string;
  subtitle: string;
} {
  const ownerLabels = OWNER_DOCUMENT_LABELS[doc.title];
  
  if (ownerLabels) {
    return ownerLabels;
  }
  
  // Fallback to original title/description
  return {
    title: doc.title,
    subtitle: doc.description ?? 'Your roadmap document.',
  };
}
