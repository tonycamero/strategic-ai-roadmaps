import 'dotenv/config';
import { getArtifactRawText, extractInventoryFromArtifacts } from '../services/diagnosticIngestion.service';
import { Sop01Outputs } from '../services/sop01Engine';

async function runUnitTests() {
    console.log('🧪 Running Unit Tests: Parser & Normalizer (SAR-STAGE6-PARSER-FIX-INV001-REV2)\n');
    let failures = 0;

    const assert = (condition: boolean, message: string) => {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
        } else {
            console.error(`❌ FAIL: ${message}`);
            failures++;
        }
    };

    // --- 1. Normalizer Tests (getArtifactRawText) ---
    console.log('\n--- 1. Normalizer Tests ---');

    // Case A: Direct String
    assert(getArtifactRawText('Hello World').raw === 'Hello World', 'Direct string normalized');

    // Case B: Wrapped in "artifact" (Drizzle row)
    const wrappedArtifact = { id: 'art1', content: 'Wrapped content' };
    assert(getArtifactRawText(wrappedArtifact).raw === 'Wrapped content', 'Simple object normalized');

    // Case C: Nested Wrapper
    const nestedWrapper = { artifact: { content: 'Deep content' } };
    assert(getArtifactRawText(nestedWrapper).raw === 'Deep content', 'Nested (artifact.content) normalized');

    // Case D: Stringified JSON Payload
    const stringifiedJson = {
        payload: JSON.stringify({ markdown: 'JSON content' })
    };
    const resD = getArtifactRawText(stringifiedJson);
    assert(resD.raw === 'JSON content' && resD.source === 'payload.markdown', 'Stringified JSON payload normalized');

    // Case E: Parsed JSON Object
    const parsedJson = {
        payload: { markdown: 'Parsed object content' }
    };
    assert(getArtifactRawText(parsedJson).raw === 'Parsed object content', 'Parsed JSON object normalized');

    // Case F: Empty/Falsey
    assert(getArtifactRawText(null).raw === '', 'Null normalized to empty');
    assert(getArtifactRawText({ content: '' }).raw === '', 'Empty string field normalized to empty');

    // --- 2. Parser Tests (extractInventoryFromArtifacts) ---
    console.log('\n--- 2. Parser Tests ---');

    const mockSop01 = (skeleton: string): Sop01Outputs => ({
        sop01DiagnosticMarkdown: 'diag',
        sop01AiLeverageMarkdown: 'ai',
        sop01DiscoveryQuestionsMarkdown: 'q',
        sop01RoadmapSkeletonMarkdown: skeleton
    });

    // Case G: Bullet Styles (-, *, •)
    const skeletonG = `
- Item 1
* Item 2
• Item 3
    `;
    const invG = extractInventoryFromArtifacts(mockSop01(skeletonG));
    assert(invG.length === 3, 'Extracted 3 items from varied bullets');
    assert(invG[0].titleTemplate === 'Item 1', 'Bullet "-" parsed correctly');
    assert(invG[2].titleTemplate === 'Item 3', 'Bullet "•" parsed correctly');

    // Case H: Numbered List
    const skeletonH = `
1. Step One
2. Step Two
    `;
    const invH = extractInventoryFromArtifacts(mockSop01(skeletonH));
    assert(invH.length === 2 && invH[0].titleTemplate === 'Step One', 'Numbered list parsed correctly');

    // Case I: Nested/Indented Bullets
    const skeletonI = `
- Top Level
  - Nested Level
    - Deep Level
    `;
    const invI = extractInventoryFromArtifacts(mockSop01(skeletonI));
    assert(invI.length === 3, 'Nested/Indented bullets parsed (flattened)');

    // Case J: Legacy Format (**System**: ...)
    const skeletonJ = `
**System**: Legacy System Name
    `;
    const invJ = extractInventoryFromArtifacts(mockSop01(skeletonJ));
    assert(invJ.length === 1 && invJ[0].titleTemplate === 'Legacy System Name', 'Legacy format parsed correctly');

    // Case K: Deduplication & Cleaning
    const skeletonK = `
- Same Item
- same item
-  Same Item  
- !!!
    `;
    const invK = extractInventoryFromArtifacts(mockSop01(skeletonK));
    assert(invK.length === 1, 'Case-insensitive trim deduplication works');
    assert(invK[0].titleTemplate === 'Same Item', 'Leading/trailing whitespace trimmed');
    // The "!!!" should be skipped by the punctuation-only regex

    // Case L: Phase/Sprint Support
    const skeletonL = `
Phase 1: Foundation
- Ticket 1
Phase 2: Build
- Ticket 2
    `;
    const invL = extractInventoryFromArtifacts(mockSop01(skeletonL));
    assert(invL[0].sprint === 30, 'Phase 1 assigned sprint 30');
    assert(invL[1].sprint === 60, 'Phase 2 assigned sprint 60');

    console.log(`\nTests Complete. Failures: ${failures}`);
    if (failures > 0) {
        process.exit(1);
    } else {
        console.log('\n🌟 ALL UNIT TESTS PASSED');
        process.exit(0);
    }
}

runUnitTests().catch(err => {
    console.error('Fatal Test Error:', err);
    process.exit(1);
});
