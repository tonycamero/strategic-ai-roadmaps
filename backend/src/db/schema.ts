import { pgTable, uuid, varchar, timestamp, boolean, json, jsonb, serial, text, integer, date, unique, index, uniqueIndex } from 'drizzle-orm/pg-core';
import type { UserRole } from '@roadmap/shared';

// ============================================================================
// TENANTS TABLE (moved before users to resolve circular reference)
// ============================================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUserId: uuid('owner_user_id').unique(),
  name: varchar('name', { length: 255 }).notNull(),
  cohortLabel: varchar('cohort_label', { length: 50 }),
  segment: varchar('segment', { length: 255 }),
  region: varchar('region', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('prospect'), // prospect | active | paused | churned
  businessType: text('business_type').notNull().default('default'), // default | chamber
  teamHeadcount: integer('team_headcount').default(5),
  baselineMonthlyLeads: integer('baseline_monthly_leads').default(40),
  firmSizeTier: varchar('firm_size_tier', { length: 20 }).default('small'), // micro | small | mid | large
  discoveryComplete: boolean('discovery_complete').notNull().default(false),
  lastDiagnosticId: varchar('last_diagnostic_id', { length: 255 }),
  intakeWindowState: varchar('intake_window_state', { length: 20 }).notNull().default('OPEN'), // OPEN | CLOSED
  intakeSnapshotId: varchar('intake_snapshot_id', { length: 255 }),
  intakeClosedAt: timestamp('intake_closed_at', { withTimezone: true }),

  // META-TICKET v2: Intake Lock (Gate 1)
  intakeLockedAt: timestamp('intake_locked_at', { withTimezone: true }),
  intakeLockedByUserId: uuid('intake_locked_by_user_id').references(() => users.id),

  notes: text('notes'),





  readinessNotes: text('readiness_notes'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),

  // Readiness signals
  slug: varchar('slug', { length: 255 }),
  domain: varchar('domain', { length: 255 }),
  discoveryAcknowledgedAt: timestamp('discovery_acknowledged_at', { withTimezone: true }),
  knowledgeBaseReadyAt: timestamp('knowledge_base_ready_at', { withTimezone: true }),
  rolesValidatedAt: timestamp('roles_validated_at', { withTimezone: true }),
  execReadyAt: timestamp('exec_ready_at', { withTimezone: true }),
});

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).$type<UserRole>().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  resetToken: varchar('reset_token', { length: 255 }).unique(),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// INVITES TABLE
// ============================================================================

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  accepted: boolean('accepted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// INTAKES TABLE
// ============================================================================

export const intakes = pgTable('intakes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(),
  answers: json('answers').notNull(), // JSONB storage
  coachingFeedback: json('coaching_feedback').default({}), // questionKey -> { comment, isFlagged }
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('in_progress'), // in_progress | completed
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// INTAKE VECTORS (Stakeholder role definitions for perception/reality synthesis)
// ============================================================================

export const intakeVectors = pgTable('intake_vectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  // Role Definition
  roleLabel: varchar('role_label', { length: 255 }).notNull(), // e.g., "Manufacturing Facilitator"
  roleType: varchar('role_type', { length: 50 }).notNull(), // FACILITATOR | OPERATIONAL_LEAD | EXECUTIVE | OTHER

  // Perception vs Reality Synthesis (Executive Brief fields)
  perceivedConstraints: text('perceived_constraints').notNull(),
  anticipatedBlindSpots: text('anticipated_blind_spots'),

  // Recipient Information
  recipientEmail: varchar('recipient_email', { length: 255 }),
  recipientName: varchar('recipient_name', { length: 255 }),

  // Status Tracking
  inviteStatus: varchar('invite_status', { length: 20 }).notNull().default('NOT_SENT'), // NOT_SENT | SENT | FAILED
  intakeId: uuid('intake_id').references(() => intakes.id, { onDelete: 'set null' }), // Link to completed intake

  // Backfill / Provenance Metadata
  metadata: json('metadata').$type<{
    sourceTag?: 'LEGACY_INTAKE' | 'OWNER_INTAKE' | 'DOC_EXTRACT' | 'MANUAL';
    confidence?: number;
  }>().default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// FIRM BASELINE INTAKE (Owner-provided starting state)
// ============================================================================

export const firmBaselineIntake = pgTable('firm_baseline_intake', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),

  // Baseline Metrics
  monthlyLeadVolume: integer('monthly_lead_volume'),
  avgResponseTimeMinutes: integer('avg_response_time_minutes'),
  closeRatePercent: integer('close_rate_percent'),
  avgJobValue: integer('avg_job_value'),
  currentTools: jsonb('current_tools').notNull().default([]),
  salesRepsCount: integer('sales_reps_count'),
  opsAdminCount: integer('ops_admin_count'),
  primaryBottleneck: text('primary_bottleneck'),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('DRAFT'), // DRAFT | COMPLETE

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('idx_firm_baseline_intake_tenant_id').on(table.tenantId),
}));



// ============================================================================
// EXECUTIVE BRIEFS TABLE (v0)
// ============================================================================

export const executiveBriefs = pgTable('executive_briefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  version: varchar('version', { length: 10 }).notNull().default('v0'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),

  // Synthesis sections (stored as JSONB)
  synthesis: jsonb('synthesis').notNull().$type<import('../types/executiveBrief').ExecutiveBriefSynthesis>(),

  // Signals (stored as JSONB)
  signals: jsonb('signals').notNull().$type<{
    constraintConsensusLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    executionRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    orgClarityScore: number; // 0-100
  }>(),

  // Sources (stored as JSONB)
  sources: jsonb('sources').notNull().$type<{
    snapshotId: string | null;
    intakeVectorIds: string[];
  }>(),

  // Authority
  status: varchar('status', { length: 20 }).notNull().default('DRAFT'), // DRAFT | GENERATED | REVIEWED
  approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

  // Mode Selector (DIAGNOSTIC_RAW vs EXECUTIVE_SYNTHESIS)
  briefMode: varchar('brief_mode', { length: 30 }).notNull().default('EXECUTIVE_SYNTHESIS'),

  // Metadata for tracking regens/actions
  metadata: jsonb('metadata').$type<{
    regenBy?: string;
    regenAt?: string;
    regenReason?: string;
  }>().default({}),
}, (table) => ({
  // Unique constraint: one brief per tenant (for now, can be extended for versioning)
  uniqueTenantVersion: unique().on(table.tenantId, table.version),
  tenantIdIdx: index('executive_briefs_tenant_id_idx').on(table.tenantId),
}));

// ============================================================================
// EXECUTIVE BRIEF ARTIFACTS TABLE
// ============================================================================

export const executiveBriefArtifacts = pgTable('executive_brief_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  executiveBriefId: uuid('executive_brief_id').notNull().references(() => executiveBriefs.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  artifactType: varchar('artifact_type', { length: 50 }).notNull(), // 'PRIVATE_LEADERSHIP_PDF'
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(), // Local path or S3 path
  fileSize: integer('file_size').notNull(), // Bytes
  checksum: text('checksum').notNull(), // SHA-256 hash

  isImmutable: boolean('is_immutable').notNull().default(true),

  // Metadata (delivery tracking, etc.)
  metadata: jsonb('metadata').$type<{
    emailedTo?: string;
    emailedAt?: string;
    deliveryStatus?: 'pending' | 'sent' | 'failed';
    retryCount?: number;
  }>(),

  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  briefIdIdx: index('executive_brief_artifacts_brief_id_idx').on(table.executiveBriefId),
  tenantIdIdx: index('executive_brief_artifacts_tenant_id_idx').on(table.tenantId),
  // UNIQUE: One artifact per (brief, type) - enforces immutability
  uniqueBriefType: unique('executive_brief_artifacts_brief_type_unique')
    .on(table.executiveBriefId, table.artifactType),
}));

// ============================================================================
// ROADMAPS TABLE
// ============================================================================

export const roadmaps = pgTable('roadmaps', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 30 }).notNull().default('draft'), // locked | generated | delivered
  version: varchar('version', { length: 50 }).notNull().default('v1.0'),
  modelJson: jsonb('model_json').notNull(), // RoadmapModel
  snapshotId: uuid('snapshot_id').references(() => implementationSnapshots.id, { onDelete: 'set null' }),
  sourceRefs: jsonb('source_refs').notNull(), // { briefId, diagnosticIds }
  pdfUrl: varchar('pdf_url', { length: 500 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// TRAINING MODULES TABLE (SCAFFOLD)
// ============================================================================

export const trainingModules = pgTable('training_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }).notNull(),
  content: varchar('content', { length: 10000 }).notNull(), // Markdown or HTML
  order: serial('order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// TRAINING PROGRESS TABLE (SCAFFOLD)
// ============================================================================

export const trainingProgress = pgTable('training_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => trainingModules.id, { onDelete: 'cascade' }),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});


// ============================================================================
// TENANT METRICS (daily rollups for SA dashboard)
// ============================================================================

export const tenantMetricsDaily = pgTable('tenant_metrics_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  metricDate: date('metric_date').notNull(),
  intakeStartedCount: integer('intake_started_count').notNull().default(0),
  intakeCompletedCount: integer('intake_completed_count').notNull().default(0),
  roadmapCreatedCount: integer('roadmap_created_count').notNull().default(0),
  roadmapDeliveredCount: integer('roadmap_delivered_count').notNull().default(0),
  pilotOpenCount: integer('pilot_open_count').notNull().default(0),
  pilotWonCount: integer('pilot_won_count').notNull().default(0),
  lastActivityAt: timestamp('last_activity_at'),
  metricsJson: json('metrics_json').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// AUDIT EVENTS (system + SA actions)
// ============================================================================

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  actorRole: varchar('actor_role', { length: 20 }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  metadata: json('metadata').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// FEATURE FLAGS (global definitions)
// ============================================================================

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  description: text('description'),
  defaultEnabled: boolean('default_enabled').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// TENANT FEATURE FLAGS (overrides)
// ============================================================================

export const tenantFeatureFlags = pgTable('tenant_feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  featureFlagId: uuid('feature_flag_id').notNull().references(() => featureFlags.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// IMPERSONATION SESSIONS (Phase 2)
// ============================================================================

export const impersonationSessions = pgTable('impersonation_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  superAdminId: uuid('super_admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
  reason: text('reason'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});



// ============================================================================
// WEBINAR REGISTRATIONS (Webinar participant registrations)
// ============================================================================

export const webinarRegistrations = pgTable('webinar_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  teamSize: integer('team_size').notNull(),
  currentCrm: varchar('current_crm', { length: 255 }).notNull(),
  bottleneck: text('bottleneck').notNull(),
  source: varchar('source', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending | reviewed | contacted | converted | rejected
  notes: text('notes'),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// WEBINAR SETTINGS (Password management for webinar access)
// ============================================================================

export const webinarSettings = pgTable('webinar_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  passwordHash: text('password_hash').notNull(),
  passwordVersion: integer('password_version').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// TENANT DOCUMENTS (SOP outputs, roadmaps, reports)
// ============================================================================

export const tenantDocuments = pgTable('tenant_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),

  // File metadata
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  content: text('content'),
  storageProvider: varchar('storage_provider', { length: 50 }),

  // Extended metadata for SOPs and Roadmaps
  section: text('section'),
  sopNumber: text('sop_number'),
  outputNumber: text('output_number'),

  // Document classification
  category: varchar('category', { length: 50 }).notNull(), // 'sop_output', 'roadmap', 'report', 'other'
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Access control
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  isPublic: boolean('is_public').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    tenantDocSopIdx: uniqueIndex('tenant_doc_sop_idx').on(table.tenantId, table.category, table.sopNumber, table.outputNumber),
  };
});

// ============================================================================
// AGENT CONFIGS (Multi-field prompt composition per firm + role)
// ============================================================================

export const agentConfigs = pgTable('agent_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  agentType: text('agent_type').notNull().default('roadmap_coach'), // 'roadmap_coach' | 'exec_overview' (future)

  systemIdentity: text('system_identity').notNull(),
  businessContext: text('business_context'),          // auto-generated
  customInstructions: text('custom_instructions'),    // owner-editable
  rolePlaybook: text('role_playbook').notNull(),      // Tony's IP

  toolContext: json('tool_context').$type<{ tools: { key: string; enabled: boolean; verifiedCompute?: boolean }[] }>().default({ tools: [] }),

  // Roadmap metadata (extracted from roadmap sections)
  roadmapMetadata: json('roadmap_metadata').$type<{
    top_pain_points?: string[];
    primary_goals?: string[];
    systems_recommended?: string[];
    timeline?: {
      '30'?: string[];
      '60'?: string[];
      '90'?: string[];
    };
  }>().default({}),

  // OpenAI Assistant provisioning
  openaiAssistantId: varchar('openai_assistant_id', { length: 128 }),
  openaiVectorStoreId: varchar('openai_vector_store_id', { length: 128 }),
  openaiModel: varchar('openai_model', { length: 64 }).default('gpt-4-1106-preview'),
  lastProvisionedAt: timestamp('last_provisioned_at'),

  // Prompt versioning and tracking
  configVersion: integer('config_version').notNull().default(1),
  instructionsHash: text('instructions_hash'),

  isActive: boolean('is_active').notNull().default(true),
  version: integer('version').notNull().default(1),

  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),

  // Align with temp_controller expectations
  lastUpdatedBy: uuid('last_updated_by').references(() => users.id),
});

// ============================================================================
// AGENT THREADS (Conversation management per user + role)
// ============================================================================

export const agentThreads = pgTable('agent_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  agentConfigId: uuid('agent_config_id').notNull().references(() => agentConfigs.id, { onDelete: 'cascade' }),
  roleType: varchar('role_type', { length: 32 }).notNull(),
  openaiThreadId: varchar('openai_thread_id', { length: 128 }).notNull(),
  actorUserId: uuid('actor_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorRole: varchar('actor_role', { length: 32 }).notNull(), // 'owner' | 'team' | 'superadmin'
  visibility: varchar('visibility', { length: 32 }).notNull().default('owner'), // 'owner' | 'superadmin_only' | 'shared'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),
});

// ============================================================================
// AGENT STRATEGY CONTEXTS (Runtime StrategyContext for v2 architecture)
// ============================================================================

export const agentStrategyContexts = pgTable('agent_strategy_contexts', {
  tenantId: uuid('tenant_id').primaryKey().references(() => tenants.id, { onDelete: 'cascade' }),
  context: json('context').$type<{
    tenantId: string;
    personaRole: string;
    roadmapSignals: {
      pains: string[];
      leveragePoints: string[];
      workflowGaps: string[];
      quickWins: string[];
    };
    tacticalFrame: {
      primaryConstraint: string | null;
      leveragePlay: string | null;
      recommendedMicroSteps: string[];
      systemInFocus: string | null;
    };
    objectives: string[];
  }>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// TENANT VECTOR STORES (V2 architecture: per-tenant vector stores)
// ============================================================================

export const tenantVectorStores = pgTable('tenant_vector_stores', {
  tenantId: uuid('tenant_id').primaryKey().references(() => tenants.id, { onDelete: 'cascade' }),
  vectorStoreId: varchar('vector_store_id', { length: 128 }).notNull(),
  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});



export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;

export type Intake = typeof intakes.$inferSelect;
export type NewIntake = typeof intakes.$inferInsert;

export type IntakeVector = typeof intakeVectors.$inferSelect;
export type NewIntakeVector = typeof intakeVectors.$inferInsert;


export type Roadmap = typeof roadmaps.$inferSelect;
export type NewRoadmap = typeof roadmaps.$inferInsert;

export type TrainingModule = typeof trainingModules.$inferSelect;
export type NewTrainingModule = typeof trainingModules.$inferInsert;

export type TrainingProgress = typeof trainingProgress.$inferSelect;
export type NewTrainingProgress = typeof trainingProgress.$inferInsert;

export type WebinarRegistration = typeof webinarRegistrations.$inferSelect;
export type NewWebinarRegistration = typeof webinarRegistrations.$inferInsert;

export type WebinarSettings = typeof webinarSettings.$inferSelect;
export type NewWebinarSettings = typeof webinarSettings.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type TenantMetricsDaily = typeof tenantMetricsDaily.$inferSelect;
export type NewTenantMetricsDaily = typeof tenantMetricsDaily.$inferInsert;

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;

export type TenantFeatureFlag = typeof tenantFeatureFlags.$inferSelect;
export type NewTenantFeatureFlag = typeof tenantFeatureFlags.$inferInsert;

export type ImpersonationSession = typeof impersonationSessions.$inferSelect;
export type NewImpersonationSession = typeof impersonationSessions.$inferInsert;



export type TenantDocument = typeof tenantDocuments.$inferSelect;
export type NewTenantDocument = typeof tenantDocuments.$inferInsert;

export type AgentConfig = typeof agentConfigs.$inferSelect;
export type NewAgentConfig = typeof agentConfigs.$inferInsert;

export type AgentThread = typeof agentThreads.$inferSelect;
export type NewAgentThread = typeof agentThreads.$inferInsert;

export type AgentStrategyContext = typeof agentStrategyContexts.$inferSelect;
export type NewAgentStrategyContext = typeof agentStrategyContexts.$inferInsert;

export type TenantVectorStore = typeof tenantVectorStores.$inferSelect;
export type NewTenantVectorStore = typeof tenantVectorStores.$inferInsert;

// ============================================================================
// AGENT MESSAGES (Conversation persistence)
// ============================================================================

export const agentMessages = pgTable('agent_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentThreadId: uuid('agent_thread_id').notNull().references(() => agentThreads.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant'
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// AGENT LOGS (Event logging)
// ============================================================================

export const agentLogs = pgTable('agent_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentConfigId: uuid('agent_config_id').references(() => agentConfigs.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  interactionMode: text('interaction_mode'),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// AGENT ROUTING RULES (Pattern-based routing)
// ============================================================================

export const agentRoutingRules = pgTable('agent_routing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  pattern: text('pattern').notNull(),
  routeTo: varchar('route_to', { length: 32 }).notNull(), // 'owner' | 'ops' | 'tc' | 'agent_support'
  priority: integer('priority').default(10),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AgentMessage = typeof agentMessages.$inferSelect;
export type NewAgentMessage = typeof agentMessages.$inferInsert;

export type AgentLog = typeof agentLogs.$inferSelect;
export type NewAgentLog = typeof agentLogs.$inferInsert;

export type AgentRoutingRule = typeof agentRoutingRules.$inferSelect;
export type NewAgentRoutingRule = typeof agentRoutingRules.$inferInsert;

// ============================================================================
// ROADMAP SECTIONS (Structured roadmap content with status tracking)
// ============================================================================

export const roadmapSections = pgTable('roadmap_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  roadmapId: uuid('roadmap_id').notNull().references(() => roadmaps.id, { onDelete: 'cascade' }),
  sectionNumber: integer('section_number').notNull(),
  sectionName: varchar('section_name', { length: 50 }).notNull(),
  contentMarkdown: text('content_markdown').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('planned'),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }),
  agentCheatsheet: json('agent_cheatsheet').$type<{
    section_role?: string;
    important_facts?: string[];
    key_decisions?: string[];
    expected_actions?: string[];
    connections?: string;
  }>().default({}),
  wordCount: integer('word_count'),
  diagrams: json('diagrams').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// SOP TICKETS (Structured SOP-01 output for ticket generation)
// ============================================================================

export const sopTickets = pgTable('sop_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  diagnosticId: varchar('diagnostic_id', { length: 255 }).references(() => diagnostics.id, { onDelete: 'cascade' }),
  ticketId: varchar('ticket_id', { length: 50 }).notNull(), // e.g., "S3-T1"
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }),
  tier: varchar('tier', { length: 50 }),
  valueCategory: varchar('value_category', { length: 100 }),
  owner: varchar('owner', { length: 100 }),
  priority: varchar('priority', { length: 50 }),
  sprint: integer('sprint').default(1),
  timeEstimateHours: integer('time_estimate_hours').default(0),
  costEstimate: integer('cost_estimate').default(0),
  projectedHoursSavedWeekly: integer('projected_hours_saved_weekly').default(0),
  projectedLeadsRecoveredMonthly: integer('projected_leads_recovered_monthly').default(0),
  approved: boolean('approved').default(false),
  adminNotes: text('admin_notes'),
  ticketType: varchar('ticket_type', { length: 50 }),
  roadmapSection: text('roadmap_section'),
  inventoryId: text('inventory_id'),
  isSidecar: boolean('is_sidecar').default(false),
  painSource: text('pain_source'),
  currentState: text('current_state'),
  targetState: text('target_state'),
  aiDesign: text('ai_design'),
  ghlImplementation: text('ghl_implementation'),
  implementationSteps: json('implementation_steps'),
  dependencies: json('dependencies').$type<string[]>(),
  moderationStatus: varchar('moderation_status', { length: 30 }).default('pending'),
  status: varchar('status', { length: 20 }).notNull().default('generated'), // generated|pending|approved|rejected|locked
  successMetric: text('success_metric'),
  roiNotes: text('roi_notes'),
  moderatedAt: timestamp('moderated_at', { withTimezone: true }),
  moderatedBy: uuid('moderated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// TICKET PACKS (Firm-specific ticket organization)
// ============================================================================

export const ticketPacks = pgTable('ticket_packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  roadmapId: uuid('roadmap_id').references(() => roadmaps.id, { onDelete: 'set null' }),

  version: varchar('version', { length: 20 }).notNull().default('v1.0'),
  status: varchar('status', { length: 20 }).notNull().default('not_started'), // not_started | in_progress | completed

  totalTickets: integer('total_tickets').notNull().default(0),
  totalSprints: integer('total_sprints').notNull().default(0),

  sprintAssignments: json('sprint_assignments').$type<{
    sprint_number: number;
    name?: string;
    ticket_instances: string[];
    planned_start?: string;
    planned_end?: string;
  }[]>().notNull().default([]),

  totals: json('totals').$type<{
    tickets?: number;
    done?: number;
    in_progress?: number;
    blocked?: number;
    not_started?: number;
  }>().notNull().default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// TICKET INSTANCES (Per-firm ticket state tracking)
// ============================================================================

export const ticketInstances = pgTable('ticket_instances', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketPackId: uuid('ticket_pack_id').notNull().references(() => ticketPacks.id, { onDelete: 'cascade' }),

  ticketId: varchar('ticket_id', { length: 50 }).notNull(), // e.g. "S3-T1"
  sectionNumber: integer('section_number'), // Links to roadmap_sections.sectionNumber (0-8)

  status: varchar('status', { length: 20 }).notNull().default('not_started'), // not_started | in_progress | blocked | done | skipped
  assignee: varchar('assignee', { length: 255 }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// IMPLEMENTATION SNAPSHOTS (Metrics capture for learning loop)
// ============================================================================

export const implementationSnapshots = pgTable('implementation_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  roadmapId: uuid('roadmap_id').references(() => roadmaps.id, { onDelete: 'set null' }),

  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  label: varchar('label', { length: 20 }).notNull(), // baseline | 30d | 60d | 90d | custom
  source: varchar('source', { length: 20 }).notNull(), // manual | ghl_export | api

  metrics: json('metrics').$type<{
    lead_response_minutes?: number;
    lead_to_appt_rate?: number;
    close_rate?: number;
    crm_adoption_rate?: number;
    weekly_ops_hours?: number;
    nps?: number;
  }>().notNull().default({}),

  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// ROADMAP OUTCOMES (Realized results and ROI)
// ============================================================================

export const roadmapOutcomes = pgTable('roadmap_outcomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  roadmapId: uuid('roadmap_id').notNull().references(() => roadmaps.id, { onDelete: 'cascade' }),

  baselineSnapshotId: uuid('baseline_snapshot_id').references(() => implementationSnapshots.id, { onDelete: 'set null' }),
  at30dSnapshotId: uuid('at_30d_snapshot_id').references(() => implementationSnapshots.id, { onDelete: 'set null' }),
  at60dSnapshotId: uuid('at_60d_snapshot_id').references(() => implementationSnapshots.id, { onDelete: 'set null' }),
  at90dSnapshotId: uuid('at_90d_snapshot_id').references(() => implementationSnapshots.id, { onDelete: 'set null' }),

  deltas: json('deltas').$type<{
    lead_response_minutes?: number;
    lead_to_appt_rate?: number;
    crm_adoption_rate?: number;
    weekly_ops_hours?: number;
    nps?: number;
  }>().notNull().default({}),

  realizedRoi: json('realized_roi').$type<{
    time_savings_hours_annual?: number;
    time_savings_value_annual?: number;
    revenue_impact_annual?: number;
    cost_avoidance_annual?: number;
    net_roi_percent?: number;
  }>(),

  status: varchar('status', { length: 20 }).notNull().default('on_track'),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// DISCOVERY CALL NOTES (SOP-02 prerequisite for roadmap generation)
// ============================================================================

// ============================================================================
// INTAKE CLARIFICATIONS (Consultant -> Stakeholder Pipeline)
// ============================================================================

export const intakeClarifications = pgTable('intake_clarifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  intakeId: uuid('intake_id').notNull().references(() => intakes.id, { onDelete: 'cascade' }),
  questionId: varchar('question_id', { length: 255 }).notNull(),

  originalResponse: text('original_response').notNull(),
  clarificationPrompt: text('clarification_prompt').notNull(),
  clarificationResponse: text('clarification_response'),

  status: varchar('status', { length: 20 }).notNull().default('requested'), // requested | responded
  token: varchar('token', { length: 255 }).notNull().unique(),

  blocking: boolean('blocking').notNull().default(false),

  // Email delivery tracking
  emailStatus: varchar('email_status', { length: 20 }).notNull().default('NOT_SENT'), // NOT_SENT | SENT | FAILED
  emailError: text('email_error'),
  lastEmailAttemptAt: timestamp('last_email_attempt_at', { withTimezone: true }),

  requestedByUserId: uuid('requested_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type IntakeClarification = typeof intakeClarifications.$inferSelect;
export type NewIntakeClarification = typeof intakeClarifications.$inferInsert;

export const discoveryCallNotes = pgTable('discovery_call_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft | ingested
  notes: text('notes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type RoadmapSection = typeof roadmapSections.$inferSelect;
export type NewRoadmapSection = typeof roadmapSections.$inferInsert;

export type TicketPack = typeof ticketPacks.$inferSelect;
export type NewTicketPack = typeof ticketPacks.$inferInsert;

export type TicketInstance = typeof ticketInstances.$inferSelect;
export type NewTicketInstance = typeof ticketInstances.$inferInsert;

export type ImplementationSnapshot = typeof implementationSnapshots.$inferSelect;
export type NewImplementationSnapshot = typeof implementationSnapshots.$inferInsert;

export type RoadmapOutcome = typeof roadmapOutcomes.$inferSelect;
export type NewRoadmapOutcome = typeof roadmapOutcomes.$inferInsert;

export type DiscoveryCallNote = typeof discoveryCallNotes.$inferSelect;
export type NewDiscoveryCallNote = typeof discoveryCallNotes.$inferInsert;

// ============================================================================
// PUBLIC AGENT SESSIONS (Anonymous homepage PulseAgent sessions)
// ============================================================================

export const publicAgentSessions = pgTable('public_agent_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 128 }).notNull().unique(),
  openaiThreadId: varchar('openai_thread_id', { length: 128 }),
  pageContext: json('page_context').$type<{
    entryPage?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  }>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// PUBLIC AGENT EVENTS (Analytics for homepage PulseAgent interactions)
// ============================================================================

export const publicAgentEvents = pgTable('public_agent_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 128 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  message: text('message'),
  metadata: json('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PublicAgentSession = typeof publicAgentSessions.$inferSelect;
export type NewPublicAgentSession = typeof publicAgentSessions.$inferInsert;

export type PublicAgentEvent = typeof publicAgentEvents.$inferSelect;
export type NewPublicAgentEvent = typeof publicAgentEvents.$inferInsert;



// ============================================================================
// DIAGNOSTIC SNAPSHOTS
// ============================================================================

export const diagnosticSnapshots = pgTable('diagnostic_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  email: varchar('email', { length: 255 }),
  orgName: varchar('org_name', { length: 255 }),
  // Allow multiple snapshots per session (history), but maybe index for lookup
  teamSessionId: varchar('team_session_id', { length: 255 }).notNull(),
  payload: json('payload').notNull(),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DiagnosticSnapshot = typeof diagnosticSnapshots.$inferSelect;
export type NewDiagnosticSnapshot = typeof diagnosticSnapshots.$inferInsert;

// ============================================================================
// DIAGNOSTICS (System of Record for SOP-01)
// ============================================================================

export const diagnostics = pgTable('diagnostics', {
  id: varchar('id', { length: 255 }).primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  sopVersion: varchar('sop_version', { length: 20 }).notNull().default('SOP-01'),
  status: varchar('status', { length: 20 }).notNull().default('generated'), // not_generated | generated | locked | published

  // Artifacts (Storing simplified payloads for easy UI rendering)
  overview: json('overview').$type<Record<string, any>>().notNull(),
  aiOpportunities: json('ai_opportunities').$type<Record<string, any>>().notNull(),
  roadmapSkeleton: json('roadmap_skeleton').$type<Record<string, any>>().notNull(),
  discoveryQuestions: json('discovery_questions').$type<Record<string, any>>().notNull(),

  // Metadata
  generatedByUserId: uuid('generated_by_user_id').references(() => users.id),
  approvedByUserId: uuid('approved_by_user_id').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Diagnostic = typeof diagnostics.$inferSelect;
export type NewDiagnostic = typeof diagnostics.$inferInsert;

// ============================================================================
// EVIDENCE ARTIFACTS (Real Systemic Evidence)
// ============================================================================

export const evidenceArtifacts = pgTable('evidence_artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: varchar('kind', { length: 50 }).notNull().default('image'), // image | pdf_excerpt | text_excerpt
  storageProvider: varchar('storage_provider', { length: 50 }).notNull(), // vercel_blob | local | s3
  storageKey: text('storage_key').notNull(),
  publicUrl: text('public_url'),
  mimeType: varchar('mime_type', { length: 100 }),
  bytes: integer('bytes'),
  width: integer('width'),
  height: integer('height'),
  caption: text('caption'),
  source: varchar('source', { length: 100 }), // manual_upload
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const evidenceBindings = pgTable('evidence_bindings', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamSessionId: varchar('team_session_id', { length: 128 }).notNull(), // FE Token or Team ID
  role: varchar('role', { length: 50 }).notNull(),
  slotKey: varchar('slot_key', { length: 100 }).notNull(),
  artifactId: uuid('artifact_id').notNull().references(() => evidenceArtifacts.id, { onDelete: 'cascade' }),
  strength: integer('strength').default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EvidenceArtifact = typeof evidenceArtifacts.$inferSelect;
export type NewEvidenceArtifact = typeof evidenceArtifacts.$inferInsert;

export type EvidenceBinding = typeof evidenceBindings.$inferSelect;
export type NewEvidenceBinding = typeof evidenceBindings.$inferInsert;



// ============================================================================
// ONBOARDING STATES TABLE
// ============================================================================

export const onboardingStates = pgTable('onboarding_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  step: varchar('step', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('not_started'),
  metadata: json('metadata').default({}),
  completedAt: timestamp('completed_at'),
  percentComplete: integer('percent_complete').default(0),
  totalPoints: integer('total_points').default(0),
  maxPoints: integer('max_points').default(0),
  steps: json('steps').default([]),
  badges: json('badges').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type SopTicket = typeof sopTickets.$inferSelect;
export type NewSopTicket = typeof sopTickets.$inferInsert;

export type ExecutiveBrief = typeof executiveBriefs.$inferSelect;
export type NewExecutiveBrief = typeof executiveBriefs.$inferInsert;

export type FirmBaselineIntake = typeof firmBaselineIntake.$inferSelect;
export type NewFirmBaselineIntake = typeof firmBaselineIntake.$inferInsert;

// ============================================================================
// ASSISTED SYNTHESIS AGENT SESSIONS (Stage 5 only - bounded persistence)
// ============================================================================

/**
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

export type AssistedSynthesisAgentSession = typeof assistedSynthesisAgentSessions.$inferSelect;
export type NewAssistedSynthesisAgentSession = typeof assistedSynthesisAgentSessions.$inferInsert;

export type AssistedSynthesisAgentMessage = typeof assistedSynthesisAgentMessages.$inferSelect;
export type NewAssistedSynthesisAgentMessage = typeof assistedSynthesisAgentMessages.$inferInsert;

// ============================================================================
// TICKET MODERATION PIPELINE (Stage 6)
// ============================================================================

export const ticketModerationSessions = pgTable('ticket_moderation_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  sourceDocId: uuid('source_doc_id').notNull().references(() => tenantDocuments.id),
  sourceDocVersion: varchar('source_doc_version', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('active'), // active|complete|archived
  startedBy: uuid('started_by').references(() => users.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ticketsDraft = pgTable('tickets_draft', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  moderationSessionId: uuid('moderation_session_id').notNull().references(() => ticketModerationSessions.id, { onDelete: 'cascade' }),
  findingId: varchar('finding_id', { length: 255 }).notNull(),
  findingType: varchar('finding_type', { length: 100 }).notNull(),
  ticketType: varchar('ticket_type', { length: 100 }).notNull(), // Diagnostic|Optimization|ConstraintCheck|CapabilityBuild
  title: text('title').notNull(),
  description: text('description').notNull(),
  evidenceRefs: jsonb('evidence_refs'),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending|accepted|rejected

  // ==========================================================================
  // STAGE 6: ENRICHED TICKET FIELDS (Parity with sop_tickets/legacy gen)
  // ==========================================================================
  category: varchar('category', { length: 100 }),
  tier: varchar('tier', { length: 50 }),
  ghlImplementation: text('ghl_implementation'),
  implementationSteps: json('implementation_steps'),
  successMetric: text('success_metric'),
  roiNotes: text('roi_notes'),
  timeEstimateHours: integer('time_estimate_hours').default(0),
  sprint: integer('sprint').default(30),
  painSource: text('pain_source'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    moderationSessionFindingIdx: uniqueIndex('moderation_session_finding_idx').on(table.moderationSessionId, table.findingId),
  }
});

export type TicketModerationSession = typeof ticketModerationSessions.$inferSelect;
export type NewTicketModerationSession = typeof ticketModerationSessions.$inferInsert;

export type TicketDraft = typeof ticketsDraft.$inferSelect;
export type NewTicketDraft = typeof ticketsDraft.$inferInsert;
