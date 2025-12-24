# Selector v1 Validation Guide

**Enhanced with owner-focused sidecar allocation**

---

## Expected Behavior by Firm Profile

### Hayes Realty (Real Estate, 5 people → Micro)

**Input Signals:**
- `pipelinePain`: true (leads in multiple places)
- `followupPain`: true (20-30% deals lost)
- `reportingPain`: true (no scoreboard)
- `ownerDependency`: true
- `firmSizeTier`: micro
- `vertical`: generic

**Expected Selection:**
- **Total tickets**: 10
- **Pipeline SOPs**: 4 (followupPain triggers heavy allocation)
- **Ops SOPs**: 2 (owner dependency)
- **CRM SOPs**: 2
- **Reporting SOPs**: 1
- **Team SOPs**: 1 (owner dependency)
- **Sidecars**: 1 (monitoring or analytics, despite micro tier)
  - Likely: "Lead Inactivity Watchdog" (mustHaveMonitoring = true)

**Tier Distribution:**
- Core (0-4): 4 tickets
- Recommended (4-8): 4 tickets
- Advanced (8-10): 2 tickets

---

### BrightFocus (Agency, 10 people → Small)

**Input Signals:**
- `pipelinePain`: true
- `followupPain`: true
- `onboardingPain`: true (chaotic project start)
- `reportingPain`: true
- `ownerDependency`: true
- `teamCoordinationPain`: true (PMs chasing clients)
- `firmSizeTier`: small
- `vertical`: agency

**Expected Selection:**
- **Total tickets**: 14
- **Vertical anchors**: 0 (no agency-specific inventory yet)
- **Pipeline SOPs**: 4 (followupPain)
- **Ops SOPs**: 3 (deliveryBottlenecks + team coordination)
- **Onboarding SOPs**: 2 (onboarding pain)
- **CRM SOPs**: 2
- **Reporting SOPs**: 2 (reporting pain)
- **Team SOPs**: 2 (owner dependency)
- **Sidecars**: 3 (wantsSidecars = true)
  - Hard-pick: Monitoring (mustHaveMonitoring = true)
  - Hard-pick: Analytics/Dashboard (mustHaveAnalytics = true)
  - Priority-fill: Next highest priority sidecar

**Tier Distribution:**
- Core (0-6): ~6 tickets
- Recommended (6-11): ~5 tickets
- Advanced (11-14): ~3 tickets

---

### Green Valley Dispensary (Chamber, 25 people → Mid)

**Input Signals:**
- `pipelinePain`: false
- `followupPain`: false
- `onboardingPain`: false
- `reportingPain`: true (compliance-heavy)
- `ownerDependency`: false
- `firmSizeTier`: mid
- `vertical`: chamber

**Expected Selection:**
- **Total tickets**: 18
- **Vertical anchors**: 3 (chamber-specific SOPs)
- **Pipeline SOPs**: 2 (baseline)
- **Ops SOPs**: 2 (baseline)
- **Onboarding SOPs**: 1 (baseline)
- **CRM SOPs**: 2
- **Reporting SOPs**: 2 (reporting pain)
- **Team SOPs**: 1
- **Sidecars**: 4 (wantsSidecars = true, mid tier)
  - Analytics/Dashboard (mustHaveAnalytics = true)
  - Priority-fill: 3 more by priority order
- **Top-up**: Remaining slots from available inventory

**Tier Distribution:**
- Core (0-7): ~7 tickets
- Recommended (7-14): ~7 tickets
- Advanced (14-18): ~4 tickets

---

## Sidecar Priority Matrix

### Priority Order:
1. **Monitoring** (lead inactivity, opportunity stalled)
2. **Alerts / SLA** (missed conversations, no-show escalation)
3. **Analytics / Dashboard** (pipeline health, conversion rates)
4. **Reporting** (weekly summaries, performance tracking)
5. **Organizational / Leadership** (scorecards, KPIs)
6. **Behavioral** (pattern detection)
7. **Predictive** (forecasting, trend analysis)
8. **Compliance** (audit trail, regulatory exports)
9. **Integrations** (cross-system connectors)

### Hard-Pick Logic:

**mustHaveMonitoring** (true when):
- `followupPain` OR
- `pipelinePain` OR
- `deliveryBottlenecks`

**mustHaveAnalytics** (true when):
- `reportingPain` OR
- `ownerDependency`

If both conditions are met → guaranteed 2 sidecars minimum (even for small firms).

---

## Validation Tests

### Test 1: Micro firm with strong pain
```ts
const ctx: SelectionContext = {
  firmSizeTier: 'micro',
  vertical: 'generic',
  wantsSidecars: true, // derived from reportingPain || ownerDependency
  diagnosticSignals: {
    pipelinePain: true,
    followupPain: true,
    reportingPain: true,
    ownerDependency: true,
    // ... rest false
  }
};

// Expected: 10 tickets, 1 sidecar (monitoring or analytics)
```

### Test 2: Small agency with chaos
```ts
const ctx: SelectionContext = {
  firmSizeTier: 'small',
  vertical: 'agency',
  wantsSidecars: true,
  diagnosticSignals: {
    pipelinePain: true,
    followupPain: true,
    onboardingPain: true,
    reportingPain: true,
    ownerDependency: true,
    teamCoordinationPain: true,
  }
};

// Expected: 14 tickets, 3 sidecars (monitoring + analytics + 1 more)
```

### Test 3: Large firm, minimal pain
```ts
const ctx: SelectionContext = {
  firmSizeTier: 'large',
  vertical: 'generic',
  wantsSidecars: false, // no reportingPain or ownerDependency
  diagnosticSignals: {
    pipelinePain: false,
    followupPain: false,
    // ... all false
  }
};

// Expected: 20 tickets, 3 sidecars (wantsSidecars override at large tier)
```

---

## Common Issues & Fixes

### Issue: Not enough inventory items
**Symptom:** `result.length < baseCount` after category selection
**Fix:** Top-up logic kicks in, pulls remaining items from coreInventory pool

### Issue: Too many sidecars
**Symptom:** Sidecars exceed 30% of total tickets
**Fix:** `maxSidecarByRatio` cap enforces limit

### Issue: No vertical-specific SOPs selected
**Symptom:** Chamber tenant doesn't get chamber SOPs
**Fix:** Verify `verticalTags` are set correctly in inventory JSON

### Issue: Wrong tier assignments
**Symptom:** All tickets in same tier
**Fix:** Tier assignment is position-based (40%/40%/20% split)

---

## Success Criteria

Phase 1 selector is successful if:

1. ✅ Ticket counts match baseCount targets (10/14/18/20)
2. ✅ Sidecar counts respect caps (0-1/1-3/2-4/3-5)
3. ✅ Hard-pick sidecars appear when pain signals present
4. ✅ Vertical anchors selected for chamber/agency tenants
5. ✅ Tier distribution roughly 40%/40%/20% (core/rec/adv)
6. ✅ No duplicate inventoryIds in selection
7. ✅ All selected items exist in loaded inventory

---

## Next Steps

1. Populate full inventory JSONs (60-80 SOPs)
2. Run selector with Hayes diagnostic data
3. Verify sidecar allocation matches expectations
4. Test with BrightFocus (agency) data
5. Validate tier/sprint assignments in generated tickets

---

**END OF VALIDATION GUIDE**
