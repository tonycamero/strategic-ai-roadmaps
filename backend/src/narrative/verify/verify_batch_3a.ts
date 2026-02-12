import { assembleNarrative } from '../engine.ts';
import { ConstraintType, FailureModeType, TimingType, SeverityType, OutcomeType } from '../taxonomy.ts';

// MOCK PACKET
const mockPacket = {
    teamSessionId: 'GATE-1-TEST',
    derived_constraint: ConstraintType.ENFORCEMENT_FAILURE,
    derived_failureMode: FailureModeType.STRUCTURAL_DEBT,
    derived_gap_enforcement: true,
    derived_gap_visibility: true,
    derived_timing: TimingType.NOW,
    derived_severity: SeverityType.HIGH,
    derived_outcome: OutcomeType.REVENUE_LEAK
};

console.log("--- GATE 1 VERIFICATION (Integration Phase 4) ---");
const narrative = assembleNarrative(mockPacket);

console.log("ASSEMBLED SEQUENCE:", narrative.selectedIds.join(" -> "));

// ASSERT ORDER (Based on selectedIds)
const expectedOrderPrefixes = [
    'S1',   // Overview
    'C',    // Constraint
    'F',    // Failure
    'G',    // Gap (Enforcement)
    'G',    // Gap (Visibility)
    'T',    // Timing
    'SEV',  // Severity
    'R'     // Outcome
];

console.log("\n[ASSERTION: ORDER]");
let cursor = 0;
for (const prefix of expectedOrderPrefixes) {
    const foundIndex = narrative.selectedIds.slice(cursor).findIndex(id => id.startsWith(prefix));
    if (foundIndex === -1) {
        console.error(`❌ FAILURE: Expected block starting with '${prefix}' after index ${cursor}.`);
        process.exit(1);
    }
    const actualIndex = cursor + foundIndex;
    console.log(`✅ Found '${prefix}' at index ${actualIndex} (${narrative.selectedIds[actualIndex]})`);
    cursor = actualIndex + 1;
}

// ASSERT SINGLETONS
if (narrative.timing.id !== 'T1_NOW') { console.error("❌ FAILURE: Wrong Timing Block"); process.exit(1); }
if (narrative.severity.id !== 'SEV_HIGH') { console.error("❌ FAILURE: Wrong Severity Block"); process.exit(1); }
if (narrative.outcome.id !== 'R1_RevenueLeak') { console.error("❌ FAILURE: Wrong Outcome Block"); process.exit(1); }

console.log("✅ All Gate 1 assertions passed.");
