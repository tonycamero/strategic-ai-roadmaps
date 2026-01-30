import { Request, Response } from 'express';
import { db } from '../db';
import { intakeClarifications, auditEvents } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function getClarificationByToken(req: Request, res: Response) {
    try {
        const { token } = req.params;

        const [clarification] = await db
            .select({
                id: intakeClarifications.id,
                questionId: intakeClarifications.questionId,
                originalResponse: intakeClarifications.originalResponse,
                clarificationPrompt: intakeClarifications.clarificationPrompt,
                status: intakeClarifications.status,
            })
            .from(intakeClarifications)
            .where(eq(intakeClarifications.token, token))
            .limit(1);

        if (!clarification) {
            return res.status(404).json({ error: 'Invalid or expired clarification link' });
        }

        return res.json(clarification);
    } catch (error) {
        console.error('Get clarification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function submitClarification(req: Request, res: Response) {
    try {
        const { token } = req.params;
        const { response } = req.body;

        if (!response) {
            return res.status(400).json({ error: 'Response is required' });
        }

        const [clarification] = await db
            .select()
            .from(intakeClarifications)
            .where(eq(intakeClarifications.token, token))
            .limit(1);

        if (!clarification) {
            return res.status(404).json({ error: 'Clarification request not found' });
        }

        if (clarification.status === 'responded') {
            return res.status(400).json({ error: 'Clarification has already been submitted' });
        }

        // Update clarification record
        await db
            .update(intakeClarifications)
            .set({
                clarificationResponse: response,
                status: 'responded',
                respondedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(intakeClarifications.id, clarification.id));

        // Audit Event
        await db.insert(auditEvents).values({
            tenantId: clarification.tenantId,
            eventType: 'INTAKE_CLARIFICATION_RESPONDED',
            entityType: 'intake_clarification',
            entityId: clarification.id,
            metadata: { intakeId: clarification.intakeId, questionId: clarification.questionId }
        });

        return res.json({ ok: true });
    } catch (error) {
        console.error('Submit clarification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
