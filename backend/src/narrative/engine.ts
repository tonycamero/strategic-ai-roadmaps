import { AssembledNarrative, NarrativeBlock, NarrativeConditions } from './types.ts';
import * as Content from './content.ts';
import { ConstraintType, FailureModeType, TimingType, RoleType, SeverityType, OutcomeType } from './taxonomy.ts';

// --- PRIORITY MAPS (Deterministic Tie-Breaking) ---
// Lower index = Higher priority.
const ROLE_PRIORITY_MAP: Record<string, string[]> = {
    'owner': ['O1_Heroics', 'O2_DecisionHoarding', 'O3_PriorityThrash', 'O4_VisionNoMechanism'],
    'sales': ['S1_MemoryFollowUp', 'S2_AuthorityBypass', 'S3_PipelineGuessing', 'S4_DiscountSubstitute'],
    'ops': ['P1_ManualReconcile', 'P2_ShadowSystems', 'P3_Firefighting', 'P4_ProcessDrift'],
    'delivery': ['D1_ReworkNorm', 'D2_ScopeCreep', 'D3_QualityFade', 'D4_DeadlineCompress']
};

function deriveState(packet: any): NarrativeConditions {
    // TODO: rigorous mapping from packet signals.
    // Ideally this comes from a dedicated derivation layer.
    return {
        constraint: packet.derived_constraint || ConstraintType.ENFORCEMENT_FAILURE,
        failureMode: packet.derived_failureMode || FailureModeType.BEHAVIORAL_COMPENSATION,
        gaps: {
            enforcement: packet.derived_gap_enforcement === true,
            visibility: packet.derived_gap_visibility === true
        },
        timing: packet.derived_timing || TimingType.NOW,
        severity: packet.derived_severity || SeverityType.HIGH,
        outcome: packet.derived_outcome || OutcomeType.REVENUE_LEAK
    };
}

// function deriveState is unchanged... (check if I need to update it? It was returning DiagnosticState before, now NarrativeConditions if I changed it?
// Wait, I see I removed DiagnosticState interface in the previous edit and used NarrativeConditions. 
// Let's make sure imports align.

function blockMatches(block: NarrativeBlock, state: NarrativeConditions): boolean {
    const c = block.appliesWhen;

    // Strict Object Selector (Standard Match)
    if (c.constraint && !c.constraint.includes(state.constraint)) return false;
    if (c.failureMode && !c.failureMode.includes(state.failureMode)) return false;

    if (c.gapScale) {
        if (c.gapScale.enforcement === true && !state.gaps.enforcement) return false;
        if (c.gapScale.visibility === true && !state.gaps.visibility) return false;
    }

    if (c.timing && !c.timing.includes(state.timing)) return false;
    if (c.severity && !c.severity.includes(state.severity)) return false;
    if (c.outcome && !c.outcome.includes(state.outcome)) return false;

    // Role filtering happens in assembly phase, not here.
    return true;
}

export function assembleNarrative(packet: any): AssembledNarrative {
    const state = deriveState(packet);
    const allBlocks = Object.values(Content);

    // 1. SELECT BLOCKS (Base Filter)
    const matchingBlocks = allBlocks.filter(b => blockMatches(b, state));

    // 2. ORGANIZE INTO STRUCTURE

    // Overview
    const overview = matchingBlocks.find(b => b.id === 'S1_Overview') || Content.S1_Overview;

    // Core Spine
    const constraint = matchingBlocks.find(b => b.id.startsWith('C') && b.priority === 10) || Content.C1_EnforcementFailure; // Fallback safe?
    const failureMode = matchingBlocks.find(b => b.id.startsWith('F') && b.priority === 20) || Content.F1_BehavioralCompensation;

    const gaps = matchingBlocks.filter(b => b.id.startsWith('G') && b.priority === 25);
    // Sort Gaps: Enforcement (G1) then Visibility (G2)
    gaps.sort((a, b) => a.id.localeCompare(b.id));

    const timing = matchingBlocks.find(b => b.id.startsWith('T') && b.priority === 30) || Content.T1_NOW;
    const severity = matchingBlocks.find(b => b.id.startsWith('SEV') && b.priority === 35) || Content.SEV_HIGH;
    const outcome = matchingBlocks.find(b => b.id.startsWith('R') && b.priority === 40) || Content.R1_RevenueLeak;

    // closing
    const closingBlock = matchingBlocks.find(b => b.id === 'S5_ClosingFrame') || Content.S5_ClosingFrame;
    const disclaimer = matchingBlocks.find(b => b.id === 'S3_WhatItIsNot'); // Optional?

    // Combined closing block or just S5? Specification says "Closing: NarrativeBlock".
    // Let's use S5 as the primary closing block. 
    // Disclaimers might be handled in UI/PDF layout or appended?
    // For now, let's treat 'closing' as just S5 and maybe we need a 'disclaimer' field if it's separate?
    // The previous implementation had `closing: NarrativeBlock[]`.
    // The NEW interface has `closing: NarrativeBlock`.
    // Let's stick to S5 for 'closing'.

    // 3. DECISION SPINE SELECTION (Phase 6 - Authoritative)

    // DS1: Situation (Exact 1)
    const ds1Candidates = matchingBlocks.filter(b => b.id.startsWith('DS1_'));
    // Sort: Active(100) > Impending(100) > Dormant(100). Rely on blockMatches specific inputs.
    // If multiple match (e.g. NOW+HIGH matches Active and maybe others?), just take first.
    // Fallback: If no match, force ActiveConstraint (most common)
    const ds1 = ds1Candidates.length > 0 ? ds1Candidates[0] : Content.DS1_Situation_ActiveConstraint;

    // DS2: Consequence (Exact 1)
    const ds2Candidates = matchingBlocks.filter(b => b.id.startsWith('DS2_'));
    // Priority: Founder -> Insolvency -> Revenue.
    // We rely on 'priority' field in blocks if multiple match.
    // Fallback: RevenueExposure
    ds2Candidates.sort((a, b) => b.priority - a.priority);
    const ds2 = ds2Candidates.length > 0 ? ds2Candidates[0] : Content.DS2_Consequence_RevenueExposure;

    // DS3: Mandate (Exact 1)
    const ds3Candidates = matchingBlocks.filter(b => b.id.startsWith('DS3_'));
    // Priority: Structural(100) > Decision(99) > Roadmap(10)
    ds3Candidates.sort((a, b) => b.priority - a.priority);
    const ds3 = ds3Candidates.length > 0 ? ds3Candidates[0] : Content.DS3_Mandate_RoadmapAuthorization;

    const decisionSpine = [ds1, ds2, ds3];


    // Role Sections (Deterministic Selection)
    const roleSections: AssembledNarrative['roleSections'] = {};
    const roleIds: string[] = [];

    ['owner', 'sales', 'ops', 'delivery'].forEach(role => {
        const priorityList = ROLE_PRIORITY_MAP[role];

        // Find blocks for this role that matched the rubric
        const roleBlocks = matchingBlocks.filter(b => {
            const c = b.appliesWhen;
            // Strict object selector logic
            return c.role && c.role.includes(role as any);
        });

        // Sort by Priority Map Index
        roleBlocks.sort((a, b) => {
            const idxA = priorityList.indexOf(a.id);
            const idxB = priorityList.indexOf(b.id);
            // If not found in map (should not happen), push to end
            const safeA = idxA === -1 ? 999 : idxA;
            const safeB = idxB === -1 ? 999 : idxB;
            return safeA - safeB;
        });

        // Take top 2
        const selected = roleBlocks.slice(0, 2);

        if (selected.length > 0) {
            roleSections[role as keyof typeof roleSections] = selected;
            roleIds.push(...selected.map(b => b.id));
        }
    });

    // Collect all IDs in order for verification/debug
    // SEQUENCE: Situation -> Overview -> Constraint -> Consequence -> Failure -> Gaps -> Timing -> Sev -> Outcome -> Role -> Mandate -> Closing
    const selectedIds = [
        ...decisionSpine.map(b => b.id),
        overview.id,
        constraint.id,
        failureMode.id,
        ...gaps.map(b => b.id),
        timing.id,
        severity.id,
        outcome.id,
        ...roleIds, // In order of role iteration (Owner->Sales->Ops->Delivery)
        closingBlock.id
    ].filter(id => id !== '');

    return {
        decisionSpine,
        overview,
        constraint,
        failureMode,
        gaps,
        timing,
        severity,
        outcome,
        roleSections,
        closing: closingBlock,
        selectedIds
    };
}
