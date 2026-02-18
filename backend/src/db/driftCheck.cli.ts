import { db } from './index';
import { getLocalMigrationTags, getDbMigrations, diffMigrations, formatReport } from './driftGuard';

async function main() {
    console.log('📡 Running Database Drift Parity Check...');

    try {
        const localTags = getLocalMigrationTags();
        const dbRows = await getDbMigrations(db);

        const diff = diffMigrations(localTags, dbRows);
        console.log(formatReport(diff));

        if (diff.verdict === 'FAIL') {
            console.error('❌ DRIFT DETECTED: Migration state mismatch.');
            process.exit(1);
        }

        console.log('✅ PASS: Database is synchronized with local migrations.');
        process.exit(0);
    } catch (err) {
        console.error('💥 FATAL ERROR during drift check:', err);
        process.exit(1);
    }
}

main();
