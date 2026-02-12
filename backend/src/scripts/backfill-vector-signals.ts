import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, like, isNull, or, sql } from 'drizzle-orm';
import * as schema from '../db/schema.ts';

/**
 * Backfill Script: SA-IV-RETROFIT-BACKFILL-1
 * 
 * Retrofits legacy intake/stakeholder data into Intake Vector Contract fields
 * so Executive Brief v0 can synthesize without placeholders.
 */

const KEYWORDS_CONSTRAINTS = ['constraint', 'challenge', 'obstacle', 'blocker', 'frustration', 'barrier'];

async function runBackfill() {
    console.log('Starting Intake Vector Backfill...');

    // Initialize DB connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const client = postgres(connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        ssl: 'require',
        prepare: false,
    });

    const db = drizzle(client, { schema });

    // 0. Ensure schema exists (Surgical DDL)
    try {
        await db.execute(sql`
            ALTER TABLE intake_vectors 
            ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'
        `);
        console.log('Verified metadata column exists.');
    } catch (e) {
        console.error('Failed to add metadata column:', e);
    }

    // 1. Fetch vectors that need backfilling (null or 'Migrated...')
    const vectors = await db
        .select()
        .from(schema.intakeVectors)
        .where(or(
            isNull(schema.intakeVectors.perceivedConstraints),
            like(schema.intakeVectors.perceivedConstraints, '%Migrated%'),
            like(schema.intakeVectors.perceivedConstraints, '%Not captured%')
        ));

    console.log(`Found ${vectors.length} vectors to process.`);

    let updatedCount = 0;
    const perTenantStats: Record<string, { total: number, backfilled: number, purged: number }> = {};

    for (const vector of vectors) {
        let recoveredConstraints = '';
        let recoveredBlindSpots = '';
        let sourceTag: 'LEGACY_INTAKE' | 'OWNER_INTAKE' | 'DOC_EXTRACT' | 'MANUAL' | null = null;
        let confidence = 0;

        // Strategy A: Check Linked Intake
        if (vector.intakeId) {
            const [intake] = await db
                .select()
                .from(schema.intakes)
                .where(eq(schema.intakes.id, vector.intakeId))
                .limit(1);

            if (intake && intake.answers) {
                const answers = intake.answers as Record<string, any>;

                // Extract Constraints
                const constraints = [
                    answers['BIGGEST_FRUSTRATION'],
                    answers['OBSTACLES'],
                    answers['CHALLENGES'],
                    answers['TOP_PAIN_POINTS']
                ].filter(Boolean).join('; ');

                if (constraints.length > 10) {
                    recoveredConstraints = constraints;
                    sourceTag = intake.role === 'owner' ? 'OWNER_INTAKE' : 'LEGACY_INTAKE';
                    confidence = 90;
                }
            }
        }

        // Strategy B: Check Tenant Documents (if A failed)
        if (!recoveredConstraints) {
            const docs = await db
                .select()
                .from(schema.tenantDocuments)
                .where(eq(schema.tenantDocuments.tenantId, vector.tenantId));

            for (const doc of docs) {
                if (!doc.content) continue;

                // Simple keyword extraction (naive)
                const lower = doc.content.toLowerCase();
                const constraintMatch = KEYWORDS_CONSTRAINTS.some(k => lower.includes(k));

                if (constraintMatch) {
                    // Strict backfill: If no structured answer, do not invent.
                    continue;
                }
            }
        }

        if (!recoveredConstraints) {
            // No signal found. We must clear the placeholder.
            recoveredConstraints = '';
            sourceTag = 'MANUAL';
            confidence = 0;
            // Also enforce blindspots to empty if they were migrated placeholders
            if (vector.anticipatedBlindSpots && (vector.anticipatedBlindSpots.includes('Migrated') || vector.anticipatedBlindSpots.includes('Not captured'))) {
                recoveredBlindSpots = '';
            }
        } else {
            // If we recovered constraints, we leave blind spots alone UNLESS they are specifically legacy
            if (vector.anticipatedBlindSpots && (vector.anticipatedBlindSpots.includes('Migrated') || vector.anticipatedBlindSpots.includes('Not captured'))) {
                recoveredBlindSpots = '';
            } else {
                recoveredBlindSpots = vector.anticipatedBlindSpots || '';
            }
        }

        // Apply Updates
        await db.update(schema.intakeVectors)
            .set({
                perceivedConstraints: recoveredConstraints,
                anticipatedBlindSpots: recoveredBlindSpots,
                metadata: {
                    sourceTag: sourceTag || 'MANUAL',
                    confidence: confidence,
                    backfilledAt: new Date().toISOString()
                }
            })
            .where(eq(schema.intakeVectors.id, vector.id));

        updatedCount++;

        // Stats
        if (!perTenantStats[vector.tenantId]) {
            perTenantStats[vector.tenantId] = { total: 0, backfilled: 0, purged: 0 };
        }
        perTenantStats[vector.tenantId].total++;
        if (confidence > 0) perTenantStats[vector.tenantId].backfilled++;
        else perTenantStats[vector.tenantId].purged++;

        console.log(`Updated Vector ${vector.id} (Tenant: ${vector.tenantId}): Source=${sourceTag}, Confidence=${confidence}`);
    }

    console.log('\n=== BACKFILL COMPLETE ===');
    console.log(`Total Vectors Processed: ${updatedCount}`);
    console.log('\n--- Per-Tenant Summary ---');
    console.table(Object.entries(perTenantStats).map(([tenantId, stats]) => ({
        Tenant: tenantId,
        Total_Vectors: stats.total,
        Recovered: stats.backfilled,
        Purged_Empty: stats.purged
    })));

    await client.end();
}

runBackfill().catch(console.error);
