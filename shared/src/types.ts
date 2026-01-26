import { z } from 'zod';

// ============================================================================
// BUSINESS TYPE
// ============================================================================

export const BusinessType = z.enum(['default', 'chamber', 'manufacturing', 'enterprise']);
export type BusinessType = z.infer<typeof BusinessType>;

// ============================================================================
// USER ROLES
// ============================================================================

export const UserRole = z.enum([
  'owner',
  'ops',
  'sales',
  'delivery',
  'staff',
  'superadmin',
  'exec_sponsor',
  'delegate',
  'operator',
  'agent'
]);
export type UserRole = z.infer<typeof UserRole>;

// ============================================================================
// USER
// ============================================================================

export const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRole,
  name: z.string(),
  createdAt: z.date(),
});

export type User = z.infer<typeof User>;

// ============================================================================
// INVITE
// ============================================================================

export const InviteStatus = z.enum(['pending', 'accepted', 'expired']);
export type InviteStatus = z.infer<typeof InviteStatus>;

export const Invite = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRole,
  token: z.string(),
  ownerId: z.string().uuid(),
  accepted: z.boolean(),
  createdAt: z.date(),
});

export type Invite = z.infer<typeof Invite>;

// ============================================================================
// INTAKE FORMS
// ============================================================================

export const OpsIntakeAnswers = z.object({
  teamSize: z.number().min(1).max(500),
  currentCRM: z.string().optional(),
  projectManagementTool: z.string().optional(),
  biggestBottleneck: z.string().min(10).max(500),
  timeSpentOnCoordination: z.enum(['0-25%', '25-50%', '50-75%', '75-100%']),
  processDocumentation: z.enum(['none', 'partial', 'comprehensive']),
  automationReadiness: z.number().min(1).max(10),
});

export type OpsIntakeAnswers = z.infer<typeof OpsIntakeAnswers>;

export const SalesIntakeAnswers = z.object({
  avgDealsPerMonth: z.number().min(0).max(1000),
  avgDealSize: z.number().min(0),
  proposalCreationTime: z.enum(['< 1 hour', '1-4 hours', '4-8 hours', '> 8 hours']),
  followUpConsistency: z.number().min(1).max(10),
  pipelineVisibility: z.number().min(1).max(10),
  biggestSalesChallenge: z.string().min(10).max(500),
  crmUsage: z.enum(['none', 'basic', 'intermediate', 'advanced']),
});

export type SalesIntakeAnswers = z.infer<typeof SalesIntakeAnswers>;

export const DeliveryIntakeAnswers = z.object({
  avgProjectDuration: z.enum(['< 1 week', '1-4 weeks', '1-3 months', '> 3 months']),
  activeProjects: z.number().min(0).max(500),
  clientSatisfactionScore: z.number().min(1).max(10),
  deliveryConsistency: z.number().min(1).max(10),
  qualityIssueFrequency: z.enum(['never', 'rarely', 'sometimes', 'often']),
  biggestDeliveryChallenge: z.string().min(10).max(500),
  processStandardization: z.number().min(1).max(10),
});

export type DeliveryIntakeAnswers = z.infer<typeof DeliveryIntakeAnswers>;

export const IntakeAnswers = z.union([
  z.object({ role: z.literal('ops'), answers: OpsIntakeAnswers }),
  z.object({ role: z.literal('sales'), answers: SalesIntakeAnswers }),
  z.object({ role: z.literal('delivery'), answers: DeliveryIntakeAnswers }),
]);

export type IntakeAnswers = z.infer<typeof IntakeAnswers>;

export const Intake = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  role: UserRole,
  answers: z.record(z.any()), // JSONB storage
  createdAt: z.date(),
});

export type Intake = z.infer<typeof Intake>;

// ============================================================================
// ROADMAP
// ============================================================================

export const Roadmap = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  pdfUrl: z.string().url().optional(),
  createdAt: z.date(),
});

export type Roadmap = z.infer<typeof Roadmap>;

// ============================================================================
// TENANT
// ============================================================================

export const Tenant = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string(),
  businessType: BusinessType,
  cohortLabel: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  status: z.string(),
  teamHeadcount: z.number().optional().nullable(),
  baselineMonthlyLeads: z.number().optional().nullable(),
  firmSizeTier: z.string().optional().nullable(),
  discoveryComplete: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tenant = z.infer<typeof Tenant>;

// ============================================================================
// API REQUEST / RESPONSE TYPES
// ============================================================================

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginRequest = z.infer<typeof LoginRequest>;

export const RegisterRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  industry: z.string().min(1).max(255),
});

export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const LoginResponse = z.object({
  token: z.string(),
  user: User,
});

export type LoginResponse = z.infer<typeof LoginResponse>;

export const CreateInviteRequest = z.object({
  email: z.string().email(),
  role: UserRole,
});

export type CreateInviteRequest = z.infer<typeof CreateInviteRequest>;

export const AcceptInviteRequest = z.object({
  token: z.string(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export type AcceptInviteRequest = z.infer<typeof AcceptInviteRequest>;

export const SubmitIntakeRequest = z.object({
  role: UserRole,
  answers: z.record(z.any()),
});

export type SubmitIntakeRequest = z.infer<typeof SubmitIntakeRequest>;

// ============================================================================
// TRAINING (SCAFFOLD)
// ============================================================================

export const TrainingModule = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  content: z.string(), // Markdown or HTML
  order: z.number(),
});

export type TrainingModule = z.infer<typeof TrainingModule>;

export const TrainingProgress = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  moduleId: z.string().uuid(),
  completed: z.boolean(),
  completedAt: z.date().optional(),
});

export type TrainingProgress = z.infer<typeof TrainingProgress>;

// ============================================================================
// EXECUTIVE BRIEF
// ============================================================================

export const ExecutiveBriefStatus = z.enum(['DRAFT', 'READY_FOR_EXEC', 'ACKNOWLEDGED', 'WAIVED']);
export type ExecutiveBriefStatus = z.infer<typeof ExecutiveBriefStatus>;

export const ExecutiveBrief = z.object({
  id: z.string().uuid(),
  firmId: z.string().uuid(),
  status: ExecutiveBriefStatus,
  content: z.string(),
  createdBy: z.string().uuid(),
  lastUpdatedBy: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ExecutiveBrief = z.infer<typeof ExecutiveBrief>;
