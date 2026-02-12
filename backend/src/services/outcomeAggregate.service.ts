import { db } from '../db/index.ts';
import { roadmapOutcomes } from '../db/schema.ts';

export class OutcomeAggregateService {
  /**
   * Compute global analytics across all roadmap outcomes
   * Returns median, p25, p75 for key metrics
   */
  static async computeGlobalAnalytics(): Promise<{
    metrics: Record<string, { median: number; p25: number; p75: number; samples: number }>;
    roiStats: { median: number; p25: number; p75: number; samples: number };
    statusDistribution: Record<string, number>;
  }> {
    const rows = await db.select().from(roadmapOutcomes);

    if (rows.length === 0) {
      return {
        metrics: {},
        roiStats: { median: 0, p25: 0, p75: 0, samples: 0 },
        statusDistribution: {},
      };
    }

    // Collect metric deltas
    const byMetric: Record<string, number[]> = {
      lead_response_minutes: [],
      lead_to_appt_rate: [],
      crm_adoption_rate: [],
      weekly_ops_hours: [],
      nps: [],
    };

    const roiValues: number[] = [];
    const statusCounts: Record<string, number> = {};

    rows.forEach((r) => {
      // Collect deltas
      Object.keys(byMetric).forEach((k) => {
        if (r.deltas && (r.deltas as any)[k] !== null && (r.deltas as any)[k] !== undefined) {
          byMetric[k].push((r.deltas as any)[k] as number);
        }
      });

      // Collect ROI
      if (r.realizedRoi?.net_roi_percent !== null && r.realizedRoi?.net_roi_percent !== undefined) {
        roiValues.push(r.realizedRoi.net_roi_percent);
      }

      // Count statuses
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    // Compute percentiles
    const stats: Record<string, { median: number; p25: number; p75: number; samples: number }> = {};
    
    for (const metric of Object.keys(byMetric)) {
      const arr = byMetric[metric].sort((a, b) => a - b);
      
      if (arr.length === 0) {
        stats[metric] = { median: 0, p25: 0, p75: 0, samples: 0 };
        continue;
      }

      const median = arr[Math.floor(arr.length * 0.5)];
      const p25 = arr[Math.floor(arr.length * 0.25)];
      const p75 = arr[Math.floor(arr.length * 0.75)];

      stats[metric] = { median, p25, p75, samples: arr.length };
    }

    // ROI stats
    roiValues.sort((a, b) => a - b);
    const roiStats = roiValues.length > 0 
      ? {
          median: roiValues[Math.floor(roiValues.length * 0.5)],
          p25: roiValues[Math.floor(roiValues.length * 0.25)],
          p75: roiValues[Math.floor(roiValues.length * 0.75)],
          samples: roiValues.length,
        }
      : { median: 0, p25: 0, p75: 0, samples: 0 };

    return {
      metrics: stats,
      roiStats,
      statusDistribution: statusCounts,
    };
  }

  /**
   * Aggregate outcomes by industry/segment if available
   */
  static async computeBySegment(): Promise<Record<string, any>> {
    // This would query outcomes joined with tenant metadata
    // For now, return basic implementation
    const allOutcomes = await db.select().from(roadmapOutcomes);

    return {
      total_outcomes: allOutcomes.length,
      // Future: group by tenant.segment
    };
  }
}
