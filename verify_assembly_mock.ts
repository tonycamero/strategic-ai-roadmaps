import { assembleNarrative } from './backend/src/narrative/engine';
import { ConstraintType, FailureModeType } from './backend/src/narrative/taxonomy';

// MOCK PACKET
// Simulating a team with:
// - C1: Enforcement Failure
// - F1: Behavioral Compensation
// - G1: Enforcement Gap (True)
// - G2: Visibility Gap (True)

const mockPacket = {
    teamSessionId: 'MOCK-123',
    derived_constraint: ConstraintType.ENFORCEMENT_FAILURE,
    derived_failureMode: FailureModeType.BEHAVIORAL_COMPENSATION,
    derived_gap_enforcement: true,
    derived_gap_visibility: true
};

console.log("--- MOCK PACKET INPUT ---");
console.log(JSON.stringify(mockPacket, null, 2));

console.log("\n--- ASSEMBLING NARRATIVE ---");
const narrative = assembleNarrative(mockPacket);

console.log("\n[OVERVIEW BLOCK]");
console.log(`HEADLINE: ${narrative.overview.content.headline}`);
console.log(`BODY:     ${narrative.overview.content.body}`);

console.log("\n[DEEP DIVE BLOCKS] (Sequence Check)");
narrative.deepDive.forEach((block, i) => {
    console.log(`\n#${i + 1} [${block.id}]`);
    console.log(`HEADLINE: ${block.content.headline}`);
    console.log(`BODY:     ${block.content.body}`);
    if (block.content.implications) {
        console.log("IMPLICATIONS:");
        block.content.implications.forEach(imp => console.log(`  - ${imp}`));
    }
});

console.log("\n[CLOSING]");
narrative.closing.forEach((block, i) => {
    console.log(`\n#${i + 1} [${block.id}]`);
    console.log(`HEADLINE: ${block.content.headline}`);
});
