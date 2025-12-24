/**
 * Core types for the Diagnostic → Tickets → Roadmap pipeline
 */

export type ImplementationTier = 'starter' | 'growth' | 'scale';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type Sprint = 30 | 60 | 90;

export type RoadmapSectionId =
  | 'executive'
  | 'diagnostic'
  | 'architecture'
  | 'systems'
  | 'implementation'
  | 'sop_pack'
  | 'metrics'
  | 'appendix';

// ============================================================================
// DIAGNOSTIC STRUCTURES
// ============================================================================

export interface PainCluster {
  category: string;
  description: string;
  severity: number; // 1-5
  affectedRoles: string[];
  estimatedTimeLostHoursWeekly: number;
}

export interface WorkflowBottleneck {
  process: string;
  currentState: string;
  targetState: string;
  impactScore: number; // 1-5
}

export interface SystemsFragmentation {
  currentTools: string[];
  redundancies: string[];
  gapsIdentified: string[];
}

export interface AiOpportunityZone {
  zone: string;
  aiCapability: string;
  estimatedImpact: string;
}

export interface DiagnosticMap {
  tenantId: string;
  firmName: string;
  diagnosticDate: string; // ISO date

  painClusters: PainCluster[];
  workflowBottlenecks: WorkflowBottleneck[];
  systemsFragmentation: SystemsFragmentation;
  aiOpportunityZones: AiOpportunityZone[];

  readinessScore: number; // 0-100
  implementationTier: ImplementationTier;
}

// ============================================================================
// SOP TICKET STRUCTURES
// ============================================================================

export interface SopTicket {
  ticketId: string; // "A1", "B3", "D7", etc.
  title: string;
  category: string;
  value_category?: string; // Fine-grained ROI attribution (e.g., "Lead Intake", "Nurture")
  tier?: string; // "core" | "recommended" | "advanced"
  pain_source: string;
  approved?: boolean; // Moderation flag (default false)
  description: string;
  current_state: string;
  target_state: string;
  ai_design: string;
  ghl_implementation: string;
  implementation_steps: string[]; // 6-8 actionable steps
  owner: string;
  dependencies: string[];
  time_estimate_hours: number;
  cost_estimate: number; // hours * $125
  success_metric: string;
  roadmap_section: string;
  priority: Priority;
  sprint: Sprint;
  projected_hours_saved_weekly: number;
  projected_leads_recovered_monthly: number;
  roi_notes: string;
  inventoryId?: string | null; // Reference to inventory template
  isSidecar?: boolean; // Whether this is a sidecar ticket
}

export interface TicketGenerationResult {
  tenantId: string;
  diagnosticId: string;
  tickets: SopTicket[];
}

// ============================================================================
// ROADMAP STRUCTURES
// ============================================================================

export interface RoadmapSection {
  section: RoadmapSectionId;
  title: string;
  content: string; // Markdown
  order: number;
}

export interface RoadmapGenerationResult {
  sections: RoadmapSection[];
}

export interface RoadmapSectionsOutput {
  executive_summary: { title: string; content: string };
  diagnostic_analysis: { title: string; content: string };
  system_architecture: { title: string; content: string };
  high_leverage_systems: { title: string; content: string };
  implementation_plan: { title: string; content: string };
  sop_pack: { title: string; content: string };
  metrics_dashboard: { title: string; content: string };
  appendix: { title: string; content: string };
}

// ============================================================================
// PROCESSING RESULTS
// ============================================================================

export interface ProcessDiagnosticResult {
  diagnosticId: string;
  ticketCount: number;
  totalCost: number;
  totalHours: number;
  roadmapSections: RoadmapSection[];
  roadmapUrl: string;
}

// ============================================================================
// ROADMAP CONTEXT (Rich input for Prompt 2)
// ============================================================================

export interface TicketRollup {
  totalHours: number;
  totalCost: number;
  totalHoursSavedWeekly: number;
  totalLeadsRecoveredMonthly: number;
  annualizedTimeValue: number; // hours saved * 52 * $35/hour
  annualizedLeadValue: number; // leads * 12 * $35/lead
  annualizedROI: number; // (time value + lead value) / total cost
  paybackWeeks: number; // total cost / weekly value
}

export interface RoadmapContext {
  // Structured data
  diagnosticMap: DiagnosticMap;
  tickets: SopTicket[];
  ticketRollup: TicketRollup;
  
  // Raw SOP-01 content (the valuable narrative)
  sop01DiagnosticMarkdown: string;      // Output-1: Company Diagnostic Map
  sop01AiLeverageMarkdown: string;      // Output-2: AI Leverage & Opportunity Map
  sop01RoadmapSkeleton: string;         // Output-4: Roadmap Skeleton
  discoveryNotesMarkdown?: string;      // Discovery call notes if available
  
  // Metadata
  tenantId: string;
  firmName: string;
  diagnosticDate: string;
}
