import {
    assembleRoadmap,
    projectRoadmap,
    AssembleRoadmapInputs,
    RoadmapModel
} from '../../../shared/src/index';

async function verifyRoadmapAssembly() {
    console.log('🔒 Verifying CR-RA-1: Roadmap Assembly & Determinism...\n');

    const firmId = 'test-firm-123';

    // 1. Mock Inputs
    const baseInputs: AssembleRoadmapInputs = {
        firmId,
        version: 'v1.test',
        executiveBrief: {
            id: 'brief-1',
            content: 'Focus on scaling operations without increasing headcount.'
        },
        diagnostics: [
            {
                id: 'diag-1',
                title: 'High Risk Fix',
                priority: 'HIGH',
                riskLevel: 'HIGH',
                moveRationale: 'Fixes immediate leakage.',
                isInternalOnly: true
            },
            {
                id: 'diag-2',
                title: 'Medium Infra',
                priority: 'MEDIUM',
                riskLevel: 'MEDIUM',
                type: 'INFRASTRUCTURE',
                moveRationale: 'Builds foundations.'
            },
            {
                id: 'diag-3',
                title: 'Long Term Bet',
                priority: 'LOW',
                riskLevel: 'LOW',
                moveRationale: 'Next gen capabilities.'
            }
        ],
        intakeMetadata: {
            orgClarityScore: 85,
            executionRiskLevel: 'HIGH',
            constraintConsensusLevel: 'MEDIUM'
        },
        generatedBy: 'admin-1'
    };

    console.log('1. Testing Determinism...');
    const roadmap1 = assembleRoadmap(baseInputs);
    const roadmap2 = assembleRoadmap(baseInputs);

    if (JSON.stringify(roadmap1) === JSON.stringify(roadmap2)) {
        console.log('✅ SUCCESS: Same inputs produced identical RoadmapModel.');
    } else {
        throw new Error('❌ FAIL: Compiler is non-deterministic!');
    }

    console.log('\n2. Testing Priority Arbitration & Horizon Mapping...');

    // Check horizons
    const integritySection = roadmap1.sections.find(s => s.id === 'operational-integrity');
    const infraSection = roadmap1.sections.find(s => s.id === 'operational-infrastructure');
    const strategicSection = roadmap1.sections.find(s => s.id === 'strategic-capabilities');

    if (integritySection?.items.find(i => i.title === 'High Risk Fix')) {
        console.log('✅ SUCCESS: HIGH priority mapped to 30-day Integrity section.');
    } else {
        console.error('Integrity Items:', integritySection?.items);
        throw new Error('❌ FAIL: Incorrect horizon mapping for HIGH priority.');
    }

    if (infraSection?.items.find(i => i.title === 'Medium Infra')) {
        console.log('✅ SUCCESS: INFRASTRUCTURE type mapped to 90-day Infrastructure section.');
    }

    console.log('\n3. Testing Projection & Redaction...');

    const execView = projectRoadmap(roadmap1, 'EXECUTIVE');
    const delegateView = projectRoadmap(roadmap1, 'DELEGATE');

    const internalItem = execView.sections
        .find(s => s.id === 'operational-integrity')
        ?.items.find(i => i.isInternalOnly);

    const redactedItem = delegateView.sections
        .find(s => s.id === 'operational-integrity')
        ?.items.find(i => i.isInternalOnly);

    if (internalItem && !redactedItem) {
        console.log('✅ SUCCESS: Internal-only item redacted from Delegate view.');
    } else {
        throw new Error('❌ FAIL: Internal-only item leaked to Delegate view!');
    }

    console.log('\n4. Testing Section Immutability (Ordering)...');
    const sectionIds = roadmap1.sections.map(s => s.id);
    const expectedIds = ['executive-logic', 'operational-integrity', 'operational-infrastructure', 'strategic-capabilities', 'risk-watchpoints'];

    // Filter expected by what was actually produced (since some might be empty)
    const filteredExpected = expectedIds.filter(id => sectionIds.includes(id as any));

    if (JSON.stringify(sectionIds) === JSON.stringify(filteredExpected)) {
        console.log('✅ SUCCESS: Sections adhere to contract ordering.');
    } else {
        throw new Error(`❌ FAIL: Invalid section ordering: ${sectionIds.join(', ')}`);
    }

    console.log('\n✅ ALL VERIFICATIONS PASSED.');
}

verifyRoadmapAssembly().catch(err => {
    console.error(err);
    process.exit(1);
});
