import { Request, Response } from 'express';
import { ProposalEnvelopeService } from '../services/proposalEnvelope.service';

/**
 * Proposal Envelope Controller
 * 
 * Exposes the cryptographic sealing capability.
 */
export const sealEnvelope = async (req: Request, res: Response) => {
    try {
        const { tenantId, parentEnvelopeId } = req.body;

        if (!tenantId) {
            return res.status(400).json({ error: "Tenant ID is required." });
        }

        // Authority check would normally happen here (e.g., operator check)

        const result = await ProposalEnvelopeService.createProposalEnvelope(tenantId, parentEnvelopeId);

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error: any) {
        console.error("[ProposalEnvelope] Seal error:", error);
        return res.status(500).json({
            error: "Failed to seal proposal envelope.",
            details: error.message
        });
    }
};
