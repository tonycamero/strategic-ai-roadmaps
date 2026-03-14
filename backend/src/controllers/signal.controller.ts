import { Request, Response } from 'express';
import { ExecutionSignalService } from '../services/executionSignal.service';

/**
 * Signal Controller
 * Receives operational telemetry from external systems (GHL, NetSuite, etc.).
 */
export const handleIncomingSignal = async (req: Request, res: Response) => {
    try {
        const { tenantId, signalType, source, severity, relatedTicketId, payload } = req.body;

        if (!tenantId || !signalType || !source || !severity) {
            return res.status(400).json({ 
                error: "Missing required signal fields (tenantId, signalType, source, severity)." 
            });
        }

        const signal = await ExecutionSignalService.recordSignal({
            tenantId,
            signalType,
            source,
            severity,
            relatedTicketId,
            payload
        });

        return res.status(201).json({
            success: true,
            signalId: signal.id
        });

    } catch (error: any) {
        console.error("[SignalController] Error recording signal:", error.message);
        
        if (error.message.startsWith('INVALID_SIGNAL_TYPE')) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(500).json({
            error: "Failed to record signal.",
            details: error.message
        });
    }
};
