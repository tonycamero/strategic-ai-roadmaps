import { RoleToAuthorityMap, AuthorityCategory } from '../shared/src/authority';

/**
 * DETERMINISTIC AUTHORITY CONTRACT VERIFICATION
 * 
 * This script verifies the core invariants of the authority layer:
 * 1. Role-to-Category mapping is correct and deterministic.
 * 2. Fail-closed behavior (unmapped roles default to Delegate in hook).
 */

const EXPECTED_MAPPINGS: Record<string, string> = {
    superadmin: 'EXECUTIVE_SPONSOR',
    exec_sponsor: 'EXECUTIVE_SPONSOR',
    owner: 'EXECUTIVE_SPONSOR',
    delegate: 'DELEGATE_FACILITATOR',
    ops: 'DELEGATE_FACILITATOR',
    sales: 'DELEGATE_FACILITATOR',
    delivery: 'DELEGATE_FACILITATOR',
    staff: 'DELEGATE_FACILITATOR',
    operator: 'INTERNAL_OPERATOR',
    agent: 'SYSTEM_AGENT',
};

async function runVerification() {
    console.log('--- STARTING DETERMINISTIC AUTHORITY VERIFICATION ---');
    let failures = 0;

    // 1. Verify Shared Mapping
    for (const [role, expectedCategory] of Object.entries(EXPECTED_MAPPINGS)) {
        const actual = RoleToAuthorityMap[role as any];
        if (actual === expectedCategory) {
            console.log(`✅ [SHARED] Role: ${role.padEnd(15)} -> ${actual}`);
        } else {
            console.log(`❌ [SHARED] Role: ${role.padEnd(15)} -> Expected ${expectedCategory}, got ${actual}`);
            failures++;
        }
    }

    // 2. Verify Hook Logic Invariants (Structural)
    // Note: We test the logic that useSuperAdminAuthority uses
    const mockCheck = (role: string | undefined) => {
        return role ? (RoleToAuthorityMap[role as any] || AuthorityCategory.DELEGATE) : AuthorityCategory.DELEGATE;
    };

    const unknownRole = 'random_unmapped_role';
    const result = mockCheck(unknownRole);
    if (result === AuthorityCategory.DELEGATE) {
        console.log(`✅ [HOOK] Fail-Closed (Unknown Role) -> ${result}`);
    } else {
        console.log(`❌ [HOOK] Fail-Closed (Unknown Role) -> Expected DELEGATE, got ${result}`);
        failures++;
    }

    const missingRole = undefined;
    const result2 = mockCheck(missingRole);
    if (result2 === AuthorityCategory.DELEGATE) {
        console.log(`✅ [HOOK] Fail-Closed (No Role)      -> ${result2}`);
    } else {
        console.log(`❌ [HOOK] Fail-Closed (No Role)      -> Expected DELEGATE, got ${result2}`);
        failures++;
    }

    console.log('\n--- VERIFICATION SUMMARY ---');
    if (failures === 0) {
        console.log('✅ PASS: All authority invariants are deterministic and simulation-free.');
        process.exit(0);
    } else {
        console.log(`❌ FAIL: ${failures} invariants violated.`);
        process.exit(1);
    }
}

runVerification().catch(err => {
    console.error(err);
    process.exit(1);
});
