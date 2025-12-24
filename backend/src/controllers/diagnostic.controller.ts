/**
 * Diagnostic Controller
 * 
 * Exposes POST /api/diagnostics/generate endpoint
 * Accepts DiagnosticMap JSON, triggers full pipeline (tickets + roadmap)
 */

import { Request, Response } from 'express';
import { ingestDiagnostic } from '../services/diagnosticIngestion.service';
import { DiagnosticMap } from '../types/diagnostic';

export async function generateFromDiagnostic(req: Request, res: Response) {
  try {
    const diagnosticMap: DiagnosticMap = req.body;

    // Validate required fields
    if (!diagnosticMap.tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    if (!diagnosticMap.firmName) {
      return res.status(400).json({ error: 'firmName is required' });
    }
    if (!diagnosticMap.diagnosticDate) {
      return res.status(400).json({ error: 'diagnosticDate is required' });
    }
    if (!diagnosticMap.painClusters || !Array.isArray(diagnosticMap.painClusters)) {
      return res.status(400).json({ error: 'painClusters array is required' });
    }

    console.log('[Diagnostic Controller] Received diagnostic for:', diagnosticMap.firmName);

    // Trigger full pipeline
    const result = await ingestDiagnostic(diagnosticMap);

    console.log('[Diagnostic Controller] Pipeline complete:', result);

    return res.status(200).json({
      success: true,
      diagnostic_id: result.diagnosticId,
      tenant_id: result.tenantId,
      ticket_count: result.ticketCount,
      roadmap_section_count: result.roadmapSectionCount,
      assistant_provisioned: result.assistantProvisioned
    });
  } catch (error) {
    console.error('[Diagnostic Controller] Error:', error);
    return res.status(500).json({
      error: 'Failed to process diagnostic',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
