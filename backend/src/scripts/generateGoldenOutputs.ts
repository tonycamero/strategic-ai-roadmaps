/**
 * Golden Output Generator
 * Run this script to generate golden fixture outputs for determinism testing
 * 
 * Usage: tsx src/scripts/generateGoldenOutputs.ts
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { executeSynthesisPipeline, SynthesisError } from '../services/executiveBriefSynthesis.service';

const FIXTURES_DIR = join(__dirname, '../__tests__/fixtures/executiveBriefSynthesis');
const GOLDEN_DIR = join(FIXTURES_DIR, 'golden');

// Ensure golden directory exists
try {
    mkdirSync(GOLDEN_DIR, { recursive: true });
} catch (err) {
    // Directory may already exist
}

// ONLY process fixtures explicitly marked as valid
const VALID_FIXTURES = [
    'fixture_minimal_valid.json',
    'fixture_typical_valid.json',
    'fixture_high_variance_valid.json'
];

let failureCount = 0;
let successCount = 0;

async function main() {
    // Generate golden outputs
    for (const fixtureName of VALID_FIXTURES) {
        console.log(`\n📋 Processing: ${fixtureName}`);

        try {
            // Load fixture
            const fixturePath = join(FIXTURES_DIR, fixtureName);
            const fixtureData = JSON.parse(readFileSync(fixturePath, 'utf-8'));

            // Run synthesis pipeline
            const result = await executeSynthesisPipeline(fixtureData.vectors);

            // Write golden output
            const goldenName = fixtureName.replace('.json', '.ExecutiveBriefSynthesis.json');
            const goldenPath = join(GOLDEN_DIR, goldenName);
            writeFileSync(goldenPath, JSON.stringify(result, null, 2), 'utf-8');

            console.log(`✅ Generated: ${goldenName}`);
            console.log(`   - Assertions: ${result.executiveAssertionBlock.length}`);
            console.log(`   - Top Risks: ${result.topRisks.length}`);
            console.log(`   - Leverage Moves: ${result.leverageMoves.length}`);
            successCount++;
        } catch (error) {
            failureCount++;

            if (error instanceof SynthesisError) {
                console.error(`❌ SYNTHESIS ERROR for ${fixtureName}:`);
                console.error(`   Stage: ${error.stage}`);
                console.error(`   Code: ${error.code}`);
                console.error(`   Message: ${error.message}`);
                if (error.details) {
                    console.error(`   Details:`, error.details);
                }
            } else {
                console.error(`❌ UNEXPECTED ERROR for ${fixtureName}:`, error);
            }
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Golden Output Generation Complete`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Success: ${successCount}/${VALID_FIXTURES.length}`);
    console.log(`❌ Failures: ${failureCount}/${VALID_FIXTURES.length}`);

    if (failureCount > 0) {
        console.error(`\n⚠️  ${failureCount} valid fixture(s) failed to generate golden outputs!`);
        console.error(`This indicates a contract violation or synthesis pipeline issue.`);
        process.exit(1);
    }

    console.log(`\n✅ All valid fixtures generated successfully!`);
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error in generator:', err);
    process.exit(1);
});
