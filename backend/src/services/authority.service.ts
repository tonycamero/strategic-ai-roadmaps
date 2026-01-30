
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';
import { tenants, intakes, intakeVectors, executiveBriefs, diagnostics, sopTickets, discoveryCallNotes } from '../db/schema';

export enum ExecutionStage {
    EXECUTIVE_BRIEF_GEN = 'EXECUTIVE_BRIEF_GEN',
    DIAGNOSTIC_GEN = 'DIAGNOSTIC_GEN',
    ROADMAP_ASSEMBLE = 'ROADMAP_ASSEMBLE',
}

export interface CanonicalAuthorityResolution {
    authorityBlocked: boolean;
    blockedReason?: string;
    satisfiedRequirements: {
        ownerIntake: boolean;
        stakeholderVectors: number;
        executiveBriefApproved: boolean;
    };
    allowedStages: {
        intake: boolean;
        executiveBrief: boolean;
        diagnostic: boolean;
        discoveryNotes: boolean;
        assistedSynthesis: boolean;
        ticketModeration: boolean;
        roadmapGeneration: boolean;
    };
}

export interface AuthorityGateResult {
    allowed: boolean;
    reasonCode?: string;
    message?: string;
    details?: any;
}

/**
 * AUTHORITY GATE CENTRAL SERVICE
 * 
 * Canonical source of truth for execution readiness.
 * "Artifacts ≠ Authority" - Presence of a record does not imply permission to proceed.
 */
export class AuthorityService {

    /**
     * DESIGNATED CANONICAL AUTHORITY SOURCE: The "Snapshot Readiness" logic.
     * All execution stages (Brief, Diagnostic, Roadmap) depend on this baseline authority.
     */
    static async getSnapshotAuthority(tenantId: string): Promise<AuthorityGateResult> {
        const resolution = await this.resolveCanonicalAuthority(tenantId);
        if (resolution.authorityBlocked) {
            return {
                allowed: false,
                reasonCode: 'AUTHORITY_GATE_BLOCKED',
                message: resolution.blockedReason,
                details: resolution.satisfiedRequirements
            };
        }
        return { allowed: true };
    }

    /**
     * CANONICAL RESOLVER
     * The single source of truth for authority state.
     */
    static async resolveCanonicalAuthority(tenantId: string): Promise<CanonicalAuthorityResolution> {
        // 1. Fetch Stakeholder Vectors
        const [vectorCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(intakeVectors)
            .where(eq(intakeVectors.tenantId, tenantId));
        const totalVectors = Number(vectorCount?.count || 0);

        // 2. Check Owner Intake
        const [ownerIntake] = await db
            .select()
            .from(intakes)
            .where(and(
                eq(intakes.tenantId, tenantId),
                eq(intakes.role, 'owner'),
                eq(intakes.status, 'completed')
            ))
            .limit(1);
        const hasOwnerIntake = !!ownerIntake;

        // 3. Check Executive Brief
        const [brief] = await db
            .select()
            .from(executiveBriefs)
            .where(eq(executiveBriefs.tenantId, tenantId))
            .limit(1);
        const isBriefApproved = brief?.status === 'APPROVED' || brief?.status === 'DELIVERED';

        // 4. Check Tenant Status (Intake Window)
        const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
        if (!tenant) {
            throw new Error('Tenant not found');
        }

        const isAuthorityBlocked = totalVectors === 0 || !hasOwnerIntake;
        const blockedReason = isAuthorityBlocked
            ? 'Strategic Authority Block is incomplete. Required: At least one stakeholder vector AND completed owner intake.'
            : undefined;

        // 5. Stage Maturity logic
        const allowedStages = {
            intake: true, // Always allowed to enter intake
            executiveBrief: !isAuthorityBlocked && tenant.intakeWindowState === 'OPEN',
            diagnostic: !isAuthorityBlocked && tenant.intakeWindowState === 'CLOSED' && isBriefApproved,
            discoveryNotes: false,
            assistedSynthesis: false,
            ticketModeration: false,
            roadmapGeneration: false,
        };

        // 6. Refine stages based on artifacts
        // Diagnostic publishing status
        const [diagnostic] = await db
            .select()
            .from(diagnostics)
            .where(eq(diagnostics.tenantId, tenantId))
            .limit(1);
        const isDiagnosticPublished = diagnostic?.status === 'published';

        // Stage 4: Discovery Notes starts after Diagnostic is Published
        allowedStages.discoveryNotes = isDiagnosticPublished;

        // Stage 5: Assisted Synthesis starts after Discovery Notes exist
        const [discovery] = await db
            .select()
            .from(discoveryCallNotes)
            .where(eq(discoveryCallNotes.tenantId, tenantId))
            .limit(1);
        allowedStages.assistedSynthesis = !!discovery;

        // Stage 6: Ticket Moderation starts after tickets exist
        const tickets = await db.select().from(sopTickets).where(eq(sopTickets.tenantId, tenantId));
        allowedStages.ticketModeration = tickets.length > 0;

        // Stage 7: Roadmap Generation starts after all tickets are moderated
        const pending = tickets.filter(t => t.moderationStatus === 'pending' || t.moderationStatus === 'generated');
        allowedStages.roadmapGeneration = tickets.length > 0 && pending.length === 0;

        return {
            authorityBlocked: isAuthorityBlocked,
            blockedReason,
            satisfiedRequirements: {
                ownerIntake: hasOwnerIntake,
                stakeholderVectors: totalVectors,
                executiveBriefApproved: isBriefApproved,
            },
            allowedStages
        };
    }

    /**
     * Asserts authority for a specific execution stage.
     * Throws an error (to be caught by controller) if authority is invalid.
     */
    static async assertAuthorityForStage(tenantId: string, stage: ExecutionStage): Promise<void> {
        const resolution = await this.resolveCanonicalAuthority(tenantId);

        if (resolution.authorityBlocked) {
            const error = new Error(resolution.blockedReason);
            (error as any).status = 403;
            (error as any).errorCode = 'AUTHORITY_GATE_BLOCKED';
            (error as any).details = resolution.satisfiedRequirements;
            throw error;
        }

        if (stage === ExecutionStage.EXECUTIVE_BRIEF_GEN) {
            if (!resolution.allowedStages.executiveBrief) {
                const error = new Error('Intake window must be OPEN to generate executive brief.');
                (error as any).status = 403;
                (error as any).errorCode = 'INTAKE_WINDOW_CLOSED';
                throw error;
            }
        }

        if (stage === ExecutionStage.DIAGNOSTIC_GEN) {
            if (!resolution.allowedStages.diagnostic) {
                const error = new Error('Diagnostic generation blocked. Requirements: Intake CLOSED and Executive Brief APPROVED/DELIVERED.');
                (error as any).status = 403;
                (error as any).errorCode = 'EXECUTIVE_BRIEF_NOT_APPROVED';
                throw error;
            }
        }

        if (stage === ExecutionStage.ROADMAP_ASSEMBLE) {
            if (!resolution.allowedStages.roadmapGeneration) {
                const error = new Error('Roadmap assembly blocked. Requirements: SOP tickets must be fully moderated.');
                (error as any).status = 403;
                (error as any).errorCode = 'TICKETS_PENDING_MODERATION';
                throw error;
            }
        }
    }
}
