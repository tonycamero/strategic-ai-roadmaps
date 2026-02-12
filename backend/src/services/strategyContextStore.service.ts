/**
 * StrategyContext Store Service
 * 
 * Persistence helper for storing and retrieving StrategyContext.
 * Used for debugging, auditing, and observability.
 */

import { db } from '../db/index.ts';
import { agentStrategyContexts } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import type { StrategyContext } from '../types/strategyContext';

/**
 * Save StrategyContext to database (upsert)
 */
export async function saveStrategyContext(
  context: StrategyContext,
): Promise<void> {
  await db
    .insert(agentStrategyContexts)
    .values({
      tenantId: context.tenantId,
      context: context as any, // JSONB column
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: agentStrategyContexts.tenantId,
      set: {
        context: context as any,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get StrategyContext from database
 */
export async function getStrategyContext(
  tenantId: string,
): Promise<StrategyContext | null> {
  const rows = await db
    .select()
    .from(agentStrategyContexts)
    .where(eq(agentStrategyContexts.tenantId, tenantId))
    .limit(1);

  if (!rows[0]) return null;
  return rows[0].context as StrategyContext;
}

/**
 * Delete StrategyContext (for cleanup)
 */
export async function deleteStrategyContext(
  tenantId: string,
): Promise<void> {
  await db
    .delete(agentStrategyContexts)
    .where(eq(agentStrategyContexts.tenantId, tenantId));
}
