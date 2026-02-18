import { describe, it, expect } from 'vitest';
import { diffMigrations } from '../driftGuard';

describe('DriftGuard Logic', () => {
    const localTags = ['0000', '0001', '0002'];
    const orphanHash = '6cec6782aaf9057166ccb08a58ef9b80d73f31313388e5223707008c0bd35984';

    it('should PASS when DB count equals local count', () => {
        const dbRows = [
            { hash: 'h1' },
            { hash: 'h2' },
            { hash: 'h3' }
        ];
        const diff = diffMigrations(localTags, dbRows);
        expect(diff.verdict).toBe('PASS');
    });

    it('should PASS with allowlisted orphan', () => {
        const dbRows = [
            { hash: orphanHash }, // 1 orphan
            { hash: 'h1' },
            { hash: 'h2' },
            { hash: 'h3' } // + 3 standard = 4 total
        ];
        const diff = diffMigrations(localTags, dbRows);
        expect(diff.verdict).toBe('PASS');
        expect(diff.allowlistedHashes).toContain(orphanHash);
    });

    it('should FAIL when dbCount < localCount (missing migrations)', () => {
        const dbRows = [
            { hash: 'h1' },
            { hash: 'h2' }
        ];
        const diff = diffMigrations(localTags, dbRows);
        expect(diff.verdict).toBe('FAIL');
        expect(diff.missingOnDb).toBe(true);
    });

    it('should FAIL with unknown orphan (extra migrations)', () => {
        const dbRows = [
            { hash: 'unknown-hash' }, // 1 unauth orphan
            { hash: 'h1' },
            { hash: 'h2' },
            { hash: 'h3' } // + 3 standard = 4 total
        ];
        const diff = diffMigrations(localTags, dbRows);
        expect(diff.verdict).toBe('FAIL');
        expect(diff.reason).toContain('unauthorized/extra');
    });
});
