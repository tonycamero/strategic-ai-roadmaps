/**
 * FETA Role Registry
 * Central registry for all role-specific taxonomies and synthesis
 */

import { OWNER_TAXONOMY } from './taxonomy.owner';
import { SALES_TAXONOMY } from './taxonomy.sales';
import { OPS_TAXONOMY } from './taxonomy.ops';
import { DELIVERY_TAXONOMY } from './taxonomy.delivery';

import { OWNER_SYNTHESIS, selectOwnerSynthesis } from './synthesis.owner';
import { SALES_SYNTHESIS, selectSalesSynthesis } from './synthesis.sales';
import { OPS_SYNTHESIS, selectOpsSynthesis } from './synthesis.ops';
import { DELIVERY_SYNTHESIS, selectDeliverySynthesis } from './synthesis.delivery';

export type RoleId = 'owner' | 'sales' | 'ops' | 'delivery';

export interface RoleConfig {
    taxonomy: any;
    synthesis: any;
    selectSynthesis: (answers: { Q1?: string; Q2?: string; Q3?: string }) => string;
}

export const FETA_REGISTRY: Record<RoleId, RoleConfig> = {
    owner: {
        taxonomy: OWNER_TAXONOMY,
        synthesis: OWNER_SYNTHESIS,
        selectSynthesis: selectOwnerSynthesis,
    },
    sales: {
        taxonomy: SALES_TAXONOMY,
        synthesis: SALES_SYNTHESIS,
        selectSynthesis: selectSalesSynthesis,
    },
    ops: {
        taxonomy: OPS_TAXONOMY,
        synthesis: OPS_SYNTHESIS,
        selectSynthesis: selectOpsSynthesis,
    },
    delivery: {
        taxonomy: DELIVERY_TAXONOMY,
        synthesis: DELIVERY_SYNTHESIS,
        selectSynthesis: selectDeliverySynthesis,
    },
};

export function isValidRole(role: string): role is RoleId {
    return role in FETA_REGISTRY;
}
