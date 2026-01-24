import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Altering executive_briefs status column to varchar(50)...');
    try {
        await db.execute(sql`ALTER TABLE executive_briefs ALTER COLUMN status TYPE varchar(50)`);
        console.log('Successfully altered column type.');
    } catch (error) {
        console.error('Error altering column:', error);
    }
    process.exit(0);
}

main();
