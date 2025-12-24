import 'dotenv/config';
import {
    FETA_REGISTRY,
    isValidRole,
    getNextStep,
    computeTeamSynthesis,
    getTeamTemplate
} from '@roadmap/shared';

console.log('Registry loaded:', !!FETA_REGISTRY);
console.log('isValidRole(owner):', isValidRole('owner'));

const mockTeamData: any = {
    teamSessionId: 'test',
    roleAnswers: {
        owner: { Q1: 'A1_FU', Q2: 'A2_MAN', Q3: 'A3_NONE' },
        sales: { Q1: 'S1_FOLLOWUP', Q2: 'S2_MANUAL', Q3: 'S3_FOUNDER' },
        ops: { Q1: 'O1_HANDOFFS', Q2: 'O2_MANUAL', Q3: 'O3_FIRE' },
        delivery: { Q1: 'D1_HANDOFF', Q2: 'D2_CONTEXT', Q3: 'D3_TEAM' }
    },
    roleEvidence: {}
};

const taxonomies: any = {
    owner: FETA_REGISTRY.owner.taxonomy,
    sales: FETA_REGISTRY.sales.taxonomy,
    ops: FETA_REGISTRY.ops.taxonomy,
    delivery: FETA_REGISTRY.delivery.taxonomy
};

try {
    const result = computeTeamSynthesis(mockTeamData, taxonomies);
    console.log('Synthesis successful:', result.team.headline);
} catch (e: any) {
    console.error('Synthesis failed:', e.message);
}
