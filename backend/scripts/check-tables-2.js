require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
async function check() {
    const r1 = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_requests')`;
    const r2 = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'webinar_registrations')`;
    console.log('lead_requests:', r1[0].exists);
    console.log('webinar_registrations:', r2[0].exists);
    await sql.end();
}
check();
