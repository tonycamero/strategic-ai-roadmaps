import { db } from '../db/index';
import { executionSignals } from '../db/schema';
import { SignalAggregatorService } from './signalAggregator.service';

export type SignalInput = {
    tenantId: string;
    signalType: string;
    source: string;
    relatedTicketId?: string;
    severity: string;
    payload?: any;
};

export class ExecutionSignalService {
    private static ALLOWED_TYPES = [
        'TASK_OVERDUE',
        'RESPONSE_DELAY',
        'PIPELINE_STALL',
        'WORKFLOW_FAILURE',
        'CRM_STAGE_CHANGE',
        'AUTOMATION_BREAK',
        'INVENTORY_EXCEPTION',
        'ANOMALY'
    ];

    /**
     * Records a raw operational signal and triggers aggregation evaluation.
     */
    static async recordSignal(input: SignalInput) {
        // 1. Validate Signal Type
        if (!this.ALLOWED_TYPES.includes(input.signalType)) {
            throw new Error(`INVALID_SIGNAL_TYPE: ${input.signalType}`);
        }

        // 2. Persist Execution Signal
        const [signal] = await db.insert(executionSignals).values({
            tenantId: input.tenantId,
            signalType: input.signalType,
            source: input.source,
            relatedTicketId: input.relatedTicketId,
            severity: input.severity,
            payload: input.payload || {},
            createdAt: new Date()
        }).returning();

        console.log(`[ExecutionSignal] Recorded ${signal.signalType} from ${signal.source} for tenant ${signal.tenantId}`);

        // 3. Trigger Aggregation Evaluation (Fire & Forget / Async)
        // Note: Real-world would likely use a job queue, but we implement direct call for Phase 2.
        SignalAggregatorService.evaluate(signal.tenantId, signal.signalType).catch(err => {
            console.error(`[SignalAggregator] Evaluation failed for ${signal.tenantId}/${signal.signalType}:`, err);
        });

        return signal;
    }
}
