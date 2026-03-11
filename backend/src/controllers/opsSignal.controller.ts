import { Request, Response } from 'express';
import * as opsSignalService from '../services/opsSignal.service';

export const registerParticipant = async (req: Request, res: Response) => {
    try {
        const { name, email, department, roleLabel, tenantId } = req.body;

        if (!name || !email || !roleLabel || !tenantId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const participant = await opsSignalService.createOrFetchParticipant({
            name,
            email,
            department: department || '',
            roleLabel,
            tenantId
        });

        return res.json({
            ok: true,
            participantId: participant.id,
            participant
        });
    } catch (error: any) {
        console.error('[OpsSignal] Participant registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const submitSignal = async (req: Request, res: Response) => {
    try {
        const { tenantId, participantId, signalType, signalData } = req.body;

        if (!tenantId || !participantId || !signalType || !signalData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const entry = await opsSignalService.createSignalEntry({
            tenantId,
            participantId,
            signalType,
            signalData
        });

        return res.json({
            ok: true,
            entryId: entry.id
        });
    } catch (error: any) {
        console.error('[OpsSignal] Signal submission error:', error);
        if (error.message.includes('Security violation')) {
            return res.status(403).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};
