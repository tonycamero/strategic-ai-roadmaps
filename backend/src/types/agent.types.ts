/**
 * Agent Configuration Types
 * 
 * Types for single-assistant-per-tenant architecture with capability profiles.
 * Includes Verifiable Compute support for future EQTY Labs / Hedera integration.
 */

// Legacy: Used for routing and thread tracking (not for configs)
export type AgentRoleType = 'owner' | 'ops' | 'tc' | 'agent_support';

// New: Agent type for configs (single assistant per tenant)
export type AgentType = 'roadmap_coach' | 'exec_overview';

export interface ToolConfig {
  key: string;
  enabled: boolean;
  verifiedCompute?: boolean;  // Future: EQTY Labs / Hedera VC integration
}

export interface AgentConfig {
  id: string;
  tenantId: string;
  agentType: AgentType;
  systemIdentity: string;
  businessContext: string | null;
  customInstructions: string | null;
  rolePlaybook: string;
  toolContext: {
    tools: ToolConfig[];
  };
  // OpenAI Assistant provisioning
  openaiAssistantId?: string | null;
  openaiVectorStoreId?: string | null;
  openaiModel?: string | null;
  lastProvisionedAt?: string | null;
  // Prompt versioning
  configVersion?: number;
  instructionsHash?: string | null;
  isActive: boolean;
  version: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
