/**
 * SOP Inventory Type Definitions (Phase 1)
 * 
 * Canonical schema for the inventory-driven ticket generation system.
 * Every SOP must map to these types to ensure hallucination-proof implementation.
 */

export type InventoryCategory =
  | 'Pipeline'
  | 'CRM'
  | 'Ops'
  | 'Onboarding'
  | 'Marketing'
  | 'Finance'
  | 'Reporting'
  | 'Team';

export type ValueCategory =
  | 'Lead Intake'
  | 'Lead Nurture'
  | 'Lead Qualification'
  | 'Appointment Booking'
  | 'Appointment Confirmation'
  | 'No-Show Recovery'
  | 'Client Onboarding'
  | 'Service Delivery'
  | 'Client Retention'
  | 'Team Communication'
  | 'Task Management'
  | 'Knowledge Base'
  | 'Campaign Execution'
  | 'Performance Tracking'
  | 'Revenue Attribution'
  | 'Data Quality'
  | 'Process Standardization'
  | 'Compliance';

export type ImplementationStatus = 'production-ready' | 'pilot-available';

export type Complexity = 'low' | 'medium' | 'high';

/**
 * Explicit adapter type — replaces isSidecar inference.
 * Used by SelectionEngine adapter gate.
 */
export type InventoryAdapter = 'ghl' | 'sidecar' | 'custom';

export type Tier = 'core' | 'recommended' | 'advanced';

export type Sprint = 30 | 60 | 90;

/**
 * GHL Component Types (Reality Surface Map)
 */
export type GHLComponent =
  | 'Workflows'
  | 'Pipelines'
  | 'Forms'
  | 'Calendars'
  | 'Conversations'
  | 'Tags'
  | 'Custom Fields'
  | 'Tasks'
  | 'Email/SMS'
  | 'API v2';

export type GHLTrigger =
  | 'Form Submitted'
  | 'Opportunity Created'
  | 'Pipeline Stage Changed'
  | 'Tag Added'
  | 'Tag Removed'
  | 'Appointment Booked'
  | 'Appointment Canceled'
  | 'Appointment No-Show'
  | 'Incoming Message';

export type GHLAction =
  | 'Send Email'
  | 'Send SMS'
  | 'Create Task'
  | 'Assign Task'
  | 'Update Contact Field'
  | 'Update Opportunity Field'
  | 'Add Tag'
  | 'Remove Tag'
  | 'Move Pipeline Stage'
  | 'Internal Notification'
  | 'Wait/Delay'
  | 'Create Opportunity';

/**
 * Sidecar Categories (Phase 1 approved list)
 */
export type SidecarCategory =
  | 'Monitoring'
  | 'Reporting'
  | 'Data Hygiene'
  | 'Analytics';

/**
 * Core Inventory Ticket Definition
 * 
 * This is the canonical schema for all SOP inventory entries.
 * GHL-native SOPs must populate ghlComponents, ghlTriggers, ghlActions.
 * Sidecar SOPs must set isSidecar=true and specify sidecarCategory.
 */
export interface InventoryTicket {
  // Identity
  inventoryId: string;
  titleTemplate: string;

  // Categorization
  category: InventoryCategory;
  valueCategory: ValueCategory;

  // GHL Reality Grounding (empty for sidecars)
  ghlComponents: GHLComponent[];
  ghlTriggers?: GHLTrigger[];
  ghlActions?: GHLAction[];
  ghlLimitations?: string[];

  // Explicit adapter — replaces isSidecar inference (EXEC-TICKET-SELECTION-ENGINE-001)
  adapter: InventoryAdapter;
  sidecarCategory?: SidecarCategory;
  implementationStatus: ImplementationStatus;

  // Custom dev requirement — used by SelectionEngine customDev gate
  requiresCustomDev: boolean;

  // Content
  description: string;

  // Implementation metadata
  implementationPattern: string;
  complexity: Complexity;
  dependencies: string[]; // Array of inventoryIds

  // Vertical support
  verticalTags: string[];

  /** @deprecated Use adapter === 'sidecar' instead */
  isSidecar?: boolean;
}

/**
 * Selection Context for inventory picking
 */
export interface SelectionContext {
  firmSizeTier: 'micro' | 'small' | 'mid' | 'large';
  vertical: 'generic' | 'chamber' | 'agency' | 'trades' | 'coaching' | 'professional';
  wantsSidecars: boolean;
  diagnosticSignals: {
    pipelinePain?: boolean;
    followupPain?: boolean;
    onboardingPain?: boolean;
    reportingPain?: boolean;
    ownerDependency?: boolean;
    crmDataPain?: boolean;
    teamCoordinationPain?: boolean;
    deliveryBottlenecks?: boolean;
  };
}

/**
 * Selected inventory ticket with tier/sprint assignment
 */
export interface SelectedInventoryTicket extends InventoryTicket {
  tier: Tier;
  sprint: Sprint;
}
