/**
 * Inventory Selection Service (v1 Heuristics)
 * 
 * Selects SOPs from inventory based on firm size, vertical, and diagnostic signals.
 * Baseline tuned for Hayes (Real Estate) and BrightFocus (Agency).
 */

import {
  InventoryTicket,
  SelectionContext,
  SelectedInventoryTicket,
  Tier,
  Sprint,
} from '../types/inventory';
import { getInventoryForVertical, getGHLNativeInventory, getSidecarInventory } from './inventory.service';

/**
 * Derive firm size tier from team headcount
 */
export function deriveFirmSizeTier(teamHeadcount?: number | null): 'micro' | 'small' | 'mid' | 'large' {
  const n = teamHeadcount ?? 5;
  if (n <= 7) return 'micro';
  if (n <= 20) return 'small';
  if (n <= 50) return 'mid';
  return 'large';
}

/**
 * Check if diagnostic map contains specific signals
 */
function hasSignal(diagnosticMap: Record<string, any>, keys: string[]): boolean {
  const lower = JSON.stringify(diagnosticMap).toLowerCase();
  return keys.some((k) => lower.includes(k.toLowerCase()));
}

/**
 * Build selection context from tenant and diagnostic data
 */
export function buildSelectionContext(
  tenant: {
    name: string;
    vertical?: string | null;
    teamHeadcount?: number | null;
  },
  diagnosticMap: Record<string, any>
): SelectionContext {
  const firmSizeTier = deriveFirmSizeTier(tenant.teamHeadcount);
  
  // Map tenant.vertical string to SelectionContext vertical type
  let vertical: SelectionContext['vertical'] = 'generic';
  if (tenant.vertical) {
    const v = tenant.vertical.toLowerCase();
    if (v.includes('chamber')) vertical = 'chamber';
    else if (v.includes('agency') || v.includes('marketing')) vertical = 'agency';
    else if (v.includes('trades') || v.includes('hvac') || v.includes('plumbing')) vertical = 'trades';
    else if (v.includes('coach')) vertical = 'coaching';
    else if (v.includes('professional') || v.includes('law') || v.includes('accounting')) vertical = 'professional';
  }

  const diagnosticSignals = {
    pipelinePain:
      hasSignal(diagnosticMap, ['pipeline', 'lead flow', 'lead capture', 'stages']) ||
      hasSignal(diagnosticMap, ['leads fall through', 'leads in multiple places']),
    followupPain:
      hasSignal(diagnosticMap, ['follow-up', 'follow up', 'no-shows', 'ghost', 'stalled']) ||
      hasSignal(diagnosticMap, ['no one follows', 'deals lost']),
    onboardingPain:
      hasSignal(diagnosticMap, ['onboarding', 'intake', 'kickoff', 'new client']) ||
      hasSignal(diagnosticMap, ['chaotic', 'project start']),
    reportingPain:
      hasSignal(diagnosticMap, ['reporting', 'dashboard', 'metrics', 'kpi']) ||
      hasSignal(diagnosticMap, ['no visibility', 'can\'t see', 'don\'t know what\'s happening']),
    ownerDependency:
      hasSignal(diagnosticMap, ['owner does', 'owner handles', 'only i', 'bottleneck']) ||
      hasSignal(diagnosticMap, ['wait for me', 'owner dispatches']),
    crmDataPain:
      hasSignal(diagnosticMap, ['data quality', 'duplicate', 'messy', 'clean up']) ||
      hasSignal(diagnosticMap, ['utm', 'attribution', 'source tracking']),
    teamCoordinationPain:
      hasSignal(diagnosticMap, ['team coordination', 'handoff', 'communication']) ||
      hasSignal(diagnosticMap, ['waiting', 'chasing', 'don\'t know who']),
  };

  // Enable sidecars if firm is not micro AND has reporting/owner dependency pain
  const wantsSidecars =
    firmSizeTier !== 'micro' &&
    (diagnosticSignals.reportingPain || diagnosticSignals.ownerDependency);

  return {
    firmSizeTier,
    vertical,
    wantsSidecars,
    diagnosticSignals,
  };
}

// ---- Helper functions ----

// Normalize category strings for matching
function normalizeCategory(cat: string): string {
  return cat.trim().toLowerCase();
}

// Soft vertical match: if ticket has verticalTags, prefer exact match
function verticalScore(ticket: InventoryTicket, vertical: SelectionContext['vertical']): number {
  if (!ticket.verticalTags || ticket.verticalTags.length === 0) return 0;
  const v = vertical.toLowerCase();
  return ticket.verticalTags.some((tag) => tag.toLowerCase().includes(v)) ? 2 : 0;
}

// Simple pool pick helper (no randomness; preserves source order)
function pickFromPool(
  pool: InventoryTicket[],
  alreadyPicked: Set<string>,
  max: number
): InventoryTicket[] {
  const result: InventoryTicket[] = [];
  for (const item of pool) {
    if (result.length >= max) break;
    if (alreadyPicked.has(item.inventoryId)) continue;
    result.push(item);
    alreadyPicked.add(item.inventoryId);
  }
  return result;
}

/**
 * Select inventory tickets based on context (v1 heuristics - enhanced with liberal sidecars)
 */
export function selectInventoryTickets(
  ctx: SelectionContext,
  allInventory: InventoryTicket[]
): SelectedInventoryTicket[] {
  const picked = new Set<string>();
  const result: InventoryTicket[] = [];

  // Split into GHL-native vs sidecars
  const coreInventory = allInventory.filter((i) => !i.isSidecar);
  const sidecarInventory = allInventory.filter((i) => i.isSidecar);

  // Vertical filters (soft preference)
  const isChamber = ctx.vertical === 'chamber';
  const isAgency = ctx.vertical === 'agency';

  // Target counts based on firm size (increased for moderation filtering)
  const baseCount =
    ctx.firmSizeTier === 'micro'
      ? 15
      : ctx.firmSizeTier === 'small'
      ? 18
      : ctx.firmSizeTier === 'mid'
      ? 22
      : 25;

  // Sidecar cap – more liberal, owner-focused
  let maxSidecars: number;
  switch (ctx.firmSizeTier) {
    case 'micro':
      // Let micro firms have 1 sidecar IF it's clearly useful
      maxSidecars = ctx.wantsSidecars ? 1 : 0;
      break;
    case 'small':
      maxSidecars = ctx.wantsSidecars ? 3 : 1;
      break;
    case 'mid':
      maxSidecars = ctx.wantsSidecars ? 4 : 2;
      break;
    case 'large':
      maxSidecars = ctx.wantsSidecars ? 5 : 3;
      break;
    default:
      maxSidecars = ctx.wantsSidecars ? 3 : 1;
  }

  // Hard cap: sidecars should never exceed ~30% of total tickets
  const maxSidecarByRatio = Math.floor(baseCount * 0.3);
  maxSidecars = Math.min(maxSidecars, maxSidecarByRatio);

  // ---- Build category pools (GHL-native) ----

  const pipelinePool = coreInventory.filter((i) => {
    const c = normalizeCategory(i.category);
    return c.includes('pipeline');
  });

  const crmPool = coreInventory.filter((i) => {
    const c = normalizeCategory(i.category);
    return c.includes('crm');
  });

  const opsPool = coreInventory.filter((i) => {
    const c = normalizeCategory(i.category);
    return c.includes('ops') || c.includes('workflow');
  });

  const onboardingPool = coreInventory.filter((i) => {
    const c = normalizeCategory(i.category);
    return c.includes('onboarding');
  });

  const reportingPool = coreInventory.filter((i) => {
    const c = normalizeCategory(i.category);
    return c.includes('report');
  });

  const teamPool = coreInventory.filter((i) => {
    const c = normalizeCategory(i.category);
    return c.includes('team');
  });

  // Vertical-specific pool (e.g. Chamber)
  const verticalPool = coreInventory.filter((i) => {
    if (!i.verticalTags || i.verticalTags.length === 0) return false;
    return verticalScore(i, ctx.vertical) > 0;
  });

  // ---- 1. Vertical anchors (if applicable) ----

  if (isChamber || isAgency) {
    const verticalAnchors = pickFromPool(verticalPool, picked, 3);
    result.push(...verticalAnchors);
  }

  // ---- 2. Pipeline-heavy if pipelinePain/followupPain ----

  if (ctx.diagnosticSignals.pipelinePain || ctx.diagnosticSignals.followupPain) {
    const pipelineNeeded = ctx.diagnosticSignals.followupPain ? 4 : 3;
    const pipelineSops = pickFromPool(pipelinePool, picked, pipelineNeeded);
    result.push(...pipelineSops);
  } else {
    const pipelineSops = pickFromPool(pipelinePool, picked, 2);
    result.push(...pipelineSops);
  }

  // ---- 3. Ops & Delivery if deliveryBottlenecks/onboardingPain ----

  if (ctx.diagnosticSignals.deliveryBottlenecks) {
    const opsSops = pickFromPool(opsPool, picked, 3);
    result.push(...opsSops);
  } else {
    const opsSops = pickFromPool(opsPool, picked, 2);
    result.push(...opsSops);
  }

  if (ctx.diagnosticSignals.onboardingPain) {
    const onboardingSops = pickFromPool(onboardingPool, picked, 2);
    result.push(...onboardingSops);
  } else {
    const onboardingSops = pickFromPool(onboardingPool, picked, 1);
    result.push(...onboardingSops);
  }

  // ---- 4. CRM & Reporting if reportingPain/ownerDependency ----

  if (ctx.diagnosticSignals.reportingPain) {
    const reportingSops = pickFromPool(reportingPool, picked, 2);
    result.push(...reportingSops);
  } else {
    const reportingSops = pickFromPool(reportingPool, picked, 1);
    result.push(...reportingSops);
  }

  const crmSops = pickFromPool(crmPool, picked, 2);
  result.push(...crmSops);

  // ---- 5. Team Ops if ownerDependency ----

  if (ctx.diagnosticSignals.ownerDependency) {
    const teamSops = pickFromPool(teamPool, picked, 2);
    result.push(...teamSops);
  } else {
    const teamSops = pickFromPool(teamPool, picked, 1);
    result.push(...teamSops);
  }

  // ---- 6. Sidecars (monitoring/analytics/leadership intel) ----

  if (maxSidecars > 0 && sidecarInventory.length > 0 && ctx.wantsSidecars) {
    const sidecarPriorityOrder = [
      'monitoring',
      'alerts',
      'sla',
      'analytics',
      'dashboard',
      'reporting',
      'organizational',
      'leadership',
      'behavioral',
      'predictive',
      'compliance',
      'integrations'
    ];

    // Extra bias: if reportingPain or ownerDependency,
    // we really want at least one monitoring + one analytics/scorecard if available
    const mustHaveMonitoring =
      ctx.diagnosticSignals.followupPain ||
      ctx.diagnosticSignals.pipelinePain ||
      ctx.diagnosticSignals.deliveryBottlenecks;

    const mustHaveAnalytics =
      ctx.diagnosticSignals.reportingPain || ctx.diagnosticSignals.ownerDependency;

    const normalizedSidecars = sidecarInventory.filter(
      (i) => !picked.has(i.inventoryId)
    );

    const scored = normalizedSidecars.sort((a, b) => {
      const aKey = (a.sidecarCategory || '').toLowerCase();
      const bKey = (b.sidecarCategory || '').toLowerCase();

      const aIndex =
        sidecarPriorityOrder.findIndex((p) => aKey.includes(p)) ?? 999;
      const bIndex =
        sidecarPriorityOrder.findIndex((p) => bKey.includes(p)) ?? 999;

      return aIndex - bIndex;
    });

    const sidecarResult: InventoryTicket[] = [];

    // Hard-pick a monitoring-type sidecar if flagged
    if (mustHaveMonitoring) {
      const monitoring = scored.find((s) =>
        (s.sidecarCategory || '').toLowerCase().includes('monitor')
      );
      if (monitoring && !picked.has(monitoring.inventoryId)) {
        sidecarResult.push(monitoring);
        picked.add(monitoring.inventoryId);
      }
    }

    // Hard-pick an analytics/scorecard sidecar if flagged
    if (mustHaveAnalytics) {
      const analytics = scored.find((s) => {
        const cat = (s.sidecarCategory || '').toLowerCase();
        return (
          cat.includes('analytics') ||
          cat.includes('dashboard') ||
          cat.includes('leadership') ||
          cat.includes('organizational')
        );
      });
      if (
        analytics &&
        !picked.has(analytics.inventoryId) &&
        sidecarResult.length < maxSidecars
      ) {
        sidecarResult.push(analytics);
        picked.add(analytics.inventoryId);
      }
    }

    // Fill remaining sidecar slots by priority
    for (const s of scored) {
      if (sidecarResult.length >= maxSidecars) break;
      if (picked.has(s.inventoryId)) continue;
      sidecarResult.push(s);
      picked.add(s.inventoryId);
    }

    result.push(...sidecarResult);
  }

  // ---- 7. Top-up with any remaining core inventory until baseCount ----

  if (result.length < baseCount) {
    const remainingCore = coreInventory.filter(
      (i) => !picked.has(i.inventoryId)
    );
    const remainingNeeded = baseCount - result.length;
    const topUps = pickFromPool(remainingCore, picked, remainingNeeded);
    result.push(...topUps);
  }

  // If we somehow overshot (unlikely with current logic), trim:
  const trimmed = result.slice(0, baseCount);

  // ---- 8. Assign tier + sprint based on position ----

  const selected: SelectedInventoryTicket[] = trimmed.map((ticket, index) => {
    const position = index; // 0-based
    const total = trimmed.length;

    let tier: SelectedInventoryTicket['tier'];
    let sprint: SelectedInventoryTicket['sprint'];

    // Simple rule:
    // - First ~40% = CORE / Sprint 30
    // - Next ~40% = RECOMMENDED / Sprint 60
    // - Last ~20% = ADVANCED / Sprint 90
    const coreCutoff = Math.round(total * 0.4);
    const recCutoff = Math.round(total * 0.8);

    if (position < coreCutoff) {
      tier = 'core';
      sprint = 30;
    } else if (position < recCutoff) {
      tier = 'recommended';
      sprint = 60;
    } else {
      tier = 'advanced';
      sprint = 90;
    }

    return {
      ...ticket,
      tier,
      sprint,
    };
  });

  console.log(`[InventorySelection] Selected ${selected.length} tickets:`, {
    core: selected.filter(t => t.tier === 'core').length,
    recommended: selected.filter(t => t.tier === 'recommended').length,
    advanced: selected.filter(t => t.tier === 'advanced').length,
    sidecars: selected.filter(t => t.isSidecar).length,
  });

  return selected;
}
