import { db } from '../db';
import { tenants, auditEvents } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AUDIT_EVENT_TYPES } from '../constants/auditEventTypes';

/**
 * INTAKE-LIFECYCLE-TRANSITION-ENGINE
 * Authoritative lifecycle phases for the intake process.
 */
export type IntakePhase = 
    | 'OPEN_INITIAL' 
    | 'CLOSED_V1' 
    | 'REOPEN_EXECUTIVE' 
    | 'CLOSED_V2' 
    | 'REOPEN_OPERATOR' 
    | 'CLOSED_V3';

/**
 * Transition Map (Authoritative)
 * OPEN_INITIAL      → CLOSED_V1  
 * CLOSED_V1        → REOPEN_EXECUTIVE  
 * REOPEN_EXECUTIVE → CLOSED_V2  
 * CLOSED_V2        → REOPEN_OPERATOR  
 * REOPEN_OPERATOR  → CLOSED_V3
 */
const VALID_TRANSITIONS: Record<IntakePhase, IntakePhase[]> = {
    'OPEN_INITIAL': ['CLOSED_V1'],
    'CLOSED_V1': ['REOPEN_EXECUTIVE'],
    'REOPEN_EXECUTIVE': ['CLOSED_V2'],
    'CLOSED_V2': ['REOPEN_OPERATOR'],
    'REOPEN_OPERATOR': ['CLOSED_V3'],
    'CLOSED_V3': []
};

export class IntakeLifecycleService {
    /**
     * transitionIntakePhase
     * Enforces ENUM-backed phase transitions and records audit events.
     */
    static async transitionIntakePhase(
        tenantId: string, 
        nextPhase: IntakePhase, 
        actorId: string, 
        reason?: string
    ) {
        // 1. Fetch current tenant state
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId)
        });

        if (!tenant) {
            throw new Error(`Tenant ${tenantId} not found`);
        }

        // Default to OPEN_INITIAL if no phase is set
        const currentPhase = (tenant.intakePhase || 'OPEN_INITIAL') as IntakePhase;

        // 2. Validate transition
        const allowedTransitions = VALID_TRANSITIONS[currentPhase];
        if (!allowedTransitions.includes(nextPhase)) {
            throw new Error(`Invalid lifecycle transition from ${currentPhase} to ${nextPhase}`);
        }

        // 3. Rule Enforcement: Reopens require a reason
        if ((nextPhase === 'REOPEN_EXECUTIVE' || nextPhase === 'REOPEN_OPERATOR') && !reason) {
            throw new Error(`Reason is required for ${nextPhase} transition`);
        }

        // 4. Prepare mutation
        const updateData: any = {
            intakePhase: nextPhase,
            updatedAt: new Date()
        };

        // Increment version and record metadata on any Reopen
        if (nextPhase === 'REOPEN_EXECUTIVE' || nextPhase === 'REOPEN_OPERATOR') {
            const currentVersion = tenant.intakeVersion ?? 1;
            updateData.intakeVersion = currentVersion + 1;
            updateData.intakeReopenedBy = actorId;
            updateData.intakeReopenReason = reason;
            updateData.intakeReopenedAt = new Date();
        }

        // Initialize version if not set on first close
        if (!tenant.intakeVersion && nextPhase === 'CLOSED_V1') {
            updateData.intakeVersion = 1;
}

        // Record closure date
        if (nextPhase === 'CLOSED_V1' || nextPhase === 'CLOSED_V2' || nextPhase === 'CLOSED_V3') {
            updateData.intakeClosedAt = new Date();
        }

        // 5. Execute Mutation
        await db.update(tenants)
            .set(updateData)
            .where(eq(tenants.id, tenantId));

        // 6. Record Audit Event
        await db.insert(auditEvents).values({
            tenantId,
            actorUserId: actorId,
            eventType: AUDIT_EVENT_TYPES.INTAKE_PHASE_TRANSITION,
            entityType: 'tenant',
            entityId: tenantId,
            metadata: {
                from: currentPhase,
                to: nextPhase,
                version: updateData.intakeVersion || tenant.intakeVersion || 1,
                actor: actorId,
                reason: reason || null
            }
        });

        return {
            success: true,
            tenantId,
            previousPhase: currentPhase,
            currentPhase: nextPhase,
            version: updateData.intakeVersion || tenant.intakeVersion || 1
        };
    }
}
