import { db } from '../db/index.ts';
import { and, eq, asc } from 'drizzle-orm';
import {
  implementationSnapshots,
  roadmapOutcomes,
  type ImplementationSnapshot,
  type NewImplementationSnapshot,
  type RoadmapOutcome,
  type NewRoadmapOutcome,
} from '../db/schema.ts';
import { normalizeMetrics, validateMetrics, type NormalizedMetrics, type RawMetrics } from './metricNormalizer.service';

export type SnapshotLabel = 'baseline' | '30d' | '60d' | '90d' | 'custom';
export type SnapshotSource = 'manual' | 'api' | 'ghl_export' | 'hubspot_export';

export class ImplementationMetricsService {
  /**
   * Create baseline snapshot with metric normalization.
   * T3.2 implementation.
   */
  static async createBaselineSnapshot(
    tenantId: string,
    roadmapId: string,
    rawMetrics: RawMetrics,
    source: SnapshotSource = 'manual'
  ): Promise<{ snapshotId: string; metrics: NormalizedMetrics }> {
    // Normalize metrics
    const metrics = normalizeMetrics(rawMetrics);

    // Validate
    const errors = validateMetrics(metrics);
    if (errors.length > 0) {
      throw new Error(`Metric validation failed: ${errors.join(', ')}`);
    }

    // Insert snapshot
    const snapshot = await this.createSnapshot({
      tenantId,
      roadmapId,
      snapshotDate: new Date(),
      label: 'baseline',
      source,
      metrics,
    });

    // Get or create roadmap outcome record
    let outcome = await this.getOutcome({ tenantId, roadmapId });

    if (!outcome) {
      // Create outcome record
      outcome = await this.createOutcome({
        tenantId,
        roadmapId,
        baselineSnapshotId: snapshot.id,
        deltas: {},
        status: 'on_track',
      });
    } else {
      // Update with baseline snapshot ID
      await db
        .update(roadmapOutcomes)
        .set({ baselineSnapshotId: snapshot.id, updatedAt: new Date() })
        .where(eq(roadmapOutcomes.id, outcome.id));
    }

    // Trigger ROI computation automatically
    await this.createOutcomeForRoadmap({ tenantId, roadmapId });

    return { snapshotId: snapshot.id, metrics };
  }

  /**
   * Create 30/60/90-day snapshot with metric normalization.
   * T3.3 implementation.
   */
  static async createTimeSnapshot(
    tenantId: string,
    roadmapId: string,
    label: SnapshotLabel,
    rawMetrics: RawMetrics,
    source: SnapshotSource = 'manual'
  ): Promise<{ snapshotId: string; metrics: NormalizedMetrics }> {
    // Normalize metrics
    const metrics = normalizeMetrics(rawMetrics);

    // Validate
    const errors = validateMetrics(metrics);
    if (errors.length > 0) {
      throw new Error(`Metric validation failed: ${errors.join(', ')}`);
    }

    // Insert snapshot
    const snapshot = await this.createSnapshot({
      tenantId,
      roadmapId,
      snapshotDate: new Date(),
      label,
      source,
      metrics,
    });

    // Update roadmapOutcomes with appropriate snapshot reference
    const outcome = await this.getOutcome({ tenantId, roadmapId });

    if (!outcome) {
      throw new Error('No outcome record found. Must create baseline first.');
    }

    // Update the appropriate snapshot ID field
    const updates: any = { updatedAt: new Date() };

    if (label === '30d') {
      updates.at30dSnapshotId = snapshot.id;
    } else if (label === '60d') {
      updates.at60dSnapshotId = snapshot.id;
    } else if (label === '90d') {
      updates.at90dSnapshotId = snapshot.id;
    }

    if (Object.keys(updates).length > 1) {
      await db
        .update(roadmapOutcomes)
        .set(updates)
        .where(eq(roadmapOutcomes.id, outcome.id));
    }

    // Trigger ROI computation automatically
    await this.createOutcomeForRoadmap({ tenantId, roadmapId });

    return { snapshotId: snapshot.id, metrics };
  }

  static async createSnapshot(
    input: NewImplementationSnapshot
  ): Promise<ImplementationSnapshot> {
    const [row] = await db.insert(implementationSnapshots).values(input).returning();
    return row;
  }

  static async getSnapshotsForRoadmap(params: {
    tenantId: string;
    roadmapId: string;
  }): Promise<ImplementationSnapshot[]> {
    return db
      .select()
      .from(implementationSnapshots)
      .where(
        and(
          eq(implementationSnapshots.tenantId, params.tenantId),
          eq(implementationSnapshots.roadmapId, params.roadmapId)
        )
      )
      .orderBy(asc(implementationSnapshots.snapshotDate));
  }

  static async createOutcome(
    input: NewRoadmapOutcome
  ): Promise<RoadmapOutcome> {
    const [row] = await db.insert(roadmapOutcomes).values(input).returning();
    return row;
  }

  static async getOutcome(params: {
    tenantId: string;
    roadmapId: string;
  }): Promise<RoadmapOutcome | null> {
    const rows = await db
      .select()
      .from(roadmapOutcomes)
      .where(
        and(
          eq(roadmapOutcomes.tenantId, params.tenantId),
          eq(roadmapOutcomes.roadmapId, params.roadmapId)
        )
      )
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Compute outcome for a roadmap based on baseline and latest snapshots
   * Uses default business assumptions for ROI calculations
   */
  static async createOutcomeForRoadmap(params: {
    tenantId: string;
    roadmapId: string;
    assumptions?: {
      blendedHourlyRate?: number;
      annualLeadVolume?: number;
      avgDealValue?: number;
      implementationCost?: number;
    };
  }): Promise<RoadmapOutcome> {
    const { tenantId, roadmapId, assumptions = {} } = params;

    // Get all snapshots for this roadmap
    const snapshots = await this.getSnapshotsForRoadmap({ tenantId, roadmapId });

    if (snapshots.length === 0) {
      throw new Error('No snapshots found for this roadmap');
    }

    // Find baseline snapshot
    const baseline = snapshots.find((s) => s.label === 'baseline');
    if (!baseline) {
      throw new Error('No baseline snapshot found');
    }

    // Find latest snapshot (prefer 90d > 60d > 30d in that order)
    const latest =
      snapshots.find((s) => s.label === '90d') ||
      snapshots.find((s) => s.label === '60d') ||
      snapshots.find((s) => s.label === '30d') ||
      snapshots[snapshots.length - 1];

    // Default assumptions
    const blendedHourlyRate = assumptions.blendedHourlyRate ?? 75;
    const annualLeadVolume = assumptions.annualLeadVolume ?? 1000;
    const avgDealValue = assumptions.avgDealValue ?? 5000;
    const implementationCost = assumptions.implementationCost ?? 25000;

    // Compute deltas (always latest - baseline; frontend uses inverted flag to determine if negative is good)
    const deltas = {
      lead_response_minutes: (latest.metrics.lead_response_minutes ?? 0) - (baseline.metrics.lead_response_minutes ?? 0),
      lead_to_appt_rate: (latest.metrics.lead_to_appt_rate ?? 0) - (baseline.metrics.lead_to_appt_rate ?? 0),
      close_rate: (latest.metrics.close_rate ?? 0) - (baseline.metrics.close_rate ?? 0),
      crm_adoption_rate: (latest.metrics.crm_adoption_rate ?? 0) - (baseline.metrics.crm_adoption_rate ?? 0),
      weekly_ops_hours: (latest.metrics.weekly_ops_hours ?? 0) - (baseline.metrics.weekly_ops_hours ?? 0),
      nps: (latest.metrics.nps ?? 0) - (baseline.metrics.nps ?? 0),
    };

    // Compute ROI
    // Time savings from weekly ops hours reduction (negative delta = time saved)
    const annualTimeSavingsHours = -deltas.weekly_ops_hours * 52;
    const timeSavingsValue = annualTimeSavingsHours * blendedHourlyRate;

    // Revenue impact from improved lead-to-appt and close rates
    const leadToApptImprovement = deltas.lead_to_appt_rate / 100; // Convert % to decimal
    const closeRateImprovement = deltas.close_rate / 100; // Convert % to decimal
    const baselineCloseRate = (baseline.metrics.close_rate ?? 15) / 100;
    const latestCloseRate = (latest.metrics.close_rate ?? 15) / 100;

    // Revenue from more appointments converting
    const additionalAppts = annualLeadVolume * leadToApptImprovement;
    const revenueFromAppts = additionalAppts * avgDealValue * latestCloseRate;

    // Revenue from better close rate on existing appointments
    const baseAppts = annualLeadVolume * ((baseline.metrics.lead_to_appt_rate ?? 30) / 100);
    const revenueFromCloseRate = baseAppts * avgDealValue * closeRateImprovement;

    const revenueImpact = revenueFromAppts + revenueFromCloseRate;

    // Cost avoidance from CRM adoption (less manual work)
    const crmAdoptionImprovement = deltas.crm_adoption_rate / 100;
    const costAvoidance = crmAdoptionImprovement * annualLeadVolume * 0.5; // $0.50 per lead in manual work avoided

    // Net ROI
    const totalBenefit = timeSavingsValue + revenueImpact + costAvoidance;
    const netRoiPercent = ((totalBenefit - implementationCost) / implementationCost) * 100;

    // Determine status
    let status: 'on_track' | 'at_risk' | 'off_track';
    if (netRoiPercent >= 100) {
      status = 'on_track';
    } else if (netRoiPercent >= 50) {
      status = 'at_risk';
    } else {
      status = 'off_track';
    }

    // Check if outcome already exists
    const existing = await this.getOutcome({ tenantId, roadmapId });

    if (existing) {
      // Update existing outcome
      const [updated] = await db
        .update(roadmapOutcomes)
        .set({
          baselineSnapshotId: baseline.id,
          at30dSnapshotId: snapshots.find((s) => s.label === '30d')?.id ?? null,
          at60dSnapshotId: snapshots.find((s) => s.label === '60d')?.id ?? null,
          at90dSnapshotId: snapshots.find((s) => s.label === '90d')?.id ?? null,
          deltas,
          realizedRoi: {
            time_savings_hours_annual: annualTimeSavingsHours,
            time_savings_value_annual: timeSavingsValue,
            revenue_impact_annual: revenueImpact,
            cost_avoidance_annual: costAvoidance,
            net_roi_percent: netRoiPercent,
          },
          status,
          updatedAt: new Date(),
        })
        .where(eq(roadmapOutcomes.id, existing.id))
        .returning();

      return updated;
    }

    // Create new outcome
    return this.createOutcome({
      tenantId,
      roadmapId,
      baselineSnapshotId: baseline.id,
      at30dSnapshotId: snapshots.find((s) => s.label === '30d')?.id ?? null,
      at60dSnapshotId: snapshots.find((s) => s.label === '60d')?.id ?? null,
      at90dSnapshotId: snapshots.find((s) => s.label === '90d')?.id ?? null,
      deltas,
      realizedRoi: {
        time_savings_hours_annual: annualTimeSavingsHours,
        time_savings_value_annual: timeSavingsValue,
        revenue_impact_annual: revenueImpact,
        cost_avoidance_annual: costAvoidance,
        net_roi_percent: netRoiPercent,
      },
      status,
    });
  }
}
