import 'dotenv/config';
import { db } from '../db';
import { executiveBriefs, intakeVectors, intakes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateExecutiveBriefV0 } from '../controllers/executiveBrief.controller';

const TENANT_ID = 'ec32ea41-d056-462d-8321-c2876c9af263';

async function main() {
    console.log(`Force regenerating executive brief for tenant ${TENANT_ID}...`);

    try {
        // 1. Delete existing brief
        console.log('Step 1: Deleting existing brief...');
        await db.delete(executiveBriefs).where(eq(executiveBriefs.tenantId, TENANT_ID));
        console.log('Brief deleted (if it existed).');

        // 2. Fetch inputs
        console.log('Step 2: Fetching generation inputs...');
        const vectors = await db
            .select()
            .from(intakeVectors)
            .where(eq(intakeVectors.tenantId, TENANT_ID));

        const [ownerIntake] = await db
            .select()
            .from(intakes)
            .where(and(
                eq(intakes.tenantId, TENANT_ID),
                eq(intakes.role, 'owner'),
                eq(intakes.status, 'completed')
            ))
            .limit(1);

        if (!vectors.length || !ownerIntake) {
            console.error('Error: Missing prerequisites. Vectors:', vectors.length, 'OwnerIntake:', !!ownerIntake);
            process.exit(1);
        }

        // 3. Generate synthesis
        console.log('Step 3: generating synthesis with attribution...');
        const synthesis = generateExecutiveBriefV0({
            ownerIntake,
            vectors,
            tenantId: TENANT_ID,
            briefMode: 'EXECUTIVE_SYNTHESIS'
        });

        // 4. Insert new brief
        console.log('Step 4: Inserting new brief...');
        const [newBrief] = await db
            .insert(executiveBriefs)
            .values({
                tenantId: TENANT_ID,
                version: 'v0',
                synthesis: synthesis.synthesis,
                signals: synthesis.signals,
                sources: synthesis.sources,
                status: 'DRAFT',
                briefMode: 'EXECUTIVE_SYNTHESIS'
            })
            .returning();

        console.log('SUCCESS! Regenerated brief ID:', newBrief.id);
        console.log('Constraint Landscape Sample:', synthesis.synthesis.constraintLandscape.substring(0, 100) + '...');

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
        process.exit(1);
    }
    process.exit(0);
}

main();
