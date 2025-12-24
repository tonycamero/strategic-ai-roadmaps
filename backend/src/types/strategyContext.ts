/**
 * StrategyContext Types
 * 
 * Core types for v2 agent architecture.
 * StrategyContext is built per-query and injected as JSON (not baked into system prompt).
 */

export type PersonaRole = 'owner' | 'staff' | 'advisor';

export interface RoadmapSignals {
  pains: string[];
  leveragePoints: string[];
  workflowGaps: string[];
  quickWins: string[];
}

export interface TacticalFrame {
  primaryConstraint: string | null;
  leveragePlay: string | null;
  recommendedMicroSteps: string[];
  systemInFocus: string | null;
}

export interface StrategyContext {
  tenantId: string;
  personaRole: PersonaRole;
  roadmapSignals: RoadmapSignals;
  tacticalFrame: TacticalFrame;
  objectives: string[];
}
