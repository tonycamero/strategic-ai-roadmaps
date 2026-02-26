import { getTenantLifecycleView } from "./tenantStateAggregation.service";

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
 * Rebound to PROJECTION SPINE (EXEC-11A).
 * This service is now a thin adapter to getTenantLifecycleView.
 */
export class AuthorityService {

    /**
     * DESIGNATED CANONICAL AUTHORITY SOURCE: The "Snapshot Readiness" logic.
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
     * Rebound to Projection Spine (TenantLifecycleView).
     */
    static async resolveCanonicalAuthority(
        tenantId: string
    ): Promise<CanonicalAuthorityResolution> {
        const view = await getTenantLifecycleView(tenantId);

        const isIntakeComplete = view.workflow.intakesComplete;
        const isBriefApproved =
            view.governance.executiveBriefStatus === 'APPROVED' ||
            view.governance.executiveBriefStatus === 'DELIVERED';

        const isAuthorityBlocked = !isIntakeComplete;
        const blockedReason = isAuthorityBlocked
            ? 'Strategic Authority Block incomplete. Required: stakeholder vectors and completed owner intake.'
            : undefined;

        const allowedStages = {
            intake: true,
            executiveBrief: isIntakeComplete,
            diagnostic: view.derived.canGenerateDiagnostic,
            discoveryNotes: view.artifacts.hasDiagnostic,
            assistedSynthesis: view.workflow.discoveryComplete,
            ticketModeration: view.workflow.sop01Complete, // Authority previously checked tickets.length > 0
            roadmapGeneration: view.derived.canAssembleRoadmap,
        };

        return {
            authorityBlocked: isAuthorityBlocked,
            blockedReason,
            satisfiedRequirements: {
                ownerIntake: view.workflow.rolesCompleted.includes('owner'),
                stakeholderVectors: view.workflow.rolesCompleted.length,
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
