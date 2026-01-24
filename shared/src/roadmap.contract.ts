/**
 * STRATEGIC ROADMAP CANONICAL CONTRACT
 *
 * This file defines the strictly-typed boundaries for the Roadmap assembly.
 */

/**
 * CONTRACT INVARIANTS (SECTION METADATA)
 */
export const SECTION_CONFIG = {
    'executive-logic': {
        title: 'Executive Logic & Guardrails',
        order: 10,
        horizon: null,
        renderMode: 'NARRATIVE',
        maxItems: 1
    },
    'operational-integrity': {
        title: 'Operational Integrity (0-30 Days)',
        order: 20,
        horizon: 30,
        renderMode: 'INITIATIVE_GRID',
        maxItems: 5
    },
    'operational-infrastructure': {
        title: 'Operational Infrastructure (30-90 Days)',
        order: 30,
        horizon: 90,
        renderMode: 'INITIATIVE_GRID',
        maxItems: 5
    },
    'strategic-capabilities': {
        title: 'Strategic AI Capabilities (90-180 Days)',
        order: 40,
        horizon: 180,
        renderMode: 'INITIATIVE_GRID',
        maxItems: 3
    },
    'risk-watchpoints': {
        title: 'Risks & Watchpoints',
        order: 50,
        horizon: null,
        renderMode: 'RISK_MATRIX',
        maxItems: 5
    }
} as const;
