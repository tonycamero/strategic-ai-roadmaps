import { db } from '../db/index';
import { executionSignals } from '../db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { StrategicSignalService } from './strategicSignal.service';

export class SignalAggregatorService {
    /**
     * Evaluates raw signals and compresses them into Strategic Signals if thresholds are met.
     */
    static async evaluate(tenantId: string, signalType: string) {
        // 1. Define aggregation window (e.g., 30 minutes)
        const windowMinutes = 30;
        const lookback = new Date(Date.now() - windowMinutes * 60 * 1000);

        // 2. Count signals in window
        const recentSignals = await db
            .select()
            .from(executionSignals)
            .where(
                and(
                    eq(executionSignals.tenantId, tenantId),
                    eq(executionSignals.signalType, signalType),
                    gte(executionSignals.createdAt, lookback)
                )
            );

        const count = recentSignals.length;

        // 3. Evaluate Aggregation Rules
        // Rule: 3+ signals in 30 mins = Strategic Signal
        if (count >= 3) {
            const strategicType = this.mapToStrategicType(signalType);
            const signalIds = recentSignals.map(s => s.id);
            
            await StrategicSignalService.emitStrategicSignal({
                tenantId,
                signalType: strategicType,
                severity: this.determineSeverity(recentSignals),
                supportingSignalIds: signalIds
            });
        }
    }

    /**
     * Maps raw signal types to strategic pattern types.
     */
    private static mapToStrategicType(rawType: string): string {
        const mapping: Record<string, string> = {
            'RESPONSE_DELAY': 'RESPONSE_LATENCY_DRIFT',
            'TASK_OVERDUE': 'EXECUTION_SLIPPAGE_PATTERN',
            'PIPELINE_STALL': 'PIPELINE_VELOCITY_CRITICAL',
            'WORKFLOW_FAILURE': 'OPERATIONAL_FRAGILITY_ALERT',
            'AUTOMATION_BREAK': 'INFRASTRUCTURE_DEGRADATION',
            'ANOMALY': 'UNIDENTIFIED_STATE_DRIFT'
        };

        return mapping[rawType] || `${rawType}_PATTERN`;
    }

    /**
     * Determines overall severity based on supporting signals.
     */
    private static determineSeverity(signals: any[]): string {
        if (signals.some(s => s.severity === 'critical')) return 'critical';
        if (signals.some(s => s.severity === 'high')) return 'high';
        return 'medium';
    }
}
