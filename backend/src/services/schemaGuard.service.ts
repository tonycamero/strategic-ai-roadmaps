import { db } from '../db';
import { sql } from 'drizzle-orm';

let isBriefModeColumnPresent: boolean | null = null;
let lastCheckError: string | null = null;

/**
 * Checks if executive_briefs.brief_mode exists in the database.
 * Results are cached for performance.
 */
export async function validateBriefModeSchema(): Promise<{ valid: boolean; error: string | null }> {
    if (isBriefModeColumnPresent === true) {
        return { valid: true, error: null };
    }

    try {
        // Check for the existence of the column in information_schema
        // We use a raw query and check the returned rows
        const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'executive_briefs' 
      AND column_name = 'brief_mode'
    `);

        if (columns.length > 0) {
            isBriefModeColumnPresent = true;
            lastCheckError = null;
            return { valid: true, error: null };
        }

        const mismatchMsg = 'SCHEMA_MISMATCH: missing executive_briefs.brief_mode';
        console.warn(mismatchMsg + ' - Run migrations to fix.');
        isBriefModeColumnPresent = false;
        lastCheckError = 'missing column executive_briefs.brief_mode';
        return { valid: false, error: lastCheckError };
    } catch (err) {
        console.error('[SchemaGuard] Unexpected check failure:', err);
        // Don't cache transient DB failures
        return { valid: false, error: err instanceof Error ? err.message : String(err) };
    }
}

/**
 * Reset the cache (useful for testing or after a migration is run)
 */
export function resetSchemaGuardCache() {
    isBriefModeColumnPresent = null;
    lastCheckError = null;
}
