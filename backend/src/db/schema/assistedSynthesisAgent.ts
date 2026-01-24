import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Assisted Synthesis Agent Sessions
 * 
 * Bounded session storage for Stage 5 interpretive agent.
 * Sessions persist ONLY while Current Facts have pending items.
 * Hard reset when all Current Facts are resolved.
 */
export const assistedSynthesisAgentSessions = pgTable('assisted_synthesis_agent_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: varchar('tenant_id', { length: 255 }).notNull(),
    stage: varchar('stage', { length: 50 }).notNull().default('assisted_synthesis'),
    phase: varchar('phase', { length: 50 }).notNull().default('current_facts'),
    contextVersion: varchar('context_version', { length: 255 }).notNull(), // hash or timestamp of proposals
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
});

/**
 * Assisted Synthesis Agent Messages
 * 
 * Individual chat messages within a bounded session.
 * Cleared when session is reset.
 */
export const assistedSynthesisAgentMessages = pgTable('assisted_synthesis_agent_messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').notNull().references(() => assistedSynthesisAgentSessions.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant'
    content: text('content').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow()
});
