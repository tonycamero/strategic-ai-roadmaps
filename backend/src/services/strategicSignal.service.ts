import { db } from '../db/index';
import { strategicSignals } from '../db/schema';

export type StrategicSignalInput = {
    tenantId: string;
    signalType: string;
    severity: string;
    supportingSignalIds: string[];
};

export class StrategicSignalService {
    /**
     * Persists compressed strategic signals which feed the agent reasoning layer.
     */
    static async emitStrategicSignal(input: StrategicSignalInput) {
        const [signal] = await db.insert(strategicSignals).values({
            tenantId: input.tenantId,
            signalType: input.signalType,
            severity: input.severity,
            supportingSignalIds: input.supportingSignalIds,
            generatedAt: new Date(),
            status: 'active'
        }).returning();

        console.log(`[StrategicSignal] Emitted ${signal.signalType} for tenant ${signal.tenantId} supported by ${input.supportingSignalIds.length} raw signals.`);

        return signal;
    }
}
