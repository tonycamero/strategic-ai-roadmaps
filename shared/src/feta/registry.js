"use strict";
/**
 * FETA Role Registry
 * Central registry for all role-specific taxonomies and synthesis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FETA_REGISTRY = void 0;
exports.isValidRole = isValidRole;
const taxonomy_owner_1 = require("./taxonomy.owner");
const taxonomy_sales_1 = require("./taxonomy.sales");
const taxonomy_ops_1 = require("./taxonomy.ops");
const taxonomy_delivery_1 = require("./taxonomy.delivery");
const synthesis_owner_1 = require("./synthesis.owner");
const synthesis_sales_1 = require("./synthesis.sales");
const synthesis_ops_1 = require("./synthesis.ops");
const synthesis_delivery_1 = require("./synthesis.delivery");
exports.FETA_REGISTRY = {
    owner: {
        taxonomy: taxonomy_owner_1.OWNER_TAXONOMY,
        synthesis: synthesis_owner_1.OWNER_SYNTHESIS,
        selectSynthesis: synthesis_owner_1.selectOwnerSynthesis,
    },
    sales: {
        taxonomy: taxonomy_sales_1.SALES_TAXONOMY,
        synthesis: synthesis_sales_1.SALES_SYNTHESIS,
        selectSynthesis: synthesis_sales_1.selectSalesSynthesis,
    },
    ops: {
        taxonomy: taxonomy_ops_1.OPS_TAXONOMY,
        synthesis: synthesis_ops_1.OPS_SYNTHESIS,
        selectSynthesis: synthesis_ops_1.selectOpsSynthesis,
    },
    delivery: {
        taxonomy: taxonomy_delivery_1.DELIVERY_TAXONOMY,
        synthesis: synthesis_delivery_1.DELIVERY_SYNTHESIS,
        selectSynthesis: synthesis_delivery_1.selectDeliverySynthesis,
    },
};
function isValidRole(role) {
    return role in exports.FETA_REGISTRY;
}
