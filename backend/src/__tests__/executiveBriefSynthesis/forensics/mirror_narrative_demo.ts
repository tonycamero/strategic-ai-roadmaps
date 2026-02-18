/**
 * Mirror Narrative Demo Script
 * Demonstrates mirror narrative output for one fixture
 */

// Load env FIRST (before any OpenAI imports)
import { loadBackendEnv } from '../helpers/loadEnv';
loadBackendEnv();

import { readFileSync } from 'fs';
import { join } from 'path';
import { executeSynthesisPipeline } from '../../../services/executiveBriefSynthesis.service';

// Enable mirror narrative
process.env.EXEC_BRIEF_MIRROR_NARRATIVE = 'true';
process.env.EXEC_BRIEF_MODE2_EXPANSION_ENABLED = 'false';

async function demo() {
    const FIXTURES_DIR = join(__dirname, '../../fixtures/executiveBriefSynthesis');
    const fixtureName = 'fixture_typical_valid.json';

    console.log('='.repeat(80));
    console.log('MIRROR NARRATIVE DEMO');
    console.log('='.repeat(80));
    console.log(`Fixture: ${fixtureName}`);
    console.log('');

    try {
        const raw = readFileSync(join(FIXTURES_DIR, fixtureName), 'utf-8');
        const data = JSON.parse(raw);

        const result = await executeSynthesisPipeline(data.vectors);

        console.log('EXECUTIVE SUMMARY:');
        console.log('-'.repeat(80));
        console.log(result.content.executiveSummary);
        console.log('');

        console.log('OPERATING REALITY:');
        console.log('-'.repeat(80));
        result.content.sections.OPERATING_REALITY.forEach((para, idx) => {
            console.log(`[${idx + 1}] ${para}`);
            console.log('');
        });

        console.log('CONSTRAINT LANDSCAPE:');
        console.log('-'.repeat(80));
        result.content.sections.CONSTRAINT_LANDSCAPE.forEach((para, idx) => {
            console.log(`[${idx + 1}] ${para}`);
            console.log('');
        });

        console.log('BLIND SPOT RISKS:');
        console.log('-'.repeat(80));
        result.content.sections.BLIND_SPOT_RISKS.forEach((para, idx) => {
            console.log(`[${idx + 1}] ${para}`);
            console.log('');
        });

        console.log('ALIGNMENT SIGNALS:');
        console.log('-'.repeat(80));
        result.content.sections.ALIGNMENT_SIGNALS.forEach((para, idx) => {
            console.log(`[${idx + 1}] ${para}`);
            console.log('');
        });

        console.log('='.repeat(80));
        console.log('VALIDATION PASSED ✓');
        console.log('='.repeat(80));
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
}

demo();
