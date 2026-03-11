import { db } from '../db/index';
import { sql } from 'drizzle-orm';

export interface OpsParticipant {
    id: string;
    tenant_id: string;
    name: string;
    email: string;
    department: string;
    role_label: string;
    created_at: Date;
}

export interface OpsSignalEntry {
    id: string;
    tenant_id: string;
    participant_id: string;
    signal_type: string;
    signal_data: any;
    created_at: Date;
}

/**
 * Service for handling Ops Team Signals
 * 
 * STRICT: This service uses raw SQL to interact with ops_signal tables 
 * because the schema is frozen and cannot be modified to include them in Drizzle.
 */
export const createOrFetchParticipant = async (data: {
    name: string;
    email: string;
    department: string;
    roleLabel: string;
    tenantId: string;
}) => {
    // 1. Check if participant already exists for this tenant
    const existingResult = await db.execute(sql`
        SELECT * FROM ops_signal_participants 
        WHERE email = ${data.email} AND tenant_id = ${data.tenantId}
        LIMIT 1
    `);

    if (existingResult.length > 0) {
        return existingResult[0] as unknown as OpsParticipant;
    }

    // 2. Create new participant
    const insertResult = await db.execute(sql`
        INSERT INTO ops_signal_participants (id, tenant_id, name, email, department, role_label)
        VALUES (gen_random_uuid(), ${data.tenantId}, ${data.name}, ${data.email}, ${data.department}, ${data.roleLabel})
        RETURNING *
    `);

    return insertResult[0] as unknown as OpsParticipant;
};

export const createSignalEntry = async (data: {
    tenantId: string;
    participantId: string;
    signalType: string;
    signalData: any;
}) => {
    // Security: Validate participant belongs to tenant
    const participantCheck = await db.execute(sql`
        SELECT tenant_id FROM ops_signal_participants 
        WHERE id = ${data.participantId}
        LIMIT 1
    `);

    if (participantCheck.length === 0) {
        throw new Error('Participant not found');
    }

    if (participantCheck[0].tenant_id !== data.tenantId) {
        throw new Error('Security violation: Participant tenant mismatch');
    }

    // Insert entry
    const insertResult = await db.execute(sql`
        INSERT INTO ops_signal_entries (id, tenant_id, participant_id, signal_type, signal_data)
        VALUES (gen_random_uuid(), ${data.tenantId}, ${data.participantId}, ${data.signalType}, ${JSON.stringify(data.signalData)})
        RETURNING *
    `);

    return insertResult[0] as unknown as OpsSignalEntry;
};
