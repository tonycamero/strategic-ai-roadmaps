import { Response } from 'express';
import { RequestWithUser } from '../types/requestWithUser';
import { generateFinalRoadmapForTenant } from '../services/finalRoadmap.service';
import { syncAgentsForRoadmap } from '../services/roadmapAgentSync.service';

/**
 * POST /api/superadmin/firms/:tenantId/generate-final-roadmap
 * 
 * Generates the final roadmap after moderation is complete.
 * Validates that all tickets are moderated before proceeding.
 */
export async function generateFinalRoadmap(req: RequestWithUser, res: Response) {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenantId parameter' });
    }

    console.log(`[FinalRoadmapController] Generating final roadmap for tenant: ${tenantId}`);

    const result = await generateFinalRoadmapForTenant(tenantId);

    // Provision AI assistants for this tenant after successful roadmap generation
    try {
      console.log(`[FinalRoadmapController] Provisioning AI assistants for tenant: ${tenantId}`);
      const userId = req.user?.id || 'system';
      await syncAgentsForRoadmap(
        tenantId,
        result.roadmapId,
        userId
      );
      console.log(`[FinalRoadmapController] AI assistants provisioned successfully`);
    } catch (provisionError: any) {
      console.error('[FinalRoadmapController] Failed to provision assistants:', provisionError);
      // Don't fail the overall request - assistants can be provisioned later
    }

    return res.status(200).json({
      success: true,
      message: 'Final roadmap generated successfully',
      data: result
    });
  } catch (error: any) {
    console.error('[FinalRoadmapController] Error:', error);

    // Return user-friendly errors for common cases
    if (error.message?.includes('Moderation incomplete')) {
      return res.status(400).json({
        error: 'Moderation not complete',
        message: error.message
      });
    }

    if (error.message?.includes('No approved tickets')) {
      return res.status(400).json({
        error: 'No approved tickets',
        message: error.message
      });
    }

    if (error.message?.includes('No tickets found')) {
      return res.status(404).json({
        error: 'Tickets not found',
        message: error.message
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
