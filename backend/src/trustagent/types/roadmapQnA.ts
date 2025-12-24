// src/trustagent/types/roadmapQnA.ts

export interface TicketRollup {
  totalHours: number;
  totalCost: number;
  totalHoursSavedWeekly: number;
  totalLeadsRecoveredMonthly: number;
  annualizedTimeValue: number;
  annualizedLeadValue: number;
  annualizedROI: number;
  paybackWeeks: number;
}

export interface RoadmapSection {
  id: string;
  sectionKey: string; // e.g. 'executive', 'systems', etc.
  title: string;
  order: number;
  contentMarkdown: string;
}

export interface RoadmapTicket {
  ticketId: string;
  inventoryId: string | null;
  isSidecar: boolean;

  title: string;
  category: string;
  valueCategory: string;
  tier: 'core' | 'recommended' | 'advanced' | string;

  sprint: number | null;
  roadmapSection: string;

  painSource: string;
  description: string;
  currentState: string;
  targetState: string;

  aiDesign: string;
  ghlImplementation: string;
  implementationSteps: string;

  owner: string;
  dependencies: string[];

  timeEstimateHours: number;
  costEstimate: number;

  projectedHoursSavedWeekly: number;
  projectedLeadsRecoveredMonthly: number;

  successMetric: string;
  roiNotes: string;

  priority: 'high' | 'medium' | 'low' | string;
}

export interface SprintSummary {
  sprint: number;
  ticketIds: string[];
  totalCost: number;
  totalHours: number;
  totalHoursSavedWeekly: number;
  totalLeadsRecoveredMonthly: number;
}

export interface TopTicketByImpact {
  ticketId: string;
  impactScore: number;
}

// Current user profile (who is using the agent right now)
export interface CurrentUserProfile {
  userId: string;
  displayName: string;   // "Sarah", "Marcus", etc
  roleLabel: string;     // "Owner", "Ops Lead", "Sales Lead", etc
}

// Enriched profile from intake answers
export interface EnrichedProfile {
  roleLabel: string;              // "Owner", "Sales Lead", etc
  departmentKey: string;          // "owner", "sales", "ops", etc
  displayName?: string;           // "Roberta"
  preferredReference?: string;    // "Roberta (Owner)"
  
  top3Issues?: string[];          // Top 3 pain points
  top3GoalsNext90Days?: string[]; // Top 3 goals
  oneThingOutcome?: string;       // "If nothing else but X..."
  
  primaryKpis?: string[];         // KPI labels
  kpiBaselines?: Record<string, string>; // KPI -> baseline value
  
  nonGoals?: string[];            // What we're NOT doing
  doNotAutomate?: string[];       // Keep human-only
  
  changeReadiness?: 'low' | 'medium' | 'high';
  weeklyCapacityHours?: number;
  biggestRiskIfTooFast?: string;
}

export interface RoadmapQnAContext {
  tenantId: string;
  firmName: string;
  firmSizeTier: 'micro' | 'small' | 'mid' | 'large' | string;
  businessType: string;
  region?: string | null;

  teamHeadcount: number | null;
  baselineMonthlyLeads: number | null;
  diagnosticDate: string; // ISO

  // Optional: current section user is viewing (for situational awareness)
  currentSection?: {
    slug: string;
    title: string;
    content: string;
  };

  // Current user (who is chatting with the agent)
  currentUserProfile?: CurrentUserProfile | null;
  
  // Enriched intake profiles (v1: owner only, future: team profiles)
  ownerProfile?: EnrichedProfile | null;
  teamProfiles?: EnrichedProfile[]; // Future: sales, ops, delivery

  // Optional longform narrative – can be wired from tenant_documents later
  executiveSummaryMarkdown?: string;
  diagnosticMarkdown?: string;
  aiLeverageMarkdown?: string;
  roadmapSkeletonMarkdown?: string;
  discoveryNotesMarkdown?: string;

  ticketRollup: TicketRollup;
  tickets: RoadmapTicket[];

  sprintSummaries?: SprintSummary[];
  topTicketsByImpact?: TopTicketByImpact[];

  roadmapSections: RoadmapSection[];
}
