
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { generateStage6TicketsFromInputs } from '../services/diagnosticIngestion.service.ts';
import { extractInventoryFromArtifacts, getArtifactRawText } from '../services/diagnosticIngestion.service.ts';

const CANONICAL_DIR = path.resolve(__dirname, '../../../docs/canonical-runs/northshore-logistics');

async function runReplay() {
    console.log('--- STAGE 6 DETERMINISM REPLAY ---');

    // 1. Load Canonical Data
    const intake = JSON.parse(fs.readFileSync(path.join(CANONICAL_DIR, 'intake.json'), 'utf-8'));
    const artifactsRaw = JSON.parse(fs.readFileSync(path.join(CANONICAL_DIR, 'artifacts.json'), 'utf-8'));
    const canonicalTickets = JSON.parse(fs.readFileSync(path.join(CANONICAL_DIR, 'tickets.json'), 'utf-8'));

    // 2. Prepare Inputs (Mirroring production logic)
    const findByTitle = (title: string) => artifactsRaw.find((a: any) => a.title === title) || artifactsRaw.find((a: any) => a.category === title);

    const docDiag = findByTitle('Company Diagnostic Map');
    const docAi = findByTitle('AI Leverage & Opportunity Map');
    const docSkeleton = findByTitle('Strategic Roadmap Skeleton');
    const docDiscovery = findByTitle('Discovery Call Preparation Questions');
    const docCanonical = findByTitle('Canonical Findings (Operator Reviewed)');

    const diagInfo = getArtifactRawText(docDiag);
    const aiInfo = getArtifactRawText(docAi);
    const skeletonInfo = getArtifactRawText(docSkeleton);
    const discoveryInfo = getArtifactRawText(docDiscovery);
    const canonicalInfo = getArtifactRawText(docCanonical);

    const promptArtifacts = {
        diagnosticMarkdown: diagInfo.raw,
        aiLeverageMarkdown: aiInfo.raw,
        roadmapSkeletonMarkdown: skeletonInfo.raw,
        discoveryQuestionsMarkdown: discoveryInfo.raw,
    };

    const derivedInventory = extractInventoryFromArtifacts({
        sop01DiagnosticMarkdown: diagInfo.raw,
        sop01AiLeverageMarkdown: aiInfo.raw,
        sop01RoadmapSkeletonMarkdown: skeletonInfo.raw,
        sop01DiscoveryQuestionsMarkdown: discoveryInfo.raw,
    });

    // Parse the canonical findings for the prompt input
    let diagnosticMap = intake;
    try {
        const canonicalJson = JSON.parse(canonicalInfo.raw);
        diagnosticMap = canonicalJson;
    } catch (e) {
        console.warn('Could not parse canonical findings JSON, falling back to intake');
    }

    // 3. Execute Replay via First-Class Path
    console.log('Executing generation replay...');
    const resultTickets = await generateStage6TicketsFromInputs(
        intake.id,
        intake, // diagnosticMap uses tenant data in some modes, or we just pass intake
        promptArtifacts,
        derivedInventory
    );

    // 4. Structural Diff Contract
    console.log('\n--- STRUCTURAL DIFF VERIFICATION ---');
    const invariants = ['ticket_count', 'slugs'];
    const failures: string[] = [];

    // Invariant: Count
    if (resultTickets.length !== canonicalTickets.length) {
        failures.push(`COUNT MISMATCH: Expected ${canonicalTickets.length}, got ${resultTickets.length}`);
    }

    // Invariant: Slugs
    const resultSlugs = new Set(resultTickets.map(t => t.slug));

    // For the very first run after slug implementation, canonicalTickets might not have slugs.
    canonicalTickets.forEach((t: any) => {
        if (!t.slug) {
            // MATCH SERVICE LOGIC (v1.0.0): Anchor on inventoryId + category + tier + sprint
            const cat = (t.category || '').toLowerCase().trim();
            const tier = (t.tier || '').toLowerCase().trim();
            const sprint = String(t.sprint || '30');
            const invId = t.inventoryId || t.inventory_id || '';

            const invariantString = `${invId}|${cat}|${tier}|${sprint}`;

            const crypto = require('crypto');
            t.slug = crypto.createHash('sha1').update(invariantString).digest('hex').substring(0, 8);
        }
    });
    const updatedCanonicalSlugs = new Set(canonicalTickets.map(t => t.slug));

    const missingSlugs = Array.from(updatedCanonicalSlugs).filter(s => !resultSlugs.has(s));
    const extraSlugs = Array.from(resultSlugs).filter(s => !updatedCanonicalSlugs.has(s));

    if (missingSlugs.length > 0) {
        failures.push(`MISSING SLUGS: ${missingSlugs.join(', ')}`);
        console.log('\nMissing Slugs Details (Canonical):');
        canonicalTickets.filter(t => missingSlugs.includes(t.slug)).forEach(t => {
            const cat = (t.category || '').toLowerCase().trim();
            const tier = (t.tier || '').toLowerCase().trim();
            const sprint = String(t.sprint || '30');
            const invId = t.inventoryId || t.inventory_id || '';
            const inv = `${invId}|${cat}|${tier}|${sprint}`;
            console.log(`  - [${t.slug}] INV: "${inv}" (Title: ${t.title})`);
        });
    }
    if (extraSlugs.length > 0) {
        failures.push(`EXTRA SLUGS: ${extraSlugs.join(', ')}`);
        console.log('\nExtra Slugs Details (Current Run):');
        resultTickets.filter(t => extraSlugs.includes(t.slug)).forEach(t => {
            const cat = (t.category || '').toLowerCase().trim();
            const tier = (t.tier || '').toLowerCase().trim();
            const sprint = String(t.sprint || '30');
            const invId = t.inventoryId || t.inventory_id || '';
            const inv = `${invId}|${cat}|${tier}|${sprint}`;
            console.log(`  - [${t.slug}] INV: "${inv}" (Title: ${t.title})`);
        });
    }

    if (failures.length === 0) {
        console.log('✓ DETERMINISM CONFIRMED: All structural invariants match.');
    } else {
        console.error('✖ DETERMINISM FAILED:');
        failures.forEach(f => console.error(`  - ${f}`));
        process.exit(1);
    }

    process.exit(0);
}

runReplay().catch(e => {
    console.error('Replay crashed:', e);
    process.exit(1);
});
