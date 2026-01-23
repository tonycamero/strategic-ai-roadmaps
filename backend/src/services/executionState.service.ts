import { db } from '../db';
import { diagnostics, discoveryCallNotes, sopTickets } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface MilestoneStatus {
  id: string;
  label: string;
  status: 'BLOCKED' | 'READY' | 'COMPLETE' | 'IN_PROGRESS';
  blockingCode?: string;
  blockingReason?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionState {
  tenantId: string;
  diagnosticId: string;
  milestones: MilestoneStatus[];
  nextAction?: string;
}

/**
 * Aggregates execution state for a tenant+diagnostic pair.
 * Single source of truth for UI gate status.
 *
 * NOTE (2026-01-23):
 * discovery_call_notes schema no longer includes diagnosticId/version/synthesisJson/approval fields.
 * This service therefore treats discovery as "exists vs not exists" until those fields are reintroduced.
 */
export async function getExecutionState(params: {
  tenantId: string;
  diagnosticId: string;
}): Promise<ExecutionState> {
  const { tenantId, diagnosticId } = params;

  const milestones: MilestoneStatus[] = [];

  // M1: SOP-01 Diagnostic Generated
  const diagnostic = await db.query.diagnostics.findFirst({
    where: eq(diagnostics.id, diagnosticId),
  });

  if (!diagnostic) {
    return {
      tenantId,
      diagnosticId,
      milestones: [
        {
          id: 'M1',
          label: 'SOP-01 Diagnostic Generated',
          status: 'BLOCKED',
          blockingCode: 'DIAGNOSTIC_NOT_FOUND',
          blockingReason: `Diagnostic ${diagnosticId} not found`,
        },
      ],
      nextAction: 'Run SOP-01 Diagnostic',
    };
  }

  milestones.push({
    id: 'M1',
    label: 'SOP-01 Diagnostic Generated',
    status: 'COMPLETE',
    metadata: {
      diagnosticId: diagnostic.id,
      createdAt: diagnostic.createdAt,
    },
  });

  // M2: Discovery Call Notes Exist (schema has no diagnostic binding)
  const discoveryNote = await db.query.discoveryCallNotes.findFirst({
    where: eq(discoveryCallNotes.tenantId, tenantId),
    // no orderBy: version (column does not exist)
  });

  if (!discoveryNote) {
    milestones.push({
      id: 'M2',
      label: 'Discovery Notes Captured',
      status: 'BLOCKED',
      blockingCode: 'DISCOVERY_REQUIRED',
      blockingReason: 'Discovery notes required. Complete SOP-02 Discovery Call.',
    });

    return {
      tenantId,
      diagnosticId,
      milestones,
      nextAction: 'Capture Discovery Notes',
    };
  }

  milestones.push({
    id: 'M2',
    label: 'Discovery Notes Captured',
    status: 'COMPLETE',
    metadata: {
      discoveryNoteId: discoveryNote.id,
      createdAt: discoveryNote.createdAt,
      updatedAt: discoveryNote.updatedAt,
      status: discoveryNote.status,
    },
  });

  /**
   * M3: Tenant Lead Approval
   * Disabled until discovery_call_notes supports approval state fields again.
   * We mark READY so the UI can proceed without blocking on non-existent columns.
   */
  milestones.push({
    id: 'M3',
    label: 'Tenant Lead Approval',
    status: 'READY',
    metadata: {
      note: 'Approval fields not present in current discovery_call_notes schema',
    },
  });

  // M4: Generate Tickets
  const tickets = await db.query.sopTickets.findMany({
    where: and(eq(sopTickets.tenantId, tenantId), eq(sopTickets.diagnosticId, diagnosticId)),
  });

  if (tickets.length === 0) {
    milestones.push({
      id: 'M4',
      label: 'Generate Tickets',
      status: 'READY',
      metadata: { ticketCount: 0 },
    });

    return {
      tenantId,
      diagnosticId,
      milestones,
      nextAction: 'Generate Tickets from Discovery',
    };
  }

  milestones.push({
    id: 'M4',
    label: 'Generate Tickets',
    status: 'COMPLETE',
    metadata: { ticketCount: tickets.length },
  });

  // M5+: Keep existing logic below this point in your file (if present),
  // but ensure it does not reference removed discoveryCallNotes fields.
  // If your file continues past here with ticket moderation / roadmap gates,
  // leave it intact.

  return {
    tenantId,
    diagnosticId,
    milestones,
  };
}
