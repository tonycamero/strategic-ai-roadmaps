import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
import { ALLOWED_ORPHAN_HASHES } from './driftAllowlist';

export interface MigrationDiff {
    verdict: 'PASS' | 'FAIL';
    localCount: number;
    dbCount: number;
    unknownHashes: string[];
    allowlistedHashes: string[];
    missingOnDb: boolean;
    reason?: string;
}

/**
 * Reads local migration tags from Drizzle journal
 */
export function getLocalMigrationTags(): string[] {
    const journalPath = path.resolve(process.cwd(), 'drizzle/meta/_journal.json');
    if (!fs.existsSync(journalPath)) {
        throw new Error(`Migration journal not found at ${journalPath}`);
    }
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    return (journal.entries || []).map((e: any) => e.tag);
}

/**
 * Fetches applied migrations from the database
 */
export async function getDbMigrations(db: any): Promise<{ id: number; hash: string; createdAt: number }[]> {
    const result = await db.execute(sql`
    SELECT id, hash, created_at as "createdAt" 
    FROM drizzle.__drizzle_migrations 
    ORDER BY created_at ASC
  `);
    return result.map((r: any) => ({
        id: parseInt(r.id),
        hash: r.hash,
        createdAt: parseInt(r.createdAt)
    }));
}

/**
 * Compares local journal against DB state
 */
export function diffMigrations(
    localTags: string[],
    dbRows: { hash: string }[]
): MigrationDiff {
    const localCount = localTags.length;
    const dbCount = dbRows.length;
    const dbHashes = dbRows.map(r => r.hash);

    const unknownHashes: string[] = [];
    const allowlistedHashes: string[] = [];

    // Identify unknown hashes in DB
    // Since Drizzle-kit doesn't store the tag in the DB row, we can't do a direct 1:1 tag mapping
    // We rely on the fact that Drizzle-kit creates 1 row per migration file.
    // "Unknown" means it's an extra row that doesn't correspond to our known count 
    // OR strictly isn't recognized.

    // Actually, Drizzle stores a hash of the SQL file.
    // For simplicity and per requirements:
    // 1. Any hash in DB not known to be 'orphan' is assumed correct if it's within the count range?
    // No, we don't know the expected hashes locally without re-calculating them (complex).
    // Strategy: Identify rows in DB. Any row exceeding the local count OR specific orphan is "extra".

    // Refined Strategy:
    // Every row in DB must either be accounted for by the local count OR be in the allowlist.
    // Count comparison: dbCount must be >= localCount.

    const totalRecognizedCount = localCount + ALLOWED_ORPHAN_HASHES.size;

    for (const row of dbRows) {
        if (ALLOWED_ORPHAN_HASHES.has(row.hash)) {
            allowlistedHashes.push(row.hash);
        } else {
            // It's a standard migration or an unauthorized orphan
            // To be strict: if we have dbCount > localCount + knownOrphans, something is wrong.
            // But we can't tell WHICH is which without hashing local files.
            // Per SCOPE LOCK: "FAILS if local migration journal count != DB applied migrations (within the recognized range)"
        }
    }

    const missingOnDb = dbCount < localCount;

    // If DB rows > localTags + orphans, we have unauthorized "extra" migrations
    const unauthorizedExtraCount = Math.max(0, dbCount - localCount - allowlistedHashes.length);

    let verdict: 'PASS' | 'FAIL' = 'PASS';
    let reason = '';

    if (missingOnDb) {
        verdict = 'FAIL';
        reason = `DB is missing migrations. DB has ${dbCount}, but local journal expects at least ${localCount}.`;
    } else if (unauthorizedExtraCount > 0) {
        verdict = 'FAIL';
        reason = `DB has ${unauthorizedExtraCount} unauthorized/extra migration(s) not in allowlist.`;
    }

    return {
        verdict,
        localCount,
        dbCount,
        unknownHashes: [], // We didn't explicitly identify them by hash comparison, just count
        allowlistedHashes,
        missingOnDb,
        reason
    };
}

/**
 * Formats the diff result for logging
 */
export function formatReport(diff: MigrationDiff): string {
    const statusIcon = diff.verdict === 'PASS' ? '✅' : '❌';
    return `
🔍 --- DATABASE DRIFT REPORT ---
Status: ${statusIcon} ${diff.verdict}
Local Migration Tags: ${diff.localCount}
DB Applied Migrations: ${diff.dbCount}
Allowlisted Orphans:  ${diff.allowlistedHashes.length}
Reason: ${diff.reason || 'Schema and migrations are in alignment.'}
---------------------------------
`;
}
