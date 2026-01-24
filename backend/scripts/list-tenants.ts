import 'dotenv/config';
import { db } from '../src/db/index.js';
import { tenants } from '../src/db/schema.js';



async function listTenants() {
    try {
        const result = await db.select().from(tenants);
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listTenants();
