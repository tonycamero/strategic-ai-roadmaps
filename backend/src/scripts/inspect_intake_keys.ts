import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function dumpIntakeKeys() {
    const sql = postgres(process.env.DATABASE_URL!);

    console.log('\n🔍 DUMPING INTAKE ANSWER KEYS\n');

    const intakes = await sql`
        SELECT role, answers
        FROM intakes
        WHERE status = 'completed'
        LIMIT 5
    `;

    for (const intake of intakes) {
        console.log(`Role: ${intake.role}`);
        console.log(`Keys: ${Object.keys(intake.answers).join(', ')}`);
        console.log('-'.repeat(40));
    }

    await sql.end();
}

dumpIntakeKeys().catch(console.error);
