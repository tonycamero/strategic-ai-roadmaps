require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function verify() {
    try {
        const checks = [
            { name: 'webinar_settings table', query: sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webinar_settings')` },
            { name: 'webinar_registrations table', query: sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webinar_registrations')` },
            { name: 'users.reset_token column', query: sql`SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reset_token')` },
            { name: 'users.tenant_id nullable', query: sql`SELECT is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tenant_id'` },
        ];

        console.log('--- Migration Verification ---');
        for (const check of checks) {
            const result = await check.query;
            let status = '❌';
            if (result.length > 0) {
                if (result[0].exists === true || result[0].is_nullable === 'YES' || result[0].exists === 'YES') {
                    status = '✅';
                }
            }
            console.log(`${status} ${check.name}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await sql.end();
    }
}

verify();
