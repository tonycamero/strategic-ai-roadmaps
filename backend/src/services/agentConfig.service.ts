/**
 * Agent Configuration Service
 * 
 * CRUD operations for agent configs with role-based access control.
 * - SuperAdmin: can update all fields
 * - Owner: can only update customInstructions
 */

import { db } from '../db/index.ts';
import { agentConfigs } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import type { AgentConfig } from '../types/agent.types';

/**
 * List all agent configs for a tenant
 */
export async function listConfigsForTenant(tenantId: string): Promise<AgentConfig[]> {
  const configs = await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.tenantId, tenantId));

  return configs.map(mapToAgentConfig);
}

/**
 * Get the config for a tenant (single roadmap_coach per tenant)
 */
export async function getConfigForTenant(
  tenantId: string
): Promise<AgentConfig | null> {
  const config = await db.query.agentConfigs.findFirst({
    where: eq(agentConfigs.tenantId, tenantId),
  });

  return config ? mapToAgentConfig(config) : null;
}

/**
 * @deprecated Use getConfigForTenant instead
 * Legacy function for backward compatibility during migration
 */
export async function getConfigForTenantAndRole(
  tenantId: string,
  roleType: string
): Promise<AgentConfig | null> {
  console.warn('[agentConfig] getConfigForTenantAndRole is deprecated, use getConfigForTenant');
  return getConfigForTenant(tenantId);
}

/**
 * Update an agent config with role-based field restrictions
 * 
 * @param id - Config ID
 * @param updates - Partial updates
 * @param userRole - Role of the user making the update (superadmin | owner)
 * @param userId - ID of user making the update
 */
export async function updateConfig(
  id: string,
  updates: Partial<AgentConfig>,
  userRole: string,
  userId: string
): Promise<AgentConfig | null> {
  // Role-based field filtering
  let allowedUpdates: Partial<typeof agentConfigs.$inferInsert> = {};

  if (userRole === 'superadmin') {
    // SuperAdmin can update all fields
    allowedUpdates = {
      systemIdentity: updates.systemIdentity,
      businessContext: updates.businessContext,
      customInstructions: updates.customInstructions,
      rolePlaybook: updates.rolePlaybook,
      toolContext: updates.toolContext,
      isActive: updates.isActive,
      updatedBy: userId,
      updatedAt: new Date(),
    };
  } else if (userRole === 'owner') {
    // Owner can only update customInstructions
    allowedUpdates = {
      customInstructions: updates.customInstructions,
      updatedBy: userId,
      updatedAt: new Date(),
    };
  } else {
    throw new Error('Unauthorized: insufficient permissions to update agent config');
  }

  // Remove undefined values
  Object.keys(allowedUpdates).forEach((key) => {
    if (allowedUpdates[key as keyof typeof allowedUpdates] === undefined) {
      delete allowedUpdates[key as keyof typeof allowedUpdates];
    }
  });

  // Perform update
  const [updated] = await db
    .update(agentConfigs)
    .set(allowedUpdates)
    .where(eq(agentConfigs.id, id))
    .returning();

  return updated ? mapToAgentConfig(updated) : null;
}

/**
 * Map DB row to AgentConfig type
 */
function mapToAgentConfig(row: any): AgentConfig {
  return {
    id: row.id,
    tenantId: row.tenantId,
    agentType: row.agentType,
    systemIdentity: row.systemIdentity,
    businessContext: row.businessContext,
    customInstructions: row.customInstructions,
    rolePlaybook: row.rolePlaybook,
    toolContext: row.toolContext || { tools: [] },
    openaiAssistantId: row.openaiAssistantId,
    openaiVectorStoreId: row.openaiVectorStoreId,
    openaiModel: row.openaiModel,
    lastProvisionedAt: row.lastProvisionedAt?.toISOString(),
    configVersion: row.configVersion,
    instructionsHash: row.instructionsHash,
    isActive: row.isActive,
    version: row.version,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt?.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}
