require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

async function checkTable() {
    try {
        const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'webinar_settings'
      );
    `;
        console.log('Table webinar_settings exists:', result[0].exists);
    } catch (error) {
        console.error('Error checking table:', error.message);
    } finally {
        await sql.end();
    }
}

checkTable();
