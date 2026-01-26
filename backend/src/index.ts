import { config } from './config/env';
import { app } from './app';

const PORT = process.env.PORT || 3001;

// Only start server if not running in Netlify or Vercel serverless environment
const isNetlify = !!process.env.NETLIFY;
const isVercel = process.env.VERCEL === '1';

if (!isNetlify && !isVercel) {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Environment: ${config.nodeEnv}`);

    // PHASE 2: DB FINGERPRINT
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');

      const dbUrl = config.dbUrl || '';
      const maskedHost = dbUrl.split('@')[1]?.split('/')[0]?.slice(-15) || 'unknown';
      const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'unknown';

      console.log(`\n🔍 --- DB CONNECTION FINGERPRINT ---`);
      console.log(`📡 Host Mask: ...${maskedHost}`);
      console.log(`🗄️  DB Name:   ${dbName}`);

      const result = await db.execute(sql`
            SELECT 
                current_database() as db,
                current_user as user,
                version() as version,
                inet_server_addr()::text as ip
        `);

      const fp = result[0];
      console.log(`🆔 Identity:  ${fp.user}@${fp.db}`);
      console.log(`📍 Server IP: ${fp.ip || 'managed-cloud'}`);
      console.log(`📦 Version:   ${fp.version}`);
      console.log(`-----------------------------------\n`);

    } catch (err) {
      console.error('❌ DB CONNECTION FAILED DURING STARTUP:', err);
    }
  });
}

// Export for Vercel serverless
export default app;
