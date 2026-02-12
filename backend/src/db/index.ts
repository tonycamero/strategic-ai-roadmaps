import '../config/env.ts';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure postgres-js with proper timeouts and connection pooling for Neon
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections in pool
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // 10s connection timeout
  ssl: 'require', // Force SSL for Neon
  prepare: false, // Disable prepared statements for serverless compatibility
});

// SQL logging: enabled in development, disabled in production
const enableSqlLogging = process.env.NODE_ENV === 'development' || process.env.ENABLE_SQL_LOGGING === 'true';

export const db = drizzle(client, {
  schema,
  logger: enableSqlLogging ? {
    logQuery(query, params) {
      console.log("\n========== DRIZZLE SQL ==========");
      console.log(query);
      if (params?.length) {
        console.log("PARAMS:", params);
      }
      console.log("=================================\n");
    },
  } : false,
});
