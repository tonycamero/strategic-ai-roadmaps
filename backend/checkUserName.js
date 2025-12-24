const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { users } = require('./dist/db/schema');
const { eq } = require('drizzle-orm');

async function checkUser() {
  const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_5zJucGskB4QI@ep-lively-paper-a4yb6gco-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });
  
  const db = drizzle(pool);
  
  const result = await pool.query(
    "SELECT id, email, name FROM users WHERE email = $1",
    ['tonycamerobiz+chamber2@gmail.com']
  );
  
  console.log('User data:', JSON.stringify(result.rows[0], null, 2));
  await pool.end();
}

checkUser().catch(console.error);
