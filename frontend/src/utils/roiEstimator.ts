/**
 * ROI Estimator Utility
 * EXEC-TICKET-ROI-03
 *
 * Generates first-pass ROI estimates from intake baseline fields.
 * All math is approximate and conservative — designed for executive narrative, not finance models.
 * Handles missing fields gracefully; returns seeded fallbacks.
 */

export interface RoiBaseline {
  monthlyLeadVolume?: number;
  closeRate?: number;            // 0–1 decimal (e.g. 0.25)
  avgJobValue?: number;          // dollars
  salesRepCount?: number;
  opsAdminCount?: number;
  avgResponseTime?: number;      // hours
  maxThroughputPerHour?: number;
  avgThroughputPerHour?: number;
  primaryBottleneck?: string;
  lifecyclePhase?: string;
}

export interface RoiEstimate {
  revenueUnlockRange: string;
  hoursRecoveredRange: string;
  throughputIncrease: string;
  speedToValue: string;
  // Raw numbers for TrustAgent context
  revenueUnlockLow: number;
  revenueUnlockHigh: number;
  hoursPerWeekLow: number;
  hoursPerWeekHigh: number;
  throughputPct: number;
}

// Seeded defaults — always believable when baseline is absent
const SEEDED: RoiEstimate = {
  revenueUnlockRange: '$420K – $680K',
  hoursRecoveredRange: '22 – 34 hrs / week',
  throughputIncrease: '+18%',
  speedToValue: '4 – 6 weeks',
  revenueUnlockLow: 420_000,
  revenueUnlockHigh: 680_000,
  hoursPerWeekLow: 22,
  hoursPerWeekHigh: 34,
  throughputPct: 18,
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function speedByPhase(phase?: string): string {
  const p = (phase || '').toUpperCase();
  if (p.includes('EXECUTION'))  return '2 – 4 weeks';
  if (p.includes('MODERATION')) return '4 – 6 weeks';
  if (p.includes('ROADMAP'))    return '4 – 6 weeks';
  if (p.includes('DISCOVERY'))  return '6 – 8 weeks';
  return '4 – 6 weeks';
}

/**
 * Estimate ROI from an intake baseline object.
 * Safe to call with undefined or partially-populated baseline.
 */
export function estimateROI(baseline?: RoiBaseline | null): RoiEstimate {
  if (!baseline) return SEEDED;

  const {
    monthlyLeadVolume,
    closeRate,
    avgJobValue,
    opsAdminCount,
    maxThroughputPerHour,
    avgThroughputPerHour,
    lifecyclePhase,
  } = baseline;

  // ── Revenue Unlock ────────────────────────────────────────────────────────
  let revenueUnlockLow  = SEEDED.revenueUnlockLow;
  let revenueUnlockHigh = SEEDED.revenueUnlockHigh;

  if (monthlyLeadVolume && closeRate && avgJobValue) {
    const baselineRevenue      = monthlyLeadVolume * closeRate * avgJobValue * 12;
    const constraintDrag       = 0.15;  // ~15% revenue impeded by constraints
    const recoverablePct       = 0.35;  // ~35% recoverable through optimization
    const midpoint             = baselineRevenue * constraintDrag * recoverablePct;
    revenueUnlockLow           = Math.round(midpoint * 0.75);
    revenueUnlockHigh          = Math.round(midpoint * 1.25);
  }

  // ── Hours Recovered ───────────────────────────────────────────────────────
  let hoursPerWeekLow  = SEEDED.hoursPerWeekLow;
  let hoursPerWeekHigh = SEEDED.hoursPerWeekHigh;

  if (opsAdminCount && opsAdminCount > 0) {
    const manualHrsPerPerson = 3; // hours/week of manual workflow per person
    const base               = opsAdminCount * manualHrsPerPerson;
    hoursPerWeekLow          = Math.round(base * 0.75);
    hoursPerWeekHigh         = Math.round(base * 1.35);
  }

  // ── Throughput Lift ───────────────────────────────────────────────────────
  let throughputPct = SEEDED.throughputPct;

  if (maxThroughputPerHour && avgThroughputPerHour && maxThroughputPerHour > 0) {
    const gap      = maxThroughputPerHour - avgThroughputPerHour;
    const pct      = Math.round((gap / maxThroughputPerHour) * 100);
    throughputPct  = Math.max(5, Math.min(pct, 60)); // clamp 5–60%
  }

  // ── Speed to Value ────────────────────────────────────────────────────────
  const speedToValue = speedByPhase(lifecyclePhase);

  return {
    revenueUnlockRange:  `${fmt(revenueUnlockLow)} – ${fmt(revenueUnlockHigh)}`,
    hoursRecoveredRange: `${hoursPerWeekLow} – ${hoursPerWeekHigh} hrs / week`,
    throughputIncrease:  `+${throughputPct}%`,
    speedToValue,
    revenueUnlockLow,
    revenueUnlockHigh,
    hoursPerWeekLow,
    hoursPerWeekHigh,
    throughputPct,
  };
}
