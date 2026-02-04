/**
 * Load backend/.env for tests and demos
 * No logging, no side effects beyond env population
 */

import { config } from 'dotenv';
import { join } from 'path';

export function loadBackendEnv(): void {
    // Load from backend/.env
    config({ path: join(process.cwd(), '.env') });
}
