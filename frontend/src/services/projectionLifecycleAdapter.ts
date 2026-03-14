/**
 * projectionLifecycleAdapter.ts
 * 
 * This is the SINGLE authority for frontend lifecycle state.
 * It maps the complex backend projection logic into a simple,
 * flat status object for UI rendering.
 */

export type StageStatus = 'LOCKED' | 'READY' | 'ACTIVE' | 'COMPLETE';

export interface LifecycleStage {
  status: StageStatus;
  label?: string;
  isBlocked?: boolean;
}

export interface ProjectionLifecycle {
  stage1: LifecycleStage; // Intake
  stage2: LifecycleStage; // Executive Brief
  stage3: LifecycleStage; // Diagnostic
  stage4: LifecycleStage; // Discovery
  stage5: LifecycleStage; // Assisted Synthesis
  stage6: LifecycleStage; // Ticket Moderation
  stage7: LifecycleStage; // Roadmap
}

export function getLifecycle(projection: any): ProjectionLifecycle {
  // Default fallback if projection is missing
  const defaultStatus: LifecycleStage = { status: 'LOCKED' };
  
  if (!projection || !projection.stages) {
    return {
      stage1: defaultStatus,
      stage2: defaultStatus,
      stage3: defaultStatus,
      stage4: defaultStatus,
      stage5: defaultStatus,
      stage6: defaultStatus,
      stage7: defaultStatus,
    };
  }

  // Map the new authoritative backend stages strictly
  return {
    stage1: { status: projection.stages.intake || 'LOCKED' },
    stage2: { status: projection.stages.executiveBrief || 'LOCKED' },
    stage3: { status: projection.stages.diagnostic || 'LOCKED' },
    stage4: { status: projection.stages.discovery || 'LOCKED' },
    stage5: { status: projection.stages.synthesis || 'LOCKED' },
    stage6: { status: projection.stages.moderation || 'LOCKED' },
    stage7: { status: projection.stages.roadmap || 'LOCKED' },
  };
}
