import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. Determine which env file to load
// Priority: .env.local > .env
// We assume we are running from 'backend' OR 'backend/dist' OR root.
// We strive to find 'backend/.env'

const findEnv = (): string | null => {
    const candidates = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'backend', '.env'),
        path.resolve(__dirname, '../../.env'), // if running from src/config/env.ts -> src/../.env (backend/.env)
        path.resolve(__dirname, '../../../.env'), // if running from dist/config/env.js
    ];

    for (const c of candidates) {
        if (fs.existsSync(c)) {
            return c;
        }
    }
    return null;
};

const envPath = findEnv();

if (envPath) {
    dotenv.config({ path: envPath });
    console.log(`[ENV] Loaded environment from: ${envPath}`);
} else {
    console.warn('[ENV] WARNING: No .env file found!');
}

export const config = {
    port: process.env.PORT || 3001,
    dbUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development',
};
